const { google } = require('googleapis');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'Responses';

// Column order must exactly match the existing Responses sheet (0-based cols 0–17).
// 0:Timestamp  1:fullName  2:contactNumber  3:emailId  4:uhidNo
// 5:opdDepartment  6:doctorName  7:recommendLikelihood  8:rateOverallSatisfaction
// 9:rateWaitingTime  10:rateStaffFriendliness  11:rateCleanliness
// 12:rateClarityInstructions  13:rateQualityOfCare  14:rateDoctorExperience
// 15:doctorConsultConvenient  16:suggestions  17:declaration

async function appendRow({ answers, phone, displayName }) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const row = [
    now,                                          // 0: Timestamp
    displayName || '',                            // 1: fullName (WhatsApp display name)
    phone || '',                                  // 2: contactNumber
    '',                                           // 3: emailId (not collected)
    '',                                           // 4: uhidNo (not collected via text bot)
    answers.opdDepartment || '',                  // 5
    answers.doctorName || '',                     // 6
    answers.recommendLikelihood || '',            // 7
    answers.rateOverallSatisfaction || '',        // 8
    answers.rateWaitingTime || '',                // 9
    answers.rateStaffFriendliness || '',          // 10
    answers.rateCleanliness || '',                // 11
    answers.rateClarityInstructions || '',        // 12
    answers.rateQualityOfCare || '',              // 13
    answers.rateDoctorExperience || '',           // 14
    answers.doctorConsultConvenient || '',        // 15
    answers.suggestions || '',                    // 16
    'Accepted via WhatsApp',                      // 17: declaration
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:R`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}

module.exports = { appendRow };
