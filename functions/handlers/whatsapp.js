const axios = require('axios');
const QUESTIONS = require('../config/questions');
const { getSession, createSession, deleteSession, processAnswer, buildMessage } = require('../conversation/stateMachine');
const { getFormConfig, postFeedback } = require('../appscript/client');

const WATI_BASE_URL = process.env.WATI_BASE_URL;
const WATI_API_TOKEN = process.env.WATI_API_TOKEN;

async function sendMessage(phone, message) {
  await axios.post(
    `${WATI_BASE_URL}/api/v1/sendSessionMessage/${phone}`,
    { messageText: message },
    { headers: { Authorization: `Bearer ${WATI_API_TOKEN}` } }
  );
}

async function handleWebhook(req, res) {
  res.status(200).send('ok');

  try {
    const body = req.body;
    if (body.type !== 'message' && body.eventType !== 'message') return;

    const phone = (body.waId || body.from || '').replace(/\D/g, '');
    const displayName = body.senderName || body.pushName || '';
    const rawText = (body.text || body.body || '').trim();

    if (!phone || !rawText) return;

    const lowerText = rawText.toLowerCase();

    // Start or restart session
    if (['feedback', 'start', 'शुरू', 'hello', 'hi', 'हेलो'].includes(lowerText)) {
      await deleteSession(phone);

      // Fetch dept-doctor map from existing Apps Script — stored in session
      const config = await getFormConfig();
      const deptDoctorMap = config.deptDoctorMap || {};

      await createSession(phone, displayName, deptDoctorMap);

      // Send first question with dynamic dept options
      const firstQ = QUESTIONS[0];
      const depts = Object.keys(deptDoctorMap).sort();
      const optionLines = depts.map((d, i) => `${i + 1}️⃣ ${d}`).join('\n');
      const message = firstQ.message.replace('{options}', optionLines);

      await sendMessage(phone, `👋 *OPD Feedback — SRHU*\n\nआपका स्वागत है! यह feedback केवल 2 मिनट में पूरी होगी।\n\n${message}`);
      return;
    }

    const session = await getSession(phone);

    if (!session) {
      await sendMessage(
        phone,
        '🙏 नमस्ते! OPD Feedback देने के लिए *"feedback"* लिखें।\n\n_(To give OPD feedback, type *"feedback"*)_'
      );
      return;
    }

    const result = await processAnswer(phone, rawText);

    if (result.notFound) {
      await sendMessage(phone, '🙏 नमस्ते! OPD Feedback देने के लिए *"feedback"* लिखें।');
      return;
    }

    if (result.done) {
      // Submit to existing Apps Script doPost — same as the web form does
      await postFeedback({
        ...result.answers,
        declaration: 'Accepted (स्वीकृत)',
      });
      await deleteSession(phone);
      await sendMessage(
        phone,
        '✅ *धन्यवाद!* आपकी feedback सफलतापूर्वक दर्ज हो गई।\n\nआपके विश्वास के लिए SRHU आभारी है। 🙏\n\n_Thank you! Your feedback has been recorded._'
      );
      return;
    }

    await sendMessage(phone, result.reply);
  } catch (err) {
    console.error('Webhook error:', err.message, err.stack);
  }
}

module.exports = { handleWebhook };
