import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { approvalService } from '@/services/approvalService'
import { PageHeader } from '@/components/common/PageHeader'
import { ApprovalCard } from '@/components/approvals/ApprovalCard'
import { LeaveHistoryTable } from '@/components/leave/LeaveHistoryTable'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { CheckSquare, AlertCircle } from 'lucide-react'

export const ManagerApprovals: React.FC = () => {
  const { tenant } = useAuth()
  const [activeTab, setActiveTab] = useState('pending')

  const { data: allRequests = [], refetch } = useQuery({
    queryKey: ['allApprovals', tenant?.id],
    queryFn: () => (tenant?.id ? approvalService.getAllApprovals(tenant.id) : []),
    enabled: !!tenant?.id,
  })

  const pendingRequests = allRequests.filter(r => r.status === 'pending')
  const processedRequests = allRequests.filter(r => r.status !== 'pending')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager Approval Center"
        subtitle="Review employee leave submissions supported by Kinetic AI policy alignment and department staffing analytics."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending Action ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Processed History ({processedRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Pending Approvals with AI Assistance Cards */}
        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card className="border border-dashed border-border/80 p-12 text-center bg-card/40 rounded-2xl">
              <CheckSquare className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-foreground">All pending requests resolved</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                There are no employee leave submissions currently waiting for manager sign-off.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map(req => (
                <ApprovalCard
                  key={req.id}
                  request={req}
                  onStatusChange={() => refetch()}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Historical Archive */}
        <TabsContent value="history" className="space-y-4">
          <LeaveHistoryTable requests={processedRequests} showEmployeeName={true} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
