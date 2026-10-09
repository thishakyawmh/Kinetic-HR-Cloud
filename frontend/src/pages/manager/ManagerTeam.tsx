import React, { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { employeeService } from '@/services/employeeService'
import { leaveService } from '@/services/leaveService'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Bot,
  UserCheck,
  CalendarDays,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const ManagerTeam: React.FC = () => {
  const { user, tenant } = useAuth()
  const navigate = useNavigate()

  const { data: team = [] } = useQuery({
    queryKey: ['teamMembers', user?.id],
    queryFn: () => (user?.id ? employeeService.getTeamMembers(user.id) : []),
    enabled: !!user?.id,
  })

  const { data: allLeaves = [] } = useQuery({
    queryKey: ['leaveRequests', tenant?.id],
    queryFn: () => (tenant?.id ? leaveService.getLeaveRequests(tenant.id) : []),
    enabled: !!tenant?.id,
  })

  // Dynamic rolling work week calendar matrix (starts Monday or today, covering upcoming workdays)
  const daysInFocus = useMemo(() => {
    const days: { date: string; label: string; isToday: boolean }[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    // Start with current day (or Monday if weekend)
    const cur = new Date(today)
    if (cur.getDay() === 0) cur.setDate(cur.getDate() + 1)
    else if (cur.getDay() === 6) cur.setDate(cur.getDate() + 2)

    while (days.length < 6) {
      const dayOfWeek = cur.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateStr = cur.toISOString().split('T')[0]
        days.push({
          date: dateStr,
          label: cur.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          isToday: dateStr === todayStr,
        })
      }
      cur.setDate(cur.getDate() + 1)
    }
    return days
  }, [])

  const getMemberLeaveForDate = (memberId: string, dateStr: string) => {
    return allLeaves.find(
      l =>
        l.employeeId === memberId &&
        l.status === 'approved' &&
        new Date(dateStr) >= new Date(l.startDate) &&
        new Date(dateStr) <= new Date(l.endDate)
    )
  }

  // Calculate daily team presence and coverage
  const dayCoverage = useMemo(() => {
    return daysInFocus.map(day => {
      const totalMembers = team.length || 1
      const onLeaveCount = team.filter(m => !!getMemberLeaveForDate(m.id, day.date)).length
      const workingCount = Math.max(0, totalMembers - onLeaveCount)
      const coveragePct = Math.round((workingCount / totalMembers) * 100)
      const hasConflict = coveragePct < 70 // Coverage bottleneck under 70%
      return {
        ...day,
        totalMembers,
        onLeaveCount,
        workingCount,
        coveragePct,
        hasConflict,
      }
    })
  }, [daysInFocus, team, allLeaves])

  // Active today count
  const todayStats = dayCoverage.find(d => d.isToday) || {
    workingCount: team.length,
    totalMembers: team.length || 1,
    coveragePct: 100,
  }

  // Team members with approved leaves in this window
  const membersWithUpcomingLeave = team.filter(m =>
    daysInFocus.some(d => !!getMemberLeaveForDate(m.id, d.date))
  )

  // Identify bottleneck days
  const conflictDays = dayCoverage.filter(d => d.hasConflict)
  const minCoverageDay = dayCoverage.reduce(
    (min, d) => (d.coveragePct < min.coveragePct ? d : min),
    dayCoverage[0] || { coveragePct: 100, label: 'Today', hasConflict: false }
  )

  // Find absent staff on bottleneck days
  const conflictAbsentStaff = useMemo(() => {
    const names = new Set<string>()
    conflictDays.forEach(cd => {
      team.forEach(m => {
        if (getMemberLeaveForDate(m.id, cd.date)) {
          names.add(m.name)
        }
      })
    })
    return Array.from(names)
  }, [conflictDays, team, allLeaves])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Availability & Schedule Matrix"
        subtitle="Monitor workplace attendance, daily staff presence, and scheduling coverage across teams."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            navigate(
              '/manager/assistant?prompt=' +
              encodeURIComponent(
                conflictDays.length > 0
                  ? `Evaluate team coverage risks on ${conflictDays.map(d => d.label).join(', ')}. What mitigation steps do you recommend?`
                  : 'Assess team availability and identify any upcoming scheduling bottlenecks.'
              )
            )
          }
          className="gap-1.5 text-xs rounded-xl border-border/80 hover:bg-muted/40 transition-all cursor-pointer"
        >
          <CalendarDays className="h-3.5 w-3.5 text-[#23ace3]" />
          <span>Coverage Analysis</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/manager/approvals')}
          className="gap-1.5 text-xs rounded-xl border-border/80 hover:bg-muted/40 transition-all cursor-pointer"
        >
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Review Approvals</span>
        </Button>
      </PageHeader>

      {/* KPI Capacity Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Direct Reports"
          value={team.length}
          subtitle="Staff members roster"
          icon={Users}
          iconColor="text-[#23ace3] bg-[#23ace3]/15"
        />
        <StatCard
          title="Available Today"
          value={todayStats.workingCount}
          subtitle={`${todayStats.workingCount} of ${team.length || 1} present`}
          icon={UserCheck}
          iconColor="text-emerald-600 dark:text-emerald-400 bg-emerald-500/15"
          badge={
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
              {todayStats.coveragePct}% Present
            </Badge>
          }
        />
        <StatCard
          title="Scheduled Absences"
          value={membersWithUpcomingLeave.length}
          subtitle="Staff with scheduled leaves"
          icon={CalendarDays}
          iconColor="text-indigo-600 dark:text-indigo-400 bg-indigo-500/15"
          badge={
            <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10">
              {membersWithUpcomingLeave.length} Employees
            </Badge>
          }
        />
        <StatCard
          title="Min Daily Coverage"
          value={`${minCoverageDay?.coveragePct ?? 100}%`}
          subtitle={`${minCoverageDay?.label ?? 'Window'} coverage level`}
          icon={AlertTriangle}
          iconColor={
            minCoverageDay?.hasConflict
              ? 'text-[#c86b25] dark:text-[#ef8d46] bg-[#ef8d46]/15'
              : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15'
          }
          trend={
            minCoverageDay?.hasConflict
              ? { value: 'Staffing Risk', positive: false }
              : { value: 'Optimal Capacity', positive: true }
          }
        />
      </div>

      {/* Modern Conflict Alert Banner or Optimal Notice */}
      {conflictDays.length > 0 ? (
        <Card className="border-[#ef8d46]/30 bg-gradient-to-r from-[#ef8d46]/15 via-[#ef8d46]/5 to-transparent p-5 rounded-2xl shadow-xs backdrop-blur-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#ef8d46]/20 text-[#c86b25] dark:text-[#ef8d46] border border-[#ef8d46]/30 shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-foreground">
                    Workplace Staffing Alert: {conflictDays.map(d => d.label).join(', ')}
                  </h4>
                  <Badge className="bg-[#ef8d46]/20 text-[#c86b25] dark:text-[#ef8d46] border border-[#ef8d46]/30 text-[10px] font-semibold">
                    Min Coverage: {minCoverageDay.coveragePct}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                  {conflictAbsentStaff.length > 0
                    ? `${conflictAbsentStaff.join(', ')} will be away on approved leave. Staff presence drops below the department 70% threshold.`
                    : 'Scheduled absences reduce presence below the recommended department 70% threshold.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(
                    '/manager/assistant?prompt=' +
                    encodeURIComponent(
                      `What mitigation plan do you suggest for the staffing shortage on ${conflictDays.map(d => d.label).join(', ')} when ${conflictAbsentStaff.join(', ')} are away?`
                    )
                  )
                }
                className="text-xs border-[#ef8d46]/50 text-[#c86b25] dark:text-[#ef8d46] hover:bg-[#ef8d46]/20 rounded-xl transition-all cursor-pointer gap-1.5"
              >
                <span>Staffing Recommendations</span>
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-emerald-500/20 bg-emerald-500/5 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Optimal Team Coverage</p>
              <p className="text-[11px] text-muted-foreground">All business days maintain adequate staffing above the 70% operational threshold.</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
            100% Operational
          </Badge>
        </Card>
      )}

      {/* Schedule Matrix Calendar */}
      <Card className="border border-border/60 bg-card/90 backdrop-blur-xs rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="py-4 px-5 border-b border-border/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/20">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Daily Staff Presence Matrix
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {daysInFocus.length > 0
                    ? `Attendance window: ${daysInFocus[0].label} – ${daysInFocus[daysInFocus.length - 1].label}`
                    : 'Daily workplace attendance breakdown across staff members'}
                </p>
              </div>
            </div>

            {/* Visual Legend */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                Working
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#23ace3]/15 text-[#0284c7] dark:text-[#23ace3] border border-[#23ace3]/25 text-[11px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-[#23ace3]" />
                Annual Leave
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/25 text-[11px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
                Sick / Medical
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ef8d46]/15 text-[#c86b25] dark:text-[#ef8d46] border border-[#ef8d46]/25 text-[11px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ef8d46] animate-pulse" />
                Coverage Risk
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border/60">
                <th className="p-3.5 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[11px] w-60">
                  Team Member
                </th>
                {dayCoverage.map(d => (
                  <th
                    key={d.date}
                    className={`p-3 text-center font-semibold transition-colors ${
                      d.hasConflict
                        ? 'bg-[#ef8d46]/10 text-[#c86b25] dark:text-[#ef8d46] border-x border-[#ef8d46]/30'
                        : d.isToday
                        ? 'bg-[#23ace3]/10 text-[#0284c7] dark:text-[#23ace3] border-x border-[#23ace3]/30'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <div className="font-bold">{d.label}</div>
                    {d.hasConflict && (
                      <span className="inline-block mt-0.5 text-[10px] font-bold text-[#ef8d46] bg-[#ef8d46]/20 px-1.5 py-0.2 rounded-md">
                        Low Coverage
                      </span>
                    )}
                    {d.isToday && (
                      <span className="inline-block mt-0.5 text-[10px] font-bold text-[#23ace3] bg-[#23ace3]/20 px-1.5 py-0.2 rounded-md">
                        Today
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {team.map(m => (
                <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#23ace3]/20 to-[#23ace3]/5 text-[#23ace3] border border-[#23ace3]/20 flex items-center justify-center font-bold text-xs shrink-0">
                        {m.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground text-xs truncate">{m.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{m.jobTitle}</div>
                      </div>
                    </div>
                  </td>
                  {dayCoverage.map(d => {
                    const leave = getMemberLeaveForDate(m.id, d.date)
                    return (
                      <td
                        key={d.date}
                        className={`p-3 text-center align-middle transition-colors ${
                          d.hasConflict
                            ? 'bg-[#ef8d46]/5 border-x border-[#ef8d46]/20'
                            : d.isToday
                            ? 'bg-[#23ace3]/5 border-x border-[#23ace3]/20'
                            : ''
                        }`}
                      >
                        {leave ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border shadow-2xs ${
                              leave.isEmergency || leave.leaveTypeCode === 'emergency'
                                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                                : leave.leaveTypeCode === 'sick'
                                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                                : 'bg-[#23ace3]/15 text-[#0284c7] dark:text-[#23ace3] border-[#23ace3]/30'
                            }`}
                          >
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>{leave.leaveTypeName}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-medium shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                            <span>Working</span>
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>

            {/* Daily Capacity Summary Footer */}
            <tfoot>
              <tr className="bg-muted/30 border-t-2 border-border/70 font-semibold">
                <td className="p-3.5 text-foreground text-xs font-bold">
                  Daily Workplace Presence
                </td>
                {dayCoverage.map(d => (
                  <td
                    key={d.date}
                    className={`p-3 text-center align-middle text-xs ${
                      d.hasConflict
                        ? 'bg-[#ef8d46]/15 border-x border-[#ef8d46]/30 text-[#c86b25] dark:text-[#ef8d46]'
                        : d.isToday
                        ? 'bg-[#23ace3]/10 border-x border-[#23ace3]/30 text-[#0284c7] dark:text-[#23ace3]'
                        : 'text-foreground'
                    }`}
                  >
                    <div className="font-extrabold text-sm">{d.coveragePct}%</div>
                    <div className="text-[10px] text-muted-foreground font-normal">
                      {d.workingCount}/{d.totalMembers} Present
                    </div>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

    </div>
  )
}
