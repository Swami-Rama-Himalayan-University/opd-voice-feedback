const axios = require('axios');

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

// Fetches the dept-doctor map from the existing project-a Apps Script doGet.
// Returns: { deptDoctorMap: { "Cardiology": ["Dr. A", "Dr. B"], ... } }
async function getFormConfig() {
  const res = await axios.get(APPS_SCRIPT_URL);
  return res.data; // { fields, deptDoctorMap }
}

// Submits a completed feedback session to the existing project-a Apps Script doPost.
// formData must match the FORM_FIELDS ids in project-a/Code.gs.
async function postFeedback(formData) {
  await axios.post(APPS_SCRIPT_URL, formData, {
    headers: { 'Content-Type': 'application/json' },
  });
}

module.exports = { getFormConfig, postFeedback };
