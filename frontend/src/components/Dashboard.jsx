import { useState, useEffect } from 'react'
import { Card } from './ui/Card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { Calendar, TrendingUp, AlertTriangle, Zap } from 'lucide-react'
import { getHeartrate } from '../api'

const COLORS = ['#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#1e40af', '#1d4ed8']

export function Dashboard({ symptoms = [], loading }) {
  const [heartrate, setHeartrate] = useState([])

  useEffect(() => {
    let cancelled = false
    getHeartrate(168)
      .then((data) => {
        if (!cancelled) setHeartrate(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const severityOverTime = symptoms
    .map((s) => ({
      date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      severity: s.severity,
      type: s.symptomType,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30)

  const symptomTypeCount = {}
  symptoms.forEach((s) => {
    symptomTypeCount[s.symptomType] = (symptomTypeCount[s.symptomType] || 0) + 1
  })
  const symptomDistribution = Object.entries(symptomTypeCount).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  const avgSeverity =
    symptoms.length > 0
      ? (symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length).toFixed(1)
      : '0'
  const highSeverityCount = symptoms.filter((s) => s.severity >= 7).length
  const weeklyFrequency = symptoms.filter((s) => {
    const diffDays = (Date.now() - new Date(s.date).getTime()) / (1000 * 60 * 60 * 24)
    return diffDays <= 7
  }).length

  const triggers = {}
  symptoms.forEach((s) => {
    if (s.triggers) {
      s.triggers
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .forEach((trigger) => {
          triggers[trigger] = (triggers[trigger] || 0) + 1
        })
    }
  })
  const topTriggers = Object.entries(triggers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
    }))

  const radarData = Object.entries(symptomTypeCount).map(([type]) => {
    const symptomsOfType = symptoms.filter((s) => s.symptomType === type)
    const avgSev =
      symptomsOfType.length > 0
        ? symptomsOfType.reduce((sum, s) => sum + s.severity, 0) / symptomsOfType.length
        : 0
    return {
      type: type.charAt(0).toUpperCase() + type.slice(1),
      severity: parseFloat(avgSev.toFixed(1)),
      frequency: symptomsOfType.length,
    }
  })

  const timeOfDay = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 }
  symptoms.forEach((s) => {
    const hour = new Date(s.date).getHours()
    if (hour >= 5 && hour < 12) timeOfDay.Morning++
    else if (hour >= 12 && hour < 17) timeOfDay.Afternoon++
    else if (hour >= 17 && hour < 21) timeOfDay.Evening++
    else timeOfDay.Night++
  })
  const timeOfDayData = Object.entries(timeOfDay).map(([name, value]) => ({ name, value }))

  const heartrateChartData = heartrate
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((r) => ({
      time: new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      heart_rate: r.heart_rate,
    }))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-gray-500">Loading insights…</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="bg-[#1e3a8a] text-white rounded-xl p-10 shadow-lg">
        <h2 className="text-4xl font-bold mb-3">Comprehensive Health Analytics</h2>
        <p className="text-blue-100 text-lg">
          Deep insights into your symptom patterns and heart rate over the last week
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-[#1e3a8a] flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-gray-600 mb-1 font-medium">Total Entries</p>
          <p className="text-4xl font-bold text-gray-900">{symptoms.length}</p>
        </Card>
        <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-[#1e3a8a] flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-gray-600 mb-1 font-medium">Avg Severity</p>
          <p className="text-4xl font-bold text-gray-900">{avgSeverity}</p>
        </Card>
        <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-gray-600 mb-1 font-medium">High Severity</p>
          <p className="text-4xl font-bold text-gray-900">{highSeverityCount}</p>
        </Card>
        <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-gray-600 mb-1 font-medium">This Week</p>
          <p className="text-4xl font-bold text-gray-900">{weeklyFrequency}</p>
        </Card>
      </div>

      {heartrateChartData.length > 0 && (
        <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Heart Rate (Last Week)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={heartrateChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="heart_rate"
                stroke="#dc2626"
                strokeWidth={2}
                dot={false}
                name="BPM"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {symptoms.length === 0 ? (
        <Card className="p-16 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="text-center">
            <TrendingUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-700 font-medium">No data to display yet</p>
            <p className="text-gray-500 mt-2">Start logging symptoms to see insights</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Severity Trend Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={severityOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis domain={[0, 10]} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="severity"
                    stroke="#1e3a8a"
                    strokeWidth={3}
                    dot={{ fill: '#1e3a8a', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Symptom Type Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={symptomDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {symptomDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {radarData.length > 0 && (
              <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Symptom Pattern Analysis</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="type" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 10]} tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Radar
                      name="Avg Severity"
                      dataKey="severity"
                      stroke="#1e3a8a"
                      fill="#1e3a8a"
                      fillOpacity={0.6}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            )}
            <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Time of Day Patterns</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeOfDayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {topTriggers.length > 0 && (
            <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Most Common Triggers</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topTriggers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="#ef4444" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
