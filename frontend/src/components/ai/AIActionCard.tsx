import React, { useState } from 'react'
import { AIActionCard as AIActionCardType } from '@/types'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Calendar, User, Check, ShieldCheck } from 'lucide-react'
import { leaveService } from '@/services/leaveService'
import { approvalService } from '@/services/approvalService'
import { useAuth } from '@/contexts/AuthContext'

interface AIActionCardProps {
  card: AIActionCardType
  onActionComplete?: (result: any) => void
}

export const AIActionCard: React.FC<AIActionCardProps> = ({ card, onActionComplete }) => {
  const { user, tenant, refreshUser } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'ready' | 'submitted' | 'approved'>(
    card.status === 'approved' ? 'approved' : card.status === 'submitted' ? 'submitted' : 'ready'
  )

  const handleExecute = async () => {
    if (!user || !tenant) return
    setIsSubmitting(true)

    try {
      if (card.type === 'leave_submission') {
        const req = await leaveService.applyLeave({
          tenantId: tenant.id,
          employeeId: user.id,
          employeeName: user.name,
          department: user.department,
          leaveTypeId: card.data.leaveTypeId || 'lt-emergency',
          leaveTypeName: card.data.leaveTypeName || 'Emergency Leave',
          leaveTypeCode: card.data.leaveTypeCode || 'emergency',
          startDate: card.data.startDate || '2026-10-03',
          endDate: card.data.endDate || '2026-10-03',
          requestedDays: card.data.requestedDays || 1,
          reason: card.data.reason || 'Emergency dependent illness leave',
          isEmergency: true,
          aiAnalysis: {
            applicablePolicy: 'Emergency Leave Policy (Sec 4.2 - Dependent Illness)',
            employeeRemainingDays: 2,
            scheduledAbsencesCount: 2,
            teamCoverageWarning: '2 other team members scheduled for leave on Oct 7-8. Engineering Friday standup at 75% coverage.',
            recommendationText: 'Emergency leave appears applicable under your company policy. Manager review required because approving this request may reduce team coverage.',
            requiresHumanApproval: true,
          },
        })
        setStatus('submitted')
        refreshUser()
        onActionComplete?.(req)
      } else if (card.type === 'approval_review') {
        const requestId = card.data.requestId || 'req-1'
        const updated = await approvalService.approveRequest(
          requestId,
          user.name || 'David Wilson',
          'Approved directly via Manager Assistant'
        )
        setStatus('approved')
        refreshUser()
        onActionComplete?.(updated)
      }
    } catch (err) {
      console.error('Action execution failed', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
          {card.type === 'approval_review' && <ShieldCheck className="h-4 w-4 text-[#23ace3]" />}
          {card.title}
        </h4>
      </div>

      {/* Structured Info for Leave Submission */}
      {card.type === 'leave_submission' && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">{card.data.leaveTypeName}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{card.data.startDate}</span>
            <span>({card.data.requestedDays} day)</span>
          </div>
        </div>
      )}

      {/* Structured Info for Approval Review */}
      {card.type === 'approval_review' && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1 font-medium text-foreground">
              <User className="h-3.5 w-3.5 text-[#23ace3]" />
              <span>{card.data.employeeName}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{card.data.startDate} ({card.data.requestedDays} day)</span>
            </div>
            <span>•</span>
            <span className="bg-muted px-2 py-0.5 rounded text-[11px] font-medium text-foreground">
              {card.data.leaveTypeName}
            </span>
          </div>
          {card.data.reason && (
            <p className="text-xs text-muted-foreground italic border-l-2 border-[#23ace3]/40 pl-2 py-0.5">
              "{card.data.reason}"
            </p>
          )}
        </div>
      )}

      {/* Action Button */}
      {status === 'ready' ? (
        <Button
          variant="default"
          size="sm"
          onClick={handleExecute}
          disabled={isSubmitting}
          className="bg-[#23ace3] hover:bg-[#1b97ca] text-white font-medium text-xs rounded-xl px-4 py-2 cursor-pointer shadow-xs gap-1.5"
        >
          {card.type === 'approval_review' && <Check className="h-3.5 w-3.5" />}
          <span>{isSubmitting ? 'Processing...' : card.actionLabel || 'Confirm Action'}</span>
        </Button>
      ) : status === 'submitted' ? (
        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="h-4 w-4" />
          <span>Submitted to manager for review</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="h-4 w-4" />
          <span>Leave authorized & team roster updated</span>
        </div>
      )}
    </div>
  )
}
