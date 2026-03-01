# PWSense Web — Frontend

React frontend for the PWSense medical dashboard. Built from the Figma mockup, converted to JSX, and wired to the Flask backend.

## Setup

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`. The Vite dev server proxies `/api` to `http://127.0.0.1:5000` (start the Flask backend separately).

## Features

- **Track** — Log symptoms (fatigue, pain, headache, nausea, dizziness, inflammation, anxiety, other), severity 0–10, triggers, notes, and “Mark as outburst”. Submits to `POST /api/symptoms`.
- **Insights** — Dashboard with symptom stats, severity trend, distribution, time-of-day patterns, triggers, and heart rate over the last 24 hours (`GET /api/heartrate?hours=24`).
- **History** — Symptom list and charts (flare-ups, severity trend). Data from `GET /api/symptoms`.
- **Profile** — Health profile (localStorage), export JSON/TXT, share with provider via email.

## Backend

Ensure the Flask backend is running (`cd backend && python3 -m flask run`) so the app can load and save symptoms and heart rate.
