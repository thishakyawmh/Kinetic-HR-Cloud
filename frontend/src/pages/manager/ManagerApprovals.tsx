import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { documentService } from '@/services/documentService'
import { storage } from '@/services/storage'
import { HRDocumentRequest } from '@/types'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, FileText } from 'lucide-react'
import { DocumentCardView } from '@/components/documents/DocumentCardView'

export const ManagerApprovals: React.FC = () => {
  const { tenant } = useAuth()
  const [docRequests, setDocRequests] = useState<HRDocumentRequest[]>([])

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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <PageHeader
        title="Manager Approval Center"
        subtitle="HR Document 2FA Signing & Executive Verification Desk."
      />

      {/* HR Document Signings Section */}
      <div className="space-y-4">
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
      </div>
    </div>
  )
}
