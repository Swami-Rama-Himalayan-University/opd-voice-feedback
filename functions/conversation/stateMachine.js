const admin = require('firebase-admin');
const QUESTIONS = require('../config/questions');

const db = () => admin.firestore();
const SESSION_TTL_HOURS = 24;

async function getSession(phone) {
  const doc = await db().collection('voiceSessions').doc(phone).get();
  if (!doc.exists) return null;
  const data = doc.data();
  const ageHours = (Date.now() - data.createdAt.toMillis()) / 3600000;
  if (ageHours > SESSION_TTL_HOURS) return null;
  return data;
}

// deptDoctorMap comes from Apps Script doGet — stored in the session so we
// don't fetch it on every message.
async function createSession(phone, displayName, deptDoctorMap) {
  const session = {
    phone,
    displayName: displayName || '',
    step: 0,
    answers: {},
    deptDoctorMap,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    completedAt: null,
    channel: 'whatsapp',
  };
  await db().collection('voiceSessions').doc(phone).set(session);
  return session;
}

async function deleteSession(phone) {
  await db().collection('voiceSessions').doc(phone).delete();
}

// Returns { reply, done, answers?, displayName? }
async function processAnswer(phone, rawText) {
  const session = await getSession(phone);
  if (!session) return { reply: null, done: false, notFound: true };

  const { step, answers, deptDoctorMap, displayName } = session;
  const question = QUESTIONS[step];

  // Resolve dynamic options at answer time
  const resolvedOptions = resolveDynamicOptions(question, answers, deptDoctorMap);
  const normalised = normalise(rawText, question, resolvedOptions);

  if (!normalised) {
    const hint = buildMessage(question, answers, deptDoctorMap);
    return { reply: `⚠️ कृपया सही जवाब दें।\n\n${hint}`, done: false };
  }

  const newAnswers = { ...answers, [question.id]: normalised };
  const nextStep = step + 1;
  const done = nextStep >= QUESTIONS.length;

  await db().collection('voiceSessions').doc(phone).update({
    step: nextStep,
    answers: newAnswers,
    ...(done ? { completedAt: admin.firestore.FieldValue.serverTimestamp() } : {}),
  });

  if (done) return { done: true, answers: newAnswers, displayName };

  return {
    reply: buildMessage(QUESTIONS[nextStep], newAnswers, deptDoctorMap),
    done: false,
  };
}

// Build the message for a question, substituting {options} for dynamic questions.
function buildMessage(question, answers, deptDoctorMap) {
  if (question.type !== 'dynamic') return question.message;
  const opts = resolveDynamicOptions(question, answers, deptDoctorMap);
  const optionLines = opts.map((o, i) => `${i + 1}️⃣ ${o}`).join('\n');
  return question.message.replace('{options}', optionLines);
}

// For dynamic questions, return the list of valid string options.
function resolveDynamicOptions(question, answers, deptDoctorMap) {
  if (question.type !== 'dynamic') return null;
  if (question.id === 'opdDepartment') {
    return Object.keys(deptDoctorMap).sort();
  }
  if (question.id === 'doctorName') {
    const dept = answers.opdDepartment;
    return (deptDoctorMap[dept] || []);
  }
  return [];
}

// Map raw patient text to a valid answer value, or null if unrecognisable.
function normalise(raw, question, dynamicOptions) {
  const trimmed = raw.trim();

  if (question.type === 'text') return trimmed.length > 0 ? trimmed : null;

  if (question.type === 'dynamic') {
    // Patient can reply with a number (1, 2, 3…) or type the name
    const idx = parseInt(trimmed, 10);
    if (!isNaN(idx) && idx >= 1 && idx <= dynamicOptions.length) {
      return dynamicOptions[idx - 1];
    }
    // Try case-insensitive text match
    const match = dynamicOptions.find(
      o => o.toLowerCase() === trimmed.toLowerCase()
    );
    return match || null;
  }

  // choice / yesNo — look up in options map
  const options = question.options || {};
  const key = trimmed.toLowerCase();
  if (options[trimmed] !== undefined) return options[trimmed];
  if (options[key] !== undefined) return options[key];
  const firstWord = key.split(/\s+/)[0];
  if (options[firstWord] !== undefined) return options[firstWord];

  return null;
}

module.exports = { getSession, createSession, deleteSession, processAnswer, buildMessage };
