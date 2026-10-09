import React from 'react'
import { LeaveRequest } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/common/StatusBadge'
import {
  Calendar,
  AlertTriangle,
  Building,
  ArrowRight,
  SearchAlert,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ApprovalCardProps {
  request: LeaveRequest
  onStatusChange?: (updated: LeaveRequest) => void
  onInvestigate?: (request: LeaveRequest) => void
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({ request, onStatusChange, onInvestigate }) => {
  const navigate = useNavigate()

  const handleInvestigate = () => {
    if (onInvestigate) {
      onInvestigate(request)
    } else {
      navigate(`/manager/assistant?investigate=${request.id}`, { state: { request } })
    }
  }

  return (
    <Card className="overflow-hidden border border-border bg-card shadow-sm transition-all hover:border-primary/40 rounded-2xl flex flex-col justify-between p-5 space-y-4">
      {/* Top Header: Employee Avatar, Name, Department & ID + Status */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted font-bold text-foreground shrink-0 text-sm">
            {request.employeeName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-bold text-foreground">{request.employeeName}</h4>
              {request.priorLeavesCount === 0 && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                  First Leave Request
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Building className="h-3 w-3 text-muted-foreground" />
                {request.department}
              </span>
              <span>•</span>
              <span>ID: {request.id}</span>
              {request.priorLeavesCount !== undefined && request.priorLeavesCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-500/90 font-medium">
                    {request.priorLeavesCount} prior leaves
                  </span>
                </>
              )}
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
          <span className="font-semibold text-foreground truncate block">{request.leaveTypeName}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-medium">Date Range</span>
          <span className="font-semibold text-foreground flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{request.startDate} {request.startDate !== request.endDate ? `to ${request.endDate}` : ''}</span>
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-medium">Duration</span>
          <span className="font-semibold text-foreground">{request.requestedDays} business day{request.requestedDays > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Employee Reason */}
      <div>
        <span className="text-xs font-semibold text-foreground block mb-1">Employee Reason:</span>
        <p className="text-xs text-foreground/80 bg-muted/20 p-3 rounded-lg border border-border italic">
          "{request.reason}"
        </p>
      </div>

      {/* Action Area */}
      <div className="pt-2">
        {request.status === 'pending' ? (
          <Button
            onClick={handleInvestigate}
            className="w-full bg-[#23ace3] hover:bg-[#1da0d4] text-white font-semibold text-xs h-9 rounded-xl gap-2 shadow-xs transition-all cursor-pointer group"
          >
            <span>Review Request</span>
            <ArrowRight className="h-3.5 w-3.5 ml-auto text-white/80 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        ) : (
          <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Review Outcome: </span>
            {request.reviewedBy} • {request.reviewerComment || 'Processed'}
          </div>
        )}
      </div>
    </Card>
  )
}
