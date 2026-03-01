const API = '/api'

export async function getSymptoms() {
  const res = await fetch(`${API}/symptoms`)
  if (!res.ok) throw new Error('Failed to load symptoms')
  return res.json()
}

export async function createSymptom(body) {
  const res = await fetch(`${API}/symptoms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export async function getHeartrate(hours = 24) {
  const res = await fetch(`${API}/heartrate?hours=${hours}`)
  if (!res.ok) throw new Error('Failed to load heart rate')
  return res.json()
}

export async function getEmotions(days = 7) {
  const res = await fetch(`${API}/emotions?days=${days}`)
  if (!res.ok) throw new Error('Failed to load emotions')
  return res.json()
}

export async function createEmotion(emotion) {
  const res = await fetch(`${API}/emotions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emotion }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export async function createHeartrate(heart_rate, timestamp) {
  const body = { heart_rate }
  if (timestamp) body.timestamp = timestamp
  const res = await fetch(`${API}/heartrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

/** POST audio blob (webm/wav) for transcription. Returns { transcript, detected_language, total_time_ms } */
export async function transcribe(audioBlob) {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.webm')
  const res = await fetch(`${API}/transcribe`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export async function getHungerScores(days = 7) {
  const res = await fetch(`${API}/hunger-scores?days=${days}`)
  if (!res.ok) throw new Error('Failed to load hunger scores')
  return res.json()
}

export async function createHungerScore(hunger_score) {
  const res = await fetch(`${API}/hunger-scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hunger_score }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

/** POST transcript for hunger/satiety score. Returns scores and phrases. */
export async function getScore(transcript) {
  const res = await fetch(`${API}/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

function _encodeWav(samples, sampleRate) {
  const buf = new ArrayBuffer(44 + samples.length * 2)
  const v = new DataView(buf)
  const str = (off, s) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)) }
  str(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); str(8, 'WAVE')
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true)
  v.setUint16(32, 2, true); v.setUint16(34, 16, true)
  str(36, 'data'); v.setUint32(40, samples.length * 2, true)
  let off = 44
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true); off += 2
  }
  return buf
}

async function _toWavBlob(audioBlob) {
  const arrayBuffer = await audioBlob.arrayBuffer()
  const audioCtx = new AudioContext()
  const decoded = await audioCtx.decodeAudioData(arrayBuffer)
  await audioCtx.close()
  const sampleRate = 16000
  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * sampleRate), sampleRate)
  const src = offline.createBufferSource()
  src.buffer = decoded
  src.connect(offline.destination)
  src.start()
  const rendered = await offline.startRendering()
  return new Blob([_encodeWav(rendered.getChannelData(0), sampleRate)], { type: 'audio/wav' })
}

/** POST audio blob for emotion detection. Returns { emotion, probabilities } */
export async function getEmotion(audioBlob) {
  const wavBlob = await _toWavBlob(audioBlob)
  const formData = new FormData()
  formData.append('audio', wavBlob, 'recording.wav')
  const res = await fetch(`${API}/emotion`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}
