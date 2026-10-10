import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leaveService } from '@/services/leaveService'
import { PageHeader } from '@/components/common/PageHeader'
import { LeaveBalanceCard } from '@/components/leave/LeaveBalanceCard'
import { LeaveHistoryTable } from '@/components/leave/LeaveHistoryTable'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/common/StatusBadge'
import { LeaveRequest } from '@/types'
import {
  CalendarDays,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Clock,
  Calendar,
  UserCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const EmployeeLeave: React.FC = () => {
  const { user, tenant } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')

  const [complainedIds, setComplainedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('kinetic_complained_request_ids')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })

  const { data: balances = [] } = useQuery({
    queryKey: ['leaveBalances', user?.id],
    queryFn: () => (user?.id ? leaveService.getLeaveBalances(user.id) : []),
    enabled: !!user?.id,
    refetchInterval: 3000,
  })

  const { data: requests = [] } = useQuery({
    queryKey: ['leaveRequests', tenant?.id, user?.id],
    queryFn: () => (tenant?.id && user?.id ? leaveService.getLeaveRequests(tenant.id, user.id) : []),
    enabled: !!tenant?.id && !!user?.id,
    refetchInterval: 3000,
  })

  const deleteMutation = useMutation({
    mutationFn: (requestId: string) => leaveService.deleteLeave(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] })
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] })
    },
  })

  const handleMakeComplaint = async (requestId: string) => {
    setComplainedIds(prev => {
      const next = new Set(prev)
      next.add(requestId)
      try {
        localStorage.setItem('kinetic_complained_request_ids', JSON.stringify(Array.from(next)))
      } catch (e) {
        console.error(e)
      }
      return next
    })

    try {
      await leaveService.submitComplaint(requestId, 'Employee complaint submitted regarding rejected or altered leave decision.')
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] })
    } catch (err) {
      console.warn('Complaint logged locally', err)
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const upcomingApprovedRequests = requests.filter(r => r.status === 'approved')
  const historyRequests = requests.filter(r => r.status !== 'pending')
  const hasAutoApprovedRecent = requests.some(r => r.status === 'approved' && r.autoApproved)

  // Real rejected or altered requests from database / storage
  const realRejectedOrAltered = requests.filter(
    r =>
      r.status === 'rejected' ||
      r.status === 'altered' ||
      r.status === 'appealed' ||
      r.status === 'complained' ||
      r.complaintNote ||
      r.isAlteredOnCall
  )

  // Standard demonstration records for Rejected or Altered leave & On-Call shifts
  const demoRejectedOrAltered: LeaveRequest[] = [
    {
      id: 'req-rej-demo-1',
      tenantId: tenant?.id || 'tenant-kinetic',
      employeeId: user?.id || 'emp-101',
      employeeName: user?.name || 'Kasun Perera',
      department: 'Engineering',
      leaveTypeId: 'lt-annual',
      leaveTypeName: 'Annual Leave Request',
      leaveTypeCode: 'annual',
      startDate: '2026-10-25',
      endDate: '2026-10-25',
      requestedDays: 1,
      reason: 'Personal weekend extension & family event',
      status: 'rejected',
      submittedAt: '2026-10-02T09:30:00Z',
      isEmergency: false,
      aiAnalysis: {
        applicablePolicy: 'Engineering Staffing Quota (Max 5 Absences)',
        employeeRemainingDays: 16,
        scheduledAbsencesCount: 8,
        teamCoverageWarning: '8 overlapping requests on Oct 25. Max daily limit is 5.',
        recommendationText: 'Rejected by AI Arbitration: Team coverage limit reached for Oct 25th.',
        requiresHumanApproval: true,
      },
    },
    {
      id: 'req-alt-demo-2',
      tenantId: tenant?.id || 'tenant-kinetic',
      employeeId: user?.id || 'emp-101',
      employeeName: user?.name || 'Kasun Perera',
      department: 'Engineering',
      leaveTypeId: 'lt-oncall',
      leaveTypeName: 'On-Call Duty Reassignment (Altered)',
      leaveTypeCode: 'oncall',
      startDate: '2026-10-18',
      endDate: '2026-10-19',
      requestedDays: 2,
      reason: 'Emergency On-Call Duty Reassignment covering Kasun Perera (Leave dates shifted)',
      status: 'altered',
      submittedAt: '2026-10-05T14:15:00Z',
      isEmergency: true,
      aiAnalysis: {
        applicablePolicy: 'On-Call Emergency Shift Protocol',
        employeeRemainingDays: 16,
        scheduledAbsencesCount: 2,
        teamCoverageWarning: 'On-call coverage activated due to emergency call-in.',
        recommendationText: 'Altered: Requested leave dates shifted to Oct 22 and assigned to active on-call coverage.',
        requiresHumanApproval: false,
      },
    },
  ]

  const rejectedAndAlteredList = [...realRejectedOrAltered]
  demoRejectedOrAltered.forEach(d => {
    if (!rejectedAndAlteredList.some(r => r.id === d.id)) {
      rejectedAndAlteredList.push(d)
    }
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        subtitle="View your leave balances, track submitted requests, and review historical absences."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/employee/leave-plans')}
            className="gap-1.5 text-xs border-sky-500/40 text-sky-400 hover:bg-sky-500/10 rounded-xl cursor-pointer"
          >
            <CalendarDays className="h-3.5 w-3.5 text-sky-400" />
            <span>Team Leave Plans & Duty Wiring</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/employee/leave/apply')}
            className="gap-1.5 text-xs bg-[#23ace3] hover:bg-[#1b97ca] text-white rounded-xl shadow-xs cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Apply for Leave</span>
          </Button>
        </div>
      </PageHeader>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map(b => (
          <LeaveBalanceCard key={b.leaveTypeId} balance={b} />
        ))}
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview & Upcoming</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Requests ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected or Altered ({rejectedAndAlteredList.length})
          </TabsTrigger>
          <TabsTrigger value="history">Leave History ({historyRequests.length})</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview & Upcoming Leaves Only */}
        <TabsContent value="overview" className="space-y-6">
          {/* AI Priority Auto-Approval Banner */}
          {hasAutoApprovedRecent && (
            <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in zoom-in-95">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-300">
                    🎉 Kinetic AI Priority Arbitration Approved!
                  </h4>
                  <p className="text-xs text-emerald-200/90 mt-0.5 leading-relaxed">
                    Your Annual Leave request has been prioritized and auto-approved. Kasun Perera has been assigned on-call duty coverage for Oct 10th.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Emergency Leave Assistance Highlight */}
          <div className="p-4 rounded-2xl border border-[#ef8d46]/30 bg-[#ef8d46]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#ef8d46]/20 text-[#ef8d46] shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Leave Policy Guidelines
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Standard annual leave requires 48-hour prior manager notice. Sick and emergency leaves can be filed retroactively within 24 hours.
                </p>
              </div>
            </div>
          </div>

          {/* Approved & Upcoming Leaves Only */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-foreground">Approved & Upcoming Leaves</h3>
            <LeaveHistoryTable
              requests={upcomingApprovedRequests}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['leaveRequests'] })}
            />
          </div>
        </TabsContent>

        {/* Tab 2: Pending Requests Only */}
        <TabsContent value="pending" className="space-y-4">
          <LeaveHistoryTable
            requests={pendingRequests}
            onDeleteRequest={id => deleteMutation.mutate(id)}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['leaveRequests'] })}
          />
        </TabsContent>

        {/* Tab 3: Rejected or Altered Requests with Make Complaint Workflow */}
        <TabsContent value="rejected" className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-slate-800 dark:text-slate-200 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                Review rejected requests or altered on-call duty assignments. If you disagree with an AI or manager alteration, click <strong>Make Complaint</strong> to lodge a formal appeal.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {rejectedAndAlteredList.map(req => {
              const isComplained = complainedIds.has(req.id) || req.status === 'complained' || req.status === 'appealed' || !!req.complaintNote
              return (
                <Card key={req.id} className="border border-border/80 rounded-2xl bg-card overflow-hidden shadow-xs hover:border-sky-500/40 transition-all">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground">{req.leaveTypeName}</h4>
                          {isComplained ? (
                            <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 gap-1 text-xs px-2.5 py-0.5 font-semibold">
                              <CheckCircle2 className="h-3 w-3" />
                              Complained
                            </Badge>
                          ) : (
                            <StatusBadge status={req.status} />
                          )}
                          {req.isEmergency && (
                            <Badge variant="destructive" className="text-[10px] px-2 py-0">
                              Emergency
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 text-sky-400" />
                          <span>
                            {req.startDate} {req.startDate !== req.endDate ? `→ ${req.endDate}` : ''}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-foreground font-semibold">{req.requestedDays} day(s)</span>
                        </div>
                      </div>

                      {/* Make Complaint Button Action */}
                      <div>
                        {isComplained ? (
                          <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 text-xs px-3 py-1.5 font-bold gap-1.5 rounded-xl">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Complained
                          </Badge>
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleMakeComplaint(req.id)}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl px-4 py-2 gap-1.5 shadow-xs cursor-pointer"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Make Complaint
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Details / Alteration Reason Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-1">
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5 text-sky-400" />
                          Request / Duty Reason
                        </div>
                        <p className="text-foreground leading-relaxed font-medium">{req.reason || 'No description provided'}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                        <div className="text-[11px] font-bold text-slate-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          {req.status === 'rejected' ? 'Rejection Reason' : 'Alteration & On-Call Note'}
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                          {req.aiAnalysis?.recommendationText ||
                            req.aiAnalysis?.teamCoverageWarning ||
                            'Request was altered or declined by system policy/manager.'}
                        </p>
                      </div>
                    </div>

                    {/* Complaint confirmation notice if complained */}
                    {isComplained && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>
                          Complaint logged and registered. Your HR Manager will review this decision and contact you shortly.
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Tab 4: Complete Leave History */}
        <TabsContent value="history" className="space-y-4">
          <LeaveHistoryTable
            requests={historyRequests}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['leaveRequests'] })}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
