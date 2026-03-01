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
  Customized,
} from 'recharts'
import { Calendar, TrendingUp, AlertTriangle, Zap } from 'lucide-react'
import { getHeartrate, getEmotions, getHungerScores } from '../api'

const COLORS = ['#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#1e40af', '#1d4ed8']

const EMOTION_COLORS = {
  neutral: '#6b7280',
  calm: '#3b82f6',
  happy: '#f59e0b',
  sad: '#6366f1',
  angry: '#ef4444',
  fearful: '#f97316',
  disgust: '#22c55e',
  surprised: '#a855f7',
}

// Higher score = more negative/distressed. angry is highest, happy is lowest.
const EMOTION_SCORE = {
  happy: 1,
  calm: 2,
  neutral: 3,
  surprised: 4,
  sad: 5,
  disgust: 6,
  fearful: 7,
  angry: 8,
}
const EMOTION_SCORE_LABELS = {
  1: 'Happy',
  2: 'Calm',
  3: 'Neutral',
  4: 'Surprised',
  5: 'Sad',
  6: 'Disgust',
  7: 'Fearful',
  8: 'Angry',
}


export function Dashboard({ symptoms = [], loading, emotionsVersion = 0 }) {
  const [heartrate, setHeartrate] = useState([])
  const [emotions, setEmotions] = useState([])
  const [hungerScores, setHungerScores] = useState([])

  useEffect(() => {
    let cancelled = false
    getHeartrate(168)
      .then((data) => {
        if (!cancelled) setHeartrate(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    getEmotions(7)
      .then((data) => {
        if (!cancelled) setEmotions(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [emotionsVersion])

  useEffect(() => {
    let cancelled = false
    getHungerScores(7)
      .then((data) => {
        if (!cancelled) setHungerScores(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [emotionsVersion])

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const weekSymptoms = symptoms.filter((s) => new Date(s.date).getTime() >= weekAgo)

  const severityOverTime = weekSymptoms
    .map((s) => ({
      date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      severity: s.severity,
      type: s.symptomType,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const symptomTypeCount = {}
  weekSymptoms.forEach((s) => {
    symptomTypeCount[s.symptomType] = (symptomTypeCount[s.symptomType] || 0) + 1
  })
  const symptomDistribution = Object.entries(symptomTypeCount).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  const avgSeverity =
    weekSymptoms.length > 0
      ? (weekSymptoms.reduce((sum, s) => sum + s.severity, 0) / weekSymptoms.length).toFixed(1)
      : '0'
  const highSeverityCount = weekSymptoms.filter((s) => s.severity >= 7).length
  const weeklyFrequency = weekSymptoms.length

  const radarData = Object.entries(symptomTypeCount).map(([type]) => {
    const symptomsOfType = weekSymptoms.filter((s) => s.symptomType === type)
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

  const hungerChartData = hungerScores.map((e) => ({
    label: new Date(e.timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    }),
    score: e.hunger_score,
  }))

  const timeOfDay = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 }
  weekSymptoms.forEach((s) => {
    const hour = new Date(s.date).getHours()
    if (hour >= 5 && hour < 12) timeOfDay.Morning++
    else if (hour >= 12 && hour < 17) timeOfDay.Afternoon++
    else if (hour >= 17 && hour < 21) timeOfDay.Evening++
    else timeOfDay.Night++
  })
  const timeOfDayData = Object.entries(timeOfDay).map(([name, value]) => ({ name, value }))

  const emotionChartData = emotions
    .filter((e) => new Date(e.timestamp).getTime() >= weekAgo)
    .map((e) => ({
      t: new Date(e.timestamp).getTime(),
      label: new Date(e.timestamp).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
      }),
      emotion: e.emotion,
      score: EMOTION_SCORE[e.emotion] ?? 3,
    }))
    .sort((a, b) => a.t - b.t)

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
          Insights into PWS hunger, emotional state, symptom patterns, and heart rate over the past week
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
          <h3 className="text-xl font-bold text-gray-900 mb-6">Heart Rate (Past Week)</h3>
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

      <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Emotional State (Past Week)</h3>
        <div className="flex flex-wrap gap-3 mb-6">
          {Object.entries(EMOTION_COLORS).map(([emotion, color]) => (
            <div key={emotion} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-500 capitalize">{emotion}</span>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={emotionChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} interval="preserveStartEnd" />
            <YAxis
              domain={[0, 9]}
              ticks={[1, 2, 3, 4, 5, 6, 7, 8]}
              tickFormatter={(v) => EMOTION_SCORE_LABELS[v] || ''}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              width={64}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const { label, emotion } = payload[0].payload
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow text-sm">
                    <p className="text-gray-500 mb-1">{label}</p>
                    <p className="capitalize font-medium" style={{ color: EMOTION_COLORS[emotion] }}>{emotion}</p>
                  </div>
                )
              }}
            />
            <Customized
              component={({ formattedGraphicalItems }) => {
                const points = formattedGraphicalItems?.[0]?.props?.points || []
                return (
                  <g>
                    {points.map((point, i) => {
                      if (i === 0) return null
                      const prev = points[i - 1]
                      const color = EMOTION_COLORS[emotionChartData[i - 1]?.emotion] || '#6b7280'
                      return (
                        <line
                          key={i}
                          x1={prev.x}
                          y1={prev.y}
                          x2={point.x}
                          y2={point.y}
                          stroke={color}
                          strokeWidth={2}
                        />
                      )
                    })}
                  </g>
                )
              }}
            />
            <Line
              type="linear"
              dataKey="score"
              stroke="none"
              dot={(props) => {
                const { cx, cy, payload } = props
                return (
                  <circle
                    key={payload.t}
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={EMOTION_COLORS[payload.emotion] || '#6b7280'}
                    stroke="white"
                    strokeWidth={1.5}
                  />
                )
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Hunger Tracker (Past Week)</h3>
        <p className="text-sm text-gray-500 mb-6">Each bar is one logged "Hungry" entry — height = hunger score (0–10)</p>
        {hungerChartData.length === 0 ? (
          <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">
            No hunger entries logged this week
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={hungerChartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={60} />
              <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fill: '#6b7280', fontSize: 12 }} label={{ value: 'Score', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: 'rgba(245,158,11,0.08)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const { label, score } = payload[0].payload
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow text-sm">
                      <p className="text-gray-500 mb-1">{label}</p>
                      <p className="font-semibold text-blue-600">Hunger score: {score} / 10</p>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey="score"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              >
                {hungerChartData.map((entry, i) => {
                  const intensity = entry.score / 10
                  const r = Math.round(96 - intensity * 66)
                  const g = Math.round(165 - intensity * 60)
                  const b = Math.round(250 - intensity * 55)
                  return <Cell key={i} fill={`rgb(${r},${g},${b})`} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {weekSymptoms.length === 0 ? (
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
              <h3 className="text-xl font-bold text-gray-900 mb-6">Severity Trend Over Time (Past Week)</h3>
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

        </>
      )}
    </div>
  )
}
