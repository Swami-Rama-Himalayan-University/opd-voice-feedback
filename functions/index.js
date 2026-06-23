const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');

admin.initializeApp();

const { handleWebhook } = require('./handlers/whatsapp');

const app = express();
app.use(express.json());

// WATI webhook — configure this URL in your WATI dashboard:
// POST https://<project>.cloudfunctions.net/whatsapp/webhook
app.post('/webhook', handleWebhook);

exports.whatsapp = functions
  .runWith({ secrets: ['WATI_API_TOKEN', 'WATI_BASE_URL', 'APPS_SCRIPT_URL'] })
  .https.onRequest(app);
