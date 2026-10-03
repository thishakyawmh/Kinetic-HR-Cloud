import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from 'react-router-dom'
import { aiService } from '@/services/aiService'
import { AIMessage } from '@/types'
import { AIMessageItem } from '@/components/ai/AIMessageItem'
import { AIThinkingIndicator } from '@/components/ai/AIThinkingIndicator'
import { VoiceModal } from '@/components/ai/VoiceModal'
import {
  Mic,
  ArrowUp,
} from 'lucide-react'

export const EmployeeWorkspace: React.FC = () => {
  const { user, tenant, refreshUser } = useAuth()
  const location = useLocation()

  const [messages, setMessages] = useState<AIMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingStep, setThinkingStep] = useState('')
  const [isVoiceOpen, setIsVoiceOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Calculate dynamic greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isThinking, thinkingStep])

  // Handle URL prompt parameters from sidebar recent links or new chat reset
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const isNew = params.get('new')
    if (isNew) {
      setMessages([])
      setInputText('')
      return
    }
    const prompt = params.get('prompt')
    if (prompt) {
      handleSendMessage(prompt)
    }
  }, [location.search])

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText
    if (!query.trim() || isThinking || !user || !tenant) return

    const userMsg: AIMessage = {
      id: `user-msg-${Date.now()}`,
      sender: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setIsThinking(true)
    setThinkingStep('Thinking...')

    try {
      const response = await aiService.sendMessage(
        query,
        {
          userId: user.id,
          tenantId: tenant.id,
          userName: user.name,
        },
        {
          onToolStep: (_, label) => {
            setThinkingStep(label)
          },
        }
      )

      setMessages(prev => [...prev, response])
    } catch (err) {
      console.error('Response error', err)
    } finally {
      setIsThinking(false)
      setThinkingStep('')
    }
  }

  const handleVoiceTranscript = (transcript: string) => {
    handleSendMessage(transcript)
  }

  // Render Input Box component for both fresh chat (middle) and ongoing chat (docked)
  const renderInputBox = (isCentered: boolean) => (
    <div className={`w-full ${isCentered ? 'max-w-2xl mx-auto' : 'max-w-3xl mx-auto'}`}>
      <div className="rounded-[28px] bg-card px-6 py-3.5 transition-all focus-within:shadow-md border border-border/40 focus-within:border-border/80 flex items-center justify-between gap-3 shadow-md">
        {/* Textarea / Input */}
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSendMessage()
            }
          }}
          placeholder="Ask Kinetic"
          rows={1}
          className="w-full bg-transparent border-0 resize-none text-[15px] sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[26px] max-h-32 leading-relaxed"
          disabled={isThinking}
          autoFocus={isCentered}
        />

        {/* Right Controls: Mic + Send Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mic Button */}
          <button
            type="button"
            onClick={() => setIsVoiceOpen(true)}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Voice input"
          >
            <Mic className="h-5 w-5" />
          </button>

          {/* Send Arrow Button */}
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isThinking}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-all cursor-pointer ${inputText.trim() && !isThinking
              ? 'bg-[#23ace3] text-white hover:bg-[#1b97ca]'
              : 'text-muted-foreground/30 cursor-not-allowed'
              }`}
            title="Send"
          >
            <ArrowUp className="h-5 w-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

    </div>
  )

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] w-full max-w-4xl mx-auto font-sans justify-between">
      {messages.length === 0 ? (
        /* Fresh Chat State: Middle Greeting + Middle Typing Section */
        <div className="flex-1 flex flex-col items-center justify-center px-4 w-full animate-in fade-in duration-300">
          <div className="w-full max-w-2xl flex flex-col items-center text-center space-y-7 -mt-10">
            {/* Middle Greeting & Subtitle */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-foreground font-sans">
                {getGreeting()},{' '}
                <span className="bg-gradient-to-r from-[#23ace3] via-[#8590ea] to-[#ef8d46] bg-clip-text text-transparent">
                  {user?.name.split(' ')[0] || 'Alice'}
                </span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground/80 font-normal">
                How can I help you today?
              </p>
            </div>

            {/* Middle Typing Section directly below greeting */}
            <div className="w-full pt-1">
              {renderInputBox(true)}
            </div>
          </div>
        </div>
      ) : (
        /* Active Conversation: Chat Thread + Docked Bottom Input Box */
        <>
          {/* Scrollable Conversation Viewport */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-6">
            <div className="space-y-6 max-w-3xl mx-auto pb-6 w-full">
              {messages.map(msg => (
                <AIMessageItem
                  key={msg.id}
                  message={msg}
                  onActionComplete={() => {
                    refreshUser()
                  }}
                />
              ))}

              {isThinking && <AIThinkingIndicator currentStep={thinkingStep} />}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Docked Bottom Typing Box */}
          <div className="w-full px-4 pb-4 pt-2">
            {renderInputBox(false)}
          </div>
        </>
      )}

      {/* Voice Modal */}
      <VoiceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onTranscriptReady={handleVoiceTranscript}
      />
    </div>
  )
}
