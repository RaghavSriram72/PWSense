#!/bin/bash
# Test the /api/emotion endpoint
# Usage: ./test_emotion_endpoint.sh [path-to-audio-file]
# Default: test_audio/test.wav

set -e
AUDIO="${1:-test_audio/test.wav}"
BASE_URL="${BASE_URL:-http://127.0.0.1:5000}"

if [[ ! -f "$AUDIO" ]]; then
  echo "Error: Audio file not found: $AUDIO"
  exit 1
fi

echo "Testing POST $BASE_URL/api/emotion with file: $AUDIO"
echo "---"
curl -s -X POST "$BASE_URL/api/emotion" -F "audio=@$AUDIO" | python3 -m json.tool
echo ""
