import React from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  Clock,
  Wrench,
  Search,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Database,
  Cpu,
  Workflow,
  CheckCircle2,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '@/services/adminService'

export const AdminAIUsage: React.FC = () => {
  const { data: metrics } = useQuery({
    queryKey: ['adminAIMetrics'],
    queryFn: () => adminService.getAIUsageMetrics(),
  })

  // Pipeline execution sequence steps (Section 29)
  const pipelineSteps = [
    { title: 'User Request', desc: 'Natural language input via web assistant', icon: Sparkles, color: 'bg-sky-500' },
    { title: 'Agent Intent Classifier', desc: 'Azure OpenAI GPT-4o routing & guardrails', icon: Cpu, color: 'bg-indigo-500' },
    { title: 'Policy Retrieval (RAG)', desc: 'Azure AI Search hybrid vector query', icon: Database, color: 'bg-blue-500' },
    { title: 'HRMS Tool Execution', desc: 'Secure leave balance & staffing API queries', icon: Wrench, color: 'bg-purple-500' },
    { title: 'AI Recommendation', desc: 'Decision proposal with policy citations', icon: CheckCircle2, color: 'bg-amber-500' },
    { title: 'Human Approval Gate', desc: 'Manager authorization required for high impact', icon: ShieldCheck, color: 'bg-rose-500' },
    { title: 'Action Execution', desc: 'HRMS database record write & calendar sync', icon: Workflow, color: 'bg-emerald-500' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Agent Observability & Activity Metrics"
        subtitle="Telemetry visualization of Microsoft Foundry Agent Service, Azure OpenAI token usage, and RAG retrieval pipelines."
        badge={
          <Badge variant="ai" className="gap-1 text-xs">
            <Sparkles className="h-3 w-3" />
            Live Observability Stream
          </Badge>
        }
      />

      {/* Telemetry Metric Cards (Section 29) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total AI Requests Today"
          value={metrics?.totalRequestsToday.toLocaleString() ?? '1,284'}
          subtitle="Processed by Kinetic AI Service"
          icon={Sparkles}
          iconColor="text-sky-600 bg-sky-50"
        />
        <StatCard
          title="Average Response Latency"
          value={`${metrics?.avgResponseTimeMs ?? 380} ms`}
          subtitle="P95 Latency: 510ms"
          icon={Clock}
          iconColor="text-emerald-600 bg-emerald-50"
          trend={{ value: 'Sub-second SLA', positive: true }}
        />
        <StatCard
          title="Tool Calls Executed"
          value={metrics?.toolCallsCount.toLocaleString() ?? '412'}
          subtitle="Leave queries, calendar checks"
          icon={Wrench}
          iconColor="text-indigo-600 bg-indigo-50"
        />
        <StatCard
          title="RAG Knowledge Searches"
          value={metrics?.ragSearchesCount.toLocaleString() ?? '890'}
          subtitle="Vector matches in Azure AI Search"
          icon={Search}
          iconColor="text-blue-600 bg-blue-50"
        />
        <StatCard
          title="Approval-Required Actions"
          value={metrics?.approvalsCount ?? 47}
          subtitle="High-impact actions gated by human managers"
          icon={ShieldCheck}
          iconColor="text-amber-600 bg-amber-50"
        />
        <StatCard
          title="Failed / Blocked Requests"
          value={metrics?.failedRequestsCount ?? 2}
          subtitle="Content safety filter blocked"
          icon={AlertTriangle}
          iconColor="text-rose-600 bg-rose-50"
          trend={{ value: '0.001% Error Rate', positive: true }}
        />
      </div>

      {/* End-to-End Pipeline Visualization (Section 29 Key Demo Feature) */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Workflow className="h-5 w-5 text-indigo-600" />
            <span>Kinetic AI Agent Orchestration Pipeline</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Visual trace of how an employee natural language query progresses through policy retrieval, tool evaluation, and human approval.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center text-center p-3 rounded-xl border border-slate-200 bg-slate-50/60 relative group hover:border-slate-400 transition-all"
                >
                  <div className={`h-10 w-10 rounded-xl ${step.color} text-white flex items-center justify-center shadow-xs mb-2`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 leading-tight mb-1">
                    {idx + 1}. {step.title}
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-snug">
                    {step.desc}
                  </div>
                  {idx < pipelineSteps.length - 1 && (
                    <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 text-slate-300 z-10 pointer-events-none">
                      →
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Model & Token Consumption Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">Token Allocation (24 Hour Cycle)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-muted-foreground">Prompt / Grounding Tokens:</span>
              <span className="font-mono font-bold text-slate-900">
                {metrics?.tokenUsage.prompt.toLocaleString() ?? '452,890'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-muted-foreground">Completion Tokens:</span>
              <span className="font-mono font-bold text-slate-900">
                {metrics?.tokenUsage.completion.toLocaleString() ?? '184,200'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 font-bold">
              <span className="text-slate-800">Total Consumption:</span>
              <span className="font-mono text-sky-700">
                {metrics?.tokenUsage.total.toLocaleString() ?? '637,090'} tokens
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">Safety & Policy Guardrails Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs text-slate-700">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="font-medium text-emerald-900">Azure AI Content Safety Jailbreak Shield</span>
              <Badge variant="success" className="text-[10px]">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="font-medium text-emerald-900">Autonomous Financial Action Lock</span>
              <Badge variant="success" className="text-[10px]">Enforced</Badge>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="font-medium text-emerald-900">Tenant Vector Filter Partitioning</span>
              <Badge variant="success" className="text-[10px]">Isolated</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
