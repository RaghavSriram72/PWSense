import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/** Map backend symptom entry to frontend display shape */
export function backendToSymptom(entry) {
  if (!entry || typeof entry !== 'object') return null
  return {
    id: entry.id,
    date: entry.timestamp,
    symptomType: entry.symptom_type,
    severity: entry.severity,
    notes: entry.additional_notes || '',
    triggers: entry.possible_triggers || '',
    is_outburst: entry.is_outburst,
  }
}
