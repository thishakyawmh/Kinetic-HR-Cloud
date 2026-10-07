import React, { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { employeeService } from '@/services/employeeService'
import { leaveService } from '@/services/leaveService'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Mail,
  Sparkles,
  Search,
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
  const [searchQuery, setSearchQuery] = useState('')

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

  // Simulated October 2026 week calendar matrix
  const daysInFocus = [
    { date: '2026-10-02', label: 'Fri, Oct 2', isToday: true },
    { date: '2026-10-05', label: 'Mon, Oct 5' },
    { date: '2026-10-06', label: 'Tue, Oct 6' },
    { date: '2026-10-07', label: 'Wed, Oct 7', hasConflict: true },
    { date: '2026-10-08', label: 'Thu, Oct 8', hasConflict: true },
    { date: '2026-10-09', label: 'Fri, Oct 9' },
  ]

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
      const workingCount = totalMembers - onLeaveCount
      const coveragePct = Math.round((workingCount / totalMembers) * 100)
      return {
        ...day,
        totalMembers,
        onLeaveCount,
        workingCount,
        coveragePct,
      }
    })
  }, [daysInFocus, team, allLeaves])

  // Active today count
  const todayStats = dayCoverage.find(d => d.isToday) || { workingCount: team.length, onLeaveCount: 0 }

  // Team members with approved leaves in this window
  const membersWithUpcomingLeave = team.filter(m =>
    daysInFocus.some(d => !!getMemberLeaveForDate(m.id, d.date))
  )

  // Filtered direct reports for the directory table
  const filteredTeam = useMemo(() => {
    if (!searchQuery.trim()) return team
    const query = searchQuery.toLowerCase()
    return team.filter(
      m =>
        m.name.toLowerCase().includes(query) ||
        m.jobTitle.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.employeeNumber.toLowerCase().includes(query)
    )
  }, [team, searchQuery])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Availability & Schedule Matrix"
        subtitle="Monitor Engineering capacity, upcoming sprint absences, and staffing threshold risks."
      >
        <Button
          variant="ai"
          size="sm"
          onClick={() =>
            navigate(
              '/manager/assistant?prompt=' +
              encodeURIComponent(
                'Are there any staffing bottlenecks or capacity risks for Engineering next week? Specifically evaluate the Oct 7-8 overlapping leaves.'
              )
            )
          }
          className="gap-1.5 text-xs rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Ask AI to Analyze Coverage</span>
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
          value={team.length || 4}
          subtitle="Engineering team roster"
          icon={Users}
          iconColor="text-[#23ace3] bg-[#23ace3]/15"
        />
        <StatCard
          title="Available Today"
          value={todayStats.workingCount}
          subtitle="Oct 2, 2026 present on duty"
          icon={UserCheck}
          iconColor="text-emerald-600 dark:text-emerald-400 bg-emerald-500/15"
          badge={
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
              100% Present
            </Badge>
          }
        />
        <StatCard
          title="In-Sprint Absences"
          value={membersWithUpcomingLeave.length}
          subtitle="Team members with approved leave"
          icon={CalendarDays}
          iconColor="text-indigo-600 dark:text-indigo-400 bg-indigo-500/15"
          badge={
            <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10">
              3 Employees
            </Badge>
          }
        />
        <StatCard
          title="Min Sprint Coverage"
          value="45%"
          subtitle="Oct 7 critical threshold alert"
          icon={AlertTriangle}
          iconColor="text-[#c86b25] dark:text-[#ef8d46] bg-[#ef8d46]/15"
          trend={{ value: 'Critical Bottleneck', positive: false }}
        />
      </div>

      {/* Modern Conflict Alert Banner */}
      <Card className="border-[#ef8d46]/30 bg-gradient-to-r from-[#ef8d46]/15 via-[#ef8d46]/5 to-transparent p-5 rounded-2xl shadow-xs backdrop-blur-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#ef8d46]/20 text-[#c86b25] dark:text-[#ef8d46] border border-[#ef8d46]/30 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-foreground">
                  Sprint Staffing Conflict Detected: October 7 & 8, 2026
                </h4>
                <Badge className="bg-[#ef8d46]/20 text-[#c86b25] dark:text-[#ef8d46] border border-[#ef8d46]/30 text-[10px] font-semibold">
                  Coverage: 45%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                Marcus Chen (DevOps) and Priya Patel (Backend Lead) have concurrent approved absences on Oct 7. Alice Johnson also has approved Annual Leave on Oct 7–8. Engineering capacity drops below the department 70% threshold.
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
                    'What mitigation plan do you suggest for the Engineering sprint bottleneck on October 7-8 when Marcus, Priya, and Alice are away?'
                  )
                )
              }
              className="text-xs border-[#ef8d46]/50 text-[#c86b25] dark:text-[#ef8d46] hover:bg-[#ef8d46]/20 rounded-xl transition-all cursor-pointer gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generate AI Mitigation Plan</span>
            </Button>
          </div>
        </div>
      </Card>

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
                  Sprint 24 Availability Matrix (October 2026)
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Daily presence breakdown across core engineering roles
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
                Bottleneck Risk
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
                {daysInFocus.map(d => (
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
                  {daysInFocus.map(d => {
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
                  Sprint Team Coverage
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
                      {d.workingCount}/{d.totalMembers} Active
                    </div>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {/* Direct Reports Directory Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-foreground">Direct Reports Directory</h3>
            <p className="text-xs text-muted-foreground">
              Contact channels and upcoming scheduled absences for your team
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by name, role, email..."
              className="pl-8 text-xs h-9 bg-card border-border/80 rounded-xl"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/50">
                <TableHead className="text-xs font-semibold">Employee</TableHead>
                <TableHead className="text-xs font-semibold">Role & Title</TableHead>
                <TableHead className="text-xs font-semibold">Location</TableHead>
                <TableHead className="text-xs font-semibold">Work Email</TableHead>
                <TableHead className="text-xs font-semibold">Next Scheduled Absence</TableHead>
                <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeam.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                    No team members match "{searchQuery}"
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeam.map(m => {
                  const nextLeave = allLeaves.find(
                    l =>
                      l.employeeId === m.id &&
                      l.status === 'approved' &&
                      new Date(l.startDate) >= new Date('2026-10-01')
                  )
                  return (
                    <TableRow key={m.id} className="border-border/40 hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-xs text-foreground">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#23ace3]/20 to-[#23ace3]/5 text-[#23ace3] border border-[#23ace3]/20 flex items-center justify-center font-bold text-[11px] shrink-0">
                            {m.name
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .substring(0, 2)}
                          </div>
                          <div>
                            <div>{m.name}</div>
                            <span className="text-[10px] text-muted-foreground font-normal font-mono">
                              {m.employeeNumber}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {m.jobTitle}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span>{m.location || 'Seattle HQ'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        <a
                          href={`mailto:${m.email}`}
                          className="flex items-center gap-1.5 hover:text-[#0284c7] dark:hover:text-[#23ace3] transition-colors"
                        >
                          <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span>{m.email}</span>
                        </a>
                      </TableCell>
                      <TableCell className="text-xs">
                        {nextLeave ? (
                          <Badge
                            variant="outline"
                            className="text-[11px] font-medium border-[#23ace3]/30 text-[#0284c7] dark:text-[#23ace3] bg-[#23ace3]/10 gap-1"
                          >
                            <Calendar className="h-2.5 w-2.5" />
                            <span>
                              {nextLeave.startDate} ({nextLeave.leaveTypeName})
                            </span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[11px] font-medium border-border/60 text-muted-foreground bg-muted/30"
                          >
                            None scheduled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(
                              '/manager/assistant?prompt=' +
                              encodeURIComponent(`What is the current workload and leave balance for ${m.name}?`)
                            )
                          }
                          className="h-7 px-2 text-[11px] text-[#0284c7] dark:text-[#23ace3] hover:bg-[#23ace3]/15 rounded-lg gap-1 cursor-pointer"
                        >
                          <Bot className="h-3 w-3" />
                          <span>Ask AI</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
