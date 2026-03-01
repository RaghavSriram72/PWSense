import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { ScrollArea } from './ui/ScrollArea'
import { Clock, TrendingUp, AlertCircle, Flame, Activity } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'

const COLORS = ['#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#1e40af', '#1d4ed8']

function getSeverityColor(severity) {
  if (severity <= 3) return 'bg-green-100 text-green-800 border-green-300'
  if (severity <= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
  return 'bg-red-100 text-red-800 border-red-300'
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

export function SymptomHistory({ symptoms }) {
  const sortedSymptoms = [...(symptoms || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const flareUps = (symptoms || []).filter((s) => s.severity >= 7)
  const moderateEpisodes = (symptoms || []).filter((s) => s.severity >= 4 && s.severity < 7).length
  const last30Days = (symptoms || []).filter((s) => {
    const diffDays = (Date.now() - new Date(s.date).getTime()) / (1000 * 60 * 60 * 24)
    return diffDays <= 30
  })
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const weekSymptoms = (symptoms || []).filter((s) => new Date(s.date).getTime() >= weekAgo)

  const severityOverTime = weekSymptoms
    .map((s) => ({
      date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      severity: s.severity,
      type: s.symptomType,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const symptomTypeCount = {}
  last30Days.forEach((s) => {
    symptomTypeCount[s.symptomType] = (symptomTypeCount[s.symptomType] || 0) + 1
  })
  const symptomDistribution = Object.entries(symptomTypeCount).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  const radarData = Object.entries(symptomTypeCount).map(([type]) => {
    const symptomsOfType = last30Days.filter((s) => s.symptomType === type)
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
  last30Days.forEach((s) => {
    const hour = new Date(s.date).getHours()
    if (hour >= 5 && hour < 12) timeOfDay.Morning++
    else if (hour >= 12 && hour < 17) timeOfDay.Afternoon++
    else if (hour >= 17 && hour < 21) timeOfDay.Evening++
    else timeOfDay.Night++
  })
  const timeOfDayData = Object.entries(timeOfDay).map(([name, value]) => ({ name, value }))

  const flareUpsByType = {}
  flareUps.forEach((s) => {
    flareUpsByType[s.symptomType] = (flareUpsByType[s.symptomType] || 0) + 1
  })
  const flareUpChartData = Object.entries(flareUpsByType).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    count,
  }))

  const triggers = {}
  last30Days.forEach((s) => {
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

  return (
    <div className="space-y-6">
      {symptoms && symptoms.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center mb-4">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-gray-600 mb-1 font-medium">Total Flare-ups</p>
              <p className="text-4xl font-bold text-gray-900">{flareUps.length}</p>
              <p className="text-xs text-gray-500 mt-2">Severity 7+ episodes</p>
            </Card>
            <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-yellow-500 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-gray-600 mb-1 font-medium">Moderate Episodes</p>
              <p className="text-4xl font-bold text-gray-900">{moderateEpisodes}</p>
              <p className="text-xs text-gray-500 mt-2">Severity 4-6 episodes</p>
            </Card>
            <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-[#1e3a8a] flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-gray-600 mb-1 font-medium">Last 30 Days</p>
              <p className="text-4xl font-bold text-gray-900">{last30Days.length}</p>
              <p className="text-xs text-gray-500 mt-2">Recent entries logged</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Severity Trend Over Past Week</h3>
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
                    dot={{ fill: '#1e3a8a', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Distribution of Symptom Types</h3>
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
              <h3 className="text-xl font-bold text-gray-900 mb-6">Outburst Time of Day Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeOfDayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} activeBar={{ fill: '#2563eb' }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {topTriggers.length > 0 && (
            <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Outburst Most Common Triggers</h3>
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
                    cursor={false}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 8, 8, 0]} activeBar={{ fill: '#2563eb' }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}

      <Card className="p-8 bg-white shadow-md border border-gray-200 rounded-xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-[#1e3a8a] flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Symptom History</h2>
          </div>
          <p className="text-gray-600">Review your past entries and track your wellness journey</p>
        </div>

        {sortedSymptoms.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-700 font-medium">No symptoms logged yet</p>
            <p className="text-gray-500 mt-2">Start tracking to see your history here</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {sortedSymptoms.map((symptom) => (
                <div
                  key={symptom.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-900 capitalize">
                          {symptom.symptomType}
                        </h3>
                        <Badge
                          className={`${getSeverityColor(symptom.severity)} px-3 py-1 rounded-full border font-medium`}
                        >
                          Level {symptom.severity}
                        </Badge>
                        {symptom.is_outburst && (
                          <Badge className="bg-red-100 text-red-800 border-red-300 px-3 py-1 rounded-full border font-medium">
                            <Flame className="w-3 h-3 mr-1 inline" />
                            Outburst
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(symptom.date)}
                      </p>
                    </div>
                    <TrendingUp className="w-5 h-5 text-[#1e3a8a]" />
                  </div>
                  {symptom.triggers && (
                    <div className="mb-3 flex items-start gap-2">
                      <span className="text-sm font-semibold text-gray-700 min-w-fit">Triggers:</span>
                      <span className="text-sm text-gray-600">{symptom.triggers}</span>
                    </div>
                  )}
                  {symptom.notes && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700 leading-relaxed">{symptom.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  )
}
