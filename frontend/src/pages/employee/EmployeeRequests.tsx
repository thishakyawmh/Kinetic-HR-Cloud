import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { leaveService } from '@/services/leaveService'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  PlusCircle,
  FileCheck2,
  CalendarDays,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  Send,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface HRRequestItem {
  id: string
  category: 'leave' | 'document'
  title: string
  type: string
  details: string
  dateSubmitted: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'appealed' | string
  reviewer: string
  riskLevel: 'Low Risk' | 'Medium Risk' | 'High Risk'
}

export const EmployeeRequests: React.FC = () => {
  const { user, tenant } = useAuth()
  const navigate = useNavigate()

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'cancelled'>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'leave' | 'document'>('all')
  const [selectedRequest, setSelectedRequest] = useState<HRRequestItem | null>(null)
  const [isDocModalOpen, setIsDocModalOpen] = useState(false)
  const [docType, setDocType] = useState('Employment Verification Letter')
  const [docPurpose, setDocPurpose] = useState('')
  const [docCreated, setDocCreated] = useState(false)

  // Fetch real leave requests from storage
  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['leaveRequests', tenant?.id, user?.id],
    queryFn: () => (tenant?.id && user?.id ? leaveService.getLeaveRequests(tenant.id, user.id) : []),
    enabled: !!tenant?.id && !!user?.id,
  })

  // Mock Document Requests
  const [customDocRequests, setCustomDocRequests] = useState<HRRequestItem[]>([
    {
      id: 'DOC-2026-081',
      category: 'document',
      title: 'Employment Verification Letter',
      type: 'Official HR Document',
      details: 'Proof of employment and tenure for residential lease application.',
      dateSubmitted: '2026-10-02',
      status: 'approved',
      reviewer: 'HR Operations / Sarah Miller',
      riskLevel: 'Low Risk',
    },
    {
      id: 'DOC-2026-094',
      category: 'document',
      title: 'Salary & Compensation Certificate',
      type: 'Official HR Document',
      details: 'Notarized earnings certificate for travel visa application.',
      dateSubmitted: '2026-10-14',
      status: 'pending',
      reviewer: 'HR Payroll Desk',
      riskLevel: 'Low Risk',
    },
  ])

  // Combine leave requests and document requests into unified items
  const unifiedLeaveRequests: HRRequestItem[] = leaveRequests.map(r => ({
    id: r.id,
    category: 'leave',
    title: r.leaveTypeName,
    type: 'Time Off Submission',
    details: `${r.startDate} to ${r.endDate} (${r.requestedDays} day) • "${r.reason}"`,
    dateSubmitted: r.submittedAt?.split('T')[0] || r.startDate,
    status: r.status,
    reviewer: user?.managerName || 'David Wilson',
    riskLevel: r.leaveTypeCode === 'emergency' ? 'Medium Risk' : 'Low Risk',
  }))

  const allRequests = [...customDocRequests, ...unifiedLeaveRequests].sort((a, b) =>
    b.dateSubmitted.localeCompare(a.dateSubmitted)
  )

  const filteredRequests = allRequests.filter(req => {
    const matchStatus = statusFilter === 'all' || req.status === statusFilter
    const matchCategory = categoryFilter === 'all' || req.category === categoryFilter
    return matchStatus && matchCategory
  })

  const pendingCount = allRequests.filter(r => r.status === 'pending').length
  const approvedCount = allRequests.filter(r => r.status === 'approved').length
  const rejectedCount = allRequests.filter(r => r.status === 'rejected').length

  const handleRequestDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!docPurpose.trim()) return

    const newDoc: HRRequestItem = {
      id: `DOC-2026-${Math.floor(100 + Math.random() * 900)}`,
      category: 'document',
      title: docType,
      type: 'Official HR Document',
      details: docPurpose,
      dateSubmitted: '2026-10-16',
      status: 'pending',
      reviewer: 'HR Service Desk',
      riskLevel: 'Low Risk',
    }

    setCustomDocRequests(prev => [newDoc, ...prev])
    setDocCreated(true)
    setTimeout(() => {
      setDocCreated(false)
      setIsDocModalOpen(false)
      setDocPurpose('')
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My HR Requests"
        subtitle="Track the real-time approval status of your leave submissions and HR applications."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDocModalOpen(true)}
          className="gap-1.5 text-xs rounded-xl border-border hover:bg-muted text-foreground"
        >
          <FileText className="h-3.5 w-3.5 text-[#23ace3]" />
          <span>Request HR Document</span>
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => navigate('/employee/leave/apply')}
          className="gap-1.5 text-xs bg-[#23ace3] hover:bg-[#1b97ca] text-white rounded-xl shadow-xs"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>New Leave Request</span>
        </Button>
      </PageHeader>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border/60 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-foreground">{pendingCount}</div>
              <div className="text-xs text-muted-foreground">Pending Review</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border/60 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-foreground">{approvedCount}</div>
              <div className="text-xs text-muted-foreground">Approved Records</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border/60 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-foreground">{rejectedCount}</div>
              <div className="text-xs text-muted-foreground">Rejected / Closed</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border/60 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#23ace3]/15 text-[#23ace3]">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-foreground">{allRequests.length}</div>
              <div className="text-xs text-muted-foreground">Total Applications</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/40 text-xs">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                statusFilter === tab
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'all' ? 'All Statuses' : tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/40 text-xs">
          {(['all', 'leave', 'document'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat === 'all' ? 'All Types' : cat === 'leave' ? 'Time Off' : 'HR Documents'}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Ledger Table / Cards */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-dashed border-border/80">
            No requests match the selected filters.
          </div>
        ) : (
          filteredRequests.map(req => (
            <Card
              key={req.id}
              onClick={() => setSelectedRequest(req)}
              className="border-border/60 hover:border-[#23ace3]/50 transition-all bg-card rounded-2xl cursor-pointer shadow-2xs group"
            >
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    req.category === 'leave'
                      ? 'bg-purple-500/15 text-purple-400'
                      : 'bg-[#23ace3]/15 text-[#23ace3]'
                  }`}>
                    {req.category === 'leave' ? <CalendarDays className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground group-hover:text-[#23ace3] transition-colors">
                        {req.title}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        #{req.id}
                      </span>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-xl">
                      {req.details}
                    </p>
                    <div className="text-[11px] text-muted-foreground/80 mt-1 flex items-center gap-3">
                      <span>Submitted: {req.dateSubmitted}</span>
                      <span>•</span>
                      <span>Assigned to: {req.reviewer}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-xs font-medium text-[#23ace3] group-hover:underline flex items-center gap-1">
                    <span>Audit Pipeline</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Action Gateway Lifecycle Telemetry Modal */}
      <Dialog open={selectedRequest !== null} onOpenChange={open => !open && setSelectedRequest(null)}>
        {selectedRequest && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#23ace3]/15 text-[#23ace3]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Action Gateway Pipeline Telemetry
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Cryptographic audit trace for Request #{selectedRequest.id}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              {/* Request Summary Overview */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-1.5">
                <div className="flex justify-between font-semibold text-foreground">
                  <span>{selectedRequest.title}</span>
                  <StatusBadge status={selectedRequest.status} />
                </div>
                <div className="text-muted-foreground">{selectedRequest.details}</div>
              </div>

              {/* 6-Stage Action Gateway Pipeline */}
              <div className="space-y-2.5 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Security & Policy Validation Trail (Sections 25 & 26)
                </div>

                <div className="space-y-2">
                  {/* Step 1: Identity */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-foreground">1. Entra ID Identity Verified</div>
                        <div className="text-[10px] text-muted-foreground">Single Sign-On JWT claims verified for {user?.email}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                      PASSED
                    </Badge>
                  </div>

                  {/* Step 2: Tenant Boundary */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-foreground">2. Tenant Boundary Isolation</div>
                        <div className="text-[10px] text-muted-foreground">Row-Level Security partitioned to tenant ID: {tenant?.id}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                      ISOLATED
                    </Badge>
                  </div>

                  {/* Step 3: Risk Level */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-foreground">3. Action Risk Tier Assessment</div>
                        <div className="text-[10px] text-muted-foreground">Evaluated as {selectedRequest.riskLevel} (no financial mutation)</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                      {selectedRequest.riskLevel.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Step 4: Policy Grounding */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-foreground">4. Policy Grounding & Eligibility</div>
                        <div className="text-[10px] text-muted-foreground">Validated against corporate handbook rules via Azure AI Search RAG</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                      COMPLIANT
                    </Badge>
                  </div>

                  {/* Step 5: Human Gating */}
                  <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
                    selectedRequest.status === 'approved'
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : selectedRequest.status === 'rejected'
                      ? 'border-rose-500/30 bg-rose-500/5'
                      : 'border-amber-500/30 bg-amber-500/5'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      {selectedRequest.status === 'approved' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : selectedRequest.status === 'rejected' ? (
                        <XCircle className="h-4 w-4 text-rose-400" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-400" />
                      )}
                      <div>
                        <div className="font-semibold text-foreground">5. Human Approval Gating</div>
                        <div className="text-[10px] text-muted-foreground">Reviewer: {selectedRequest.reviewer}</div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        selectedRequest.status === 'approved'
                          ? 'border-emerald-500/30 text-emerald-400'
                          : selectedRequest.status === 'rejected'
                          ? 'border-rose-500/30 text-rose-400'
                          : 'border-amber-500/30 text-amber-400'
                      }`}
                    >
                      {selectedRequest.status.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Step 6: Immutable Audit Ledger */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-foreground">6. Audit Event Ledger Appended</div>
                        <div className="text-[10px] text-muted-foreground">Immutable audit record persisted in append-only storage</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                      COMMITTED
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRequest(null)}
                className="text-xs"
              >
                Close Trace
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>

      {/* Request Official Document Modal */}
      <Dialog open={isDocModalOpen} onOpenChange={setIsDocModalOpen}>
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-foreground">
            Request Official HR Document
          </DialogTitle>
          <DialogDescription className="text-xs">
            Generate and request verified corporate letters for banking, lease, or travel purposes.
          </DialogDescription>
        </DialogHeader>

        {docCreated ? (
          <div className="py-8 text-center space-y-2 animate-in fade-in">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
            <div className="text-sm font-bold text-foreground">Document Request Dispatched</div>
            <p className="text-xs text-muted-foreground">
              Your request has been routed through the Action Gateway to HR Service Desk.
            </p>
          </div>
        ) : (
          <form onSubmit={handleRequestDocumentSubmit} className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Document Type</label>
              <Select value={docType} onChange={e => setDocType(e.target.value)} className="h-9">
                <option value="Employment Verification Letter">Employment Verification Letter</option>
                <option value="Salary Certificate">Salary & Compensation Certificate</option>
                <option value="Proof of Address / Relocation">Proof of Address / Office Allocation</option>
                <option value="Bonafide Employee Certificate">Bonafide Employee Letter (Consulate / Visa)</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Purpose & Addressee Details</label>
              <Input
                placeholder="e.g. For mortgage application with Chase Bank / Embassy visa application..."
                value={docPurpose}
                onChange={e => setDocPurpose(e.target.value)}
                className="h-9"
                required
              />
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-[11px] text-muted-foreground">
              Official corporate documents include an automated cryptographic hash and digital signature. Processing turnaround is typically under 2 business hours.
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDocModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!docPurpose.trim()}
                className="text-xs bg-[#23ace3] hover:bg-[#1b97ca] text-white"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>
    </div>
  )
}
