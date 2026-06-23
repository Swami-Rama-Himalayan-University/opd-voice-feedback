const admin = require('firebase-admin');
const QUESTIONS = require('../config/questions');

const db = () => admin.firestore();
const SESSION_TTL_HOURS = 24;

// Session doc lives at voiceSessions/{phone}
// phone number is used as session ID so one active session per patient.

async function getSession(phone) {
  const doc = await db().collection('voiceSessions').doc(phone).get();
  if (!doc.exists) return null;
  const data = doc.data();
  // Expire sessions older than TTL
  const ageHours = (Date.now() - data.createdAt.toMillis()) / 3600000;
  if (ageHours > SESSION_TTL_HOURS) return null;
  return data;
}

async function createSession(phone, displayName) {
  const session = {
    phone,
    displayName: displayName || '',
    step: 0,
    answers: {},
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    completedAt: null,
    sheetRowWritten: false,
    channel: 'whatsapp',
  };
  await db().collection('voiceSessions').doc(phone).set(session);
  return session;
}

async function deleteSession(phone) {
  await db().collection('voiceSessions').doc(phone).delete();
}

// Returns { reply, done } after processing a patient's answer.
// reply: string to send back via WhatsApp
// done: true when all questions answered and row written
async function processAnswer(phone, rawText) {
  const session = await getSession(phone);
  if (!session) {
    return { reply: null, done: false, notFound: true };
  }

  const { step, answers, displayName } = session;
  const question = QUESTIONS[step];
  const normalised = normalise(rawText, question);

  if (!normalised) {
    // Invalid answer — re-ask with a hint
    return {
      reply: `⚠️ कृपया सही जवाब दें।\n\n${question.message}`,
      done: false,
    };
  }

  const newAnswers = { ...answers, [question.id]: normalised };
  const nextStep = step + 1;
  const done = nextStep >= QUESTIONS.length;

  await db().collection('voiceSessions').doc(phone).update({
    step: nextStep,
    answers: newAnswers,
    ...(done ? { completedAt: admin.firestore.FieldValue.serverTimestamp() } : {}),
  });

  if (done) {
    return { reply: null, done: true, answers: newAnswers, displayName };
  }

  return {
    reply: QUESTIONS[nextStep].message,
    done: false,
  };
}

// Maps raw patient text to a valid answer value, or null if unrecognisable.
function normalise(raw, question) {
  const trimmed = raw.trim();

  if (question.type === 'text') {
    return trimmed.length > 0 ? trimmed : null;
  }

  // For choice and yesNo, look up in the options map (case-insensitive)
  const key = trimmed.toLowerCase();
  const options = question.options || {};

  // Try exact match first
  if (options[trimmed] !== undefined) return options[trimmed];
  // Try lowercase match
  if (options[key] !== undefined) return options[key];
  // Try first word only (e.g. patient types "Good morning" → "good")
  const firstWord = key.split(/\s+/)[0];
  if (options[firstWord] !== undefined) return options[firstWord];

  return null;
}

module.exports = { getSession, createSession, deleteSession, processAnswer };
