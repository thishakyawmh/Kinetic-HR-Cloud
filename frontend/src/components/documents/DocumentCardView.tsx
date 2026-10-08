import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  ShieldCheck,
  Download,
  Printer,
  Send,
  Sparkles,
  CheckCircle2,
  Lock,
  UserCheck,
  Calendar,
} from 'lucide-react'
import { HRDocumentRequest } from '@/types'
import { DocumentStageStepper } from './DocumentStageStepper'
import { Manager2faSigningModal } from './Manager2faSigningModal'
import { documentService } from '@/services/documentService'
import { storage } from '@/services/storage'

interface DocumentCardViewProps {
  doc: HRDocumentRequest
  isManagerView?: boolean
  onUpdate?: (updatedDoc: HRDocumentRequest) => void
}

export const DocumentCardView: React.FC<DocumentCardViewProps> = ({ doc, isManagerView = false, onUpdate }) => {
  const [is2faModalOpen, setIs2faModalOpen] = useState<boolean>(false)
  const [softcopySentMsg, setSoftcopySentMsg] = useState<string | null>(null)
  const [currentDoc, setCurrentDoc] = useState<HRDocumentRequest>(doc)

  const handleSendSoftcopy = async () => {
    try {
      await documentService.sendSoftcopy(currentDoc.id)
      storage.addNotification({
        id: `notif-doc-${Date.now()}`,
        tenantId: currentDoc.tenantId,
        userId: currentDoc.employeeId,
        title: `HR Document Issued: ${currentDoc.documentType}`,
        message: `${currentDoc.managerName} has digitally signed your ${currentDoc.documentType} (#${currentDoc.referenceCode}) via Executive 2FA. Softcopy dispatched to email & mobile SMS.`,
        type: 'policy',
        isRead: false,
        createdAt: new Date().toISOString(),
      })
      setSoftcopySentMsg(`📱 Softcopy dispatched to ${currentDoc.employeeName}'s email & real-time SMS alert sent (+1 555-234-5678)!`)
      setTimeout(() => setSoftcopySentMsg(null), 6000)
    } catch (e) {
      console.error('Softcopy failed', e)
    }
  }

  const handleDownloadPDF = () => {
    window.print()
  }

  const isSigned = currentDoc.status === 'approved_and_signed' || currentDoc.status === 'auto_issued'
  const isPendingSignature = currentDoc.status === 'pending_manager_signature'

  return (
    <Card className="border border-border/60 shadow-xs bg-card rounded-2xl overflow-hidden space-y-4 p-5">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-foreground">{currentDoc.documentType}</h4>
              <Badge variant="outline" className="text-[10px] font-mono border-border">
                #{currentDoc.referenceCode}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Requested by {currentDoc.employeeName} ({currentDoc.employeeNumber}) • {currentDoc.department}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={isSigned ? 'success' : isPendingSignature ? 'warning' : 'outline'}
            className={`text-[10px] uppercase font-bold ${
              isSigned
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {currentDoc.status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>

      {/* 4-Stage Stepper Bar */}
      <DocumentStageStepper status={currentDoc.status} requiresManagerSignature={currentDoc.requiresManagerSignature} />

      {/* AI Verification & Notes Summary */}
      <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 text-xs space-y-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <Sparkles className="h-3.5 w-3.5 text-[#23ace3]" />
          <span>AI Identity & Contract Verification</span>
        </div>
        <p className="text-muted-foreground text-[11px]">
          {currentDoc.aiVerification?.verificationNotes || 'AI Agent verified employee contract details.'}
        </p>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t border-border/40">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <CheckCircle2 className="h-3 w-3" /> Identity Verified
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <CheckCircle2 className="h-3 w-3" /> Corporate Policy Compliant
          </span>
        </div>
      </div>

      {/* Generated Document Text Preview Box */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
          Official Generated Document Preview
        </span>
        <div className="p-4 rounded-xl bg-background border border-border/60 text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto shadow-inner">
          {currentDoc.aiVerification?.generatedContent || 'Generated document content preview...'}
        </div>
      </div>

      {/* Manager Cryptographic Digital Signature Badge (If Signed) */}
      {isSigned && currentDoc.managerSignatureDetails && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              Cryptographic Digital Executive Signature Applied
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
              Mobile 2FA Verified
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1 font-mono">
            <div>
              <strong className="text-foreground">Signed By:</strong> {currentDoc.managerSignatureDetails.signedBy}
            </div>
            <div>
              <strong className="text-foreground">2FA Mobile:</strong> {currentDoc.managerSignatureDetails.phoneNumberMasked}
            </div>
            <div className="sm:col-span-2">
              <strong className="text-foreground">Signature Hash:</strong> {currentDoc.managerSignatureDetails.signatureHash}
            </div>
          </div>
        </div>
      )}

      {/* Softcopy Notification Alert */}
      {softcopySentMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-400 font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{softcopySentMsg}</span>
        </div>
      )}

      {/* Footer Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/50">
        <span className="text-[11px] text-muted-foreground">
          Purpose: {currentDoc.purpose}
        </span>

        <div className="flex items-center gap-2">
          {/* Manager Action: 2FA Sign */}
          {isManagerView && isPendingSignature && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setIs2faModalOpen(true)}
              className="text-xs bg-[#23ace3] hover:bg-[#1b97ca] text-white font-bold rounded-xl gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Review & Sign via 2FA</span>
            </Button>
          )}

          {/* Download / Print / Softcopy Actions */}
          {isSigned && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                className="text-xs rounded-xl gap-1.5 border-border hover:bg-muted cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download PDF</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs rounded-xl gap-1.5 border-border hover:bg-muted cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendSoftcopy}
                className="text-xs rounded-xl gap-1.5 border-border hover:bg-muted text-[#23ace3] cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Softcopy</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 2FA Signing Modal */}
      <Manager2faSigningModal
        isOpen={is2faModalOpen}
        onClose={() => setIs2faModalOpen(false)}
        docRequest={currentDoc}
        onSuccess={updated => {
          setCurrentDoc(updated)
          setIs2faModalOpen(false)
          if (onUpdate) onUpdate(updated)
        }}
      />
    </Card>
  )
}
