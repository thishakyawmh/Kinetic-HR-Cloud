import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { approvalService } from '@/services/approvalService'
import { employeeService } from '@/services/employeeService'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { ApprovalCard } from '@/components/approvals/ApprovalCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  CalendarDays,
  Clock,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle,
  CalendarCheck,
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
        title={`Manager Command Center — ${user?.name || 'David Wilson'}`}
        subtitle={`Engineering Department Overview • ${tenant?.name}`}
      >
        <Button
          variant="ai"
          size="sm"
          onClick={() => navigate('/manager/assistant')}
          className="gap-1.5 text-xs"
        >
          <Bot className="h-3.5 w-3.5" />
          <span>Manager AI Agent</span>
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => navigate('/manager/approvals')}
          className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-700 text-white"
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Review Approvals ({pendingApprovals.length})</span>
        </Button>
      </PageHeader>

      {/* Metrics Row (Section 19) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Team Members"
          value={12}
          subtitle="Direct and dotted-line reports"
          icon={Users}
          iconColor="text-sky-600 bg-sky-50"
        />
        <StatCard
          title="On Leave Today"
          value={2}
          subtitle="Scheduled authorized absences"
          icon={CalendarDays}
          iconColor="text-indigo-600 bg-indigo-50"
          badge={<Badge variant="outline" className="text-[10px]">Marcus & Priya</Badge>}
        />
        <StatCard
          title="Pending Approvals"
          value={pendingApprovals.length}
          subtitle="Awaiting manager sign-off"
          icon={Clock}
          iconColor="text-amber-600 bg-amber-50"
          trend={{ value: 'Action Required', positive: false }}
        />
        <StatCard
          title="Staffing Warning"
          value="75%"
          subtitle="Friday standup coverage threshold"
          icon={AlertTriangle}
          iconColor="text-rose-600 bg-rose-50"
          trend={{ value: 'Below 80% Threshold', positive: false }}
        />
      </div>

      {/* Staffing Alert Callout */}
      <Card className="border-[#ef8d46]/30 bg-[#ef8d46]/10 p-5 rounded-2xl shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-[#ef8d46]/20 text-[#ef8d46] shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-foreground">
              Department Staffing Alert: Overlapping Leaves Detected (Oct 7 - Oct 8)
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Marcus Chen and Priya Patel have approved absences on October 7. Any additional emergency or personal leave will reduce Engineering core sprint velocity below the 70% minimum threshold.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/manager/team')}
            className="text-xs shrink-0 border-[#ef8d46]/30 text-foreground hover:bg-[#ef8d46]/20 rounded-xl"
          >
            <span>View Team Roster</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </Card>

      {/* Priority Pending Approval Highlight (Section 20 & Demo Step 7) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Pending Team Approvals Requiring Action
            </h3>
            <p className="text-xs text-muted-foreground">
              Review requests augmented with Kinetic AI policy retrieval & staffing impact calculations.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/manager/approvals')}
            className="text-xs text-[#23ace3] hover:bg-[#23ace3]/15 rounded-lg"
          >
            <span>View all approvals</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {pendingApprovals.length === 0 ? (
          <Card className="border border-dashed border-border/80 p-8 text-center bg-card/40 rounded-2xl">
            <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-sm font-semibold text-foreground">Inbox Zero: No Pending Approvals</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              All team leave submissions have been reviewed.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingApprovals.map(req => (
              <ApprovalCard
                key={req.id}
                request={req}
                onStatusChange={() => refetch()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
