import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '@/services/adminService'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Clock,
  BookOpen,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert,
  Activity,
  CheckCircle2,
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR Administrator Command Center"
        subtitle={`Tenant Governance & Operations • ${tenant?.name} (${tenant?.code})`}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/audit-logs')}
          className="gap-1.5 text-xs"
        >
          <ShieldAlert className="h-3.5 w-3.5 text-slate-500" />
          <span>Audit Logs</span>
        </Button>
        <Button
          variant="ai"
          size="sm"
          onClick={() => navigate('/admin/ai-usage')}
          className="gap-1.5 text-xs"
        >
          <Activity className="h-3.5 w-3.5" />
          <span>AI Observability</span>
        </Button>
      </PageHeader>

      {/* Primary KPI Metric Tiles (Section 23) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={248}
          subtitle="Active on corporate roster"
          icon={Users}
          iconColor="text-[#23ace3] bg-[#23ace3]/15"
          trend={{ value: '+4 this month', positive: true }}
        />
        <StatCard
          title="Pending HR Requests"
          value={stats?.pendingRequests ?? 12}
          subtitle="Awaiting manager/admin review"
          icon={Clock}
          iconColor="text-[#ef8d46] bg-[#ef8d46]/15"
        />
        <StatCard
          title="Active Policies"
          value={stats?.activePolicies ?? 18}
          subtitle="Indexed in Azure AI Search"
          icon={BookOpen}
          iconColor="text-indigo-400 bg-indigo-500/15"
          trend={{ value: '100% vector indexed', positive: true }}
        />
        <StatCard
          title="AI Requests Today"
          value={stats?.aiRequestsToday ? stats.aiRequestsToday.toLocaleString() : '1,284'}
          subtitle="Avg response latency: 380ms"
          icon={Sparkles}
          iconColor="text-purple-400 bg-purple-500/15"
          trend={{ value: '99.8% safe SLA', positive: true }}
        />
      </div>

      {/* Cloud Integrations Status Banner (Section 23 & 30) */}
      {/* Cloud Integrations Status Banner (Section 23 & 30) */}
      <Card className="border-border/60 bg-card text-foreground rounded-2xl shadow-sm">
        <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#23ace3]" />
              <h4 className="text-sm font-bold text-foreground">Hybrid Cloud Integration Fabric</h4>
              <Badge variant="warning" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                1 Gateway Warning
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Workday HRMS (Connected) • ADP Payroll (Connected) • Biometric Gateway (High Latency) • Entra ID (Connected)
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/integrations')}
            className="text-xs rounded-xl border-border text-foreground hover:bg-muted shrink-0"
          >
            <span>View Integration Diagnostics</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
          </Button>
        </CardContent>
      </Card>

      {/* Two Column Layout: Recent Activity Feed & Admin Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed Column (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Recent Enterprise Activity</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/audit-logs')}
              className="text-xs text-[#23ace3] hover:bg-[#23ace3]/15 rounded-lg"
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
                auditLogs.slice(0, 5).map(event => (
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
                      <span className="text-[10px] text-muted-foreground">{event.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Admin Navigation Hub (1 col) */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground">Admin Modules</h3>
          <div className="space-y-2.5 text-xs">
            <button
              onClick={() => navigate('/admin/employees')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-card hover:border-[#23ace3]/50 hover:bg-muted/40 transition-all text-left cursor-pointer group"
            >
              <div className="font-semibold text-foreground group-hover:text-[#23ace3] transition-colors">Employee Directory</div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[#23ace3] transition-colors" />
            </button>
            <button
              onClick={() => navigate('/admin/leave-types')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-card hover:border-[#23ace3]/50 hover:bg-muted/40 transition-all text-left cursor-pointer group"
            >
              <div className="font-semibold text-foreground group-hover:text-[#23ace3] transition-colors">Leave Policies & Quotas</div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[#23ace3] transition-colors" />
            </button>
            <button
              onClick={() => navigate('/admin/policies')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-card hover:border-[#23ace3]/50 hover:bg-muted/40 transition-all text-left cursor-pointer group"
            >
              <div className="font-semibold text-foreground group-hover:text-[#23ace3] transition-colors">Policy Management & Vector Indexing</div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[#23ace3] transition-colors" />
            </button>
            <button
              onClick={() => navigate('/admin/ai-usage')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-[#23ace3]/40 bg-[#23ace3]/10 hover:bg-[#23ace3]/15 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#23ace3]" />
                <span className="font-semibold text-foreground group-hover:text-[#23ace3]">AI Observability & Telemetry</span>
              </div>
              <ArrowRight className="h-4 w-4 text-[#23ace3]" />
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-card hover:border-[#23ace3]/50 hover:bg-muted/40 transition-all text-left cursor-pointer group"
            >
              <div className="font-semibold text-foreground group-hover:text-[#23ace3] transition-colors">Tenant & LLM Model Configuration</div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[#23ace3] transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
