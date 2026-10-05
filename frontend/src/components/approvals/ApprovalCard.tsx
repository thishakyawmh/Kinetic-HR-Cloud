import React, { useState } from 'react'
import { LeaveRequest } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/common/StatusBadge'
import {
  Calendar,
  AlertTriangle,
  Bot,
  User,
  CheckCircle,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Building,
} from 'lucide-react'
import { approvalService } from '@/services/approvalService'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

import { useAuth } from '@/contexts/AuthContext'

interface ApprovalCardProps {
  request: LeaveRequest
  onStatusChange?: (updated: LeaveRequest) => void
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({ request, onStatusChange }) => {
  const { user } = useAuth()
  const reviewerName = user?.name || 'Manager Reviewer'
  const [isProcessing, setIsProcessing] = useState(false)
  const [dialogMode, setDialogMode] = useState<'reject' | 'clarify' | null>(null)
  const [commentText, setCommentText] = useState('')

  const handleApprove = async () => {
    setIsProcessing(true)
    try {
      const updated = await approvalService.approveRequest(
        request.id,
        reviewerName,
        `Approved by ${reviewerName}.`
      )
      if (updated && onStatusChange) {
        onStatusChange(updated)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectOrClarify = async () => {
    if (!commentText.trim()) return
    setIsProcessing(true)
    try {
      const updated = await approvalService.rejectRequest(
        request.id,
        reviewerName,
        dialogMode === 'clarify' ? `Clarification needed: ${commentText}` : commentText
      )
      if (updated && onStatusChange) {
        onStatusChange(updated)
      }
      setDialogMode(null)
      setCommentText('')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <Card className="overflow-hidden border border-border bg-card shadow-sm transition-all hover:border-primary/40">
        <div className="flex flex-col md:flex-row md:items-stretch">
          {/* Main Request Information */}
          <div className="flex-1 p-5 md:p-6 space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted font-bold text-foreground">
                  {request.employeeName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">{request.employeeName}</h4>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Building className="h-3 w-3 text-muted-foreground" />
                      {request.department}
                    </span>
                    <span>•</span>
                    <span>ID: {request.id}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {request.isEmergency && (
                  <Badge variant="destructive" className="gap-1 text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    Emergency Request
                  </Badge>
                )}
                <StatusBadge status={request.status} />
              </div>
            </div>

            {/* Leave Detail Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-muted/30 p-3.5 rounded-xl border border-border text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-medium">Leave Type</span>
                <span className="font-semibold text-foreground">{request.leaveTypeName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-medium">Date Range</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {request.startDate} {request.startDate !== request.endDate ? `to ${request.endDate}` : ''}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-medium">Duration</span>
                <span className="font-semibold text-foreground">{request.requestedDays} business day</span>
              </div>
            </div>

            {/* Reason */}
            <div>
              <span className="text-xs font-semibold text-foreground block mb-1">Employee Reason:</span>
              <p className="text-xs text-foreground/80 bg-muted/20 p-3 rounded-lg border border-border italic">
                "{request.reason}"
              </p>
            </div>
          </div>

          {/* AI Analysis & Recommendation Sidebar Box */}
          <div className="w-full md:w-80 bg-muted/20 border-t md:border-t-0 md:border-l border-border p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#23ace3] font-bold text-xs">
                <div className="p-1 rounded bg-[#23ace3]/15 text-[#23ace3]">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <span>Kinetic AI Decision Support</span>
              </div>

              {request.aiAnalysis ? (
                <div className="space-y-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-card border border-border space-y-1">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase block">
                      Policy Evaluation
                    </span>
                    <span className="text-foreground font-medium block">
                      {request.aiAnalysis.applicablePolicy}
                    </span>
                    <span className="text-[11px] text-emerald-500 font-medium block">
                      ✓ Remaining Quota: {request.aiAnalysis.employeeRemainingDays} days available
                    </span>
                  </div>

                  {request.aiAnalysis.teamCoverageWarning && (
                    <div className="p-2.5 rounded-lg bg-[#ef8d46]/10 border border-[#ef8d46]/30 text-[#ef8d46] space-y-1">
                      <span className="text-[10px] font-semibold uppercase flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Staffing Conflict Warning
                      </span>
                      <p className="text-[11px] text-foreground/90 leading-snug">
                        {request.aiAnalysis.teamCoverageWarning}
                      </p>
                    </div>
                  )}

                  <div className="p-2.5 rounded-lg bg-[#23ace3]/10 border border-[#23ace3]/20 text-[11px] text-foreground">
                    <span className="font-semibold block mb-0.5 text-[#23ace3]">AI Recommendation:</span>
                    <p className="italic">{request.aiAnalysis.recommendationText}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Standard leave request verified against quota limits.</p>
              )}

              <p className="text-[10px] text-slate-400 italic">
                * AI provides decision support only. Final approval authority resides with the direct manager.
              </p>
            </div>

            {/* Action Buttons for Manager */}
            {request.status === 'pending' ? (
              <div className="pt-4 space-y-2">
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold text-xs h-9"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Approve Request</span>
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDialogMode('reject')}
                    disabled={isProcessing}
                    className="text-xs text-rose-400 hover:bg-rose-500/10 border-rose-500/30 rounded-xl"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDialogMode('clarify')}
                    disabled={isProcessing}
                    className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl border-border"
                  >
                    <HelpCircle className="h-3 w-3 mr-1" />
                    Clarify
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-border/50">
                <div className="text-xs font-semibold text-foreground">Review Outcome:</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {request.reviewedBy} • {request.reviewerComment || 'Processed'}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Reject or Clarify Dialog */}
      <Dialog open={dialogMode !== null} onOpenChange={open => !open && setDialogMode(null)}>
        <DialogHeader>
          <DialogTitle>
            {dialogMode === 'reject' ? 'Reject Leave Request' : 'Request Clarification from Employee'}
          </DialogTitle>
          <DialogDescription>
            {dialogMode === 'reject'
              ? 'Please provide the business rationale for declining this request.'
              : 'Specify questions or required documentation before proceeding with approval.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder={
              dialogMode === 'reject'
                ? 'E.g., Team coverage threshold violated due to pending production deployment.'
                : 'E.g., Could you confirm if half-day morning coverage is possible?'
            }
            rows={4}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setDialogMode(null)}>
            Cancel
          </Button>
          <Button
            variant={dialogMode === 'reject' ? 'destructive' : 'default'}
            size="sm"
            onClick={handleRejectOrClarify}
            disabled={!commentText.trim() || isProcessing}
          >
            {dialogMode === 'reject' ? 'Confirm Rejection' : 'Send Clarification'}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  )
}
