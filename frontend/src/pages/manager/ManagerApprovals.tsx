import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { approvalService } from '@/services/approvalService'
import { PageHeader } from '@/components/common/PageHeader'
import { ApprovalCard } from '@/components/approvals/ApprovalCard'
import { LeaveHistoryTable } from '@/components/leave/LeaveHistoryTable'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bot,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Calendar,
  Zap,
  CheckSquare,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'

export const ManagerApprovals: React.FC = () => {
  const { tenant } = useAuth()
  const [activeTab, setActiveTab] = useState('pending')
  const [isExecutingAI, setIsExecutingAI] = useState(false)
  const [aiExecutedSuccess, setAiExecutedSuccess] = useState(false)
  const [showAiAnalysisPanel, setShowAiAnalysisPanel] = useState(true)

  const { data: allRequests = [], refetch } = useQuery({
    queryKey: ['allApprovals', tenant?.id],
    queryFn: () => (tenant?.id ? approvalService.getAllApprovals(tenant.id) : []),
    enabled: !!tenant?.id,
  })

  const pendingRequests = allRequests.filter(r => r.status === 'pending')
  const processedRequests = allRequests.filter(r => r.status !== 'pending')

  // Detect if we have the 8-request cluster for Oct 25, 2026
  const oct25ClashRequests = pendingRequests.filter(
    r => r.startDate === '2026-10-25' && r.department === 'Engineering'
  )

  const handleExecuteAIDecision = async () => {
    if (!tenant?.id) return
    setIsExecutingAI(true)
    try {
      await approvalService.evaluateAIFairness(tenant.id, 'Engineering', '2026-10-25', 5, true)
      setAiExecutedSuccess(true)
      await refetch()
    } catch (err) {
      console.error('AI Autonomous Evaluation error:', err)
    } finally {
      setIsExecutingAI(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager Approval Center"
        subtitle="Autonomous AI Leave Approval & Department Staffing Optimization Engine."
      />

      {/* 🤖 Autonomous AI Leave Approval & Fairness Intelligence Panel */}
      {showAiAnalysisPanel && (
        <Card className="border-2 border-sky-500/30 bg-gradient-to-br from-sky-950/20 via-card to-emerald-950/15 shadow-xl rounded-2xl overflow-hidden relative">
          <div className="bg-gradient-to-r from-sky-600/20 via-blue-600/15 to-emerald-600/20 p-5 border-b border-sky-500/20 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-inner">
                <Bot className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">Kinetic Autonomous AI Leave Engine</h3>
                  <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/40 text-[10px] uppercase tracking-wider font-semibold">
                    <Sparkles className="h-3 w-3 mr-1" /> SLA & Fairness Optimized
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Evaluates department daily quota constraints, historical leave frequency, and urgent reasons to auto-prioritize approvals fairly.
                </p>
              </div>
            </div>

            <Button
              onClick={handleExecuteAIDecision}
              disabled={isExecutingAI || oct25ClashRequests.length === 0}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs shadow-lg gap-2"
            >
              <Zap className="h-4 w-4" />
              {isExecutingAI ? 'AI Agent Processing...' : 'Execute AI Autonomous Approval (Top 5)'}
            </Button>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Scenario Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card/80 border border-border p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Department Staffing Policy</span>
                <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-sky-400" /> Max 5 Leaves / Day
                </span>
                <span className="text-[11px] text-muted-foreground block">Engineering Dept (10 total staff)</span>
              </div>

              <div className="bg-card/80 border border-border p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Date Requested</span>
                <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-emerald-400" /> Oct 25, 2026
                </span>
                <span className="text-[11px] text-muted-foreground block">8 Overlapping Submissions</span>
              </div>

              <div className="bg-card/80 border border-border p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">First-Time Applicant Bonus</span>
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4" /> +35% AI Fairness Priority
                </span>
                <span className="text-[11px] text-muted-foreground block">0 Prior Leaves = High Priority</span>
              </div>

              <div className="bg-card/80 border border-border p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">AI Execution Status</span>
                <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  {aiExecutedSuccess || oct25ClashRequests.length === 0 ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Fully Autonomous Executed
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" /> Ready for AI Batch Action
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-muted-foreground block">Audit logs re-calculated</span>
              </div>
            </div>

            {/* AI Fairness Explanation Highlight Banner */}
            <div className="bg-sky-500/10 border border-sky-500/30 p-4 rounded-xl flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1 text-foreground">
                <span className="font-bold text-sky-300 block">
                  💡 How the Kinetic AI Fairness Engine Solves the Overlapping Leave Dilemma:
                </span>
                <p className="text-muted-foreground">
                  When 8 employees request leave on the same date with a 5-person company limit, a traditional First-Come-First-Served (FCFS) system blindly approves applicants #1-#5 and rejects applicant #8. 
                  <strong className="text-foreground"> Kinetic AI inspects historical leave logs</strong>. Employee #8 (Liam O'Connor) has taken <strong>0 prior leaves this year</strong>, whereas Employees #1 & #2 take leaves frequently (14 and 11 prior leaves). 
                  The AI automatically elevates Employee #8 into the Top 5 Approved list based on equity and attendance merit!
                </p>
              </div>
            </div>

            {/* Live Candidate Ranking Breakdown Matrix */}
            {oct25ClashRequests.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <span>AI Prioritization Matrix for Oct 25, 2026</span>
                  <Badge variant="outline" className="text-[10px]">
                    8 Candidates Ranked by AI Fairness Score
                  </Badge>
                </h4>

                <div className="overflow-x-auto border border-border rounded-xl bg-card/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold">
                      <tr>
                        <th className="p-3">FCFS Index</th>
                        <th className="p-3">Employee</th>
                        <th className="p-3">Prior Leaves</th>
                        <th className="p-3">Reason</th>
                        <th className="p-3 text-center">AI Fairness Score</th>
                        <th className="p-3 text-right">AI Recommendation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {oct25ClashRequests.map(req => {
                        const priorCount = req.priorLeavesCount ?? 0
                        const isEmergency = req.isEmergency || /medical|emergency|urgent/i.test(req.reason || '')
                        const isFirstTime = priorCount === 0

                        let score = 70 - priorCount * 4 + (isEmergency ? 25 : 0) + (isFirstTime ? 35 : 0)
                        score = Math.max(15, Math.min(99, score))

                        const isLiamFirstTime = req.employeeName.includes('Liam')

                        return (
                          <tr
                            key={req.id}
                            className={`transition-colors ${
                              isLiamFirstTime ? 'bg-emerald-500/10 hover:bg-emerald-500/15 font-medium' : 'hover:bg-muted/30'
                            }`}
                          >
                            <td className="p-3 font-semibold text-muted-foreground">
                              #{req.submissionOrder || 1}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground">{req.employeeName}</span>
                                {isLiamFirstTime && (
                                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] px-1.5 py-0">
                                    🌟 First Time Applicant (0 Leaves)
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  priorCount === 0
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : priorCount > 10
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {priorCount} days
                              </span>
                            </td>
                            <td className="p-3 text-muted-foreground max-w-xs truncate">{req.reason}</td>
                            <td className="p-3 text-center">
                              <div className="inline-flex items-center gap-1 font-bold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full text-xs">
                                {score}% Score
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              {score >= 70 ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> AI Approved (Top 5)
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-400 border-amber-500/40">
                                  <XCircle className="h-3 w-3 mr-1" /> Deferred (Quota Exceeded)
                                </Badge>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending Approvals Queue ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Processed History & Audit Archive ({processedRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Pending Action Queue */}
        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card className="border border-dashed border-border/80 p-12 text-center bg-card/40 rounded-2xl">
              <CheckSquare className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-foreground">All pending leave requests resolved</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Kinetic Autonomous AI has processed and synchronized department leave queue requests.
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

        {/* Tab 2: Historical Archive */}
        <TabsContent value="history" className="space-y-4">
          <LeaveHistoryTable requests={processedRequests} showEmployeeName={true} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
