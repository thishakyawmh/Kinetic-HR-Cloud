import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '@/services/adminService'
import { branchService } from '@/services/branchService'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HRInsightsDashboard } from '@/components/dashboard/HRInsightsDashboard'
import {
  Users,
  Clock,
  BookOpen,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Activity,
  Building2,
  CheckCircle2,
  Calendar,
  FileCheck2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const AdminDashboard: React.FC = () => {
  const { tenant } = useAuth()
  const navigate = useNavigate()

  const { data: stats } = useQuery({
    queryKey: ['adminDashboardStats', tenant?.id],
    queryFn: () => (tenant?.id ? adminService.getDashboardStats(tenant.id) : null),
    enabled: !!tenant?.id,
  })

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['recentAuditLogs', tenant?.id],
    queryFn: () => (tenant?.id ? adminService.getAuditLogs(tenant.id) : []),
    enabled: !!tenant?.id,
  })

  const { data: branches = [] } = useQuery({
    queryKey: ['branches', tenant?.id],
    queryFn: () => branchService.getBranches(tenant?.id),
    enabled: !!tenant?.id,
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      <PageHeader
        title="HR Administrator Command Center"
        subtitle="Enterprise Workforce Governance & Operations"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/audit-logs')}
          className="gap-1.5 text-xs rounded-xl"
        >
          <ShieldAlert className="h-3.5 w-3.5 text-slate-500" />
          <span>Audit Logs</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/ai-usage')}
          className="gap-1.5 text-xs rounded-xl"
        >
          <Activity className="h-3.5 w-3.5 text-slate-500" />
          <span>System Analytics</span>
        </Button>
      </PageHeader>

      {/* Primary KPI Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Workforce"
          value={248}
          subtitle="Active on corporate roster"
          icon={Users}
          iconColor="text-[#23ace3] bg-[#23ace3]/15"
          trend={{ value: '+4 this month', positive: true }}
        />
        <StatCard
          title="Operating Branches"
          value={branches.length || 6}
          subtitle="Sites across Sri Lanka"
          icon={Building2}
          iconColor="text-sky-500 bg-sky-500/15"
          trend={{ value: '100% active sites', positive: true }}
        />
        <StatCard
          title="Today's Attendance"
          value="96.8%"
          subtitle="240 staff members on-duty"
          icon={CheckCircle2}
          iconColor="text-emerald-500 bg-emerald-500/15"
          trend={{ value: '+1.2% vs yesterday', positive: true }}
        />
        <StatCard
          title="Pending HR Requests"
          value={stats?.pendingRequests ?? 12}
          subtitle="Awaiting manager/admin review"
          icon={Clock}
          iconColor="text-[#ef8d46] bg-[#ef8d46]/15"
          trend={{ value: 'Action required', positive: false }}
        />
        <StatCard
          title="Scheduled Leaves Today"
          value={8}
          subtitle="Approved time-off across sites"
          icon={Calendar}
          iconColor="text-amber-500 bg-amber-500/15"
        />
        <StatCard
          title="Active HR Policies"
          value={stats?.activePolicies ?? 18}
          subtitle="Official company guidelines"
          icon={BookOpen}
          iconColor="text-indigo-400 bg-indigo-500/15"
          trend={{ value: 'Published & active', positive: true }}
        />
        <StatCard
          title="Support Inquiries Handled"
          value={stats?.aiRequestsToday ? stats.aiRequestsToday.toLocaleString() : '1,284'}
          subtitle="Policy & workflow requests resolved"
          icon={CheckCircle2}
          iconColor="text-purple-400 bg-purple-500/15"
          trend={{ value: '99.8% resolution rate', positive: true }}
        />
        <StatCard
          title="Monthly Payroll Status"
          value="99.4%"
          subtitle="October cycle ready for cutoff"
          icon={FileCheck2}
          iconColor="text-teal-500 bg-teal-500/15"
          trend={{ value: 'Cycle on schedule', positive: true }}
        />
      </div>

      {/* Workforce Intelligence & Operational Analytics Chart */}
      <HRInsightsDashboard branches={branches} />

      {/* Recent Enterprise Activity Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Recent Enterprise Audit Activity</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live organizational audit trail, role changes, and workforce compliance logs
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/audit-logs')}
            className="text-xs text-[#23ace3] hover:bg-[#23ace3]/15 rounded-xl cursor-pointer"
          >
            <span>View full audit trail</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        <Card className="border-border/60 bg-card rounded-2xl overflow-hidden shadow-xs">
          <CardContent className="p-0 divide-y divide-border/40">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No recent enterprise activity recorded for this organization.
              </div>
            ) : (
              auditLogs.slice(0, 6).map(event => (
                <div key={event.id} className="p-4 flex items-start justify-between gap-3 text-xs hover:bg-muted/30 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{event.action}</span>
                      <Badge
                        variant={
                          event.riskLevel === 'High'
                            ? 'destructive'
                            : event.riskLevel === 'Medium'
                            ? 'warning'
                            : 'outline'
                        }
                        className="text-[10px]"
                      >
                        {event.riskLevel} Risk
                      </Badge>
                    </div>
                    <div className="text-muted-foreground">{event.resource}</div>
                    <p className="text-muted-foreground italic text-[11px]">{event.details}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-medium text-foreground block">{event.userName}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{event.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
