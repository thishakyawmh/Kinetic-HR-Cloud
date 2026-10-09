import React, { useState } from 'react'
import { AIMessage, AIMessageSuggestedOption } from '@/types'
import { AIActionCard } from './AIActionCard'
import { Lightbulb, Send } from 'lucide-react'

interface AIMessageItemProps {
  message: AIMessage
  onActionComplete?: (result: any) => void
  onSelectOption?: (option: AIMessageSuggestedOption | { id: string; label: string; actionValue: string }) => void
}

export const AIMessageItem: React.FC<AIMessageItemProps> = ({ message, onActionComplete, onSelectOption }) => {
  const isUser = message.sender === 'user'
  const [optionInput, setOptionInput] = useState('')

  // Helper to parse simple markdown formatting for bold, headers, and lists
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n')
    return (
      <div className="space-y-3 text-[15px] leading-relaxed text-foreground/95">
        {lines.map((line, i) => {
          if (!line.trim()) return <div key={i} className="h-1.5" />

          // Render headers
          if (line.startsWith('### ')) {
            return (
              <h3 key={i} className="text-base font-bold text-foreground mt-2 mb-1">
                {line.replace('### ', '')}
              </h3>
            )
          }

          if (line.startsWith('#### ')) {
            return (
              <h4 key={i} className="text-sm font-semibold text-foreground/90 mt-2 mb-0.5">
                {line.replace('#### ', '')}
              </h4>
            )
          }

          if (line.trim() === '---') {
            return <hr key={i} className="my-2 border-border/60" />
          }

          // Render bullet list items
          if (line.startsWith('• ') || line.startsWith('- ')) {
            return (
              <div key={i} className="flex items-start gap-3 pl-1">
                <span className="text-muted-foreground mt-1 text-xs">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(line.substring(2)) }} />
              </div>
            )
          }

          // Render numbered list items
          if (/^\d+\.\s/.test(line)) {
            const num = line.match(/^\d+\./)![0]
            const text = line.replace(/^\d+\.\s*/, '')
            return (
              <div key={i} className="flex items-start gap-3 pl-1">
                <span className="font-medium text-muted-foreground text-sm mt-0.5">{num}</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(text) }} />
              </div>
            )
          }

          return <p key={i} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
        })}
      </div>
    )
  }

  const formatInline = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
  }

  const handleCustomOptionSubmit = () => {
    const trimmed = optionInput.trim()
    if (!trimmed) return

    if (message.suggestedOptions && message.suggestedOptions.length > 0) {
      // Check if user entered a number like 1, 2, 3, 4
      const numMatch = trimmed.match(/^(\d+)/)
      if (numMatch) {
        const index = parseInt(numMatch[1], 10) - 1
        if (index >= 0 && index < message.suggestedOptions.length) {
          onSelectOption?.(message.suggestedOptions[index])
          setOptionInput('')
          return
        }
      }

      // Check if text matches option label
      const matched = message.suggestedOptions.find(opt =>
        opt.label.toLowerCase().includes(trimmed.toLowerCase()) ||
        opt.actionValue.toLowerCase().includes(trimmed.toLowerCase())
      )
      if (matched) {
        onSelectOption?.(matched)
        setOptionInput('')
        return
      }
    }

    onSelectOption?.({
      id: `custom-opt-${Date.now()}`,
      label: trimmed,
      actionValue: trimmed,
    })
    setOptionInput('')
  }

  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[85%] sm:max-w-xl rounded-[20px] bg-card border border-border/70 px-5 py-3.5 text-[15px] text-foreground leading-relaxed shadow-2xs">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-4 mb-8 text-left group">
      {/* Kinetic Brand Icon */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-1">
        <img
          src="/kenetic_logo.webp"
          alt="Kinetic"
          className="h-6 w-6 object-contain drop-shadow-xs"
          onError={e => {
            const target = e.currentTarget
            if (!target.src.endsWith('kenetic_logo.wbp')) {
              target.src = '/kenetic_logo.wbp'
            }
          }}
        />
      </div>

      {/* Response Body rendered on clean canvas */}
      <div className="flex-1 max-w-2xl space-y-4 pt-0.5">
        <div>
          {renderFormattedContent(message.content)}
        </div>

        {/* Model Inference & Telemetry Badges */}
        {message.toolExecutions && message.toolExecutions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {message.toolExecutions.map((tool, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 shadow-2xs"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{tool.label}</span>
              </span>
            ))}
          </div>
        )}

        {/* Embedded Action Card if applicable */}
        {message.actionCard && (
          <AIActionCard card={message.actionCard} onActionComplete={onActionComplete} />
        )}

        {/* Suggested Options & Option Input */}
        {message.suggestedOptions && message.suggestedOptions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/70 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-md bg-[#23ace3]/15 text-[#23ace3] flex items-center justify-center text-xs">
                <Lightbulb className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold text-foreground">Suggested Resolution Options:</span>
            </div>

            {/* Clickable option selection list */}
            <div className="grid grid-cols-1 gap-2">
              {message.suggestedOptions.map((opt, idx) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSelectOption?.(opt)}
                  className="flex items-start gap-3 p-3 rounded-xl border border-border/80 bg-card/60 hover:bg-[#23ace3]/10 hover:border-[#23ace3]/50 transition-all text-left group/opt cursor-pointer shadow-2xs"
                >
                  <div className="h-6 w-6 rounded-lg bg-muted group-hover/opt:bg-[#23ace3] group-hover/opt:text-white font-bold text-xs flex items-center justify-center text-foreground shrink-0 transition-colors">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground group-hover/opt:text-[#23ace3] transition-colors">
                      {opt.label}
                    </div>
                    {opt.description && (
                      <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        {opt.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Option Input Field */}
            <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-xl border border-border/80 focus-within:border-[#23ace3] focus-within:ring-1 focus-within:ring-[#23ace3]/30 transition-all">
              <input
                type="text"
                value={optionInput}
                onChange={e => setOptionInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCustomOptionSubmit()
                  }
                }}
                placeholder="Select option above or enter number (1, 2, 3, 4)..."
                className="flex-1 bg-transparent border-0 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCustomOptionSubmit}
                disabled={!optionInput.trim()}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  optionInput.trim()
                    ? 'bg-[#23ace3] text-white hover:bg-[#1da0d4] cursor-pointer'
                    : 'bg-muted text-muted-foreground/40 cursor-not-allowed'
                }`}
              >
                <span>Confirm</span>
                <Send className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
