import { useState } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Input } from './ui/Input'
import { Label } from './ui/Label'
import { Textarea } from './ui/Textarea'
import { Checkbox } from './ui/Checkbox'
import { Activity, Plus } from 'lucide-react'
import { createSymptom } from '../api'

const SYMPTOM_TYPES = [
  'Skin picking',
  'High Anxiety',
  'Depression',
  'Irritable',
  'Sleep Disturbance',
  'Increased Opposition',
  'Uncommunicative',
  'Hungry',
  'Other',
]

export function SymptomTracker({ onAddSymptom }) {
  const [symptomType, setSymptomType] = useState('')
  const [severity, setSeverity] = useState(5)
  const [notes, setNotes] = useState('')
  const [triggers, setTriggers] = useState('')
  const [isOutburst, setIsOutburst] = useState(false)
  const [otherSymptom, setOtherSymptom] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!symptomType) {
      setError('Please select a symptom type')
      return
    }
    const backendType = symptomType === 'other' ? 'other' : symptomType
    setLoading(true)
    try {
      const created = await createSymptom({
        symptom_type: backendType,
        severity: Number(severity),
        possible_triggers: triggers.trim(),
        additional_notes: notes.trim(),
        is_outburst: isOutburst,
      })
      onAddSymptom(created)
      setSymptomType('')
      setSeverity(5)
      setNotes('')
      setTriggers('')
      setOtherSymptom('')
      setIsOutburst(false)
    } catch (err) {
      setError(err.message || 'Failed to log symptom')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-8 bg-white shadow-md border border-gray-200 rounded-xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-lg bg-[#1e3a8a] flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Log Your Symptoms</h2>
        </div>
        <p className="text-gray-600">Track how you're feeling to identify patterns and stay ahead of flare-ups</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="symptom-type" className="text-gray-700 font-medium">Symptom Type</Label>
          <select
            id="symptom-type"
            value={symptomType}
            onChange={(e) => setSymptomType(e.target.value)}
            className="flex h-12 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus:border-[#1e3a8a] focus:outline-none focus:ring-1 focus:ring-[#1e3a8a]"
          >
            <option value="">Select symptom type</option>
            {SYMPTOM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {symptomType === 'other' && (
          <div className="space-y-2">
            <Label htmlFor="other-symptom" className="text-gray-700 font-medium">Specify (optional)</Label>
            <Input
              id="other-symptom"
              placeholder="e.g., fever, rash"
              value={otherSymptom}
              onChange={(e) => setOtherSymptom(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="severity" className="text-gray-700 font-medium">Severity Level (0-10)</Label>
          <div className="flex items-center gap-4">
            <input
              id="severity"
              type="range"
              min="0"
              max="10"
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              className="flex-1 h-2 rounded-full accent-[#1e3a8a]"
            />
            <div className="w-16 h-12 rounded-lg bg-[#1e3a8a] flex items-center justify-center font-bold text-xl text-white shadow-sm">
              {severity}
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 px-1">
            <span>Mild</span>
            <span>Moderate</span>
            <span>Severe</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="triggers" className="text-gray-700 font-medium">Possible Triggers</Label>
          <Input
            id="triggers"
            placeholder="e.g., stress, certain foods, lack of sleep"
            value={triggers}
            onChange={(e) => setTriggers(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-gray-700 font-medium">Additional Notes</Label>
          <Textarea
            id="notes"
            placeholder="Describe your symptoms in detail..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
          <Checkbox
            id="outburst"
            checked={isOutburst}
            onCheckedChange={setIsOutburst}
          />
          <Label htmlFor="outburst" className="cursor-pointer font-medium text-gray-700">
            Mark as outburst
          </Label>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <Button
          type="submit"
          className="w-full h-12"
          disabled={loading}
        >
          <Plus className="w-5 h-5 mr-2" />
          {loading ? 'Saving…' : 'Log Symptom'}
        </Button>
      </form>
    </Card>
  )
}
