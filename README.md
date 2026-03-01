# PWSense — Prader-Willi Syndrome Vagus Nerve Stimulation and Monitoring System

Medical dashboard for tracking symptoms, voice recordings, and health insights for Prader-Willi Syndrome (PWS) care. Records speech and generates transcript, hunger score, and conducts emotion analysis. Additionally, you can log symptoms and view analytics over time.

## Overview

PWSense helps caregivers and patients:

- **Track** — Log symptoms (anxiety, depression, irritability, sleep disturbance, etc.) with severity, triggers, and outburst flags
- **Record** — Records speech and generates transcript, hunger/satiety score (via Claude), and emotion detection (via RAVDEES CNN model)
- **Insights** — View emotional state trends, hunger tracker, heart rate, symptom patterns over time
- **History** — Review past entries, flare-ups by symptom type, and most common triggers
- **Profile** — View and manage health profile, share reports with healthcare providers, and automatic MyChart integration

## How to Run

### Backend (Flask)

1. **Requirements:** Python 3.9+, ffmpeg (for audio conversion)
   - macOS: `brew install ffmpeg`

2. Install dependencies:
   ```bash
   cd backend
   pip3 install -r requirements.txt
   ```

3. Create a `.env` file (in `backend/` or project root) with:
   - `WISPR_FLOW_API_KEY` or `WHISPER_API_KEY` — for transcription
   - `ANTHROPIC_API_KEY` — for hunger scoring

4. Start backend server:
   ```bash
   python3 -m flask run
   ```
   Server runs at `http://127.0.0.1:5000`

### Frontend (React + Vite)

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start frontend server:
   ```bash
   npm run dev
   ```
   App runs at `http://localhost:5173`

## Requirements

### Backend
- flask
- flask-cors
- python-dotenv
- requests
- anthropic
- pydub
- numpy
- librosa
- tensorflow

### Frontend
- React 18
- Vite
- Recharts
- Tailwind CSS
- Radix UI (Tabs, Select, Label)
