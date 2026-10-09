import React, { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leaveService } from '@/services/leaveService'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CalendarDays,
  Sparkles,
  Users,
  Zap,
  ArrowRight,
  Clock,
  RefreshCw,
  Calendar as CalendarIcon,
  AlertTriangle,
  CheckCircle2,
  X,
  Info,
  ShieldCheck,
} from 'lucide-react'

interface RoleColorConfig {
  role: string
  color: string
  bg: string
  border: string
  badgeText: string
}

const ROLE_COLORS: Record<string, RoleColorConfig> = {
  'Senior Credit Officer': {
    role: 'Senior Credit Officer',
    color: '#0284c7',
    bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    border: 'border-sky-500',
    badgeText: 'Credit & Risk',
  },
  'Senior Branch Manager': {
    role: 'Senior Branch Manager',
    color: '#6366f1',
    bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    border: 'border-indigo-500',
    badgeText: 'Branch Management Lead',
  },
  'Foreign Exchange Specialist': {
    role: 'Foreign Exchange Specialist',
    color: '#10b981',
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    border: 'border-emerald-500',
    badgeText: 'Treasury & Forex',
  },
  'Treasury Operations Manager': {
    role: 'Treasury Operations Manager',
    color: '#8b5cf6',
    bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    border: 'border-purple-500',
    badgeText: 'Treasury Operations',
  },
  'Senior Frontend Engineer': {
    role: 'Senior Frontend Engineer',
    color: '#0284c7',
    bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    border: 'border-sky-500',
    badgeText: 'Engineering',
  },
}

interface LeavePlanEntry {
  id: string
  employeeId: string
  employeeName: string
  role?: string
  employeeRole?: string
  startDate: string
  endDate: string
  days?: number
  status: string
  assignedBackupId: string
  assignedBackupName: string
  assignedBackupRole?: string
  type?: string
  leaveTypeCode?: string
  notes?: string
  reassignedFrom?: string
  isCasualAbsence?: boolean
  hoursUnannounced?: number
}

const DEFAULT_PLANS: LeavePlanEntry[] = []

