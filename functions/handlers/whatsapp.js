const axios = require('axios');
const QUESTIONS = require('../config/questions');
const { getSession, createSession, deleteSession, processAnswer } = require('../conversation/stateMachine');
const { appendRow } = require('../sheet/appendRow');

const WATI_BASE_URL = process.env.WATI_BASE_URL;   // e.g. https://live-server-XXXXX.wati.io
const WATI_API_TOKEN = process.env.WATI_API_TOKEN;

// Send a plain text WhatsApp message via WATI
async function sendMessage(phone, message) {
  await axios.post(
    `${WATI_BASE_URL}/api/v1/sendSessionMessage/${phone}`,
    { messageText: message },
    { headers: { Authorization: `Bearer ${WATI_API_TOKEN}` } }
  );
}

// Main webhook handler — called by WATI on every incoming message
async function handleWebhook(req, res) {
  // Acknowledge immediately so WATI doesn't retry
  res.status(200).send('ok');

  try {
    const body = req.body;

    // WATI sends different event types; we only care about incoming messages
    if (body.type !== 'message' && body.eventType !== 'message') return;

    const phone = (body.waId || body.from || '').replace(/\D/g, '');
    const displayName = body.senderName || body.pushName || '';
    const rawText = (body.text || body.body || '').trim();

    if (!phone || !rawText) return;

    // Ignore non-text messages (images, stickers, etc.)
    const messageType = body.messageType || body.type || 'text';
    if (!['text', 'message'].includes(messageType) && body.text === undefined) return;

    const lowerText = rawText.toLowerCase();

    // Allow patient to restart at any time
    if (['feedback', 'start', 'शुरू', 'hello', 'hi', 'हेलो'].includes(lowerText)) {
      await deleteSession(phone);
      await createSession(phone, displayName);
      await sendMessage(phone, QUESTIONS[0].message);
      return;
    }

    let session = await getSession(phone);

    // No active session — prompt them to start
    if (!session) {
      await sendMessage(
        phone,
        '🙏 नमस्ते! OPD Feedback देने के लिए *"feedback"* लिखें।\n\n_(To give OPD feedback, type *"feedback"*)_'
      );
      return;
    }

    const result = await processAnswer(phone, rawText);

    if (result.notFound) {
      await sendMessage(
        phone,
        '🙏 नमस्ते! OPD Feedback देने के लिए *"feedback"* लिखें।'
      );
      return;
    }

    if (result.done) {
      // Write to Google Sheet
      await appendRow({
        answers: result.answers,
        phone,
        displayName: result.displayName,
      });
      await deleteSession(phone);
      await sendMessage(
        phone,
        '✅ *धन्यवाद!* आपकी feedback सफलतापूर्वक दर्ज हो गई।\n\nआपके विश्वास के लिए SRHU आभारी है। 🙏\n\n_Thank you! Your feedback has been recorded successfully._'
      );
      return;
    }

    // Send next question or re-ask current
    await sendMessage(phone, result.reply);
  } catch (err) {
    console.error('Webhook error:', err.message, err.stack);
  }
}

module.exports = { handleWebhook };
