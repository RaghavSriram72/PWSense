"""
PreStorm backend — Hunger tracker: transcribe (Wispr Flow) + satiety score (Claude).
"""
import base64
import io
import json
import os
from pathlib import Path

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

# Load .env from backend/ then project root (so root .env works)
_here = Path(__file__).resolve().parent
load_dotenv(_here / ".env")
load_dotenv(_here.parent / ".env")

app = Flask(__name__)
CORS(app)

# Wispr Flow: https://api-docs.wisprflow.ai/rest_api_transcribe
WISPR_TRANSCRIBE_URL = "https://platform-api.wisprflow.ai/api/v1/dash/api"

# Satiety score: Claude system prompt (do not modify)
SATIETY_SCORE_SYSTEM_PROMPT = """Given this transcript, score the following on 0-10:
1. Food mention frequency and emotional intensity
2. Topic return rate (how many times does the speaker circle back to food)
3. Anxiety/distress markers in language
4. Sentence-level perseveration (repeating the same idea in different words)

Return a JSON with scores and the specific phrases that drove each score. Return only valid JSON, no markdown code blocks and no explanation text."""


def _get_wispr_api_key():
    """API key for Wispr Flow (Bearer fl-...). Prefer WISPR_FLOW_API_KEY, fallback WHISPER_API_KEY."""
    key = (os.environ.get("WISPR_FLOW_API_KEY") or os.environ.get("WHISPER_API_KEY") or "").strip()
    return key if key else None


def _get_anthropic_api_key():
    """API key for Claude (ANTHROPIC_API_KEY in .env)."""
    key = (os.environ.get("ANTHROPIC_API_KEY") or "").strip()
    return key if key else None


def _extract_json_from_text(text: str):
    """Extract a JSON object from model output (handles markdown code blocks)."""
    text = (text or "").strip()
    # Try to find JSON object
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        return text[start:end]
    return text


def _guess_audio_format(content_type: str, filename: str = "") -> str:
    """Guess pydub format from content type or filename."""
    ct = (content_type or "").lower()
    fn = (filename or "").lower()
    if "webm" in ct or fn.endswith(".webm"):
        return "webm"
    if "mpeg" in ct or "mp3" in ct or fn.endswith(".mp3"):
        return "mp3"
    if "mp4" in ct or fn.endswith(".mp4") or fn.endswith(".m4a"):
        return "mp4"
    if "wav" in ct or fn.endswith(".wav"):
        return "wav"
    return "mp3"  # default try mp3 then others


def _audio_to_16k_wav_base64(audio_bytes: bytes, content_type: str, filename: str = "") -> str:
    """Convert uploaded audio (webm, wav, mp3, mp4) to 16kHz mono WAV and return base64."""
    try:
        from pydub import AudioSegment
    except ImportError:
        raise ValueError("pydub is required for audio conversion. Install with: pip install pydub. Also need ffmpeg installed.")
    fmt = _guess_audio_format(content_type, filename)
    fallback_formats = ["mp3", "webm", "wav", "mp4"]
    if fmt not in fallback_formats:
        fallback_formats.insert(0, fmt)
    else:
        fallback_formats = [fmt] + [f for f in fallback_formats if f != fmt]
    buf = io.BytesIO(audio_bytes)
    seg = None
    for f in fallback_formats:
        buf.seek(0)
        try:
            seg = AudioSegment.from_file(buf, format=f)
            break
        except Exception:
            continue
    if seg is None:
        raise ValueError("Could not decode audio as mp3, webm, wav, or mp4. Check file format.")
    seg = seg.set_frame_rate(16000).set_channels(1)
    out = io.BytesIO()
    seg.export(out, format="wav")
    out.seek(0)
    return base64.b64encode(out.read()).decode("utf-8")


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/transcribe", methods=["POST"])
def transcribe():
    """
    Accept multipart audio (webm or wav from browser).
    Convert to 16kHz WAV, send to Wispr Flow, return transcript.
    """
    api_key = _get_wispr_api_key()
    if not api_key:
        return jsonify({"error": "WISPR_FLOW_API_KEY or WHISPER_API_KEY not set in .env"}), 500

    if "audio" not in request.files and "file" not in request.files:
        return jsonify({"error": "No audio file: send multipart field 'audio' or 'file'"}), 400
    blob = request.files.get("audio") or request.files.get("file")
    if not blob or blob.filename == "":
        return jsonify({"error": "No audio file"}), 400

    content_type = blob.content_type or ""
    try:
        audio_bytes = blob.read()
    except Exception as e:
        return jsonify({"error": f"Failed to read upload: {e}"}), 400

    if not audio_bytes:
        return jsonify({"error": "Uploaded file is empty"}), 400

    try:
        audio_b64 = _audio_to_16k_wav_base64(audio_bytes, content_type, blob.filename or "")
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Audio conversion failed: {e}"}), 400

    # Wispr Flow: POST JSON with audio (base64) and optional properties
    payload = {
        "audio": audio_b64,
        "properties": {
            "language": "en",
            "app_type": "other",
        },
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        r = requests.post(WISPR_TRANSCRIBE_URL, json=payload, headers=headers, timeout=60)
    except Exception as e:
        return jsonify({"error": f"Request to Wispr Flow failed: {e}"}), 502

    if r.status_code == 401:
        return jsonify({
            "error": "Wispr Flow returned 401 Unauthorized. Check that your API key in .env is correct and from https://platform.wisprflow.ai"
        }), 401
    if r.status_code != 200:
        try:
            detail = r.json().get("detail", r.text)
        except Exception:
            detail = r.text
        return jsonify({"error": f"Wispr Flow error ({r.status_code}): {detail}"}), 502

    try:
        data = r.json()
    except Exception:
        return jsonify({"error": "Invalid JSON from Wispr Flow"}), 502

    text = (data.get("text") or "").strip()
    return jsonify({
        "transcript": text,
        "detected_language": data.get("detected_language"),
        "total_time_ms": data.get("total_time"),
    })


@app.route("/api/score", methods=["POST"])
def score():
    """
    Accept JSON with "transcript". Send to Claude with satiety-scoring system prompt.
    Return JSON with scores (0-10) and phrases that drove each score.
    """
    api_key = _get_anthropic_api_key()
    if not api_key:
        return jsonify({"error": "ANTHROPIC_API_KEY not set in .env"}), 500

    body = request.get_json(silent=True) or {}
    transcript = (body.get("transcript") or "").strip()
    if not transcript:
        return jsonify({"error": "Missing or empty 'transcript' in request body"}), 400

    try:
        from anthropic import Anthropic
    except ImportError:
        return jsonify({"error": "anthropic package required. pip install anthropic"}), 500

    client = Anthropic(api_key=api_key)
    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=SATIETY_SCORE_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": transcript}],
        )
        raw_text = response.content[0].text
    except Exception as e:
        return jsonify({"error": f"Claude API error: {e}"}), 502

    try:
        json_str = _extract_json_from_text(raw_text)
        result = json.loads(json_str)
    except json.JSONDecodeError as e:
        return jsonify({
            "error": "Claude did not return valid JSON",
            "raw_response": raw_text[:500],
        }), 502

    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
