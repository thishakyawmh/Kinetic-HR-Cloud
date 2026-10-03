import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leaveService } from '@/services/leaveService'
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
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const leaveSchema = z.object({
  leaveTypeCode: z.enum(['annual', 'sick', 'casual', 'emergency', 'other']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(5, 'Please provide a reason (minimum 5 characters)'),
})

type LeaveFormData = z.infer<typeof leaveSchema>

export const EmployeeLeaveApply: React.FC = () => {
  const { user, tenant, refreshUser } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [submittedRequest, setSubmittedRequest] = useState<any>(null)

  const { data: balances = [] } = useQuery({
    queryKey: ['leaveBalances', user?.id],
    queryFn: () => (user?.id ? leaveService.getLeaveBalances(user.id) : []),
    enabled: !!user?.id,
  })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      leaveTypeCode: 'annual',
      startDate: '2026-10-15',
      endDate: '2026-10-16',
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
    mutationFn: async (data: LeaveFormData) => {
      if (!user || !tenant) return
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
      })
    },
    onSuccess: newReq => {
      setSubmittedRequest(newReq)
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] })
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] })
      refreshUser()
    },
  })

  const onSubmit = (data: LeaveFormData) => {
    applyMutation.mutate(data)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Apply for Leave"
        subtitle="Submit a formal leave request for manager review and calendar synchronization."
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/employee/leave')}
          className="gap-1 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Leave</span>
        </Button>
      </PageHeader>



      {submittedRequest ? (
        /* Confirmation State */
        <Card className="border-emerald-200 bg-emerald-50/30 p-8 text-center animate-in fade-in zoom-in-95">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Leave request submitted successfully
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Your request (Ref #{submittedRequest.id}) has been routed to your direct manager for review.
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
                  <Clock className="h-3.5 w-3.5" /> Pending Manager Approval
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Manager:</span>
                <span className="font-semibold text-foreground">{user?.managerName || 'David Wilson'}</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSubmittedRequest(null)}
                className="text-xs"
              >
                Submit Another Request
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/employee/leave')}
                className="text-xs bg-sky-600 text-white"
              >
                View Leave Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Structured Form */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Standard Leave Application</CardTitle>
                <CardDescription>
                  Please submit planned annual leave at least 2 weeks in advance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Leave Type Select */}
                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                      Leave Type *
                    </label>
                    <Select {...register('leaveTypeCode')}>
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
                      <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                        Start Date *
                      </label>
                      <Input type="date" {...register('startDate')} />
                      {errors.startDate && (
                        <p className="text-[11px] text-rose-600 mt-1">{errors.startDate.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                        End Date *
                      </label>
                      <Input type="date" {...register('endDate')} />
                      {errors.endDate && (
                        <p className="text-[11px] text-rose-600 mt-1">{errors.endDate.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                      Reason for Absence *
                    </label>
                    <Textarea
                      {...register('reason')}
                      placeholder="Please provide details regarding your leave request..."
                      rows={3}
                    />
                    {errors.reason && (
                      <p className="text-[11px] text-rose-600 mt-1">{errors.reason.message}</p>
                    )}
                  </div>

                  {/* Optional Attachment */}
                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                      Optional Attachment (Medical Certificate / Travel Proof)
                    </label>
                    <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 cursor-pointer">
                      <FileUp className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                      <span className="text-xs text-slate-600 font-medium block">
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
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs h-10"
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
            <Card className="bg-slate-50/70 border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs uppercase font-bold text-slate-600">
                  Balance Calculation Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Available Quota:</span>
                  <span className="font-bold text-foreground">{currentRemaining} days</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Requested Duration:</span>
                  <span className="font-bold text-[#23ace3]">{requestedDays} business day(s)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Remaining after approval:</span>
                  <span className={`font-bold ${afterRemaining < 0 ? 'text-rose-500' : 'text-foreground'}`}>
                    {afterRemaining} days
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-[11px] text-muted-foreground space-y-1 mt-3">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#23ace3]" />
                    <span>Manager Review SLA</span>
                  </div>
                  <p>
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
