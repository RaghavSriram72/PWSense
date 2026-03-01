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

/** POST audio blob for emotion detection. Returns { emotion, probabilities } */
export async function getEmotion(audioBlob) {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.webm')
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
