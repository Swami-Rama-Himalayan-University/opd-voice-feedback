# OPD Voice Feedback — Sarvam AI Integration

Voice-based OPD patient feedback system using Sarvam AI for speech-to-text in Indian languages.

## Overview

This is an additive intake channel alongside the existing [opd-firebase-dashboard](../opd-firebase-dashboard). Patients speak their feedback (Hindi/regional language) via WhatsApp voice notes or IVR; Sarvam AI transcribes and maps responses to the existing Responses sheet schema.

## Architecture

```
Patient (WhatsApp voice note / IVR)
        ↓
  Sarvam STT API
        ↓
  Firebase Cloud Function
        ↓
  Google Sheets (same Responses sheet as web form)
        ↓
  Existing OPD dashboard — no changes needed
```

## Status

> Work in progress
