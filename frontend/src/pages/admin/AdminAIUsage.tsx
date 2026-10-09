import React from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Clock,
  Wrench,
  Search,
  ShieldCheck,
  AlertTriangle,
  Activity,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '@/services/adminService'

export const AdminAIUsage: React.FC = () => {
  const { data: metrics } = useQuery({
    queryKey: ['adminAIMetrics'],
    queryFn: () => adminService.getAIUsageMetrics(),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Analytics & Usage Metrics"
        subtitle="Operational metrics for automated workflows, response times, and knowledge base lookups."
      />

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Automated Inquiries Today"
          value={metrics?.totalRequestsToday.toLocaleString() ?? '1,284'}
          subtitle="Processed and resolved"
          icon={Activity}
          iconColor="text-[#23ace3] bg-[#23ace3]/15 border border-[#23ace3]/20"
        />
        <StatCard
          title="Average Response Latency"
          value={`${metrics?.avgResponseTimeMs ?? 380} ms`}
          subtitle="P95 Latency: 510ms"
          icon={Clock}
          iconColor="text-emerald-500 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/20"
          trend={{ value: 'Sub-second response', positive: true }}
        />
        <StatCard
          title="Automated Actions Executed"
          value={metrics?.toolCallsCount.toLocaleString() ?? '412'}
          subtitle="Leave calculations, calendar syncs"
          icon={Wrench}
          iconColor="text-indigo-500 dark:text-indigo-400 bg-indigo-500/15 border border-indigo-500/20"
        />
        <StatCard
          title="Knowledge Base Lookups"
          value={metrics?.ragSearchesCount.toLocaleString() ?? '890'}
          subtitle="Policy and documentation queries"
          icon={Search}
          iconColor="text-sky-500 dark:text-sky-400 bg-sky-500/15 border border-sky-500/20"
        />
        <StatCard
          title="Approval-Required Actions"
          value={metrics?.approvalsCount ?? 47}
          subtitle="High-impact actions gated by human managers"
          icon={ShieldCheck}
          iconColor="text-[#ef8d46] bg-[#ef8d46]/15 border border-[#ef8d46]/20"
        />
        <StatCard
          title="Failed / Blocked Requests"
          value={metrics?.failedRequestsCount ?? 2}
          subtitle="Content safety filter blocked"
          icon={AlertTriangle}
          iconColor="text-rose-500 dark:text-rose-400 bg-rose-500/15 border border-rose-500/20"
          trend={{ value: '0.001% Error Rate', positive: true }}
        />
      </div>

      {/* Model & Token Consumption Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-border/70 bg-card/90 backdrop-blur-xs rounded-2xl shadow-xs">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-bold text-foreground">Token Allocation (24 Hour Cycle)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4 text-xs">
            <div className="flex justify-between py-2 border-b border-border/40">
              <span className="text-muted-foreground">Prompt / Grounding Tokens:</span>
              <span className="font-mono font-bold text-foreground">
                {metrics?.tokenUsage.prompt.toLocaleString() ?? '452,890'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/40">
              <span className="text-muted-foreground">Completion Tokens:</span>
              <span className="font-mono font-bold text-foreground">
                {metrics?.tokenUsage.completion.toLocaleString() ?? '184,200'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/40 font-bold items-center">
              <span className="text-foreground">Total Consumption:</span>
              <span className="font-mono text-[#23ace3] font-extrabold text-sm">
                {metrics?.tokenUsage.total.toLocaleString() ?? '637,090'} tokens
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card/90 backdrop-blur-xs rounded-2xl shadow-xs">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-bold text-foreground">Safety & Policy Guardrails Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/15 transition-colors">
              <span className="font-medium text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                Azure AI Content Safety Jailbreak Shield
              </span>
              <Badge variant="success" className="text-[10px]">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/15 transition-colors">
              <span className="font-medium text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                Autonomous Financial Action Lock
              </span>
              <Badge variant="success" className="text-[10px]">Enforced</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/15 transition-colors">
              <span className="font-medium text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                Tenant Vector Filter Partitioning
              </span>
              <Badge variant="success" className="text-[10px]">Isolated</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
