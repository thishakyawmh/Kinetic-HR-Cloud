import React, { useState, useRef, useEffect } from 'react'
import { AIMessage } from '@/types'
import { aiService } from '@/services/aiService'
import { useAuth } from '@/contexts/AuthContext'
import { AIMessageItem } from './AIMessageItem'
import { AIThinkingIndicator } from './AIThinkingIndicator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Send,
  Sparkles,
  Bot,
  MessageSquare,
  PlusCircle,
  HelpCircle,
  Clock,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AIChatPanelProps {
  initialPrompt?: string
  payslipContextId?: string
}

interface ChatSession {
  id: string
  title: string
  timestamp: string
  messages: AIMessage[]
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ initialPrompt, payslipContextId }) => {
  const { user, tenant } = useAuth()
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: 'session-default',
      title: 'HR General Inquiry',
      timestamp: 'Today, 9:00 AM',
      messages: aiService.getInitialMessages(user?.name.split(' ')[0] || 'Alice'),
    },
  ])
  const [activeSessionId, setActiveSessionId] = useState<string>('session-default')
  const [inputMessage, setInputMessage] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingStep, setThinkingStep] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0]

  const quickPrompts = [
    'My child suddenly got sick. I need tomorrow off. What can I do?',
    'Why is my October take-home salary lower than September?',
    'How much leave do I have?',
    'What is the work-from-home policy?',
    'Can I take emergency leave?',
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [activeSession?.messages, isThinking, thinkingStep])

  // Handle initial prompt from navigation (e.g. from payslip detail)
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt)
    }
  }, [initialPrompt])

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage
    if (!query.trim() || isThinking || !user || !tenant) return

    const userMsg: AIMessage = {
      id: `user-msg-${Date.now()}`,
      sender: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    // Append user message immediately
    const updatedMessages = [...activeSession.messages, userMsg]
    const updatedSessions = sessions.map(s =>
      s.id === activeSessionId
        ? {
          ...s,
          messages: updatedMessages,
          title: s.messages.length === 1 ? query.substring(0, 30) + '...' : s.title,
        }
        : s
    )
    setSessions(updatedSessions)
    setInputMessage('')
    setIsThinking(true)
    setThinkingStep('Consulting Kinetic HR Cloud agent...')

    try {
      const aiResponse = await aiService.sendMessage(
        query,
        {
          userId: user.id,
          tenantId: tenant.id,
          userName: user.name,
          payslipId: payslipContextId,
        },
        {
          onToolStep: (_, label) => {
            setThinkingStep(label)
          },
        }
      )

      // Append assistant response
      setSessions(prev =>
        prev.map(s =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, aiResponse] }
            : s
        )
      )
    } catch (err) {
      console.error('AI response error', err)
    } finally {
      setIsThinking(false)
      setThinkingStep('')
    }
  }

  const handleNewChat = () => {
    const newSessionId = `session-${Date.now()}`
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Conversation',
      timestamp: 'Just now',
      messages: aiService.getInitialMessages(user?.name.split(' ')[0] || 'Alice'),
    }
    setSessions([newSession, ...sessions])
    setActiveSessionId(newSessionId)
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[580px] rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
      {/* Left Sidebar: Conversation History */}
      <div className="hidden lg:flex w-72 flex-col border-r border-slate-200 bg-slate-50/70 p-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-sky-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Chat History</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewChat}
            className="h-7 px-2 text-xs gap-1 border-slate-300"
          >
            <PlusCircle className="h-3 w-3" />
            <span>New</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 py-3">
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-start gap-2.5 ${s.id === activeSessionId
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-medium'
                : 'text-slate-600 hover:bg-slate-200/50'
                }`}
            >
              <MessageSquare className="h-3.5 w-3.5 mt-0.5 text-sky-600 shrink-0" />
              <div className="flex-1 truncate">
                <div className="truncate">{s.title}</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {s.timestamp}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* AI Capabilities Notice */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-950">
          <div className="flex items-center gap-1.5 font-semibold text-indigo-900 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>Enterprise Knowledge</span>
          </div>
          <p className="text-[11px] text-indigo-800 leading-normal">
            Grounding across company policies, live HR balances, and personal payslips.
          </p>
        </div>
      </div>

      {/* Right: Active Chat Area */}
      <div className="flex flex-1 flex-col overflow-hidden bg-slate-50/20">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-sm">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Kinetic HR AI Assistant</h3>
                <Badge variant="ai" className="text-[10px] py-0">
                  RAG + Foundry
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Ask questions about leave policies, emergency situations, or payroll statements.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="lg:hidden text-xs text-muted-foreground"
          >
            Reset
          </Button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-100 bg-white px-6 py-2.5">
          <span className="text-[11px] font-medium text-slate-400 shrink-0 flex items-center gap-1">
            <HelpCircle className="h-3 w-3" />
            Suggestions:
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              disabled={isThinking}
              className="shrink-0 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1 text-xs text-slate-700 transition-colors cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Message Thread Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {activeSession.messages.map(msg => (
            <AIMessageItem
              key={msg.id}
              message={msg}
              onActionComplete={() => {
                // Refresh list or trigger notification
              }}
            />
          ))}

          {isThinking && <AIThinkingIndicator currentStep={thinkingStep} />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-200 bg-white p-4">
          <form
            onSubmit={e => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="Ask a question or describe an urgent situation (e.g., 'My child is sick and I need tomorrow off')..."
              className="h-11 rounded-xl border-slate-200 focus-visible:ring-sky-500 text-sm shadow-none"
              disabled={isThinking}
            />
            <Button
              type="submit"
              variant="default"
              disabled={!inputMessage.trim() || isThinking}
              className="h-11 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white shrink-0 font-medium text-xs gap-1.5"
            >
              <span>Send</span>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Kinetic HR Agent is grounded on official company policies & records.</span>
            <span className="hidden sm:inline">Final approvals executed by authorized managers.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
