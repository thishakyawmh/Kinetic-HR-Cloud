import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { employeeService } from '@/services/employeeService'
import { leaveService } from '@/services/leaveService'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Mail,
  Sparkles,
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Availability & Schedule Matrix"
        subtitle="Monitor Engineering capacity, upcoming absences, and staffing threshold risks."
      >
        <Button
          variant="ai"
          size="sm"
          onClick={() =>
            navigate(
              '/manager/assistant?prompt=' +
              encodeURIComponent('Are there any staffing bottlenecks or capacity risks for Engineering next week?')
            )
          }
          className="gap-1.5 text-xs"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Ask AI to Analyze Coverage</span>
        </Button>
      </PageHeader>

      {/* Conflict Alert Banner */}
      <Card className="border-amber-200 bg-amber-50/70 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950">
              Staffing Conflict Detected: October 7 & 8, 2026
            </h4>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              Marcus Chen (DevOps) and Priya Patel (Backend Lead) have concurrent approved leaves on Oct 7. Alice Johnson has approved Annual Leave on Oct 7-8. Engineering frontend/backend sprint coverage drops to 45%.
            </p>
          </div>
        </div>
      </Card>

      {/* Schedule Matrix Calendar */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-sky-600" />
              <span>Sprint Schedule Matrix (October 2026)</span>
            </CardTitle>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-emerald-500 inline-block" /> Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-sky-500 inline-block" /> Annual Leave
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-amber-500 inline-block" /> Sick / Emergency
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-3 text-left font-semibold text-slate-700 w-56">Team Member</th>
                {daysInFocus.map(d => (
                  <th
                    key={d.date}
                    className={`p-3 text-center font-semibold ${d.hasConflict ? 'bg-amber-100/70 text-amber-900 border-x border-amber-200' : 'text-slate-700'
                      } ${d.isToday ? 'bg-sky-50 text-sky-900' : ''}`}
                  >
                    <div>{d.label}</div>
                    {d.hasConflict && (
                      <span className="text-[10px] text-amber-700 font-bold block">Low Coverage</span>
                    )}
                    {d.isToday && (
                      <span className="text-[10px] text-sky-600 font-bold block">Today</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {team.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{m.name}</div>
                    <div className="text-[11px] text-muted-foreground">{m.jobTitle}</div>
                  </td>
                  {daysInFocus.map(d => {
                    const leave = getMemberLeaveForDate(m.id, d.date)
                    return (
                      <td
                        key={d.date}
                        className={`p-3 text-center align-middle ${d.hasConflict ? 'bg-amber-50/30 border-x border-amber-100' : ''
                          }`}
                      >
                        {leave ? (
                          <span
                            className={`inline-block px-2 py-1 rounded text-[10px] font-semibold ${leave.isEmergency
                              ? 'bg-rose-100 text-rose-800'
                              : leave.leaveTypeCode === 'sick'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-sky-100 text-sky-800'
                              }`}
                          >
                            {leave.leaveTypeName}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded bg-slate-100/60 text-slate-600 text-[10px] font-medium">
                            Working
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Team Roster Details Table */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-foreground">Direct Reports Directory</h3>
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/50">
                <TableHead>Employee</TableHead>
                <TableHead>Role / Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Work Email</TableHead>
                <TableHead>Next Absence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.map(m => {
                const nextLeave = allLeaves.find(
                  l => l.employeeId === m.id && l.status === 'approved' && new Date(l.startDate) >= new Date('2026-10-01')
                )
                return (
                  <TableRow key={m.id} className="border-border/40 hover:bg-muted/30 transition-colors">
                    <TableCell className="font-bold text-xs text-foreground">
                      {m.name}
                      <span className="block text-[10px] text-muted-foreground font-normal">
                        {m.employeeNumber}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.jobTitle}</TableCell>
                    <TableCell className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {m.location || 'Seattle HQ'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{m.email}</TableCell>
                    <TableCell className="text-xs">
                      {nextLeave ? (
                        <span className="font-medium text-[#23ace3]">
                          {nextLeave.startDate} ({nextLeave.leaveTypeName})
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">None scheduled</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
