# PreStorm backend — Hunger tracker (transcribe)

Flask API that accepts recorded audio and returns a transcript using **Wispr Flow** (speech-to-text).

## Setup

1. **Python 3.9+** and **ffmpeg** (required for converting browser audio to 16kHz WAV).
   - **With Homebrew:** `brew install ffmpeg`
   - **Without Homebrew:** Install Homebrew first: https://brew.sh — or download a static ffmpeg for macOS from https://evermeet.cx/ffmpeg/ and put `ffmpeg` (and `ffprobe`) in your PATH.

2. Install dependencies:
   ```bash
   cd backend
   python3 -m pip install -r requirements.txt
   ```

3. **API key**  
   Put your Wispr Flow API key in `.env` (in `backend/` or project root). Your key from the platform is like `fl-xxxx...`.  
   Backend reads either:
   - `WISPR_FLOW_API_KEY=fl-...`
   - or `WHISPER_API_KEY=fl-...` (so your existing root `.env` works)

## Run

```bash
cd backend
python3 -m flask run
```

Server: `http://127.0.0.1:5000`

## Endpoints

- **GET /api/health** — `{"status": "ok"}` (no key needed).
- **POST /api/transcribe** — multipart form with an audio file (field name `audio` or `file`).  
  Accepts **webm** (e.g. from Chrome MediaRecorder) or **wav**.  
  Returns: `{"transcript": "...", "detected_language": "en", "total_time_ms": 123}`

## Test transcription

**1. Health check**
```bash
curl -s http://127.0.0.1:5000/api/health
# expect: {"status":"ok"}
```

**2. Transcribe a file**  
Record a short clip (e.g. 5–10 seconds) as webm or wav, then:

```bash
curl -X POST http://127.0.0.1:5000/api/transcribe \
  -F "audio=@/path/to/your/recording.webm"
```

Or with a wav file:
```bash
curl -X POST http://127.0.0.1:5000/api/transcribe \
  -F "audio=@/path/to/recording.wav"
```

- Success: JSON with `transcript`, `detected_language`, `total_time_ms`.
- 401: Wrong or missing API key — check `.env` and that the key is from Wispr Flow.
- 400: No file, empty file, or conversion failed (e.g. ffmpeg not installed).

Your `.env` is in the project root with `WHISPER_API_KEY=fl-...`; the backend loads that automatically, so you don’t need to copy it into `backend/.env` unless you want to override.
