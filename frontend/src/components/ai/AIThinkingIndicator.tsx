import React from 'react'

interface AIThinkingIndicatorProps {
  currentStep?: string
}

export const AIThinkingIndicator: React.FC<AIThinkingIndicatorProps> = ({
  currentStep = 'Thinking...',
}) => {
  return (
    <div className="flex items-center gap-2.5 py-2 px-1 text-xs text-muted-foreground font-normal">
      <div className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-[#23ace3] animate-pulse" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#ef8d46] animate-pulse [animation-delay:200ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#23ace3] animate-pulse [animation-delay:400ms]" />
      </div>
      <span>{currentStep}</span>
    </div>
  )
}
