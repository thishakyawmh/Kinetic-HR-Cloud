import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { approvalService } from '@/services/approvalService'
import { documentService } from '@/services/documentService'
import { storage } from '@/services/storage'
import { HRDocumentRequest } from '@/types'
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
  FileText,
  Smartphone,
  RotateCcw,
} from 'lucide-react'

import { DocumentCardView } from '@/components/documents/DocumentCardView'

export const ManagerApprovals: React.FC = () => {
  const { tenant } = useAuth()
  const [activeTab, setActiveTab] = useState('pending')
  const [isExecutingAI, setIsExecutingAI] = useState(false)
  const [aiExecutedSuccess, setAiExecutedSuccess] = useState(false)
  const [showAiAnalysisPanel, setShowAiAnalysisPanel] = useState(true)
  const [docRequests, setDocRequests] = useState<HRDocumentRequest[]>([])

  const { data: allRequests = [], refetch } = useQuery({
    queryKey: ['allApprovals', tenant?.id],
    queryFn: () => (tenant?.id ? approvalService.getAllApprovals(tenant.id) : []),
    enabled: !!tenant?.id,
  })

  // Fetch document requests for manager 2FA signing queue
  const loadDocs = async () => {
    try {
      const data = await documentService.getRequests()
      setDocRequests(data)
    } catch (e) {
      console.error('Failed to load document requests:', e)
    }
  }

  useEffect(() => {
    loadDocs()
  }, [tenant?.id])

  const appealedRequests = allRequests.filter(r => r.status === 'appealed' || r.complaintNote)
  const pendingRequests = allRequests.filter(r => r.status === 'pending')
  const processedRequests = allRequests.filter(r => r.status !== 'pending' && r.status !== 'appealed')
  const pendingDocRequests = docRequests.filter(d => d.status === 'pending_manager_signature')

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

  const handleHumanOverride = async (reqId: string, approved: boolean) => {
    if (approved) {
      await approvalService.approveRequest(reqId, 'David Wilson (Human Manager)', 'Human Manager Override: Appeal approved after manual review.')
    } else {
      await approvalService.rejectRequest(reqId, 'David Wilson (Human Manager)', 'Human Manager Sustained Rejection: Department capacity is full.')
    }
    await refetch()
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <PageHeader
        title="Manager Approval Center"
        subtitle="Autonomous AI Leave Approval, HR Document 2FA Signing, & Human Appeal Escalation Desk."
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
                  <h3 className="text-base font-bold text-foreground">Kinetic Autonomous AI Engine</h3>
                  <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/40 text-[10px] uppercase tracking-wider font-semibold">
                    <Sparkles className="h-3 w-3 mr-1" /> SLA & Fairness Optimized
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Evaluates department daily quota constraints, verifies HR document requests, and routes approvals with 2FA executive signature compliance.
                </p>
              </div>
            </div>

            <Button
              onClick={handleExecuteAIDecision}
              disabled={isExecutingAI}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs shadow-md gap-2 rounded-xl"
            >
              <Zap className="h-4 w-4" />
              {isExecutingAI ? 'AI Re-Evaluating Quota...' : 'Run Autonomous AI Fairness Evaluation'}
            </Button>
          </div>

          <CardContent className="p-5 space-y-4">
            {oct25ClashRequests.length >= 5 && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    Engineering Department Staffing Conflict Detected (Oct 25, 2026)
                  </span>
                  <span className="text-[11px] font-mono text-amber-400">
                    8 Applicants vs 5 Max Daily Quota
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  AI scoring prioritized Liam O'Connor (Rank #1) due to 100% attendance (0 prior leaves), promoting fairness over simple first-come-first-served order.
                </p>

                <div className="rounded-xl border border-border/50 overflow-hidden bg-card/60">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground font-semibold">
                      <tr>
                        <th className="p-2.5">FCFS Submission Order</th>
                        <th className="p-2.5">Employee</th>
                        <th className="p-2.5">Prior Leaves YTD</th>
                        <th className="p-2.5">Reason</th>
                        <th className="p-2.5 text-center">AI Fairness Score</th>
                        <th className="p-2.5 text-right">Autonomous AI Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                      {oct25ClashRequests.map(req => {
                        const priorCount = req.priorLeavesCount || 0
                        const isLiamFirstTime = req.employeeName.includes('Liam')
                        const score = isLiamFirstTime ? 98 : Math.max(20, 95 - priorCount * 5)

                        return (
                          <tr key={req.id} className="hover:bg-muted/30">
                            <td className="p-2.5 font-bold text-muted-foreground">
                              #{req.submissionOrder || 1}
                            </td>
                            <td className="p-2.5">
                              <div className="flex items-center gap-2 font-sans">
                                <span className="font-bold text-foreground">{req.employeeName}</span>
                                {isLiamFirstTime && (
                                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] px-1.5 py-0">
                                    🌟 Top Priority (0 Leaves)
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-2.5">
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
                            <td className="p-2.5 text-muted-foreground max-w-xs truncate font-sans">{req.reason}</td>
                            <td className="p-2.5 text-center">
                              <div className="inline-flex items-center gap-1 font-bold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full text-xs">
                                {score}% Score
                              </div>
                            </td>
                            <td className="p-2.5 text-right font-sans">
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
            Pending Leaves Queue ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="relative flex items-center gap-1.5">
            <Smartphone className="h-3.5 w-3.5 text-[#23ace3]" />
            HR Document 2FA Signings ({pendingDocRequests.length})
          </TabsTrigger>
          <TabsTrigger value="appeals" className="relative">
            🚨 Human Manager Appeals ({appealedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Processed History & Audit Archive ({processedRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Pending Leave Queue */}
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

        {/* Tab 2: HR Document Signings (2FA Required) */}
        <TabsContent value="documents" className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#23ace3]/10 border border-[#23ace3]/20 flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <ShieldCheck className="h-5 w-5 text-[#23ace3]" />
              <span>
                Executive Digital Signatures require 2-Step Mobile SMS OTP verification for W-2 compliance & legal enforceability.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] text-[#23ace3] hover:bg-[#23ace3]/20 cursor-pointer"
                onClick={async () => {
                  storage.resetDocumentRequests()
                  await loadDocs()
                }}
              >
                <RotateCcw className="h-3 w-3 mr-1" /> Reset Demo Requests
              </Button>
              <Badge variant="outline" className="text-[10px] font-mono border-[#23ace3]/30 text-[#23ace3]">
                NIST 2FA Standard
              </Badge>
            </div>
          </div>

          {docRequests.length === 0 ? (
            <Card className="border border-dashed border-border/80 p-12 text-center bg-card/40 rounded-2xl">
              <FileText className="h-10 w-10 text-[#23ace3] mx-auto mb-3" />
              <h4 className="text-base font-bold text-foreground">No pending HR document signature requests</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto mb-4">
                All employee HR document applications have been verified and signed.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-[#23ace3]/40 text-[#23ace3] hover:bg-[#23ace3]/10 cursor-pointer"
                onClick={async () => {
                  storage.resetDocumentRequests()
                  await loadDocs()
                }}
              >
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                Generate Demo Signature Request (DOC-2026-9041)
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {docRequests.map(doc => (
                <DocumentCardView key={doc.id} doc={doc} isManagerView={true} onUpdate={() => loadDocs()} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Human Appeals & Complaints Desk */}
        <TabsContent value="appeals" className="space-y-4">
          {appealedRequests.length === 0 ? (
            <Card className="border border-dashed border-border/80 p-12 text-center bg-card/40 rounded-2xl">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-base font-bold text-foreground">No active employee complaints or appeals</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                All employee disputes have been reviewed and resolved by Human Management.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {appealedRequests.map(req => (
                <Card key={req.id} className="border-2 border-amber-500/40 bg-card p-5 space-y-4 rounded-2xl shadow-md">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 font-bold text-amber-400 border border-amber-500/40">
                        {req.employeeName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-foreground">{req.employeeName}</h4>
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                            🚨 Direct Human Manager Appeal
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {req.department} • Requested Date: <strong>{req.startDate}</strong> ({req.requestedDays} day)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 text-xs text-foreground">
                    <span className="font-bold text-amber-300 block">
                      💬 Employee Complaint Note (Bypassed AI):
                    </span>
                    <p className="italic text-foreground/90">"{req.complaintNote || req.reason}"</p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleHumanOverride(req.id, false)}
                      className="text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10 cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Sustain Rejection
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleHumanOverride(req.id, true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Human Manager Override & Approve
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 4: Historical Archive */}
        <TabsContent value="history" className="space-y-4">
          <LeaveHistoryTable requests={processedRequests} showEmployeeName={true} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
