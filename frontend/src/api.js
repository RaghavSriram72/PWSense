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
