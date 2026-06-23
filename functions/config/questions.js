// Each question maps to one FORM_FIELDS id in project-a/Code.gs.
// type 'choice'  → fixed numbered options
// type 'dynamic' → options loaded at session start from Apps Script doGet
// type 'text'    → free-form reply, stored as-is
// type 'yesNo'   → maps हाँ/नहीं variants to "1"/"2"

const QUESTIONS = [
  {
    id: 'opdDepartment',
    type: 'dynamic',         // options injected at session start from deptDoctorMap keys
    message: '*प्रश्न 1:* आप किस विभाग में गए थे?\n\n{options}',
  },
  {
    id: 'doctorName',
    type: 'dynamic',         // options injected after dept is chosen (filtered by dept)
    message: '*प्रश्न 2:* डॉक्टर का नाम बताएं:\n\n{options}',
  },
  {
    id: 'recommendLikelihood',
    type: 'yesNo',
    message: '*प्रश्न 3:* क्या आप हमारे अस्पताल को दूसरों को suggest करेंगे?\n\n1️⃣ हाँ\n2️⃣ नहीं',
    options: { '1': '1', 'हाँ': '1', 'han': '1', 'yes': '1', 'ha': '1', '2': '2', 'नहीं': '2', 'nahi': '2', 'no': '2' },
  },
  {
    id: 'rateOverallSatisfaction',
    type: 'choice',
    message: '*प्रश्न 4:* कुल मिलाकर अपना अनुभव कैसा रहा?\n\n1️⃣ Excellent\n2️⃣ Good\n3️⃣ Average\n4️⃣ Poor',
    options: { '1': 'Excellent', '2': 'Good', '3': 'Average', '4': 'Poor', 'excellent': 'Excellent', 'good': 'Good', 'average': 'Average', 'poor': 'Poor' },
  },
  {
    id: 'rateWaitingTime',
    type: 'choice',
    message: '*प्रश्न 5:* इंतज़ार के समय को कैसे रेट करेंगे?\n\n1️⃣ Excellent\n2️⃣ Good\n3️⃣ Average\n4️⃣ Poor',
    options: { '1': 'Excellent', '2': 'Good', '3': 'Average', '4': 'Poor', 'excellent': 'Excellent', 'good': 'Good', 'average': 'Average', 'poor': 'Poor' },
  },
  {
    id: 'rateStaffFriendliness',
    type: 'choice',
    message: '*प्रश्न 6:* स्टाफ का व्यवहार कैसा था?\n\n1️⃣ Excellent\n2️⃣ Good\n3️⃣ Average\n4️⃣ Poor',
    options: { '1': 'Excellent', '2': 'Good', '3': 'Average', '4': 'Poor', 'excellent': 'Excellent', 'good': 'Good', 'average': 'Average', 'poor': 'Poor' },
  },
  {
    id: 'rateCleanliness',
    type: 'choice',
    message: '*प्रश्न 7:* साफ़-सफ़ाई को कैसे रेट करेंगे?\n\n1️⃣ Excellent\n2️⃣ Good\n3️⃣ Average\n4️⃣ Poor',
    options: { '1': 'Excellent', '2': 'Good', '3': 'Average', '4': 'Poor', 'excellent': 'Excellent', 'good': 'Good', 'average': 'Average', 'poor': 'Poor' },
  },
  {
    id: 'rateClarityInstructions',
    type: 'choice',
    message: '*प्रश्न 8:* डॉक्टर के निर्देश कितने स्पष्ट थे?\n\n1️⃣ Excellent\n2️⃣ Good\n3️⃣ Average\n4️⃣ Poor',
    options: { '1': 'Excellent', '2': 'Good', '3': 'Average', '4': 'Poor', 'excellent': 'Excellent', 'good': 'Good', 'average': 'Average', 'poor': 'Poor' },
  },
  {
    id: 'rateQualityOfCare',
    type: 'choice',
    message: '*प्रश्न 9:* देखभाल की गुणवत्ता कैसी थी?\n\n1️⃣ Excellent\n2️⃣ Good\n3️⃣ Average\n4️⃣ Poor',
    options: { '1': 'Excellent', '2': 'Good', '3': 'Average', '4': 'Poor', 'excellent': 'Excellent', 'good': 'Good', 'average': 'Average', 'poor': 'Poor' },
  },
  {
    id: 'rateDoctorExperience',
    type: 'choice',
    message: '*प्रश्न 10:* डॉक्टर के साथ अनुभव कैसा रहा?\n\n1️⃣ Excellent\n2️⃣ Good\n3️⃣ Average\n4️⃣ Poor',
    options: { '1': 'Excellent', '2': 'Good', '3': 'Average', '4': 'Poor', 'excellent': 'Excellent', 'good': 'Good', 'average': 'Average', 'poor': 'Poor' },
  },
  {
    id: 'doctorConsultConvenient',
    type: 'choice',
    message: '*प्रश्न 11:* Consultation की प्रक्रिया कितनी आसान थी?\n\n1️⃣ Excellent\n2️⃣ Good\n3️⃣ Average\n4️⃣ Poor',
    options: { '1': 'Excellent', '2': 'Good', '3': 'Average', '4': 'Poor', 'excellent': 'Excellent', 'good': 'Good', 'average': 'Average', 'poor': 'Poor' },
  },
  {
    id: 'suggestions',
    type: 'text',
    message: '*प्रश्न 12 (अंतिम):* कोई सुझाव देना चाहते हैं?\n_(अगर नहीं तो "नहीं" लिखें)_',
  },
];

module.exports = QUESTIONS;
