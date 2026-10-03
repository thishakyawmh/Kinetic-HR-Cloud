import React from 'react'
import { AIMessage } from '@/types'
import { AIActionCard } from './AIActionCard'

interface AIMessageItemProps {
  message: AIMessage
  onActionComplete?: (result: any) => void
}

export const AIMessageItem: React.FC<AIMessageItemProps> = ({ message, onActionComplete }) => {
  const isUser = message.sender === 'user'

  // Helper to parse simple markdown formatting for bold and lists
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n')
    return (
      <div className="space-y-3 text-[15px] leading-relaxed text-foreground/95">
        {lines.map((line, i) => {
          if (!line.trim()) return <div key={i} className="h-1.5" />

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

  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[85%] sm:max-w-xl rounded-[20px] bg-card px-5 py-3.5 text-[15px] text-foreground leading-relaxed shadow-2xs">
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

        {/* Embedded Action Card if applicable */}
        {message.actionCard && (
          <AIActionCard card={message.actionCard} onActionComplete={onActionComplete} />
        )}

      </div>
    </div>
  )
}
