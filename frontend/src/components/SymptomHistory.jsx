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
  Area,
  AreaChart,
} from 'recharts'

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

  const dateGroups = {}
  ;(symptoms || []).forEach((s) => {
    const date = new Date(s.date).toLocaleDateString()
    if (!dateGroups[date]) dateGroups[date] = []
    dateGroups[date].push(s.severity)
  })
  const chartData = Object.entries(dateGroups)
    .map(([date, severities]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      avgSeverity: severities.reduce((a, b) => a + b, 0) / severities.length,
      maxSeverity: Math.max(...severities),
      count: severities.length,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14)

  const flareUpsByType = {}
  flareUps.forEach((s) => {
    flareUpsByType[s.symptomType] = (flareUpsByType[s.symptomType] || 0) + 1
  })
  const flareUpChartData = Object.entries(flareUpsByType).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
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
              <h3 className="text-xl font-bold text-gray-900 mb-6">Severity Trend (Last 14 Days)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSeverity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  <Area
                    type="monotone"
                    dataKey="avgSeverity"
                    stroke="#1e3a8a"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSeverity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            {flareUpChartData.length > 0 && (
              <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Flare-ups by Symptom Type</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={flareUpChartData}>
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
                    <Bar dataKey="count" fill="#dc2626" radius={[8, 8, 0, 0]} activeBar={{ fill: '#b91c1c' }} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
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
