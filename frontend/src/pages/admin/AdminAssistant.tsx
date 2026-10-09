import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from 'react-router-dom'
import { aiService } from '@/services/aiService'
import { chatHistoryService, AIChatSession } from '@/services/chatHistoryService'
import { AIMessage } from '@/types'
import { AIMessageItem } from '@/components/ai/AIMessageItem'
import { AIThinkingIndicator } from '@/components/ai/AIThinkingIndicator'
import { AIChatHistoryDrawer } from '@/components/ai/AIChatHistoryDrawer'
import { VoiceModal } from '@/components/ai/VoiceModal'
import { Mic, ArrowUp, History, Plus, Sparkles } from 'lucide-react'

export const AdminAssistant: React.FC = () => {
  const { user, tenant, refreshUser } = useAuth()
  const location = useLocation()

  const [messages, setMessages] = useState<AIMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingStep, setThinkingStep] = useState('')
  const [isVoiceOpen, setIsVoiceOpen] = useState(false)
  const [sessions, setSessions] = useState<AIChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
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

  // Load initial sessions
  useEffect(() => {
    if (tenant?.id && user?.id) {
      setSessions(chatHistoryService.getSessions(tenant.id, user.id))
    }
  }, [tenant?.id, user?.id])

  const handleStartNewChat = () => {
    setActiveSessionId(null)
    setMessages([])
    setInputText('')
  }

  const handleSelectSession = (session: AIChatSession) => {
    setActiveSessionId(session.id)
    setMessages(session.messages || [])
  }

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!tenant?.id || !user?.id) return
    const updated = chatHistoryService.deleteSession(tenant.id, user.id, sessionId)
    setSessions(updated)
    if (activeSessionId === sessionId) {
      handleStartNewChat()
    }
  }

  // Handle URL prompt parameters from sidebar recent links or new chat reset
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const isNew = params.get('new')
    if (isNew) {
      handleStartNewChat()
      return
    }

    const chatId = params.get('chatId')
    if (chatId && tenant?.id && user?.id) {
      const all = chatHistoryService.getSessions(tenant.id, user.id)
      const found = all.find(s => s.id === chatId)
      if (found) {
        handleSelectSession(found)
        return
      }
    }

    const prompt = params.get('prompt')
    if (prompt && prompt.trim()) {
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
    setThinkingStep('Analyzing tenant data...')

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

      setMessages(prev => {
        const next = [...prev, response]
        if (tenant?.id && user?.id) {
          const saved = chatHistoryService.saveSession(tenant.id, user.id, {
            id: activeSessionId || undefined,
            messages: next,
          })
          setActiveSessionId(saved.id)
          setSessions(chatHistoryService.getSessions(tenant.id, user.id))
        }
        return next
      })
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
      {/* Top Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 shrink-0 bg-card/40 backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#23ace3]/15 text-[#23ace3]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">Kinetic AI Administrator Copilot</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Azure OpenAI GPT-4o
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Chat History Button */}
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-border/60 bg-muted/40 hover:bg-muted text-foreground transition-all cursor-pointer shadow-2xs hover:border-[#23ace3]/50"
            title="Open Chat History (Limit: 5 chats)"
          >
            <History className="h-3.5 w-3.5 text-[#23ace3]" />
            <span>Chat History</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#23ace3]/15 text-[#23ace3] font-bold">
              {sessions.length} / 5
            </span>
          </button>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleStartNewChat}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#23ace3] text-white hover:bg-[#1b97ca] transition-all cursor-pointer shadow-2xs"
            title="Start new conversation"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {messages.length === 0 ? (
        /* Fresh Chat State: Middle Greeting + Middle Typing Section */
        <div className="flex-1 flex flex-col items-center justify-center px-4 w-full animate-in fade-in duration-300">
          <div className="w-full max-w-2xl flex flex-col items-center text-center space-y-7 -mt-10">
            {/* Middle Greeting & Subtitle */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-foreground font-sans">
                {getGreeting()},{' '}
                <span className="bg-gradient-to-r from-[#23ace3] via-[#8590ea] to-[#ef8d46] bg-clip-text text-transparent">
                  {user?.name.split(' ')[0] || 'Admin'}
                </span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground/80 font-normal">
                How can I assist with your organization today?
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

      {/* Slide-over Chat History Drawer */}
      <AIChatHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleStartNewChat}
        onDeleteSession={handleDeleteSession}
      />
    </div>
  )
}
