import React, { useState } from 'react'
import { LeaveRequest } from '@/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Calendar, Eye, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface LeaveHistoryTableProps {
  requests: LeaveRequest[]
  onCancelRequest?: (id: string) => void
  onDeleteRequest?: (id: string) => void
  showEmployeeName?: boolean
}

export const LeaveHistoryTable: React.FC<LeaveHistoryTableProps> = ({
  requests,
  onCancelRequest,
  onDeleteRequest,
  showEmployeeName = false,
}) => {
  const handleDelete = onDeleteRequest || onCancelRequest
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)

  if (requests.length === 0) {
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
            {requests.map(req => (
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
                  {new Date(req.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
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
            </div>

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
    </>
  )
}
