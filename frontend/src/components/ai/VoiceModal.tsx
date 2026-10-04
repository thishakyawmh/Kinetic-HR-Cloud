import React, { useState, useEffect, useRef } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Volume2, Sparkles, X, Check } from 'lucide-react'

interface VoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onTranscriptReady: (transcript: string) => void
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  onTranscriptReady,
}) => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<any>(null)

  const samplePrompts = [
    'My child suddenly got sick and I need tomorrow off. What can I do?',
    'How much leave do I have remaining?',
    'Why is my October take-home salary lower than September?',
    'What is our hybrid and remote work policy?',
  ]

  useEffect(() => {
    if (isOpen) {
      setIsListening(true)
      setTranscript('')

      // Test if Web Speech API is supported in browser
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition()
          recognition.continuous = true
          recognition.interimResults = true
          recognition.lang = 'en-US'

          recognition.onresult = (event: any) => {
            let current = ''
            for (let i = 0; i < event.results.length; i++) {
              current += event.results[i][0].transcript
            }
            setTranscript(current)
          }

          recognition.onerror = () => {
            // Speech error, fallback to interactive simulation
          }

          recognition.start()
          recognitionRef.current = recognition
        } catch (e) {
          console.warn('SpeechRecognition error', e)
        }
      } else {
        // Fallback simulated voice typing
        const simulated = 'My child suddenly got sick and I need tomorrow off. What can I do?'
        let idx = 0
        const interval = setInterval(() => {
          if (idx < simulated.length) {
            setTranscript(simulated.substring(0, idx + 1))
            idx++
          } else {
            clearInterval(interval)
          }
        }, 50)
        return () => clearInterval(interval)
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {}
      }
      setIsListening(false)
    }
  }, [isOpen])

  const handleFinish = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {}
    }
    const finalQuery =
      transcript.trim() || 'My child suddenly got sick and I need tomorrow off. What can I do?'
    onTranscriptReady(finalQuery)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="relative z-50 w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center text-foreground shadow-2xl animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Pulsing Audio Sphere with #23ace3 and #ef8d46 */}
        <div className="my-6 flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            {/* Outer rings */}
            <div className="absolute h-32 w-32 rounded-full bg-[#23ace3]/20 animate-ping" />
            <div className="absolute h-24 w-24 rounded-full bg-[#ef8d46]/25 animate-pulse" />

            {/* Center Mic Button */}
            <button
              onClick={() => setIsListening(!isListening)}
              className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-[#23ace3] to-[#ef8d46] shadow-xl shadow-[#23ace3]/30 hover:scale-105 transition-transform cursor-pointer"
            >
              <Mic className="h-8 w-8 text-white" />
            </button>
          </div>
        </div>

        {/* Animated Sound Wave Bars */}
        <div className="flex items-center justify-center gap-1.5 h-8 my-4">
          {[40, 70, 30, 90, 60, 100, 50, 80, 45, 95, 35, 75].map((h, i) => (
            <div
              key={i}
              className="w-1.5 bg-gradient-to-t from-[#23ace3] to-[#ef8d46] rounded-full transition-all duration-150 animate-pulse"
              style={{
                height: `${isListening ? h : 12}%`,
                animationDelay: `${i * 75}ms`,
              }}
            />
          ))}
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase font-mono tracking-widest text-[#23ace3] font-bold">
            {isListening ? 'Listening to your voice...' : 'Microphone Paused'}
          </span>

          <div className="min-h-[50px] p-4 rounded-2xl bg-muted/40 border border-border text-sm text-foreground">
            {transcript ? (
              <p className="font-medium text-foreground italic">"{transcript}"</p>
            ) : (
              <p className="text-muted-foreground text-xs">
                Speak your request naturally (e.g., "I need tomorrow off - my child is sick")
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-border text-foreground hover:bg-muted text-xs cursor-pointer rounded-xl"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleFinish}
            className="bg-[#23ace3] hover:bg-[#1b97ca] text-white font-bold text-xs px-6 gap-1.5 shadow-lg shadow-[#23ace3]/25 cursor-pointer rounded-xl"
          >
            <Check className="h-4 w-4" />
            <span>Process Voice Query</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
