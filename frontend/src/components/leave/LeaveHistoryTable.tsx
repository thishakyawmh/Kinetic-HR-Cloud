import React, { useState } from 'react'
import { LeaveRequest } from '@/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Eye, Trash2, AlertCircle, ShieldAlert, Send } from 'lucide-react'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { leaveService } from '@/services/leaveService'

interface LeaveHistoryTableProps {
  requests: LeaveRequest[]
  onCancelRequest?: (id: string) => void
  onDeleteRequest?: (id: string) => void
  showEmployeeName?: boolean
  onRefresh?: () => void
}

export const LeaveHistoryTable: React.FC<LeaveHistoryTableProps> = ({
  requests,
  onCancelRequest,
  onDeleteRequest,
  showEmployeeName = false,
  onRefresh,
}) => {
  const handleDelete = onDeleteRequest || onCancelRequest
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [complaintModalReq, setComplaintModalReq] = useState<LeaveRequest | null>(null)
  const [complaintText, setComplaintText] = useState('')
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false)

  const displayRequests = React.useMemo(() => {
    const active = requests.filter(r => r.status !== 'cancelled')
    const map = new Map<string, LeaveRequest>()
    active.forEach(r => {
      const key = `${r.startDate}_${r.endDate}_${r.leaveTypeCode || r.leaveTypeName}`
      if (!map.has(key)) {
        map.set(key, r)
      }
    })
    return Array.from(map.values())
  }, [requests])

  const handleSubmitComplaint = async () => {
    if (!complaintModalReq || !complaintText.trim()) return
    setIsSubmittingComplaint(true)
    try {
      await leaveService.submitComplaint(complaintModalReq.id, complaintText)
      setComplaintModalReq(null)
      setComplaintText('')
      if (onRefresh) onRefresh()
    } finally {
      setIsSubmittingComplaint(false)
    }
  }

  if (displayRequests.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-dashed border-border/80">
        No leave records found in this category.
      </div>
    )
  }

  return (
    <>
      <div className="rounded-2xl border border-border/60 overflow-hidden bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              {showEmployeeName && <TableHead className="whitespace-nowrap">Employee</TableHead>}
              <TableHead className="whitespace-nowrap">Leave Type</TableHead>
              <TableHead className="whitespace-nowrap">Dates</TableHead>
              <TableHead className="whitespace-nowrap">Days</TableHead>
              <TableHead className="max-w-[170px]">Reason</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="whitespace-nowrap">Submitted</TableHead>
              <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRequests.map(req => (
              <TableRow key={req.id}>
                {showEmployeeName && (
                  <TableCell className="font-semibold text-foreground text-xs whitespace-nowrap">
                    {req.employeeName}
                    <span className="block text-[10px] text-muted-foreground font-normal">
                      {req.department}
                    </span>
                  </TableCell>
                )}
                <TableCell className="font-medium text-xs text-foreground whitespace-nowrap">
                  {req.leaveTypeName}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground/70" />
                    <span className="text-foreground">{req.startDate}</span>
                    {req.startDate !== req.endDate && <span>→ {req.endDate}</span>}
                  </div>
                </TableCell>
                <TableCell className="text-xs font-semibold text-foreground font-mono whitespace-nowrap">
                  {req.requestedDays} d
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[170px] truncate" title={req.reason}>
                  {req.reason}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <StatusBadge status={req.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {req.submittedAt && !isNaN(new Date(req.submittedAt).getTime())
                    ? new Date(req.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                    : (req.startDate || 'Recent')}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRequest(req)}
                      className="h-7 px-2 text-xs font-medium text-foreground hover:bg-muted rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                      title="View details"
                    >
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>View</span>
                    </Button>

                    {/* If rejected or deferred, offer Complain / Appeal to Human Manager */}
                    {req.status === 'rejected' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setComplaintModalReq(req)
                          setComplaintText('')
                        }}
                        className="h-7 px-2 text-[11px] font-semibold text-amber-400 hover:bg-amber-500/10 border-amber-500/40 rounded-lg cursor-pointer gap-1"
                        title="Appeal directly to Human Manager (Bypasses AI)"
                      >
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                        <span>Appeal to Manager</span>
                      </Button>
                    )}

                    {req.status === 'pending' && handleDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(req.id)}
                        className="h-7 w-7 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete request"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Leave Details Modal */}
      <Dialog open={!!selectedRequest} onOpenChange={open => !open && setSelectedRequest(null)}>
        {selectedRequest && (
          <div>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1.5">
                <StatusBadge status={selectedRequest.status} />
                {selectedRequest.isEmergency && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    Emergency
                  </span>
                )}
              </div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {selectedRequest.leaveTypeName} Details
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Request ID: <span className="font-mono text-foreground">{selectedRequest.id}</span> • Submitted on{' '}
                {new Date(selectedRequest.submittedAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              {/* Key Details Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-muted/40 rounded-xl border border-border/60 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-0.5">Leave Duration</span>
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span>
                      {selectedRequest.startDate}
                      {selectedRequest.startDate !== selectedRequest.endDate && ` → ${selectedRequest.endDate}`}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-0.5">Total Days</span>
                  <span className="font-semibold text-foreground font-mono">
                    {selectedRequest.requestedDays} {selectedRequest.requestedDays === 1 ? 'day' : 'days'}
                  </span>
                </div>

                {selectedRequest.employeeName && showEmployeeName && (
                  <div className="col-span-2 pt-2 border-t border-border/40">
                    <span className="text-muted-foreground block text-[11px] mb-0.5">Applicant</span>
                    <span className="font-semibold text-foreground">
                      {selectedRequest.employeeName} ({selectedRequest.department})
                    </span>
                  </div>
                )}
              </div>

              {/* Complete Reason Section */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Full Reason for Leave
                </label>
                <div className="p-3.5 rounded-xl bg-card border border-border/80 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedRequest.reason || 'No specific reason provided.'}
                </div>
              </div>

              {/* Reviewer / Decision Details if reviewed */}
              {(selectedRequest.reviewedBy || selectedRequest.reviewerComment) && (
                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 text-xs space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                    <span>Reviewed by {selectedRequest.reviewedBy}</span>
                    {selectedRequest.reviewedAt && (
                      <span>
                        {new Date(selectedRequest.reviewedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                  {selectedRequest.reviewerComment && (
                    <p className="text-foreground italic pt-1">
                      "{selectedRequest.reviewerComment}"
                    </p>
                  )}
                </div>
              )}

              {/* Complaint Note if filed */}
              {selectedRequest.complaintNote && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                  <span className="font-bold text-amber-400 block flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5" /> Human Manager Appeal Submitted
                  </span>
                  <p className="text-foreground italic">"{selectedRequest.complaintNote}"</p>
                </div>
              )}
            </div>

            {selectedRequest.status === 'rejected' && (
              <DialogFooter className="flex items-center justify-between w-full pt-3 mt-4 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setComplaintModalReq(selectedRequest)
                    setSelectedRequest(null)
                  }}
                  className="h-8 text-xs text-amber-400 border-amber-500/40 hover:bg-amber-500/10 cursor-pointer"
                >
                  <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                  Complain / Appeal to Manager
                </Button>
              </DialogFooter>
            )}

            {selectedRequest.status === 'pending' && handleDelete && (
              <DialogFooter className="flex items-center justify-start w-full pt-3 mt-4 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleDelete(selectedRequest.id)
                    setSelectedRequest(null)
                  }}
                  className="h-8 text-xs text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 border-rose-500/30 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete This Request
                </Button>
              </DialogFooter>
            )}
          </div>
        )}
      </Dialog>

      {/* Employee Dispute / Appeal Modal (Bypasses AI) */}
      <Dialog open={!!complaintModalReq} onOpenChange={open => !open && setComplaintModalReq(null)}>
        {complaintModalReq && (
          <div>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert className="h-5 w-5 text-amber-400" />
                <DialogTitle className="text-base font-bold text-foreground">
                  Appeal Leave Rejection to Human Manager
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                This complaint will <strong>bypass AI arbitration</strong> and go directly to your Human HR/Manager for manual review & override.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              <div className="p-3 bg-muted/30 rounded-xl border border-border text-xs space-y-1">
                <div className="text-muted-foreground">Disputed Request:</div>
                <div className="font-bold text-foreground">
                  {complaintModalReq.leaveTypeName} ({complaintModalReq.startDate})
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Why are you appealing this decision? (Explain your circumstance to the Manager):
                </label>
                <Textarea
                  value={complaintText}
                  onChange={e => setComplaintText(e.target.value)}
                  placeholder="E.g., I have critical family circumstances that require my presence on this date. AI rejected me due to quota, but I request a manual human manager override."
                  className="text-xs min-h-[100px]"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setComplaintModalReq(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitComplaint}
                disabled={isSubmittingComplaint || !complaintText.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                {isSubmittingComplaint ? 'Escalating...' : 'Submit Appeal to Manager'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </>
  )
}
