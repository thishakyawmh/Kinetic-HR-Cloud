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
import { CalendarDays, PlusCircle, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const EmployeeLeave: React.FC = () => {
  const { user, tenant } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')

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

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const upcomingApprovedRequests = requests.filter(r => r.status === 'approved')
  const historyRequests = requests.filter(r => r.status !== 'pending')
  const hasAutoApprovedRecent = requests.some(r => r.status === 'approved' && r.autoApproved)

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
            className="gap-1.5 text-xs border-sky-500/40 text-sky-400 hover:bg-sky-500/10 rounded-xl"
          >
            <CalendarDays className="h-3.5 w-3.5 text-sky-400" />
            <span>Team Leave Plans & Duty Wiring</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/employee/leave/apply')}
            className="gap-1.5 text-xs bg-[#23ace3] hover:bg-[#1b97ca] text-white rounded-xl shadow-xs"
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

        {/* Tab 3: Complete Leave History (Approved, Rejected, Appealed) */}
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
