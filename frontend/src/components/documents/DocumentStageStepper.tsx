import React from 'react'
import { CheckCircle2, Clock, ShieldCheck, Sparkles, Send, FileCheck } from 'lucide-react'
import { HRDocumentStatus } from '@/types'

interface StageStepperProps {
  status: HRDocumentStatus
  requiresManagerSignature?: boolean
}

export const DocumentStageStepper: React.FC<StageStepperProps> = ({ status, requiresManagerSignature = true }) => {
  const getStageState = () => {
    switch (status) {
      case 'submitted':
        return 1
      case 'ai_verifying':
        return 2
      case 'pending_manager_signature':
        return 3
      case 'approved_and_signed':
      case 'auto_issued':
        return 4
      case 'rejected':
        return -1
      default:
        return 1
    }
  }

  const currentStage = getStageState()

  const stages = [
    { number: 1, label: 'Submitted', desc: 'Requested by Employee' },
    { number: 2, label: 'AI Verified', desc: 'Identity & Draft Created' },
    { number: 3, label: 'Manager 2FA Sign', desc: 'Mobile OTP Verification' },
    { number: 4, label: 'Issued & Dispatched', desc: 'Print / Softcopy Ready' },
  ]

  if (status === 'rejected') {
    return (
      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-semibold flex items-center gap-2">
        <Clock className="h-4 w-4 shrink-0" />
        <span>Request Rejected by Manager or HR Administration</span>
      </div>
    )
  }

  return (
    <div className="space-y-3 bg-muted/30 p-4 rounded-2xl border border-border/50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[#23ace3]" />
          Document Lifecycle Stages
        </span>
        <span className="text-[11px] font-semibold text-[#23ace3] font-mono">
          Stage {currentStage} of 4: {stages[Math.max(0, currentStage - 1)]?.label}
        </span>
      </div>

      {/* Progress Bar & Nodes */}
      <div className="grid grid-cols-4 gap-2 relative">
        {stages.map(st => {
          const isCompleted = currentStage > st.number
          const isCurrent = currentStage === st.number

          return (
            <div
              key={st.number}
              className={`p-2.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
                isCompleted
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : isCurrent
                  ? 'bg-[#23ace3]/15 border-[#23ace3]/40 text-[#23ace3] shadow-xs'
                  : 'bg-muted/40 border-border/40 text-muted-foreground'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase font-mono">Stage {st.number}</span>
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : isCurrent ? (
                  <Clock className="h-4 w-4 text-[#23ace3] animate-pulse" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                )}
              </div>
              <div className="mt-1">
                <div className="text-xs font-bold leading-tight text-foreground">{st.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{st.desc}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