export const EmployeeLeavePlans: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedDaysCount, setSelectedDaysCount] = useState<number>(2)
  const [aiWarning, setAiWarning] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<string>('REALTIME_SYNCED')
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<LeavePlanEntry | null>(null)
  const [cancellingPlan, setCancellingPlan] = useState<LeavePlanEntry | null>(null)
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  const currentRole = user?.jobTitle || 'Senior Frontend Engineer'

  // Fetch real plans from backend
  const { data: apiPlans = [], isFetching } = useQuery({
    queryKey: ['leavePlans'],
    queryFn: () => leaveService.getLeavePlans(),
  })

  // Real plans from database without mock fallback
  const plans: LeavePlanEntry[] = (apiPlans || []).map(p => ({
    ...p,
    role: p.employeeRole || p.role || 'Senior Frontend Engineer',
    type: p.type || 'Annual Leave',
  }))

  const isPlanOwner = (p: LeavePlanEntry) => {
    if (!user) return true
    const uName = user.name?.toLowerCase() || ''
    const pName = p.employeeName?.toLowerCase() || ''
    const uId = user.id
    return (
      p.employeeId === uId ||
      (uName && pName && (pName.includes(uName) || uName.includes(pName))) ||
      (uName.includes('kasun') && pName.includes('kasun')) ||
      (uId === 'user-kasun' && p.employeeId === 'user-kasun') ||
      (uName.includes('alice') && pName.includes('alice')) ||
      (uId === 'user-Alice' && p.employeeId === 'user-Alice')
    )
  }

  const [selectedLeaveType, setSelectedLeaveType] = useState<'Annual Leave' | 'Casual Leave'>('Annual Leave')

  const createPlanMutation = useMutation({
    mutationFn: (data: { startDate: string; endDate: string; notes?: string; type?: string; leaveTypeCode?: string }) =>
      leaveService.createLeavePlan(data),
    onSuccess: (newPlan) => {
      queryClient.invalidateQueries({ queryKey: ['leavePlans'] })
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] })
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] })
      setSyncStatus('JUST_UPDATED')
      setTimeout(() => setSyncStatus('REALTIME_SYNCED'), 3000)

      if (newPlan.status === 'Coverage Needed') {
        setAiWarning(
          `🚨 Coverage Alert: Scheduled leave plan for ${newPlan.startDate} to ${newPlan.endDate}, but no available same-role backup was found. Status updated to "Coverage Needed — Manager Action Required".`
        )
      } else {
        setAiWarning(null)
      }
    },
  })

  const cancelPlanMutation = useMutation({
    mutationFn: (planId: string) => leaveService.cancelLeavePlan(planId),
    onSuccess: (_, planId) => {
      queryClient.invalidateQueries({ queryKey: ['leavePlans'] })
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] })
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] })
      setSyncStatus('JUST_UPDATED')
      setTimeout(() => setSyncStatus('REALTIME_SYNCED'), 3000)

      const targetPlan = cancellingPlan || plans.find(p => p.id === planId)
      const daysRestored = targetPlan?.days || 1

      setCancelSuccessMsg(
        `✅ Leave plan cancelled successfully! ${daysRestored} day(s) have been credited back to your leave balance.`
      )
      setCancellingPlan(null)
      setSelectedPlanDetails(null)
      setTimeout(() => setCancelSuccessMsg(null), 6000)
    },
  })

  const autoCasualMutation = useMutation({
    mutationFn: (date?: string) => leaveService.triggerAutoCasualLeave(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leavePlans'] })
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] })
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] })
      setCancelSuccessMsg(
        '⚡ Biometric Fingerprint Unannounced Absence detected! Automatically registered 1 day Casual Leave and deducted 1 day from Casual Leave balance.'
      )
      setTimeout(() => setCancelSuccessMsg(null), 7000)
    },
  })

  // Handle Mark Leave directly on calendar
  const handleMarkAnnualLeave = (day: number) => {
    const startDateStr = `2026-10-${day < 10 ? '0' + day : day}`
    const endDayNum = Math.min(31, day + selectedDaysCount - 1)
    const endDateStr = `2026-10-${endDayNum < 10 ? '0' + endDayNum : endDayNum}`

    createPlanMutation.mutate({
      startDate: startDateStr,
      endDate: endDateStr,
      type: selectedLeaveType,
      leaveTypeCode: selectedLeaveType === 'Casual Leave' ? 'casual' : 'annual',
      notes: `${selectedLeaveType} scheduled by ${user?.name || 'Kasun Perera'}`,
    })
  }

  // Days in October 2026
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1)

  // Get plans for a specific day (Deduplicated and excluding cancelled)
  const getPlansForDay = (day: number) => {
    const dateStr = `2026-10-${day < 10 ? '0' + day : day}`
    const activeItems = plans.filter(p => p.status !== 'cancelled' && p.startDate <= dateStr && p.endDate >= dateStr)
    const uniqueMap = new Map<string, LeavePlanEntry>()
    activeItems.forEach(p => {
      const key = p.id || `${p.employeeId}-${p.startDate}-${p.endDate}`
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, p)
      }
    })
    return Array.from(uniqueMap.values())
  }

  const handleCellClick = (day: number) => {
    const dayPlans = getPlansForDay(day)
    const myPlan = dayPlans.find(p => isPlanOwner(p))
    if (myPlan) {
      setCancellingPlan(myPlan)
    } else {
      handleMarkAnnualLeave(day)
    }
  }


  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <PageHeader
        title="Team Leave Calendar & Duty Wiring"
        subtitle="Real-time synchronized team annual leave plans, role color-coding, and automated duty handoff connections."
      >
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-3 py-1 text-xs flex items-center gap-1.5"
          >
            <Zap className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
            <span>Realtime Azure Calendar & BCDR Synced</span>
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setSyncStatus('SYNCING')}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            <span>Sync Calendar</span>
          </Button>
        </div>
      </PageHeader>

      {/* AI Alert Banner if Conflict Detected */}
      {aiWarning && (
        <Card className="border border-amber-500/40 bg-amber-500/10 p-4 rounded-2xl animate-in fade-in zoom-in-95">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-amber-300">AI Priority Arbitration & Duty Re-assignment</h4>
              <p className="text-xs text-amber-200/90 leading-relaxed">{aiWarning}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Success Banner when plan is cancelled and balance is restored */}
      {cancelSuccessMsg && (
        <Card className="border border-emerald-500/40 bg-emerald-500/10 p-4 rounded-2xl animate-in fade-in zoom-in-95">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-emerald-300">Leave Balance Recalculated & Restored</h4>
              <p className="text-xs text-emerald-200/90 leading-relaxed">{cancelSuccessMsg}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Role Color Legend & Realtime Status */}
      <Card className="border border-border/60 bg-card p-4 rounded-2xl shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-sky-400" />
            <span className="text-xs font-semibold text-foreground">Role Color Coding Legend:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {Object.values(ROLE_COLORS).map(rc => (
              <div key={rc.role} className="flex items-center gap-1.5">
                <span
                  className="h-3 w-3 rounded-full inline-block shadow-xs"
                  style={{ backgroundColor: rc.color }}
                />
                <span className="text-xs text-muted-foreground font-medium">{rc.role}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Integrated Grid: Calendar + Figma-Style Connections + Handoff Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Real-Time Interactive Team Calendar */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border/60 bg-card p-6 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span>October 2026</span>
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-secondary text-muted-foreground">
                      31 Days
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Click any calendar day to instantly schedule your annual leave plan & connect backup duties.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40">
                  {(['Annual Leave', 'Casual Leave'] as const).map(lType => (
                    <button
                      key={lType}
                      type="button"
                      onClick={() => setSelectedLeaveType(lType)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedLeaveType === lType
                          ? lType === 'Casual Leave'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'bg-sky-500 text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {lType}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40">
                  <span className="text-[11px] text-muted-foreground font-medium px-2">Days:</span>
                  {[1, 2, 3, 5].map(days => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setSelectedDaysCount(days)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selectedDaysCount === days
                          ? 'bg-sky-500 text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Calendar Container */}
            <div className="relative" ref={calendarRef}>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-muted-foreground">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* 31 Day Calendar Cell Grid */}
              <div className="grid grid-cols-7 gap-2.5">
                {/* Empty Offset Days for Oct 1st (Thursday) */}
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-24 bg-muted/20 rounded-2xl border border-dashed border-border/30" />
                ))}

                {daysInMonth.map(day => {
                  const dayPlans = getPlansForDay(day)
                  const isMyPlan = dayPlans.some(p => isPlanOwner(p))
                  const hasCasualAbsence = dayPlans.some(p => p.isCasualAbsence)

                  return (
                    <div
                      key={day}
                      onClick={() => handleCellClick(day)}
                      className={`h-24 p-2 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                        isMyPlan
                          ? 'border-sky-500/80 bg-sky-500/5 shadow-xs'
                          : hasCasualAbsence
                          ? 'border-amber-500/50 bg-amber-500/5'
                          : dayPlans.length > 0
                          ? 'border-border/80 bg-card hover:border-sky-500/40'
                          : 'border-border/40 bg-card/50 hover:bg-card hover:border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            isMyPlan ? 'text-sky-400' : 'text-foreground'
                          }`}
                        >
                          {day}
                        </span>
                        {isMyPlan && (
                          <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping" />
                        )}
                      </div>

                      {/* Render Leave Chips with Role Color Bar (Displayed ONCE per plan) */}
                      <div className="space-y-1 my-1 overflow-hidden">
                        {dayPlans.map(dp => {
                          const roleCfg = ROLE_COLORS[dp.role || 'Senior Frontend Engineer'] || ROLE_COLORS['Senior Frontend Engineer']
                          const isCoverageNeeded = dp.status === 'Coverage Needed' || dp.assignedBackupName?.includes('Coverage Needed')
                          const isReassigned = dp.status === 'Reassigned'
                          const isCasual = dp.type?.toLowerCase().includes('casual') || dp.leaveTypeCode === 'casual' || dp.isCasualAbsence

                          return (
                            <div
                              key={dp.id}
                              onClick={e => {
                                e.stopPropagation()
                                if (isPlanOwner(dp)) {
                                  setCancellingPlan(dp)
                                } else {
                                  setSelectedPlanDetails(dp)
                                }
                              }}
                              className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold truncate flex items-center justify-between border shadow-2xs cursor-pointer hover:scale-[1.02] transition-transform"
                              style={{
                                backgroundColor: isCoverageNeeded ? '#ef444420' : isReassigned ? '#a855f720' : isCasual ? '#f59e0b25' : `${roleCfg.color}15`,
                                borderColor: isCoverageNeeded ? '#ef444460' : isReassigned ? '#a855f760' : isCasual ? '#f59e0b60' : `${roleCfg.color}40`,
                                color: isCoverageNeeded ? '#f87171' : isReassigned ? '#c084fc' : isCasual ? '#fbbf24' : roleCfg.color,
                              }}
                              title={`${dp.employeeName} (${dp.type || 'Annual Leave'}) -> Backup: ${dp.assignedBackupName}`}
                            >
                              <span className="truncate">{dp.employeeName.split(' ')[0]}</span>
                              <span className="text-[9px] opacity-80">
                                {isCasual ? '⚡ Casual' : isCoverageNeeded ? '⚠️ Needed' : `➔ ${dp.assignedBackupName.split(' ')[0]}`}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      {/* Quick Hover Hint */}
                      <div className="text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                        {isMyPlan ? 'Click to Manage' : '+ Mark Plan'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* Right 1 Column: Real-Time Responsibility Wiring & Coverage Status */}
        <div className="space-y-6">
          {/* Active Responsibility Connections */}
          <Card className="border border-border/60 bg-card p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-sky-400" />
                <span>Active Responsibility Handoffs</span>
              </h4>
              <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-400 border-sky-500/30">
                Figma-Style Wired
              </Badge>
            </div>

            <div className="space-y-3">
              {plans.slice(0, 5).map(p => {
                const roleCfg = ROLE_COLORS[p.role || 'Senior Frontend Engineer'] || ROLE_COLORS['Senior Frontend Engineer']
                const isCoverageNeeded = p.status === 'Coverage Needed' || p.assignedBackupName?.includes('Coverage Needed')
                const isReassigned = p.status === 'Reassigned'

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlanDetails(p)}
                    className="p-3 rounded-2xl border bg-muted/30 text-xs space-y-2 relative overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
                    style={{ borderColor: isCoverageNeeded ? '#ef444450' : isReassigned ? '#a855f750' : `${roleCfg.color}40` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{p.employeeName}</span>
                      <Badge
                        variant="secondary"
                        className={`text-[9px] ${
                          isCoverageNeeded
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : isReassigned
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {p.startDate} - {p.endDate}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-medium">
                      <span className="text-sky-400">On {p.type || 'Annual Leave'}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      {isCoverageNeeded ? (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Coverage Needed — Manager Action Required
                        </span>
                      ) : (
                        <span className={isReassigned ? 'text-purple-300' : 'text-emerald-400'}>
                          Duty Covered by {p.assignedBackupName} {isReassigned ? '(Reassigned)' : ''}
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-muted-foreground border-t border-border/40 pt-1.5 flex justify-between">
                      <span>Role: {p.role}</span>
                      <span className="text-sky-400 font-mono">
                        {isCoverageNeeded ? 'Escalation Active' : isReassigned ? 'AI Reassigned' : 'Realtime Connected'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* 1-Hour Unannounced Absence Biometric SLA Monitor */}
          <Card className="border border-amber-500/30 bg-amber-500/5 p-6 rounded-3xl shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Clock className="h-4 w-4" />
              <h4 className="text-xs font-bold text-foreground">1-Hour Unannounced Absence Tracking SLA</h4>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              If an employee takes an unannounced casual or sick leave, real-time fingerprint sensors monitor clock-in times. After <strong>1 hour of no clock-in</strong>, the system automatically triggers backup responsibility re-assignment to the next available colleague in the same role.
            </p>

            <div className="p-3 bg-card rounded-2xl border border-border/60 text-xs space-y-2">
              <div className="flex justify-between items-center text-amber-300 font-medium">
                <span>Biometric Sensor SLA Trigger</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                  1-Hour Fingerprint Alert
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Click below to simulate an unannounced absence. The system will automatically mark a <strong>Casual Leave</strong>, deduct 1 day from your Casual Leave balance, and connect duty backup.
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={autoCasualMutation.isPending}
                onClick={() => autoCasualMutation.mutate()}
                className="w-full text-xs font-bold rounded-xl bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer"
              >
                {autoCasualMutation.isPending ? 'Processing Fingerprint Event...' : '⚡ Trigger Fingerprint Unannounced Absence (-1 Casual Day)'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Interactive Details Panel Modal for Calendar Events & Handoffs */}
      {selectedPlanDetails && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full bg-card border border-border/80 rounded-[28px] shadow-2xl p-6 space-y-5 relative">
            <button
              onClick={() => setSelectedPlanDetails(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
                <CalendarIcon className="h-5.5 w-5.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {selectedPlanDetails.employeeName}
                </h3>
                <p className="text-xs text-muted-foreground">{selectedPlanDetails.role}</p>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-2xl border border-border/60 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Leave Type:</span>
                <span className="font-semibold text-foreground">{selectedPlanDetails.type || 'Annual Leave'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scheduled Period:</span>
                <span className="font-semibold text-foreground">
                  {selectedPlanDetails.startDate} to {selectedPlanDetails.endDate}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Assigned Duty Backup:</span>
                <span
                  className={`font-semibold ${
                    selectedPlanDetails.status === 'Coverage Needed' || selectedPlanDetails.assignedBackupName?.includes('Coverage Needed')
                      ? 'text-rose-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {selectedPlanDetails.assignedBackupName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Backup Role:</span>
                <span className="font-semibold text-foreground">
                  {selectedPlanDetails.assignedBackupRole || selectedPlanDetails.role}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Handover Status:</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    selectedPlanDetails.status === 'Coverage Needed' || selectedPlanDetails.assignedBackupName?.includes('Coverage Needed')
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : selectedPlanDetails.status === 'Reassigned'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {selectedPlanDetails.status === 'Coverage Needed' || selectedPlanDetails.assignedBackupName?.includes('Coverage Needed')
                    ? 'Coverage Needed — Manager Action Required'
                    : selectedPlanDetails.status === 'Reassigned'
                    ? 'Reassigned (Urgent Leave Escalation)'
                    : 'Confirmed & Active'}
                </Badge>
              </div>
            </div>

            {selectedPlanDetails.notes && (
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs">
                <div className="font-semibold mb-0.5 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-sky-400" /> Audit Log / Handoff Notes:
                </div>
                <p className="text-[11px] text-sky-200/90 leading-relaxed">{selectedPlanDetails.notes}</p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-3">
              {isPlanOwner(selectedPlanDetails) ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const planToCancel = selectedPlanDetails
                    setSelectedPlanDetails(null)
                    setCancellingPlan(planToCancel)
                  }}
                  className="text-xs rounded-xl bg-rose-600 hover:bg-rose-700"
                >
                  Cancel Leave Plan & Restore Balance
                </Button>
              ) : (
                <div />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPlanDetails(null)}
                className="text-xs rounded-xl"
              >
                Close Details Panel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Confirmation Modal Popup for Leave Plan Cancellation */}
      {cancellingPlan && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full bg-card border border-rose-500/40 rounded-[28px] shadow-2xl p-6 space-y-5 relative">
            <button
              onClick={() => setCancellingPlan(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                <AlertTriangle className="h-6 w-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Cancel Scheduled Annual Leave Plan</h3>
                <p className="text-xs text-muted-foreground">Restore Leave Days & Revoke Handoff</p>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-2xl border border-border/60 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employee:</span>
                <span className="font-semibold text-foreground">{cancellingPlan.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scheduled Period:</span>
                <span className="font-semibold text-foreground">
                  {cancellingPlan.startDate} to {cancellingPlan.endDate} ({cancellingPlan.days || 1} business days)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assigned Duty Backup:</span>
                <span className="font-semibold text-emerald-400">{cancellingPlan.assignedBackupName}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Do you want to cancel this scheduled annual leave plan? Cancelling will release <strong>{cancellingPlan.assignedBackupName}</strong> from duty coverage and immediately recalculate and refund <strong>{cancellingPlan.days || 1} day(s)</strong> back to your authoritative annual leave balance.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancellingPlan(null)}
                className="text-xs rounded-xl"
              >
                Keep Leave Schedule
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={cancelPlanMutation.isPending}
                onClick={() => cancelPlanMutation.mutate(cancellingPlan.id)}
                className="text-xs rounded-xl bg-rose-600 hover:bg-rose-700"
              >
                {cancelPlanMutation.isPending ? 'Cancelling Plan...' : 'Yes, Cancel Leave Plan & Refund Days'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

