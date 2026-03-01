import { useState, useRef } from 'react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { transcribe, getScore, getEmotion, createHungerScore } from '../api'
import { Mic, Square, FileText, UtensilsCrossed, Smile } from 'lucide-react'

export function Record() {
  const [isRecording, setIsRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  const startRecording = async () => {
    setError('')
    setResults(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      setError(err.message || 'Microphone access denied. Please allow microphone access to record.')
    }
  }

  const stopRecording = async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state !== 'recording') return

    await new Promise((resolve) => {
      const originalOnStop = recorder.onstop
      recorder.onstop = () => {
        if (originalOnStop) originalOnStop()
        resolve()
      }
      recorder.stop()
    })
    setIsRecording(false)

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    if (blob.size < 1000) {
      setError('Recording too short. Please record for at least a few seconds.')
      return
    }

    setProcessing(true)
    setError('')

    try {
      const [transcribeRes, emotionRes] = await Promise.all([
        transcribe(blob),
        getEmotion(blob),
      ])

      const transcript = transcribeRes.transcript || ''
      let scoreRes = null
      if (transcript.trim()) {
        try {
          scoreRes = await getScore(transcript)
          if (scoreRes?.hunger_score != null) {
            createHungerScore(scoreRes.hunger_score).catch(() => {})
          }
        } catch {
          scoreRes = null
        }
      }

      setResults({
        transcript,
        score: scoreRes,
        emotion: emotionRes.emotion,
        probabilities: emotionRes.probabilities,
      })
    } catch (err) {
      setError(err.message || 'Failed to process recording')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Card className="p-8 bg-white shadow-md border border-gray-200 rounded-xl max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-lg bg-[#1e3a8a] flex items-center justify-center">
            <Mic className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Voice Recording</h2>
        </div>
        <p className="text-gray-600">
          Record your voice to get a transcript, hunger score, and emotion analysis
        </p>
      </div>

      <div className="flex flex-col items-center gap-6">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
            aria-label="Start recording"
          >
            <Mic className="w-12 h-12" />
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            className="w-24 h-24 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center animate-pulse"
            aria-label="Stop recording"
          >
            <Square className="w-10 h-10" fill="currentColor" />
          </Button>
        )}

        <p className="text-sm text-gray-500">
          {isRecording ? 'Recording… Click the square to stop' : 'Click the red button to start recording'}
        </p>

        {processing && (
          <div className="flex items-center gap-2 text-[#1e3a8a] font-medium">
            <span className="inline-block w-4 h-4 border-2 border-[#1e3a8a] border-t-transparent rounded-full animate-spin" />
            Processing audio…
          </div>
        )}

        {error && (
          <div className="w-full p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {results && !processing && (
          <div className="w-full space-y-6 mt-4">
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-[#1e3a8a]" />
                <h3 className="font-semibold text-gray-900">Transcript</h3>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">
                {results.transcript || '(No speech detected)'}
              </p>
            </div>

            {results.score && (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <UtensilsCrossed className="w-5 h-5 text-amber-700" />
                  <h3 className="font-semibold text-gray-900">Hunger Score</h3>
                </div>
                <p className="text-3xl font-bold text-amber-700">
                  {results.score.hunger_score}<span className="text-lg font-medium text-amber-600"> / 10</span>
                </p>
              </div>
            )}

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Smile className="w-5 h-5 text-[#1e3a8a]" />
                <h3 className="font-semibold text-gray-900">Emotion</h3>
              </div>
              <p className="text-lg font-medium text-[#1e3a8a] capitalize mb-2">
                {results.emotion}
              </p>
              {results.probabilities && Object.keys(results.probabilities).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(results.probabilities).map(([name, prob]) => (
                    <span
                      key={name}
                      className="px-2 py-1 rounded-md bg-white/80 text-sm text-gray-700"
                    >
                      {name}: {(prob * 100).toFixed(0)}%
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
