import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { approvalService } from '@/services/approvalService'
import { PageHeader } from '@/components/common/PageHeader'
import { LeaveHistoryTable } from '@/components/leave/LeaveHistoryTable'
import { ApprovalCard } from '@/components/approvals/ApprovalCard'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { CheckSquare } from 'lucide-react'

export const AdminApprovals: React.FC = () => {
  const { tenant } = useAuth()
  const [activeTab, setActiveTab] = useState('pending')

  const { data: allRequests = [], refetch } = useQuery({
    queryKey: ['adminAllApprovals', tenant?.id],
    queryFn: () => (tenant?.id ? approvalService.getAllApprovals(tenant.id) : []),
    enabled: !!tenant?.id,
  })

  const pendingRequests = allRequests.filter(r => r.status === 'pending')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global HR Approvals & Executive Oversight"
        subtitle="Monitor and process all organizational leave submissions and department exceptions."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending Submissions ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="all">All Historical Records ({allRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card className="border border-dashed border-border/80 p-10 text-center bg-card/40 rounded-2xl">
              <CheckSquare className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-foreground">No Pending Requests</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                All employee requests across all business units have been addressed.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map(req => (
                <ApprovalCard key={req.id} request={req} onStatusChange={() => refetch()} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <LeaveHistoryTable requests={allRequests} showEmployeeName={true} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
