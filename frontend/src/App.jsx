import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/Tabs'
import { SymptomTracker } from './components/SymptomTracker'
import { SymptomHistory } from './components/SymptomHistory'
import { Dashboard } from './components/Dashboard'
import { HealthProfile } from './components/HealthProfile'
import { ElectronicBackground } from './components/ElectronicBackground'
import { BarChart3, Clock, Plus, User } from 'lucide-react'
import { getSymptoms } from './api'
import { backendToSymptom } from './lib/utils'

export default function App() {
  const [symptoms, setSymptoms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSymptoms = async () => {
    try {
      setError('')
      const data = await getSymptoms()
      setSymptoms(data)
    } catch (err) {
      setError(err.message || 'Failed to load symptoms')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSymptoms()
  }, [])

  const handleAddSymptom = (created) => {
    setSymptoms((prev) => [created, ...prev])
  }

  const symptomsForDisplay = Array.isArray(symptoms)
    ? symptoms.map(backendToSymptom).filter(Boolean)
    : []

  return (
    <div className="min-h-screen bg-[#d5dce6]">
      <ElectronicBackground />
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-[#1e3a8a] flex items-center justify-center text-white text-2xl font-bold">
                PWS
              </div>
              <h1 className="text-3xl font-bold text-[#1e3a8a]">PWSense</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <Tabs defaultValue="track" className="w-full">
          <div className="bg-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-4 gap-3 bg-transparent h-auto p-0 mb-6">
                <TabsTrigger value="track">
                  <Plus className="w-5 h-5" aria-hidden />
                  <span className="text-sm font-medium">Track</span>
                </TabsTrigger>
                <TabsTrigger value="dashboard">
                  <BarChart3 className="w-5 h-5" aria-hidden />
                  <span className="text-sm font-medium">Insights</span>
                </TabsTrigger>
                <TabsTrigger value="history">
                  <Clock className="w-5 h-5" aria-hidden />
                  <span className="text-sm font-medium">History</span>
                </TabsTrigger>
                <TabsTrigger value="profile">
                  <User className="w-5 h-5" aria-hidden />
                  <span className="text-sm font-medium">Profile</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="track" className="mt-0">
            <div className="bg-[#d5dce6] py-12">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <SymptomTracker onAddSymptom={handleAddSymptom} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dashboard" className="mt-0">
            <div className="bg-[#d5dce6] py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {error && <p className="text-red-600 mb-4">{error}</p>}
                <Dashboard symptoms={symptomsForDisplay} loading={loading} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <div className="bg-[#d5dce6] py-12">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <SymptomHistory symptoms={symptomsForDisplay} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="mt-0">
            <div className="bg-[#d5dce6] py-12">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <HealthProfile symptoms={symptomsForDisplay} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">Track your health journey • Identify patterns • Stay informed</p>
            <p className="text-sm text-gray-500 mt-2">© 2026 PWSense. Your health, our priority.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
