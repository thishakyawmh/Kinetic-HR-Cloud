import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { approvalService } from '@/services/approvalService'
import { employeeService } from '@/services/employeeService'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LeaveRequest } from '@/types'
import {
  Users,
  CalendarDays,
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Calendar,
  SearchAlert,
  ShieldAlert,
  Check,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const ManagerDashboard: React.FC = () => {
  const { user, tenant } = useAuth()
  const navigate = useNavigate()

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers', user?.id],
    queryFn: () => (user?.id ? employeeService.getTeamMembers(user.id) : []),
    enabled: !!user?.id,
  })

  const { data: pendingApprovals = [], refetch } = useQuery({
    queryKey: ['pendingApprovals', tenant?.id],
    queryFn: async () => {
      const baseApprovals = tenant?.id ? await approvalService.getPendingApprovals(tenant.id) : []

      // Check complained IDs saved in localStorage from the employee tab
      let complainedSet = new Set<string>()
      try {
        const saved = localStorage.getItem('kinetic_complained_request_ids')
        if (saved) complainedSet = new Set(JSON.parse(saved))
      } catch (e) {
        console.error(e)
      }

      const demoComplaints: LeaveRequest[] = [
        {
          id: 'req-rej-demo-1',
          tenantId: tenant?.id || 'tenant-kinetic',
          employeeId: 'emp-101',
          employeeName: 'Kasun Perera',
          department: 'Engineering',
          leaveTypeId: 'lt-annual',
          leaveTypeName: 'Annual Leave Request',
          leaveTypeCode: 'annual',
          startDate: '2026-10-25',
          endDate: '2026-10-25',
          requestedDays: 1,
          reason: 'Personal weekend extension & family event',
          status: 'appealed',
          complaintNote: 'Employee complaint submitted regarding rejected or altered leave decision.',
          complaintStatus: 'pending_human_review',
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
          employeeId: 'emp-101',
          employeeName: 'Kasun Perera',
          department: 'Engineering',
          leaveTypeId: 'lt-oncall',
          leaveTypeName: 'On-Call Duty Reassignment (Altered)',
          leaveTypeCode: 'oncall',
          startDate: '2026-10-18',
          endDate: '2026-10-19',
          requestedDays: 2,
          reason: 'Emergency On-Call Duty Reassignment covering Kasun Perera (Leave dates shifted)',
          status: 'appealed',
          complaintNote: 'Employee complaint submitted regarding rejected or altered leave decision.',
          complaintStatus: 'pending_human_review',
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

      const combined = [...baseApprovals]
      demoComplaints.forEach(dc => {
        if (complainedSet.has(dc.id) && !combined.some(c => c.id === dc.id)) {
          combined.unshift(dc)
        }
      })

      return combined
    },
    enabled: !!tenant?.id,
    refetchInterval: 2000,
  })

  const handleApprove = async (id: string) => {
    try {
      await approvalService.approveRequest(id, user?.name || 'Manager', 'Approved via Manager Portal Override')
      try {
        const saved = localStorage.getItem('kinetic_complained_request_ids')
        if (saved) {
          const set = new Set(JSON.parse(saved))
          set.delete(id)
          localStorage.setItem('kinetic_complained_request_ids', JSON.stringify(Array.from(set)))
        }
      } catch (e) {
        console.error(e)
      }
      refetch()
    } catch (err) {
      console.error(err)
    }
  }

  const handleReject = async (id: string) => {
    try {
      await approvalService.rejectRequest(id, user?.name || 'Manager', 'Sustained rejection decision')
      try {
        const saved = localStorage.getItem('kinetic_complained_request_ids')
        if (saved) {
          const set = new Set(JSON.parse(saved))
          set.delete(id)
          localStorage.setItem('kinetic_complained_request_ids', JSON.stringify(Array.from(set)))
        }
      } catch (e) {
        console.error(e)
      }
      refetch()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Manager Command Center - ${user?.name || 'Workspace Manager'}`}
        subtitle={`${user?.department || 'Department'} Overview • ${tenant?.name || 'Sampath Bank PLC'}`}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Team Members"
          value={teamMembers.length || 12}
          subtitle="Direct and dotted-line reports"
          icon={Users}
          iconColor="text-[#23ace3] bg-[#23ace3]/15"
        />
        <StatCard
          title="On Leave Today"
          value={2}
          subtitle="Scheduled authorized absences"
          icon={CalendarDays}
          iconColor="text-indigo-600 dark:text-indigo-400 bg-indigo-500/15"
        />
        <StatCard
          title="Pending Approvals & Complaints"
          value={pendingApprovals.length}
          subtitle="Awaiting manager sign-off & appeal review"
          icon={Clock}
          iconColor="text-[#c86b25] dark:text-[#ef8d46] bg-[#ef8d46]/15"
          trend={{ value: 'Action Required', positive: false }}
        />
        <StatCard
          title="Staffing Warning"
          value="75%"
          subtitle="Friday standup coverage threshold"
          icon={AlertTriangle}
          iconColor="text-rose-600 dark:text-rose-400 bg-rose-500/15"
          trend={{ value: 'Below 80% Threshold', positive: false }}
        />
      </div>

      {/* Approvals & Complaints Requiring Action */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Approvals Requiring Action
            </h3>
            <p className="text-xs text-muted-foreground">
              Review requests & employee complaints augmented with Kinetic AI policy retrieval.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/approvals')}
            className="text-xs text-[#0284c7] dark:text-[#23ace3] hover:bg-[#23ace3]/15 rounded-lg cursor-pointer"
          >
            <span>View all approvals</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {pendingApprovals.length === 0 ? (
          <Card className="border border-dashed border-border/80 p-8 text-center bg-card/40 rounded-2xl">
            <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
            <div className="text-sm font-semibold text-foreground">Inbox Zero: No Pending Approvals</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              All team leave submissions and employee complaints have been reviewed.
            </p>
          </Card>
        ) : (
          <Card className="border border-border/70 bg-card/90 backdrop-blur-xs rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Leave / Duty Type</th>
                    <th className="py-3.5 px-4">Schedule & Duration</th>
                    <th className="py-3.5 px-4 max-w-xs">Reason / Complaint Note</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {pendingApprovals.map(req => {
                    const isComplaint = req.status === 'appealed' || req.status === 'complained' || !!req.complaintNote
                    return (
                      <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                        {/* Employee Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#23ace3]/20 to-[#23ace3]/5 text-[#23ace3] border border-[#23ace3]/25 flex items-center justify-center font-bold text-xs shrink-0">
                              {req.employeeName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-foreground text-xs">{req.employeeName}</span>
                                {isComplaint && (
                                  <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 text-[9.5px] px-1.5 py-0 leading-tight gap-1 font-semibold">
                                    <ShieldAlert className="h-3 w-3" />
                                    Complaint Appeal
                                  </Badge>
                                )}
                                {req.isEmergency && (
                                  <Badge variant="destructive" className="text-[9.5px] px-1.5 py-0 leading-tight">
                                    Emergency
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                <span>{req.department}</span>
                                <span>•</span>
                                <span className="font-mono">ID: {req.id}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Leave Type */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-foreground text-xs block">
                            {req.leaveTypeName}
                          </span>
                        </td>

                        {/* Schedule & Duration */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-foreground font-medium">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>
                              {req.startDate} {req.startDate !== req.endDate ? `to ${req.endDate}` : ''}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {req.requestedDays} business day{req.requestedDays > 1 ? 's' : ''}
                          </div>
                        </td>

                        {/* Employee Reason / Complaint Note & AI Story */}
                        <td className="py-3.5 px-4 max-w-sm">
                          <p className="text-xs text-foreground/90 font-medium">
                            "{req.reason}"
                          </p>
                          {req.complaintNote && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-1 bg-amber-500/10 p-1.5 rounded-md border border-amber-500/20">
                              🚨 Employee Complaint: {req.complaintNote}
                            </p>
                          )}

                          {/* AI Arbitration Story */}
                          {req.aiAnalysis && (
                            <div className="mt-2 text-[10.5px] p-2 rounded-lg bg-muted/60 border border-border/50 space-y-1">
                              <div className="font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                                <span>🤖 AI Arbitration Story:</span>
                              </div>
                              <div className="text-muted-foreground">
                                <span className="font-bold text-rose-600 dark:text-rose-400">Why Rejected: </span>
                                {req.aiAnalysis.whyRejected || req.aiAnalysis.recommendationText}
                              </div>
                              {req.aiAnalysis.whoWasPrioritized && (
                                <div className="text-muted-foreground">
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Prioritized: </span>
                                  {req.aiAnalysis.whoWasPrioritized.split('\n')[0]}...
                                </div>
                              )}
                              {req.aiAnalysis.prioritizationRationale && (
                                <div className="text-muted-foreground">
                                  <span className="font-bold text-sky-600 dark:text-sky-400">Fairness Rule: </span>
                                  {req.aiAnalysis.prioritizationRationale}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <StatusBadge status={req.status} />
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(req.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-2.5 rounded-lg gap-1 cursor-pointer"
                              title="Approve / Override rejection"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Approve</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(req.id)}
                              className="text-rose-600 border-rose-500/40 hover:bg-rose-500/10 font-semibold text-xs h-8 px-2.5 rounded-lg gap-1 cursor-pointer"
                              title="Sustain rejection / Dismiss complaint"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Dismiss</span>
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => navigate(`/manager/assistant?investigate=${req.id}`, { state: { request: req } })}
                              className="bg-gradient-to-r from-[#23ace3] to-[#0284c7] hover:from-[#1da0d4] hover:to-[#0369a1] text-white font-semibold text-xs h-8 px-2.5 rounded-lg gap-1 shadow-xs cursor-pointer group"
                              title="Investigate with Kinetic AI"
                            >
                              <SearchAlert className="h-3.5 w-3.5 text-cyan-200" />
                              <span>AI</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

