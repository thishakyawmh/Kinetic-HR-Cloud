import React from 'react'
import { AIChatSession } from '@/services/chatHistoryService'
import {
  History,
  Plus,
  Trash2,
  X,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Clock,
} from 'lucide-react'

interface AIChatHistoryDrawerProps {
  isOpen: boolean
  onClose: () => void
  sessions: AIChatSession[]
  activeSessionId: string | null
  onSelectSession: (session: AIChatSession) => void
  onNewChat: () => void
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void
}

export const AIChatHistoryDrawer: React.FC<AIChatHistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}) => {
  if (!isOpen) return null

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      const now = new Date()
      const isToday = date.toDateString() === now.toDateString()
      if (isToday) {
        return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Recently'
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm sm:max-w-md bg-card border-l border-border/60 shadow-2xl flex flex-col font-sans animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#23ace3]/15 text-[#23ace3]">
              <History className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">Chat History</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30">
                  {sessions.length} / 5 limit
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Recent platform conversations</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onNewChat()
                onClose()
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#23ace3] text-white hover:bg-[#1b97ca] transition-all cursor-pointer shadow-xs"
              title="Start a new chat"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>New</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Close history"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 no-scrollbar">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground space-y-2">
              <MessageSquare className="h-8 w-8 stroke-1 text-muted-foreground/60" />
              <p className="text-xs">No saved conversations yet.</p>
              <button
                onClick={() => {
                  onNewChat()
                  onClose()
                }}
                className="text-xs text-[#23ace3] font-medium hover:underline"
              >
                Start a new conversation
              </button>
            </div>
          ) : (
            sessions.map(s => {
              const isActive = s.id === activeSessionId
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectSession(s)
                    onClose()
                  }}
                  className={`group relative rounded-xl p-3.5 border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#23ace3]/10 border-[#23ace3] shadow-xs ring-1 ring-[#23ace3]/40'
                      : 'bg-card hover:bg-muted/40 border-border/60 hover:border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-[#23ace3]' : 'text-muted-foreground'}`} />
                        <h4 className="text-xs font-semibold text-foreground truncate">{s.title}</h4>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {s.snippet}
                      </p>
                    </div>

                    {/* Delete Icon button */}
                    <button
                      onClick={e => onDeleteSession(s.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer shrink-0"
                      title="Delete chat session"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Footer Meta: Timestamp & Message Count */}
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(s.updatedAt || s.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium text-foreground/80">
                      <span>{s.messages?.length || 0} msgs</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Drawer Footer Notice */}
        <div className="p-3.5 border-t border-border/50 bg-muted/10 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-[#23ace3]" />
            <span>Azure OpenAI Grounded</span>
          </span>
          <span className="text-[10px]">Max 5 chats preserved</span>
        </div>
      </div>
    </>
  )
}
