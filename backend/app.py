"""
PreStorm backend — Hunger tracker: transcribe, satiety score, caretaker symptom logs.
"""
import base64
import io
import json
import os
import tempfile
import uuid
from datetime import datetime, timedelta, timezone
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

# Caretaker symptom log: allowed types and storage
SYMPTOM_TYPES = frozenset({
    "fatigue", "pain", "headache", "nausea", "dizziness",
    "inflammation", "anxiety", "other",
})
_data_dir = _here / "data"
_data_dir.mkdir(parents=True, exist_ok=True)
SYMPTOMS_FILE = _data_dir / "symptoms.json"
HEARTRATE_FILE = _data_dir / "heartrate.json"

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


def _load_symptoms():
    """Read symptom log from JSON file."""
    if not SYMPTOMS_FILE.exists():
        return []
    with open(SYMPTOMS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_symptoms(entries):
    """Write symptom log to JSON file."""
    with open(SYMPTOMS_FILE, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)


def _load_heartrate():
    """Read heart rate readings from JSON file."""
    if not HEARTRATE_FILE.exists():
        return []
    with open(HEARTRATE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_heartrate(entries):
    """Write heart rate readings to JSON file."""
    with open(HEARTRATE_FILE, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)


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


def _audio_to_wav_path(audio_bytes: bytes, content_type: str, filename: str = "") -> str:
    """
    Convert uploaded audio (webm, wav, mp3, mp4) to 16kHz mono WAV.
    Returns path to a temp WAV file. Caller must delete the file when done.
    """
    fmt = _guess_audio_format(content_type, filename)
    suffix = f".{fmt}" if fmt else ".bin"
    fd, input_path = tempfile.mkstemp(suffix=suffix)
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(audio_bytes)
        wav_fd, wav_path = tempfile.mkstemp(suffix=".wav")
        os.close(wav_fd)
        try:
            if fmt == "mp4":
                from Mp4ToWav import convert_mp4_to_wav
                convert_mp4_to_wav(input_path, wav_path)
            else:
                from pydub import AudioSegment
                fallback_formats = ["mp3", "webm", "wav", "mp4"]
                if fmt not in fallback_formats:
                    fallback_formats.insert(0, fmt)
                else:
                    fallback_formats = [fmt] + [f for f in fallback_formats if f != fmt]
                seg = None
                for f in fallback_formats:
                    try:
                        seg = AudioSegment.from_file(input_path, format=f)
                        break
                    except Exception:
                        continue
                if seg is None:
                    raise ValueError("Could not decode audio. Check file format.")
                seg = seg.set_frame_rate(16000).set_channels(1)
                seg.export(wav_path, format="wav")
            return wav_path
        except Exception:
            if os.path.exists(wav_path):
                os.unlink(wav_path)
            raise
    finally:
        os.unlink(input_path)


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


@app.route("/api/symptoms", methods=["GET"])
def list_symptoms():
    """Return all caretaker symptom log entries, newest first."""
    try:
        entries = _load_symptoms()
        entries = sorted(entries, key=lambda e: e.get("timestamp", ""), reverse=True)
        return jsonify(entries)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/symptoms", methods=["POST"])
def create_symptom():
    """
    Caretaker manual symptom log. Body (JSON):
    - symptom_type: fatigue | pain | headache | nausea | dizziness | inflammation | anxiety | other
    - severity: 0-10
    - possible_triggers: string (optional)
    - additional_notes: string (optional)
    - is_outburst: boolean (optional, default false)
    Server always sets id and timestamp (UTC); do not send timestamp from client.
    """
    body = request.get_json(silent=True) or {}
    symptom_type = (body.get("symptom_type") or "").strip().lower()
    if symptom_type not in SYMPTOM_TYPES:
        return jsonify({
            "error": "Invalid or missing symptom_type",
            "allowed": list(SYMPTOM_TYPES),
        }), 400
    try:
        severity = int(body.get("severity", 0))
    except (TypeError, ValueError):
        severity = 0
    if not (0 <= severity <= 10):
        return jsonify({"error": "severity must be 0-10"}), 400
    possible_triggers = (body.get("possible_triggers") or "").strip()
    additional_notes = (body.get("additional_notes") or "").strip()
    is_outburst = bool(body.get("is_outburst", False))
    # Timestamp is always server-generated (never from client input)
    timestamp = datetime.now(timezone.utc).isoformat()
    entry = {
        "id": str(uuid.uuid4()),
        "symptom_type": symptom_type,
        "severity": severity,
        "possible_triggers": possible_triggers,
        "additional_notes": additional_notes,
        "is_outburst": is_outburst,
        "timestamp": timestamp,
    }
    try:
        entries = _load_symptoms()
        entries.append(entry)
        _save_symptoms(entries)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify(entry), 201


@app.route("/api/heartrate", methods=["GET"])
def list_heartrate():
    """
    Return heart rate readings for charting. Query: ?hours=24 (default).
    Readings in last N hours, sorted by timestamp ascending (for time-series chart).
    """
    try:
        hours = request.args.get("hours", "24")
        try:
            hours = float(hours)
        except (TypeError, ValueError):
            hours = 24
        hours = max(0.1, min(168, hours))  # clamp 0.1–168 (1 week)
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        cutoff_iso = cutoff.isoformat()
        entries = _load_heartrate()
        entries = [e for e in entries if (e.get("timestamp") or "") >= cutoff_iso]
        entries.sort(key=lambda e: e.get("timestamp", ""))
        return jsonify(entries)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/heartrate", methods=["POST"])
def create_heartrate():
    """
    Submit a heart rate reading (device or manual entry for demo).
    Body (JSON): { "heart_rate": number (required, 30-250 BPM) }
    Optional: "timestamp" (ISO 8601) for manual backfill; otherwise server sets current time.
    """
    body = request.get_json(silent=True) or {}
    try:
        heart_rate = float(body.get("heart_rate", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "heart_rate must be a number"}), 400
    if not (30 <= heart_rate <= 250):
        return jsonify({"error": "heart_rate must be between 30 and 250 BPM"}), 400
    ts = (body.get("timestamp") or "").strip()
    if not ts:
        ts = datetime.now(timezone.utc).isoformat()
    entry = {"timestamp": ts, "heart_rate": round(heart_rate, 1)}
    try:
        entries = _load_heartrate()
        entries.append(entry)
        _save_heartrate(entries)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify(entry), 201

_emotion_model = None


def _load_emotion_model():
    global _emotion_model
    if _emotion_model is None:
        import tensorflow as tf
        model_path = _here / "models" / "Emotion_Voice_Detection_Model.h5"
        if not model_path.exists():
            raise FileNotFoundError(
                f"Emotion model not found at {model_path}. "
                "Download or place Emotion_Voice_Detection_Model.h5 in backend/models/"
            )
        _emotion_model = tf.keras.models.load_model(model_path)
    return _emotion_model


@app.route("/api/emotion", methods=["POST"])
def get_emotion():
    """
    Get the emotion of an audio file from voice.
    Accept multipart form data with field 'audio' or 'file'.
    Supports: wav, mp3, mp4, webm.
    Returns: { "emotion": str, "probabilities": { emotion: float, ... } }
    """
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

    wav_path = None
    try:
        wav_path = _audio_to_wav_path(audio_bytes, content_type, blob.filename or "")
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Audio conversion failed: {e}"}), 400

    try:
        from predict_emotion import predict_emotion, EMOTIONS

        model = _load_emotion_model()
        emotion, probs = predict_emotion(wav_path, model)
        probs_dict = {EMOTIONS.get(i, f"class_{i}"): float(p) for i, p in enumerate(probs)}
        return jsonify({"emotion": emotion, "probabilities": probs_dict})
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": f"Emotion prediction failed: {e}"}), 500
    finally:
        if wav_path and os.path.exists(wav_path):
            try:
                os.unlink(wav_path)
            except OSError:
                pass


if __name__ == "__main__":
    app.run(debug=True, port=5000)
