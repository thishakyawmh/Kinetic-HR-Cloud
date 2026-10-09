import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { policyService } from '@/services/policyService'
import { PageHeader } from '@/components/common/PageHeader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  FileText,
  UploadCloud,
  Sparkles,
  Layers,
  Database,
  CheckCircle2,
  Trash2,
  Eye,
} from 'lucide-react'

export const AdminPolicies: React.FC = () => {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [docTitle, setDocTitle] = useState('')
  const [docCategory, setDocCategory] = useState<any>('Leave & Attendance')
  const [docSummary, setDocSummary] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const { data: policies = [], refetch } = useQuery({
    queryKey: ['adminPolicies', tenant?.id],
    queryFn: () => (tenant?.id ? policyService.getPolicies(tenant.id) : []),
    enabled: !!tenant?.id,
  })

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!tenant) throw new Error('No tenant')
      return policyService.uploadPolicy({
        tenantId: tenant.id,
        title: docTitle,
        category: docCategory,
        version: '1.0',
        fileSize: '340 KB',
        summary: docSummary || 'Standard corporate operational policy document.',
        keyTerms: ['Compliance', 'HRMS', 'Policy', 'Enterprise'],
        contentExcerpt: 'Authorized enterprise policy guidelines for tenant operations.',
      })
    },
    onSuccess: () => {
      refetch()
      setIsUploadModalOpen(false)
      setDocTitle('')
      setDocSummary('')
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Policy Documents"
        subtitle="Manage official organizational handbooks, compliance guidelines, and workplace policies."
      >
        <Button
          variant="default"
          size="sm"
          onClick={() => setIsUploadModalOpen(true)}
          className="gap-1.5 text-xs bg-[#23ace3] hover:bg-[#1b97ca] text-white rounded-xl"
        >
          <UploadCloud className="h-3.5 w-3.5" />
          <span>Upload Policy</span>
        </Button>
      </PageHeader>

      {/* Drag & Drop Upload Zone (Section 26) */}
      <div
        onDragOver={e => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setIsDragging(false)
          setIsUploadModalOpen(true)
        }}
        onClick={() => setIsUploadModalOpen(true)}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-[#23ace3] bg-[#23ace3]/15' : 'border-border/80 hover:border-[#23ace3]/50 bg-card'
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-[#23ace3] mx-auto mb-2">
          <UploadCloud className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-bold text-foreground">
          Drag and drop PDF policy documents to index
        </h4>
        <p className="text-xs text-muted-foreground mt-0.5 max-w-sm mx-auto">
          Supports .pdf, .docx, .txt up to 25MB per document. Automatic semantic chunking enabled.
        </p>
      </div>

      {/* Policies Inventory Table (Section 26) */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/50">
              <TableHead>Document Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Uploaded Date</TableHead>
              <TableHead>AI Index Status</TableHead>
              <TableHead>File Size</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {policies.map(p => (
              <TableRow key={p.id} className="border-border/40 hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-[#23ace3] shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-foreground">{p.title}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">{p.summary}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10px]">
                    {p.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-mono font-medium text-muted-foreground">
                  v{p.version}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{p.uploadedDate}</TableCell>
                <TableCell>
                  <StatusBadge status={p.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">{p.fileSize}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-[#23ace3] hover:bg-[#23ace3]/15 rounded-lg"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Inspect Chunks
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogHeader>
          <DialogTitle>Index New Policy Document</DialogTitle>
          <DialogDescription>
            Document will be processed and indexed into Azure AI Search for {tenant?.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div>
            <label className="font-semibold block mb-1">Document Title *</label>
            <Input
              value={docTitle}
              onChange={e => setDocTitle(e.target.value)}
              placeholder="E.g., Travel & Expense Policy 2026.pdf"
            />
          </div>
          <div>
            <label className="font-semibold block mb-1">Category *</label>
            <Select value={docCategory} onChange={e => setDocCategory(e.target.value)}>
              <option value="Leave & Attendance">Leave & Attendance</option>
              <option value="Compensation & Benefits">Compensation & Benefits</option>
              <option value="Workplace & Remote">Workplace & Remote</option>
              <option value="Conduct & Compliance">Conduct & Compliance</option>
            </Select>
          </div>
          <div>
            <label className="font-semibold block mb-1">Executive Summary</label>
            <Textarea
              value={docSummary}
              onChange={e => setDocSummary(e.target.value)}
              placeholder="Brief summary of policy coverage and employee obligations..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setIsUploadModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => uploadMutation.mutate()}
            disabled={!docTitle || uploadMutation.isPending}
            className="bg-sky-600 text-white"
          >
            {uploadMutation.isPending ? 'Uploading to Azure...' : 'Ingest & Index'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
