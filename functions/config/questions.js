// Each question maps to one column in the Responses sheet.
// type: 'choice' = numbered options, 'text' = free-form reply, 'yesNo' = yes/no
// sheetCol matches the column order in the existing Responses sheet (0-based).

const QUESTIONS = [
  {
    id: 'opdDepartment',
    sheetCol: 5,
    type: 'text',
    message:
      '👋 *OPD Feedback — SRHU*\n\nआपका स्वागत है! यह feedback केवल 2 मिनट में पूरी होगी।\n\n*प्रश्न 1:* आप किस विभाग में गए थे?\n_(जैसे: Cardiology, Ortho, Urology, General Medicine)_',
  },
  {
    id: 'doctorName',
    sheetCol: 6,
    type: 'text',
    message:
      '*प्रश्न 2:* डॉक्टर का नाम बताएं जिन्होंने आपको देखा।\n_(अगर याद न हो तो "पता नहीं" लिखें)_',
  },
  {
    id: 'recommendLikelihood',
    sheetCol: 7,
    type: 'yesNo',
    message:
      '*प्रश्न 3:* क्या आप हमारे अस्पताल को दूसरों को suggest करेंगे?\n\n1️⃣ हाँ\n2️⃣ नहीं',
    options: { '1': '1', 'हाँ': '1', 'han': '1', 'yes': '1', 'ha': '1', '2': '2', 'नहीं': '2', 'nahi': '2', 'no': '2' },
  },
  {
    id: 'rateOverallSatisfaction',
    sheetCol: 8,
    type: 'choice',
    message:
      '*प्रश्न 4:* कुल मिलाकर अपना अनुभव कैसा रहा?\n\n1️⃣ Excellent\n2️⃣ Good\n3️⃣ Average\n4️⃣ Poor',
    options: { '1': 'Excellent', '2': 'Good', '3': 'Average', '4': 'Poor', 'excellent': 'Excellent', 'good': 'Good', 'average': 'Average', 'poor': 'Poor' },
  },
  {
    id: 'rateWaitingTime',
    sheetCol: 9,
    type: 'choice',
    message:
      '*प्रश्न 5:* इंतज़ार के समय को कैसे रेट करेंगे?\n\n1️⃣ Excellent\n2️⃣ Good\n3️⃣ Average\n4️⃣ Poor',
    options: { '1': 'Excellent', '2': 'Good', '3': 'Average', '4': 'Poor', 'excellent': 'Excellent', 'good': 'Good', 'average': 'Average', 'poor': 'Poor' },
  },
  {
    id: 'rateStaffFriendliness',
    sheetCol: 10,
    type: 'choice',
    message:
      '*प्रश्न 6:* स्टाफ का व्यवहार कैसा था?\n\n1️⃣ Excellent\n2️⃣ Good\n3️⃣ Average\n4️⃣ Poor',
    options: { '1': 'Excellent', '2': 'Good', '3': 'Average', '4': 'Poor', 'excellent': 'Excellent', 'good': 'Good', 'average': 'Average', 'poor': 'Poor' },
  },
  {
    id: 'rateCleanliness',
    sheetCol: 11,
    type: 'choice',
    message:
      '*प्रश्न 7:* साफ़-सफ़ाई को कैसे रेट करेंगे?\n\n1️⃣ Excellent\n2️⃣ Good\n3️⃣ Average\n4️⃣ Poor',
    options: { '1': 'Excellent', '2': 'Good', '3': 'Average', '4': 'Poor', 'excellent': 'Excellent', 'good': 'Good', 'average': 'Average', 'poor': 'Poor' },
  },
  {
    id: 'rateClarityInstructions',
    sheetCol: 12,
    type: 'choice',
    message:
      '*प्रश्न 8:* डॉक्टर के निर्देश कितने स्पष्ट थे?\n\n1️⃣ Excellent\n2️⃣ Good\n3️⃣ Average\n4️⃣ Poor',
    options: { '1': 'Excellent', '2': 'Good', '3': 'Average', '4': 'Poor', 'excellent': 'Excellent', 'good': 'Good', 'average': 'Average', 'poor': 'Poor' },
  },
  {
    id: 'rateQualityOfCare',
    sheetCol: 13,
    type: 'choice',
    message:
      '*प्रश्न 9:* देखभाल की गुणवत्ता कैसी थी?\n\n1️⃣ Excellent\n2️⃣ Good\n3️⃣ Average\n4️⃣ Poor',
    options: { '1': 'Excellent', '2': 'Good', '3': 'Average', '4': 'Poor', 'excellent': 'Excellent', 'good': 'Good', 'average': 'Average', 'poor': 'Poor' },
  },
  {
    id: 'rateDoctorExperience',
    sheetCol: 14,
    type: 'choice',
    message:
      '*प्रश्न 10:* डॉक्टर के साथ अनुभव कैसा रहा?\n\n1️⃣ Excellent\n2️⃣ Good\n3️⃣ Average\n4️⃣ Poor',
    options: { '1': 'Excellent', '2': 'Good', '3': 'Average', '4': 'Poor', 'excellent': 'Excellent', 'good': 'Good', 'average': 'Average', 'poor': 'Poor' },
  },
  {
    id: 'doctorConsultConvenient',
    sheetCol: 15,
    type: 'choice',
    message:
      '*प्रश्न 11:* Consultation की प्रक्रिया कितनी आसान थी?\n\n1️⃣ Excellent\n2️⃣ Good\n3️⃣ Average\n4️⃣ Poor',
    options: { '1': 'Excellent', '2': 'Good', '3': 'Average', '4': 'Poor', 'excellent': 'Excellent', 'good': 'Good', 'average': 'Average', 'poor': 'Poor' },
  },
  {
    id: 'suggestions',
    sheetCol: 16,
    type: 'text',
    message:
      '*प्रश्न 12 (अंतिम):* कोई सुझाव देना चाहते हैं?\n_(अगर नहीं तो "नहीं" लिखें)_',
  },
];

// Columns in the sheet that are NOT asked in this flow — filled with defaults.
// sheetCol 0: Timestamp (set at write time)
// sheetCol 1: fullName   → filled from WhatsApp display name or blank
// sheetCol 2: contactNumber → filled from WhatsApp phone number
// sheetCol 3: emailId    → blank
// sheetCol 4: uhidNo     → blank (or from QR code param in future)
// sheetCol 17: declaration → "Accepted via WhatsApp"

module.exports = QUESTIONS;
