import React from 'react'
import { LeaveBalance, LeaveRequest } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  X,
  Calendar,
  CalendarCheck2,
} from 'lucide-react'

interface EmployeeLeaveDrawerProps {
  isOpen: boolean
  onClose: () => void
  balances: LeaveBalance[]
  requests: LeaveRequest[]
  onAskAI?: (prompt: string) => void
  onApplyLeave?: () => void
}

export const EmployeeLeaveDrawer: React.FC<EmployeeLeaveDrawerProps> = ({
  isOpen,
  onClose,
  balances,
  requests,
}) => {
  if (!isOpen) return null

  const upcomingLeaves = requests.filter(r => r.status === 'approved')
  const pendingRequests = requests.filter(r => r.status === 'pending')

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
        <div className="w-screen max-w-md bg-card text-card-foreground shadow-xl border-l border-border flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-6 py-5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground text-base">Leave balances</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Annual allowances for 2026</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
            {/* Quick Balances Grid */}
            <div className="space-y-3">
              <div className="text-xs font-medium text-muted-foreground">
                Available allowances
              </div>

              <div className="grid grid-cols-2 gap-3">
                {balances.map(b => {
                  const percentUsed = Math.min(100, Math.round((b.used / (b.totalAllowance || 1)) * 100))
                  const isEmergency = b.code === 'emergency'

                  return (
                    <div
                      key={b.leaveTypeId}
                      className="rounded-2xl border border-border bg-card p-4 transition-colors flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground truncate block">
                          {b.leaveTypeName}
                        </span>

                        <div className="flex items-baseline gap-1 pt-1">
                          <span className="text-3xl font-bold text-foreground tracking-tight">
                            {b.remaining}
                          </span>
                          <span className="text-xs text-muted-foreground">days left</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="pt-3 space-y-1.5">
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isEmergency ? 'bg-[#ef8d46]' : 'bg-[#23ace3]'
                            }`}
                            style={{ width: `${percentUsed}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                          <span>Used: {b.used}</span>
                          <span>Total: {b.totalAllowance}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Upcoming Approved Leaves */}
            <div className="space-y-3">
              <div className="text-xs font-medium text-muted-foreground">
                Upcoming leaves
              </div>

              {upcomingLeaves.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-border">
                  No upcoming scheduled leaves
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingLeaves.map(r => (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-2xl border border-border bg-card space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{r.leaveTypeName}</span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Approved</span>
                      </div>
                      <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                        <CalendarCheck2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{r.startDate} to {r.endDate} ({r.requestedDays} days)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-medium text-[#ef8d46]">
                  Pending review ({pendingRequests.length})
                </div>

                <div className="space-y-2">
                  {pendingRequests.map(r => (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-2xl border border-[#ef8d46]/30 bg-[#ef8d46]/5 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-foreground flex items-center gap-1.5">
                          {r.isEmergency && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-[#ef8d46]/40 text-[#ef8d46]">
                              Emergency
                            </Badge>
                          )}
                          <span>{r.leaveTypeName}</span>
                        </div>
                        <span className="text-[11px] text-[#ef8d46] font-medium">In review</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {r.startDate} • {r.requestedDays} day
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Workday HRMS</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs rounded-xl border-border hover:bg-muted text-foreground px-4 cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
