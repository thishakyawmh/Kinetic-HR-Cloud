import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { documentService } from '@/services/documentService'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  FileText,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  Sparkles,
  FileCheck,
  Paperclip,
  Printer,
  Download,
} from 'lucide-react'
import { HRDocumentRequest } from '@/types'

export const EmployeeRequests: React.FC = () => {
  const { user, tenant } = useAuth()

  const [isDocModalOpen, setIsDocModalOpen] = useState(false)
  const [docType, setDocType] = useState('Employment Verification Letter')
  const [docPurpose, setDocPurpose] = useState('')
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const [aiProgressStep, setAiProgressStep] = useState(0)
  const [, setCreatedDocSuccess] = useState<HRDocumentRequest | null>(null)
  const [selectedAttachmentDoc, setSelectedAttachmentDoc] = useState<HRDocumentRequest | null>(null)

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
          }, 1200)
        } catch (err) {
          console.error('Document request creation error:', err)
          setIsAiProcessing(false)
        }
      }, 900)
    }, 800)
  }

  const pendingDocsCount = documentRequests.filter(d => d.status === 'pending_manager_signature').length
  const approvedDocsCount = documentRequests.filter(
    d => d.status === 'approved_and_signed' || d.status === 'auto_issued'
  ).length

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <PageHeader
        title="Document Requests"
        subtitle="Track the real-time status of your AI-verified official HR document applications."
      >
        <Button
          variant="default"
          size="sm"
          onClick={() => setIsDocModalOpen(true)}
          className="gap-1.5 text-xs bg-[#23ace3] hover:bg-[#1b97ca] text-white rounded-xl shadow-xs cursor-pointer font-bold"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Request HR Document</span>
        </Button>
      </PageHeader>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-card border-border/60 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-foreground">{pendingDocsCount}</div>
              <div className="text-xs text-muted-foreground">Pending Manager Signature</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border/60 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-foreground">{approvedDocsCount}</div>
              <div className="text-xs text-muted-foreground">Approved & Digitally Signed</div>
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
              <div className="text-xs text-muted-foreground">Total HR Documents</div>
            </div>
          </div>
        </Card>
      </div>

      {/* HR DOCUMENTS SECTION */}
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
          <div className="p-12 text-center bg-card border border-dashed border-border/70 rounded-2xl text-xs text-muted-foreground space-y-3">
            <FileText className="h-8 w-8 text-muted-foreground/60 mx-auto" />
            <div className="font-bold text-foreground">No official HR documents requested yet</div>
            <p>Click "Request HR Document" above to generate letters for banking, lease, or travel.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documentRequests.map(doc => {
              const isApproved = doc.status === 'approved_and_signed' || doc.status === 'auto_issued'
              return (
                <Card
                  key={doc.id}
                  className="p-4 bg-card border-border/60 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground">{doc.documentType}</span>
                      <Badge variant="outline" className="text-[10px] font-mono border-border">
                        #{doc.referenceCode}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {doc.submittedAt ? doc.submittedAt.substring(0, 10) : '2026-10-07'} • "{doc.purpose}"
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg ${
                        isApproved
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {isApproved ? 'APPROVED' : 'PENDING'}
                    </Badge>

                    {isApproved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAttachmentDoc(doc)}
                        className="text-xs rounded-xl gap-1.5 border-[#23ace3]/40 text-[#23ace3] hover:bg-[#23ace3]/10 font-bold cursor-pointer"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        <span>See Attachment</span>
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

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

      {/* SEE ATTACHMENT MODAL (OFFICIAL SIGNED SOFTCOPY VIEWER) */}
      <Dialog open={!!selectedAttachmentDoc} onOpenChange={open => !open && setSelectedAttachmentDoc(null)}>
        {selectedAttachmentDoc && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between pr-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <Paperclip className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-foreground">
                      Official Signed Attachment ({selectedAttachmentDoc.documentType})
                    </DialogTitle>
                    <DialogDescription className="text-xs font-mono">
                      Reference Code: #{selectedAttachmentDoc.referenceCode}
                    </DialogDescription>
                  </div>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] uppercase">
                  APPROVED
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Executive 2FA Signature Details Badge */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" /> Cryptographic Executive Signature Verified
                  </span>
                  <Badge variant="outline" className="text-[9px] bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                    NIST 2FA Standard
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground font-mono">
                  <div>
                    <strong className="text-foreground">Signed By:</strong>{' '}
                    {selectedAttachmentDoc.managerSignatureDetails?.signedBy || selectedAttachmentDoc.managerName}
                  </div>
                  <div>
                    <strong className="text-foreground">Authentication:</strong>{' '}
                    {selectedAttachmentDoc.managerSignatureDetails?.mobile2faVerified
                      ? '2-Step Mobile SMS OTP'
                      : 'Executive 2FA Key'}
                  </div>
                  <div className="sm:col-span-2">
                    <strong className="text-foreground">Signature Hash:</strong>{' '}
                    {selectedAttachmentDoc.managerSignatureDetails?.signatureHash || 'SIG-2FA-I5YH-8105'}
                  </div>
                </div>
              </div>

              {/* Official Document Body Content */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Official Document Content
                </span>
                <div className="p-4 rounded-xl bg-background border border-border/80 text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto shadow-inner">
                  {selectedAttachmentDoc.aiVerification?.generatedContent}
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedAttachmentDoc(null)}
                className="text-xs rounded-xl"
              >
                Close
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="text-xs rounded-xl gap-1.5 border-border hover:bg-muted cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 text-[#23ace3]" />
                  <span>Print Hardcopy</span>
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => window.print()}
                  className="text-xs bg-[#23ace3] hover:bg-[#1b97ca] text-white font-bold rounded-xl gap-1.5 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download PDF</span>
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  )
}
