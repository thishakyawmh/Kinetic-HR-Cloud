import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { approvalService } from '@/services/approvalService'
import { employeeService } from '@/services/employeeService'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  CalendarDays,
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  CalendarCheck,
  Calendar,
  SearchAlert,
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
    queryFn: () => (tenant?.id ? approvalService.getPendingApprovals(tenant.id) : []),
    enabled: !!tenant?.id,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Manager Command Center - ${user?.name || 'Workspace Manager'}`}
        subtitle={`${user?.department || 'Department'} Overview • ${tenant?.name || 'Sampath Bank PLC'}`}
      />

      {/* Metrics Row (Section 19) */}
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
          title="Pending Approvals"
          value={pendingApprovals.length}
          subtitle="Awaiting manager sign-off"
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

      {/* Priority Pending Approval Highlight (Section 20 & Demo Step 7) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Approvals Requiring Action
            </h3>
            <p className="text-xs text-muted-foreground">
              Review requests augmented with Kinetic AI policy retrieval & staffing impact calculations.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/manager/approvals')}
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
              All team leave submissions have been reviewed.
            </p>
          </Card>
        ) : (
          <Card className="border border-border/70 bg-card/90 backdrop-blur-xs rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Leave Type</th>
                    <th className="py-3.5 px-4">Schedule & Duration</th>
                    <th className="py-3.5 px-4 max-w-xs">Employee Reason</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {pendingApprovals.map(req => (
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

                      {/* Employee Reason */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-xs text-foreground/80 italic line-clamp-2">
                          "{req.reason}"
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={req.status} />
                      </td>

                      {/* Action: Investigate */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/manager/assistant?investigate=${req.id}`, { state: { request: req } })}
                          className="bg-gradient-to-r from-[#23ace3] to-[#0284c7] hover:from-[#1da0d4] hover:to-[#0369a1] text-white font-semibold text-xs h-8 px-3 rounded-lg gap-1.5 shadow-xs hover:shadow-md hover:shadow-[#23ace3]/20 transition-all cursor-pointer group"
                        >
                          <SearchAlert className="h-3.5 w-3.5 text-cyan-200 transition-transform group-hover:rotate-12" />
                          <span>Investigate</span>
                          <ArrowRight className="h-3 w-3 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
