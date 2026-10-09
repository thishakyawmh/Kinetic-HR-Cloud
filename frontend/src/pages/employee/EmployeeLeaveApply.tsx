import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leaveService } from '@/services/leaveService'
import { ApiError } from '@/services/apiClient'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  CalendarDays,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Clock,
  ShieldCheck,
  FileUp,
  X,
  ArrowRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const leaveSchema = z.object({
  leaveTypeCode: z.enum(['annual', 'sick', 'casual', 'emergency', 'other']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(5, 'Please provide a reason (minimum 5 characters)'),
})

type LeaveFormData = z.infer<typeof leaveSchema>

interface ConflictModalData {
  coveringForName: string
  coveringForId: string
  startDate: string
  endDate: string
  responsibility: string
}

export const EmployeeLeaveApply: React.FC = () => {
  const { user, tenant, refreshUser } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [submittedRequest, setSubmittedRequest] = useState<any>(null)
  const [conflictModalData, setConflictModalData] = useState<ConflictModalData | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pendingFormData, setPendingFormData] = useState<LeaveFormData | null>(null)

  const { data: balances = [] } = useQuery({
    queryKey: ['leaveBalances', user?.id],
    queryFn: () => (user?.id ? leaveService.getLeaveBalances(user.id) : []),
    enabled: !!user?.id,
  })

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors },
  } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      leaveTypeCode: 'annual',
      startDate: '2026-10-07',
      endDate: '2026-10-09',
      reason: '',
    },
  })

  const selectedTypeCode = watch('leaveTypeCode')
  const startDateStr = watch('startDate')
  const endDateStr = watch('endDate')

  // Calculate requested days on frontend for display
  const calculateDays = () => {
    if (!startDateStr || !endDateStr) return 1
    const start = new Date(startDateStr)
    const end = new Date(endDateStr)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 1
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  const requestedDays = calculateDays()
  const activeBalance = balances.find(b => b.code === selectedTypeCode)
  const currentRemaining = activeBalance ? activeBalance.remaining : 0
  const afterRemaining = Math.max(0, currentRemaining - requestedDays)

  const applyMutation = useMutation({
    mutationFn: async ({ data, isUrgent }: { data: LeaveFormData; isUrgent?: boolean }) => {
      if (!user || !tenant) return
      setErrorMessage(null)
      const leaveTypeMap: Record<string, string> = {
        annual: 'Annual Leave',
        sick: 'Sick Leave',
        casual: 'Casual Leave',
        emergency: 'Emergency Leave',
        other: 'Unpaid / Special Leave',
      }
      return leaveService.applyLeave({
        tenantId: tenant.id,
        employeeId: user.id,
        employeeName: user.name,
        department: user.department,
        leaveTypeId: `lt-${data.leaveTypeCode}`,
        leaveTypeName: leaveTypeMap[data.leaveTypeCode] || 'Leave',
        leaveTypeCode: data.leaveTypeCode,
        startDate: data.startDate,
        endDate: data.endDate,
        requestedDays,
        reason: data.reason,
        isEmergency: data.leaveTypeCode === 'emergency',
        isUrgent,
      })
    },
    onSuccess: newReq => {
      setSubmittedRequest(newReq)
      setConflictModalData(null)
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] })
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] })
      queryClient.invalidateQueries({ queryKey: ['leavePlans'] })
      refreshUser()
    },
    onError: (err: any) => {
      if (err instanceof ApiError && err.status === 409 && err.details) {
        setConflictModalData({
          coveringForName: err.details.coveringForName || 'Marcus Chen',
          coveringForId: err.details.coveringForId || 'user-marcus',
          startDate: err.details.startDate || '2026-10-06',
          endDate: err.details.endDate || '2026-10-10',
          responsibility: err.details.responsibility || 'Senior Frontend Engineering Duty Handoff',
        })
      } else {
        setErrorMessage(err.message || 'Failed to submit leave request')
      }
    },
  })

  const onSubmit = (data: LeaveFormData) => {
    setPendingFormData(data)
    applyMutation.mutate({ data, isUrgent: false })
  }

  const handleConfirmUrgentLeave = () => {
    const data = pendingFormData || getValues()
    applyMutation.mutate({ data, isUrgent: true })
  }


  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Apply for Leave"
        subtitle="Submit a formal leave request for manager review and calendar synchronization."
        backButton={
          <button
            type="button"
            onClick={() => navigate('/employee/leave')}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer group py-1"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Leave</span>
          </button>
        }
      />

      {/* Error / Warning Alert Banner */}
      {errorMessage && (
        <Card className="border border-rose-500/40 bg-rose-500/10 p-4 rounded-2xl animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-rose-300">Leave Application Notice</h4>
              <p className="text-xs text-rose-200/90 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Interactive Active Duty Handover Conflict Modal */}
      {conflictModalData && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="max-w-xl w-full bg-card border border-amber-500/50 rounded-[28px] shadow-2xl p-6 space-y-5 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1 pr-4">
                <h3 className="text-lg font-bold text-foreground">You Have an Active Duty Handover</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You're scheduled to cover <span className="font-semibold text-foreground">{conflictModalData.coveringForName}</span> during these dates ({conflictModalData.startDate} to {conflictModalData.endDate}). Taking leave may leave this responsibility uncovered. Is your leave urgent and necessary?
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted/40 rounded-2xl border border-border/60 text-xs space-y-2">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground">Assigned Coverage Target:</span>
                <span className="font-semibold text-foreground truncate">{conflictModalData.coveringForName}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground">Responsibility:</span>
                <span className="font-semibold text-sky-400 truncate">{conflictModalData.responsibility}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground">Scheduled Duty Dates:</span>
                <span className="font-semibold text-foreground">{conflictModalData.startDate} — {conflictModalData.endDate}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <Button
                type="button"
                onClick={() => handleConfirmUrgentLeave()}
                disabled={applyMutation.isPending}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-10 rounded-xl shadow-sm cursor-pointer"
              >
                {applyMutation.isPending ? 'Submitting Urgent Request...' : 'Yes — Request Urgent Leave'}
              </Button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConflictModalData(null)}
                  className="w-full text-xs h-10 rounded-xl border-border cursor-pointer"
                >
                  No — Keep Current Schedule
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/employee/leave-plans')}
                  className="w-full text-xs h-10 rounded-xl cursor-pointer"
                >
                  Review My Responsibilities
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {submittedRequest ? (
        /* Confirmation State */
        <Card className="border border-emerald-500/30 bg-emerald-500/5 p-8 text-center rounded-[24px] shadow-sm animate-in fade-in zoom-in-95">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                Leave request submitted successfully
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Your request (Ref #{submittedRequest.id}) has been registered and updated in your balance ledger.
              </p>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border/60 text-left text-xs space-y-2.5 shadow-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-semibold text-foreground">{submittedRequest.leaveTypeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dates:</span>
                <span className="font-semibold text-foreground">
                  {submittedRequest.startDate} to {submittedRequest.endDate} ({submittedRequest.requestedDays} day)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> {submittedRequest.status === 'approved' ? 'Auto-Approved' : 'Pending Manager Review'}
                </span>
              </div>
              {submittedRequest.reassignmentSummary && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] leading-relaxed mt-2">
                  <div className="font-semibold flex items-center gap-1.5 mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>AI Duty Reassignment Status</span>
                  </div>
                  {submittedRequest.reassignmentSummary}
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSubmittedRequest(null)}
                className="text-xs rounded-xl"
              >
                Submit Another Request
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/employee/leave-plans')}
                className="text-xs bg-[#23ace3] hover:bg-[#1b97ca] text-white rounded-xl"
              >
                View Team Calendar & Duty Wiring
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Structured Form */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="border border-border/70 bg-card rounded-[24px] shadow-sm overflow-hidden">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-base font-bold text-foreground">Standard Leave Application</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Please submit planned annual leave at least 2 weeks in advance.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-4">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Leave Type Select */}
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">
                      Leave Type *
                    </label>
                    <Select
                      {...register('leaveTypeCode')}
                      className="h-10 rounded-xl bg-background border-border/80 text-foreground"
                    >
                      <option value="annual">Annual Leave (Planned Vacation)</option>
                      <option value="sick">Sick Leave (Medical & Health)</option>
                      <option value="casual">Casual Leave (Personal Errand)</option>
                      <option value="emergency">Emergency Leave (Dependent Care)</option>
                      <option value="other">Unpaid / Special Circumstance</option>
                    </Select>
                  </div>

                  {/* Dates Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1.5">
                        Start Date *
                      </label>
                      <Input
                        type="date"
                        {...register('startDate')}
                        className="h-10 rounded-xl bg-background border-border/80 text-foreground"
                      />
                      {errors.startDate && (
                        <p className="text-[11px] text-rose-500 mt-1">{errors.startDate.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1.5">
                        End Date *
                      </label>
                      <Input
                        type="date"
                        {...register('endDate')}
                        className="h-10 rounded-xl bg-background border-border/80 text-foreground"
                      />
                      {errors.endDate && (
                        <p className="text-[11px] text-rose-500 mt-1">{errors.endDate.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">
                      Reason for Absence *
                    </label>
                    <Textarea
                      {...register('reason')}
                      rows={3}
                      className="rounded-xl bg-background border-border/80 text-foreground resize-none"
                    />
                    {errors.reason && (
                      <p className="text-[11px] text-rose-500 mt-1">{errors.reason.message}</p>
                    )}
                  </div>

                  {/* Optional Attachment */}
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">
                      Optional Attachment (Medical Certificate / Travel Proof)
                    </label>
                    <div className="border border-dashed border-border/80 hover:border-[#23ace3]/60 rounded-2xl p-5 text-center bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer group">
                      <FileUp className="h-5 w-5 text-muted-foreground group-hover:text-[#23ace3] mx-auto mb-1.5 transition-colors" />
                      <span className="text-xs text-foreground font-medium block">
                        Click to select or drag and drop document
                      </span>
                      <span className="text-[10px] text-muted-foreground">PDF, PNG, JPG up to 10MB</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={applyMutation.isPending}
                      className="w-full bg-[#23ace3] hover:bg-[#1b97ca] disabled:opacity-60 text-white font-medium text-sm h-11 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      {applyMutation.isPending ? 'Submitting Request...' : 'Submit Leave Request'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Quota & Calculation Preview Column */}
          <div className="space-y-4">
            <Card className="border border-border/70 bg-card rounded-[24px] shadow-sm overflow-hidden">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Balance Calculation Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-border/40">
                  <span className="text-muted-foreground">Available Quota:</span>
                  <span className="font-bold text-foreground">{currentRemaining} days</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/40">
                  <span className="text-muted-foreground">Requested Duration:</span>
                  <span className="font-bold text-[#23ace3]">{requestedDays} business day(s)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/40">
                  <span className="text-muted-foreground">Remaining after approval:</span>
                  <span className={`font-bold ${afterRemaining < 0 ? 'text-rose-500' : 'text-foreground'}`}>
                    {afterRemaining} days
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/50 text-[11px] text-muted-foreground space-y-1 mt-3">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <ShieldCheck className="h-4 w-4 text-[#23ace3]" />
                    <span>Manager Review SLA</span>
                  </div>
                  <p className="leading-relaxed">
                    Submitted requests are routed to {user?.managerName || 'David Wilson'}. Standard review SLA is 24 hours.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
