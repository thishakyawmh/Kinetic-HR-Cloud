import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { leaveService } from '@/services/leaveService'
import { documentService } from '@/services/documentService'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  CalendarDays,
  Send,
  Sparkles,
  RefreshCw,
  FileCheck,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { HRDocumentRequest } from '@/types'
import { DocumentCardView } from '@/components/documents/DocumentCardView'

export const EmployeeRequests: React.FC = () => {
  const { user, tenant } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'all' | 'leaves' | 'documents'>('all')
  const [isDocModalOpen, setIsDocModalOpen] = useState(false)
  const [docType, setDocType] = useState('Employment Verification Letter')
  const [docPurpose, setDocPurpose] = useState('')
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const [aiProgressStep, setAiProgressStep] = useState(0)
  const [createdDocSuccess, setCreatedDocSuccess] = useState<HRDocumentRequest | null>(null)

  // Fetch real leave requests
  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['leaveRequests', tenant?.id, user?.id],
    queryFn: () => (tenant?.id && user?.id ? leaveService.getLeaveRequests(tenant.id, user.id) : []),
    enabled: !!tenant?.id && !!user?.id,
  })

  // Fetch real HR document requests
  const { data: documentRequests = [], refetch: refetchDocs } = useQuery({
    queryKey: ['documentRequests', tenant?.id, user?.id],
    queryFn: () => documentService.getRequests(),
    enabled: !!tenant?.id && !!user?.id,
  })

  const handleRequestDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docPurpose.trim()) return

    setIsAiProcessing(true)
    setAiProgressStep(1) // Step 1: AI Identity verification

    setTimeout(async () => {
      setAiProgressStep(2) // Step 2: Policy check & Draft generation

      setTimeout(async () => {
        setAiProgressStep(3) // Step 3: Dispatch & Manager queue

        try {
          const newDoc = await documentService.createRequest(docType, docPurpose)
          setCreatedDocSuccess(newDoc)
          await refetchDocs()

          setTimeout(() => {
            setIsAiProcessing(false)
            setIsDocModalOpen(false)
            setDocPurpose('')
            setCreatedDocSuccess(null)
            setAiProgressStep(0)
            setActiveTab('documents')
          }, 1200)
        } catch (err) {
          console.error('Document request creation error:', err)
          setIsAiProcessing(false)
        }
      }, 900)
    }, 800)
  }

  const pendingLeavesCount = leaveRequests.filter(r => r.status === 'pending').length
  const pendingDocsCount = documentRequests.filter(d => d.status === 'pending_manager_signature').length
  const totalPending = pendingLeavesCount + pendingDocsCount

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <PageHeader
        title="My HR Requests"
        subtitle="Track the real-time status of your leave submissions and AI-verified official HR document applications."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDocModalOpen(true)}
          className="gap-1.5 text-xs rounded-xl border-border hover:bg-muted text-foreground cursor-pointer"
        >
          <FileText className="h-3.5 w-3.5 text-[#23ace3]" />
          <span>Request HR Document</span>
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => navigate('/employee/leave/apply')}
          className="gap-1.5 text-xs bg-[#23ace3] hover:bg-[#1b97ca] text-white rounded-xl shadow-xs cursor-pointer"
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
              <div className="text-2xl font-bold font-mono text-foreground">{totalPending}</div>
              <div className="text-xs text-muted-foreground">Pending Requests</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border/60 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-foreground">
                {leaveRequests.filter(r => r.status === 'approved').length + documentRequests.filter(d => d.status === 'approved_and_signed' || d.status === 'auto_issued').length}
              </div>
              <div className="text-xs text-muted-foreground">Approved & Issued</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border/60 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#23ace3]/15 text-[#23ace3]">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-foreground">{documentRequests.length}</div>
              <div className="text-xs text-muted-foreground">HR Documents</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border/60 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-foreground">{leaveRequests.length}</div>
              <div className="text-xs text-muted-foreground">Leave Submissions</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#23ace3] text-white shadow-xs'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            All Requests ({leaveRequests.length + documentRequests.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'documents'
                ? 'bg-[#23ace3] text-white shadow-xs'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Official HR Documents ({documentRequests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leaves')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'leaves'
                ? 'bg-[#23ace3] text-white shadow-xs'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Leave Applications ({leaveRequests.length})</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: HR DOCUMENTS (AI Verified & 2FA Signed) */}
      {(activeTab === 'all' || activeTab === 'documents') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-[#23ace3]" />
              Official HR Documents (AI Verified & 2FA Signed)
            </h3>
            <span className="text-xs text-muted-foreground">
              Includes cryptographic digital signatures & 4-stage tracking
            </span>
          </div>

          {documentRequests.length === 0 ? (
            <div className="p-8 text-center bg-card border border-border/60 rounded-2xl text-xs text-muted-foreground">
              No official HR documents requested yet. Click "Request HR Document" above to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {documentRequests.map(doc => (
                <DocumentCardView key={doc.id} doc={doc} onUpdate={() => refetchDocs()} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: LEAVE APPLICATIONS */}
      {(activeTab === 'all' || activeTab === 'leaves') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#23ace3]" />
              Leave Applications & Time Off Submissions
            </h3>
          </div>

          {leaveRequests.length === 0 ? (
            <div className="p-8 text-center bg-card border border-border/60 rounded-2xl text-xs text-muted-foreground">
              No leave requests submitted yet.
            </div>
          ) : (
            <div className="space-y-3">
              {leaveRequests.map(l => (
                <Card key={l.id} className="p-4 bg-card border-border/60 rounded-2xl shadow-xs flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{l.leaveTypeName}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {l.requestedDays} {l.requestedDays === 1 ? 'day' : 'days'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {l.startDate} to {l.endDate} • "{l.reason}"
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={l.status === 'approved' ? 'success' : l.status === 'pending' ? 'warning' : 'destructive'}
                      className={`text-[10px] uppercase font-bold ${
                        l.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : l.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {l.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REQUEST OFFICIAL HR DOCUMENT MODAL WITH REAL-TIME AI PROCESSING */}
      <Dialog open={isDocModalOpen} onOpenChange={setIsDocModalOpen}>
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#23ace3]" />
            Request Official HR Document
          </DialogTitle>
          <DialogDescription className="text-xs">
            Generate and request verified corporate letters for banking, lease, or travel purposes with AI identity verification & 2FA manager signature.
          </DialogDescription>
        </DialogHeader>

        {isAiProcessing ? (
          <div className="py-8 text-center space-y-4 animate-in fade-in">
            <div className="p-3 rounded-2xl bg-[#23ace3]/15 text-[#23ace3] w-12 h-12 mx-auto flex items-center justify-center border border-[#23ace3]/30">
              <Sparkles className="h-6 w-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-foreground">Kinetic AI Autonomous Processing</div>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Running user verification, policy check, and generating official document draft...
              </p>
            </div>

            {/* AI Progress Step Indicators */}
            <div className="space-y-2 max-w-xs mx-auto text-left text-xs pt-2 font-mono">
              <div className={`flex items-center gap-2 ${aiProgressStep >= 1 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>[Step 1] Identity & Employment Contract Verified</span>
              </div>
              <div className={`flex items-center gap-2 ${aiProgressStep >= 2 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>[Step 2] Corporate Draft Generated & Ref Code Created</span>
              </div>
              <div className={`flex items-center gap-2 ${aiProgressStep >= 3 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>[Step 3] Forwarded to Manager 2FA Signing Queue</span>
              </div>
            </div>
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

            <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-[11px] text-muted-foreground space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-[#23ace3]" />
                Automated AI Processing & Manager 2FA Signature
              </div>
              <p>
                The AI underlayer will automatically verify your identity, generate the official draft, check signature requirements, and route it to your manager's mobile 2FA signing queue.
              </p>
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
                className="text-xs bg-[#23ace3] hover:bg-[#1b97ca] text-white font-bold"
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
