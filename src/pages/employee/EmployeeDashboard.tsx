import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { payrollService } from '@/services/payrollService'
import { leaveService } from '@/services/leaveService'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  CalendarCheck2,
  DollarSign,
  CalendarDays,
  Users,
  CheckCircle2,
  ArrowRight,
  Briefcase,
  MapPin,
  Laptop,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '@/lib/utils'

export const EmployeeDashboard: React.FC = () => {
  const { user, tenant } = useAuth()
  const navigate = useNavigate()

  const { data: latestPayslip } = useQuery({
    queryKey: ['latestPayslip', tenant?.id, user?.id],
    queryFn: () => (tenant?.id && user?.id ? payrollService.getLatestPayslip(tenant.id, user.id) : undefined),
    enabled: !!tenant?.id && !!user?.id,
  })

  const { data: balances = [] } = useQuery({
    queryKey: ['leaveBalances', user?.id],
    queryFn: () => (user?.id ? leaveService.getLeaveBalances(user.id) : []),
    enabled: !!user?.id,
  })

  const annualLeave = balances.find(b => b.code === 'annual')
  const totalRemainingDays = balances.reduce((acc, curr) => acc + curr.remaining, 0)

  // Demo Weekly Attendance Log for Alice Johnson
  const weeklyAttendance = [
    { day: 'Mon', date: 'Oct 12', status: 'In-Office', hours: '8.5h', checkIn: '9:00 AM', checkOut: '5:30 PM', mode: 'office' },
    { day: 'Tue', date: 'Oct 13', status: 'Remote', hours: '8.4h', checkIn: '8:50 AM', checkOut: '5:15 PM', mode: 'remote' },
    { day: 'Wed', date: 'Oct 14', status: 'In-Office', hours: '8.5h', checkIn: '9:05 AM', checkOut: '5:35 PM', mode: 'office' },
    { day: 'Thu', date: 'Oct 15', status: 'Remote', hours: '8.2h', checkIn: '8:45 AM', checkOut: '5:00 PM', mode: 'remote' },
    { day: 'Fri', date: 'Oct 16', status: 'Remote (Today)', hours: '7.5h', checkIn: '9:00 AM', checkOut: 'Active', mode: 'remote' },
  ]

  // Demo Team Members Availability
  const teamMembers = [
    { name: 'David Wilson', role: 'Engineering Lead', status: 'Active', location: 'Office', isManager: true },
    { name: 'Alice Johnson', role: 'Full Stack Engineer (You)', status: 'Active', location: 'Remote', isYou: true },
    { name: 'Marcus Vance', role: 'Backend Engineer', status: 'On Leave', location: 'Annual Leave until Oct 20', isOnLeave: true },
    { name: 'Elena Rostova', role: 'Frontend Engineer', status: 'Active', location: 'Office' },
  ]

  // Upcoming Company Holidays
  const upcomingHolidays = [
    { name: 'Thanksgiving Day', date: 'Nov 26, 2026', days: '2 days off', type: 'Public Holiday' },
    { name: 'Winter Break & Christmas', date: 'Dec 24 – Dec 26, 2026', days: '3 days off', type: 'Corporate Recess' },
    { name: "New Year's Day", date: 'Jan 01, 2027', days: '1 day off', type: 'Public Holiday' },
  ]

  return (
    <div className="space-y-6">
      {/* Dashboard Greeting */}
      <PageHeader
        title={`Good morning, ${user?.name.split(' ')[0] || 'Alice'}`}
        subtitle="Here's your HR overview."
      />

      {/* 4 Distinct Executive Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Worked Days & Monthly Attendance */}
        <Card className="hover:border-[#23ace3]/50 transition-all shadow-xs bg-card border-border/60 rounded-2xl">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Monthly Attendance
                </span>
                <div className="p-1.5 rounded-xl bg-[#23ace3]/15 text-[#23ace3]">
                  <Briefcase className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-foreground font-mono">21 / 22</span>
                <span className="text-xs text-muted-foreground">days logged</span>
              </div>
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                <CheckCircle2 className="h-3 w-3" />
                <span>95.5% on-time check-in</span>
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/40 text-[11px] text-muted-foreground flex justify-between">
              <span>12 Remote</span>
              <span>•</span>
              <span>9 In-Office</span>
            </div>
          </CardContent>
        </Card>

        {/* Stat 2: Total Leave Quota Preview */}
        <Card className="hover:border-[#23ace3]/50 transition-all shadow-xs bg-card border-border/60 rounded-2xl">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Available Time Off
                </span>
                <div className="p-1.5 rounded-xl bg-purple-500/15 text-purple-400">
                  <CalendarCheck2 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-foreground font-mono">
                  {totalRemainingDays}
                </span>
                <span className="text-xs text-muted-foreground">days total</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {annualLeave ? `${annualLeave.remaining} annual days remaining` : '14 annual days remaining'}
              </p>
            </div>
            <button
              onClick={() => navigate('/employee/leave')}
              className="mt-4 pt-3 border-t border-border/40 text-xs font-medium text-[#23ace3] hover:underline flex items-center justify-between cursor-pointer w-full text-left"
            >
              <span>Manage Time Off</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </CardContent>
        </Card>

        {/* Stat 3: Compensation & Earnings */}
        <Card className="hover:border-[#23ace3]/50 transition-all shadow-xs bg-card border-border/60 rounded-2xl">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Latest Take-Home Pay
                </span>
                <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-400">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-foreground font-mono">
                  {latestPayslip ? formatCurrency(latestPayslip.netSalary) : '$2,900'}
                </span>
                <span className="text-xs text-muted-foreground">net pay</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Disbursed for {latestPayslip?.periodMonth || 'October'} {latestPayslip?.periodYear || 2026}
              </p>
            </div>
            <button
              onClick={() => navigate('/employee/payslips')}
              className="mt-4 pt-3 border-t border-border/40 text-xs font-medium text-[#23ace3] hover:underline flex items-center justify-between cursor-pointer w-full text-left"
            >
              <span>View Statement Details</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </CardContent>
        </Card>

        {/* Stat 4: Upcoming Public Holiday */}
        <Card className="hover:border-[#23ace3]/50 transition-all shadow-xs bg-card border-border/60 rounded-2xl">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Next Holiday
                </span>
                <div className="p-1.5 rounded-xl bg-[#ef8d46]/15 text-[#ef8d46]">
                  <CalendarDays className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-sm font-bold text-foreground">
                  Thanksgiving Day
                </div>
                <div className="text-xs text-[#ef8d46] mt-0.5 font-medium">
                  Nov 26, 2026 • 2 days off
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Upcoming 4-day long holiday weekend
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
              Corporate office closed
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Attendance & Timesheet Tracker */}
      <Card className="border-border/60 bg-card rounded-2xl overflow-hidden shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#23ace3]" />
                <span>Weekly Timesheet & Attendance</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Standard schedule: 40 hrs / week • Hybrid policy (3 days remote / 2 days onsite)
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-medium border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
              Current Week: 41.1 hrs
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          <div className="space-y-2.5">
            {weeklyAttendance.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/40 transition-colors text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 font-bold text-foreground">{item.day}</div>
                  <div className="text-muted-foreground text-[11px] hidden sm:block">{item.date}</div>
                  <div className="flex items-center gap-1.5 pl-2">
                    {item.mode === 'office' ? (
                      <Building2 className="h-3.5 w-3.5 text-sky-400" />
                    ) : (
                      <Laptop className="h-3.5 w-3.5 text-purple-400" />
                    )}
                    <span className="font-medium text-foreground">{item.status}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div className="text-muted-foreground text-[11px] hidden sm:block">
                    {item.checkIn} – {item.checkOut}
                  </div>
                  <div className="font-mono font-bold text-[#23ace3] min-w-10">
                    {item.hours}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two Horizontal Cards: Team Availability & Upcoming Holidays (2 per row) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Availability Card */}
        <Card className="border-border/60 bg-card rounded-2xl shadow-xs">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-[#23ace3]" />
              <span>My Team Availability Today</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            {teamMembers.map((member, idx) => (
              <div key={idx} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                <div>
                  <div className="font-medium text-foreground flex items-center gap-1.5">
                    <span>{member.name}</span>
                    {member.isYou && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded-md">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{member.role}</div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={member.isOnLeave ? 'warning' : 'outline'}
                    className={`text-[10px] ${
                      member.isOnLeave
                        ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                        : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                    }`}
                  >
                    {member.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Holidays Calendar */}
        <Card className="border-border/60 bg-card rounded-2xl shadow-xs">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#ef8d46]" />
              <span>Upcoming Company Holidays</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            {upcomingHolidays.map((holiday, idx) => (
              <div key={idx} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                <div>
                  <div className="font-medium text-foreground">{holiday.name}</div>
                  <div className="text-[11px] text-muted-foreground">{holiday.date}</div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-[#ef8d46]">
                    {holiday.days}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
