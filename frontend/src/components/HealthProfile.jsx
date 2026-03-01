import { useState, useEffect } from 'react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Label } from './ui/Label'
import { Textarea } from './ui/Textarea'
import { Checkbox } from './ui/Checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog'
import { User, Download, Share2, Building2, FileText, Save, Calendar, Send, Mail, Upload, X } from 'lucide-react'

const defaultProfile = {
  fullName: '',
  dateOfBirth: '',
  bloodType: '',
  allergies: '',
  currentMedications: '',
  chronicConditions: '',
  emergencyContact: '',
  emergencyPhone: '',
  primaryPhysician: '',
  physicianPhone: '',
  insuranceProvider: '',
  insuranceId: '',
}

export function HealthProfile({ symptoms = [] }) {
  const [profile, setProfile] = useState(defaultProfile)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [providerEmail, setProviderEmail] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [includeProfile, setIncludeProfile] = useState(true)
  const [includeSymptoms, setIncludeSymptoms] = useState(true)
  const [shareMethod, setShareMethod] = useState('email')
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('healthProfile')
      if (stored) setProfile({ ...defaultProfile, ...JSON.parse(stored) })
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem('healthProfile', JSON.stringify(profile))
    setSaveMessage('Profile saved.')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const exportToJSON = () => {
    const sorted = [...symptoms].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const exportData = {
      profile,
      symptoms: sorted,
      exportDate: new Date().toISOString(),
      summary: {
        totalSymptoms: symptoms.length,
        dateRange:
          symptoms.length > 0
            ? {
                start: new Date(sorted[sorted.length - 1].date).toLocaleDateString(),
                end: new Date(sorted[0].date).toLocaleDateString(),
              }
            : null,
      },
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pwsense-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const buildReportText = () => {
    let text = '=== PWSENSE MEDICAL REPORT ===\n\n'
    text += `Export Date: ${new Date().toLocaleString()}\n\n`
    if (includeProfile) {
      text += '--- PATIENT INFORMATION ---\n'
      text += `Name: ${profile.fullName || 'Not provided'}\n`
      text += `Date of Birth: ${profile.dateOfBirth || 'Not provided'}\n`
      text += `Blood Type: ${profile.bloodType || 'Not provided'}\n`
      text += `Allergies: ${profile.allergies || 'None listed'}\n`
      text += `Current Medications: ${profile.currentMedications || 'None listed'}\n`
      text += `Chronic Conditions: ${profile.chronicConditions || 'None listed'}\n\n`
      text += '--- EMERGENCY CONTACT ---\n'
      text += `Contact: ${profile.emergencyContact || 'Not provided'}\n`
      text += `Phone: ${profile.emergencyPhone || 'Not provided'}\n\n`
      text += '--- PRIMARY CARE ---\n'
      text += `Physician: ${profile.primaryPhysician || 'Not provided'}\n`
      text += `Phone: ${profile.physicianPhone || 'Not provided'}\n\n`
    }
    if (includeSymptoms) {
      text += `--- SYMPTOM HISTORY (${symptoms.length} entries) ---\n`
      const sorted = [...symptoms].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      sorted.forEach((s, i) => {
        text += `\n[${i + 1}] ${new Date(s.date).toLocaleString()}\n`
        text += `   Type: ${(s.symptomType || '').toUpperCase()}\n`
        text += `   Severity: ${s.severity}/10\n`
        if (s.triggers) text += `   Triggers: ${s.triggers}\n`
        if (s.notes) text += `   Notes: ${s.notes}\n`
      })
    }
    return text
  }

  const exportToText = () => {
    const blob = new Blob([buildReportText()], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pwsense-report-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleShare = () => {
    if (!providerEmail.trim()) return
    const text = buildReportText()
    const mailtoLink = `mailto:${providerEmail.trim()}?subject=PWSense%20Medical%20Report&body=${encodeURIComponent(shareMessage + '\n\n' + text)}`
    window.location.href = mailtoLink
    setShareDialogOpen(false)
  }

  return (
    <div className="space-y-8">
      <Card className="p-8 bg-white border border-gray-200 shadow-md rounded-xl">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-[#1e3a8a] flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Health Profile</h2>
          </div>
          <p className="text-gray-600">Manage your health information and medical records</p>
        </div>
        <div className="flex flex-wrap gap-4 mt-8">
          <Button variant="outline" onClick={exportToJSON} className="min-w-[200px] h-12">
            <Download className="w-4 h-4 mr-2" />
            Export Data (JSON)
          </Button>
          <Button variant="outline" onClick={exportToText} className="min-w-[200px] h-12">
            <FileText className="w-4 h-4 mr-2" />
            Medical Report (TXT)
          </Button>
          <Button variant="outline" onClick={() => setShareDialogOpen(true)} className="min-w-[200px] h-12">
            <Share2 className="w-4 h-4 mr-2" />
            Share with Provider
          </Button>
        </div>
      </Card>

      <Card className="p-8 bg-white shadow-md border border-gray-200 rounded-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#1e3a8a] flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Personal Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            ['fullName', 'Full Name', 'John Doe'],
            ['dateOfBirth', 'Date of Birth', ''],
            ['bloodType', 'Blood Type', 'e.g., O+'],
            ['insuranceProvider', 'Insurance Provider', ''],
            ['insuranceId', 'Insurance ID', ''],
          ].map(([key, label, placeholder]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                type={key === 'dateOfBirth' ? 'date' : 'text'}
                value={profile[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-8 bg-white shadow-md border border-gray-200 rounded-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#1e3a8a] flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Medical Information</h3>
        </div>
        <div className="space-y-5">
          {[
            ['allergies', 'Allergies', 'List any allergies'],
            ['currentMedications', 'Current Medications', 'List medications with dosage'],
            ['chronicConditions', 'Chronic Conditions', 'List chronic conditions'],
          ].map(([key, label, placeholder]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Textarea
                id={key}
                value={profile[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                rows={key === 'allergies' ? 2 : 3}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-8 bg-white shadow-md border border-gray-200 rounded-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#1e3a8a] flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Emergency & Healthcare Contacts</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            ['emergencyContact', 'Emergency Contact Name'],
            ['emergencyPhone', 'Emergency Contact Phone'],
            ['primaryPhysician', 'Primary Physician'],
            ['physicianPhone', 'Physician Phone'],
          ].map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                type={key.includes('Phone') ? 'tel' : 'text'}
                value={profile[key]}
                onChange={(e) => handleChange(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-8 bg-[#1e3a8a] text-white shadow-lg rounded-xl">
        <div className="flex items-start gap-5">
          <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-3">Medical System Integration</h3>
            <p className="text-blue-100 mb-5 leading-relaxed">
              Share your symptom tracking data with healthcare providers through secure export formats. 
              Your exported files can be imported into most Electronic Health Record (EHR) systems or 
              shared directly with your doctor.
            </p>
            <div className="space-y-2.5">
              <p className="text-blue-50 flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                HIPAA-compliant data export
              </p>
              <p className="text-blue-50 flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                Compatible with major EHR systems
              </p>
              <p className="text-blue-50 flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                Secure local storage (no cloud uploads)
              </p>
              <p className="text-blue-50 flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                Easy sharing via email or patient portal
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end items-center gap-4">
        {saveMessage && <span className="text-green-600 text-sm">{saveMessage}</span>}
        <Button onClick={handleSave} className="h-12 px-10">
          <Save className="w-5 h-5 mr-2" />
          Save Profile
        </Button>
      </div>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="relative max-w-lg">
          <button
            type="button"
            onClick={() => setShareDialogOpen(false)}
            className="absolute top-6 right-6 p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <DialogHeader>
            <DialogTitle>Share with Healthcare Provider</DialogTitle>
            <DialogDescription>Send your health profile and symptom data securely to your healthcare provider.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="font-semibold text-gray-900">Delivery Method:</Label>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setShareMethod('email')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${shareMethod === 'email' ? 'bg-gray-200 border-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                >
                  <span className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${shareMethod === 'email' ? 'border-gray-700 bg-gray-700' : 'border-gray-400'}`}>
                    {shareMethod === 'email' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <Mail className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  <span className="font-medium text-gray-900">Email to Provider</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShareMethod('mychart')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${shareMethod === 'mychart' ? 'bg-gray-200 border-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                >
                  <span className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${shareMethod === 'mychart' ? 'border-gray-700 bg-gray-700' : 'border-gray-400'}`}>
                    {shareMethod === 'mychart' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <Upload className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  <span className="font-medium text-gray-900">Upload to MyChart</span>
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="providerEmail" className="font-semibold text-gray-900">Provider Email Address</Label>
              <Input
                id="providerEmail"
                type="email"
                value={providerEmail}
                onChange={(e) => setProviderEmail(e.target.value)}
                placeholder="doctor@healthcare.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shareMessage" className="font-semibold text-gray-900">Personal Message</Label>
              <Textarea
                id="shareMessage"
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                placeholder="Include a message for your provider (optional)"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-gray-900">Include in Report:</Label>
              <div className="space-y-1">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <Checkbox id="incProfile" checked={includeProfile} onCheckedChange={setIncludeProfile} />
                  <Label htmlFor="incProfile" className="cursor-pointer font-normal">Health profile and medical information</Label>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <Checkbox id="incSymptoms" checked={includeSymptoms} onCheckedChange={setIncludeSymptoms} />
                  <Label htmlFor="incSymptoms" className="cursor-pointer font-normal">Symptom tracking history ({symptoms.length} entries)</Label>
                </div>
              </div>
            </div>
            {shareMethod === 'email' && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                Note: This will open your default email client with the report attached. Make sure your email is properly configured.
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setShareDialogOpen(false)} className="flex-1 h-12 bg-white">
              Cancel
            </Button>
            <Button onClick={handleShare} className="flex-1 h-12 bg-[#1e3a8a] hover:bg-[#1e40af] text-white">
              <Send className="w-4 h-4 mr-2" />
              Send to Provider
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
