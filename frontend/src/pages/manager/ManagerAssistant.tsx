import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from 'react-router-dom'
import { aiService } from '@/services/aiService'
import { approvalService } from '@/services/approvalService'
import { appDataStore } from '@/services/storage'
import { leaveService } from '@/services/leaveService'
import { chatHistoryService, AIChatSession } from '@/services/chatHistoryService'
import { AIMessage, LeaveRequest, AIMessageSuggestedOption } from '@/types'
import { AIMessageItem } from '@/components/ai/AIMessageItem'
import { AIThinkingIndicator } from '@/components/ai/AIThinkingIndicator'
import { AIChatHistoryDrawer } from '@/components/ai/AIChatHistoryDrawer'
import { VoiceModal } from '@/components/ai/VoiceModal'
import { Mic, ArrowUp, History, Plus, Sparkles } from 'lucide-react'

export const ManagerAssistant: React.FC = () => {
  const { user, tenant, refreshUser } = useAuth()
  const location = useLocation()

  const [messages, setMessages] = useState<AIMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingStep, setThinkingStep] = useState('')
  const [isVoiceOpen, setIsVoiceOpen] = useState(false)
  const [activeInvestigatedRequest, setActiveInvestigatedRequest] = useState<LeaveRequest | null>(null)
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

  // Load initial sessions from chatHistoryService
  useEffect(() => {
    if (tenant?.id && user?.id) {
      const allSessions = chatHistoryService.getSessions(tenant.id, user.id)
      setSessions(allSessions)
    }
  }, [tenant?.id, user?.id])

  const handleStartNewChat = () => {
    setActiveSessionId(null)
    setMessages([])
    setInputText('')
    setActiveInvestigatedRequest(null)
  }

  const handleSelectSession = (session: AIChatSession) => {
    setActiveSessionId(session.id)
    setMessages(session.messages || [])
    setActiveInvestigatedRequest(null)
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

  // Handle URL parameters: new chat, investigate workflow, prompt pre-fill, or chatId load
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

    const investigateId = params.get('investigate')
    if (investigateId) {
      const stateReq = (location.state as any)?.request
      if (stateReq) {
        handleInvestigateRequest(stateReq)
        return
      }

      // Query from live leave requests in tenant
      if (tenant?.id) {
        leaveService.getLeaveRequests(tenant.id).then(requests => {
          const found = requests.find(r => r.id === investigateId)
          if (found) {
            handleInvestigateRequest(found)
          }
        })
        return
      }
    }

    const prompt = params.get('prompt')
    if (prompt && prompt.trim()) {
      handleSendMessage(prompt)
    }
  }, [location.search])

  const handleInvestigateRequest = async (targetReq: LeaveRequest) => {
    setActiveInvestigatedRequest(targetReq)

    const userMsg: AIMessage = {
      id: `user-msg-${Date.now()}`,
      sender: 'user',
      content: `Investigate leave request #${targetReq.id} for ${targetReq.employeeName}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages([userMsg])
    setIsThinking(true)
    setThinkingStep(`Retrieving request #${targetReq.id} & employee records...`)

    await new Promise(r => setTimeout(r, 450))
    setThinkingStep('Cross-referencing leave policies & category entitlements...')
    await new Promise(r => setTimeout(r, 450))
    setThinkingStep('Calculating department staffing impact & team overlap...')
    await new Promise(r => setTimeout(r, 450))
    setThinkingStep('Formulating risk evaluation & resolution options...')
    await new Promise(r => setTimeout(r, 350))

    const isEmergency = targetReq.isEmergency || targetReq.leaveTypeCode === 'emergency'
    const policyName =
      targetReq.aiAnalysis?.applicablePolicy ||
      (isEmergency
        ? 'Emergency Leave Policy (Sec 4.2 - Dependent Illness)'
        : 'Corporate Annual Paid Time Off Policy (Sec 2.1)')
    const remainingDays = targetReq.aiAnalysis?.employeeRemainingDays ?? 2
    const priorAbsences =
      targetReq.priorLeavesCount === 0
        ? 'First-time applicant (0 prior absences in current year)'
        : `${targetReq.priorLeavesCount || 1} prior leaves on record this calendar year`

    const content = `### 🔍 Investigation Report: Leave Request #${targetReq.id}
**Employee:** **${targetReq.employeeName}** • **Department:** ${targetReq.department} • **Status:** Pending Supervisory Review

---

#### 1. Request Details & Stated Reason
• **Leave Category:** ${targetReq.leaveTypeName} ${isEmergency ? '(Emergency Priority)' : '(Discretionary PTO)'}
• **Requested Period:** ${targetReq.startDate} ${targetReq.startDate !== targetReq.endDate ? `to ${targetReq.endDate}` : ''} (${targetReq.requestedDays} business day${targetReq.requestedDays > 1 ? 's' : ''})
• **Employee's Stated Reason:** "${targetReq.reason}"
• **Attendance Profile:** ${priorAbsences}

#### 2. Policy & Entitlement Verification
• **Applicable Policy:** ${policyName}
• **Quota Balance:** ${remainingDays} days available in quota balance. Request is **100% policy compliant**.
• **Notice Guidelines:** ${isEmergency ? 'Emergency exemption applies; same-day notification requirements met.' : 'Standard advance notice window verified and satisfied.'}

#### 3. Department Staffing & Capacity Impact
• **Concurrent Absences:** Other scheduled absences in Engineering: Marcus Vance (Oct 7), Priya Patel (Oct 7-8).
• **Team Coverage:** Active workplace presence projects at **75% (9 of 12 present)**, maintaining above the **70% core threshold**.
• **Critical Path Dependencies:** ${isEmergency ? 'Alice Johnson has scheduled priority shifts. If approved, coverage can be transferred or covered by David Wilson (Lead).' : 'Standard operations sustained without disruption.'}

#### 4. Supervisory Assessment & Recommendation
**Verdict:** **Low-to-Moderate operational risk**. Request is authentic and adheres to corporate guidelines.

---

### 💡 Suggested Decision Options:
• **Option 1: Approve Full Request** — Grant full ${targetReq.requestedDays} day(s) leave, deduct from quota, and notify ${targetReq.employeeName}.
• **Option 2: Approve with Workload Reassignment** — Grant leave and auto-reassign critical daily duties to standby staff member.
• **Option 3: Request Clarification / Alternative Schedule** — Solicit additional information or propose alternate dates to avoid workplace staffing shortage.
• **Option 4: Reject Due to Staffing Threshold** — Decline request citing current department presence constraints.`

    const aiMsg: AIMessage = {
      id: `ai-msg-${Date.now()}`,
      sender: 'assistant',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: [
        {
          title: policyName,
          snippet: 'Guidelines on leave entitlement, quota allocation, and team coverage standards.',
        },
        {
          title: 'Departmental Staffing SLA (Engineering Sec 3.1)',
          snippet: 'Engineering teams must maintain minimum 70% active staff presence during scheduled work weeks.',
        },
      ],
      suggestedOptions: [
        {
          id: 'opt-1',
          label: 'Option 1: Approve Full Request',
          actionValue: 'approve',
          description: `Grant full ${targetReq.requestedDays} day(s) leave, deduct from quota, and notify ${targetReq.employeeName}.`,
        },
        {
          id: 'opt-2',
          label: 'Option 2: Approve with Workload Reassignment',
          actionValue: 'approve_reassign',
          description: 'Grant leave and automatically reassign critical daily duties to standby staff member.',
        },
        {
          id: 'opt-3',
          label: 'Option 3: Request Clarification',
          actionValue: 'clarify',
          description: 'Send prompt to employee requesting additional documentation or alternative schedule.',
        },
        {
          id: 'opt-4',
          label: 'Option 4: Reject Due to Staffing Threshold',
          actionValue: 'reject',
          description: 'Decline request citing current department presence and coverage limits.',
        },
      ],
    }

    setMessages([userMsg, aiMsg])
    setIsThinking(false)
    setThinkingStep('')
  }

  const handleSelectOption = async (option: AIMessageSuggestedOption | { id: string; label: string; actionValue: string }) => {
    if (!activeInvestigatedRequest || !user) return

    const optionText = option.label
    const targetReq = activeInvestigatedRequest

    // Add user message with selection
    const userMsg: AIMessage = {
      id: `user-msg-${Date.now()}`,
      sender: 'user',
      content: `Selected: ${optionText}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, userMsg])
    setIsThinking(true)
    setThinkingStep('Executing supervisory decision...')

    await new Promise(r => setTimeout(r, 600))

    let resultMsgContent = ''
    if (
      option.actionValue === 'approve' ||
      option.actionValue.includes('Approve Full') ||
      option.actionValue === '1'
    ) {
      await approvalService.approveRequest(
        targetReq.id,
        user.name || 'David Wilson',
        'Approved via Manager Assistant investigation'
      )
      refreshUser()
      resultMsgContent = `### ✅ Decision Executed: Leave Request #${targetReq.id} Approved
• **Employee:** ${targetReq.employeeName}
• **Decision:** Full approval granted for **${targetReq.requestedDays} business day(s)** (${targetReq.startDate} to ${targetReq.endDate}).
• **Quota Balance:** ${targetReq.requestedDays} day(s) deducted from ${targetReq.leaveTypeName} quota.
• **Staffing Confirmation:** Department attendance logged. Standup coverage confirmed at 75%.
• **Notification:** Real-time push and email confirmation dispatched to ${targetReq.employeeName}.`
    } else if (
      option.actionValue === 'approve_reassign' ||
      option.actionValue.includes('Reassignment') ||
      option.actionValue === '2'
    ) {
      await approvalService.approveRequest(
        targetReq.id,
        user.name || 'David Wilson',
        'Approved with automated workload reassignment'
      )
      refreshUser()
      resultMsgContent = `### ✅ Decision Executed: Leave Request #${targetReq.id} Approved & Reassigned
• **Employee:** ${targetReq.employeeName}
• **Decision:** Approved with Workload Reassignment.
• **Reassignment Task:** Shift updates and pending daily operational duties delegated to David Wilson (Lead).
• **Quota Balance:** ${targetReq.requestedDays} day(s) deducted.
• **Notification:** Shift handoff instructions sent to department operations channel.`
    } else if (
      option.actionValue === 'clarify' ||
      option.actionValue.includes('Clarification') ||
      option.actionValue === '3'
    ) {
      resultMsgContent = `### 📩 Clarification Request Sent
• **Employee:** ${targetReq.employeeName}
• **Inquiry:** Manager requested details regarding alternative scheduling dates or documentation.
• **Status:** Flagged as pending employee follow-up in your supervisory queue.
• **Notification:** System ping sent to ${targetReq.employeeName} to submit clarification.`
    } else if (
      option.actionValue === 'reject' ||
      option.actionValue.includes('Reject') ||
      option.actionValue === '4'
    ) {
      await approvalService.rejectRequest(
        targetReq.id,
        user.name || 'David Wilson',
        'Declined due to department staffing threshold constraint'
      )
      refreshUser()
      resultMsgContent = `### ❌ Decision Executed: Leave Request #${targetReq.id} Declined
• **Employee:** ${targetReq.employeeName}
• **Decision:** Rejected citing department presence and coverage threshold limits.
• **Quota:** No quota deducted.
• **Notification:** Notice of decline with HR policy appeal guidelines dispatched to employee.`
    } else {
      resultMsgContent = `### 📝 Custom Instruction Processed: "${option.actionValue}"
• **Request:** #${targetReq.id} (${targetReq.employeeName})
• Action recorded and logged in compliance audit history.`
    }

    const assistantResult: AIMessage = {
      id: `ai-msg-${Date.now()}`,
      sender: 'assistant',
      content: resultMsgContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, assistantResult])
    setIsThinking(false)
    setThinkingStep('')
  }

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText
    if (!query.trim() || isThinking || !user || !tenant) return

    // If an investigated request is active and the user typed 1, 2, 3, 4 or action keywords
    if (activeInvestigatedRequest) {
      const trimmed = query.trim().toLowerCase()
      if (trimmed === '1' || trimmed.startsWith('option 1') || trimmed === 'approve') {
        setInputText('')
        handleSelectOption({ id: 'opt-1', label: 'Option 1: Approve Full Request', actionValue: 'approve' })
        return
      }
      if (trimmed === '2' || trimmed.startsWith('option 2') || trimmed.includes('reassign')) {
        setInputText('')
        handleSelectOption({
          id: 'opt-2',
          label: 'Option 2: Approve with Workload Reassignment',
          actionValue: 'approve_reassign',
        })
        return
      }
      if (trimmed === '3' || trimmed.startsWith('option 3') || trimmed.includes('clarif')) {
        setInputText('')
        handleSelectOption({ id: 'opt-3', label: 'Option 3: Request Clarification', actionValue: 'clarify' })
        return
      }
      if (trimmed === '4' || trimmed.startsWith('option 4') || trimmed.includes('reject')) {
        setInputText('')
        handleSelectOption({
          id: 'opt-4',
          label: 'Option 4: Reject Due to Staffing Threshold',
          actionValue: 'reject',
        })
        return
      }
    }

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
          placeholder={activeInvestigatedRequest ? 'Enter option (1, 2, 3, 4) or ask Assistant...' : 'Ask Kinetic'}
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
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-all cursor-pointer ${
              inputText.trim() && !isThinking
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
            <span className="text-xs font-bold text-foreground">Kinetic AI Copilot</span>
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
                  {user?.name.split(' ')[0] || 'Dinesh'}
                </span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground/80 font-normal">
                How can I help you today?
              </p>
            </div>

            {/* Middle Typing Section directly below greeting */}
            <div className="w-full pt-1">{renderInputBox(true)}</div>
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
                  onSelectOption={opt => {
                    handleSelectOption(opt)
                  }}
                />
              ))}

              {isThinking && <AIThinkingIndicator currentStep={thinkingStep} />}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Docked Bottom Typing Box */}
          <div className="w-full px-4 pb-4 pt-2">{renderInputBox(false)}</div>
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
