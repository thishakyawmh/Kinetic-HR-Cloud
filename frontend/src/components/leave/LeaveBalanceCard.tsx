import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  CalendarDays,
  CalendarCheck,
  HeartPulse,
  Coffee,
  Baby,
  Clock,
  Sparkles,
} from 'lucide-react'

interface LeaveBalanceProps {
  balance: {
    id?: string
    leaveTypeId?: string
    leaveTypeName?: string
    leaveType?: string
    code?: string
    totalAllowance?: number
    allocated?: number
    total?: number
    used?: number
    pending?: number
    remaining?: number
  }
}

export const LeaveBalanceCard: React.FC<LeaveBalanceProps> = ({ balance }) => {
  // Normalize leave code/type
  const rawCode = (balance.code || balance.leaveType || 'annual').toLowerCase()

  // Pre-configured theme metadata for each leave category
  const themeConfig: Record<
    string,
    {
      title: string
      icon: React.ComponentType<{ className?: string }>
      accentColor: string
      bgAccent: string
      borderAccent: string
      barGradient: string
      badgeBg: string
    }
  > = {
    annual: {
      title: 'Annual Leave',
      icon: CalendarCheck,
      accentColor: 'text-[#23ace3]',
      bgAccent: 'bg-[#23ace3]/12',
      borderAccent: 'border-[#23ace3]/30',
      barGradient: 'bg-gradient-to-r from-[#23ace3] to-sky-400',
      badgeBg: 'bg-[#23ace3]/10 text-[#23ace3] border-[#23ace3]/20',
    },
    casual: {
      title: 'Casual Leave',
      icon: Coffee,
      accentColor: 'text-[#ef8d46]',
      bgAccent: 'bg-[#ef8d46]/12',
      borderAccent: 'border-[#ef8d46]/30',
      barGradient: 'bg-gradient-to-r from-[#ef8d46] to-amber-400',
      badgeBg: 'bg-[#ef8d46]/10 text-[#ef8d46] border-[#ef8d46]/20',
    },
    medical: {
      title: 'Medical Leave',
      icon: HeartPulse,
      accentColor: 'text-emerald-500',
      bgAccent: 'bg-emerald-500/12',
      borderAccent: 'border-emerald-500/30',
      barGradient: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    sick: {
      title: 'Medical Leave',
      icon: HeartPulse,
      accentColor: 'text-emerald-500',
      bgAccent: 'bg-emerald-500/12',
      borderAccent: 'border-emerald-500/30',
      barGradient: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    maternity: {
      title: 'Maternity Leave',
      icon: Baby,
      accentColor: 'text-purple-500',
      bgAccent: 'bg-purple-500/12',
      borderAccent: 'border-purple-500/30',
      barGradient: 'bg-gradient-to-r from-purple-500 to-fuchsia-400',
      badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
    emergency: {
      title: 'Emergency Leave',
      icon: Sparkles,
      accentColor: 'text-rose-500',
      bgAccent: 'bg-rose-500/12',
      borderAccent: 'border-rose-500/30',
      barGradient: 'bg-gradient-to-r from-rose-500 to-red-400',
      badgeBg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    },
  }

  const currentTheme = themeConfig[rawCode] || {
    title: `${rawCode.charAt(0).toUpperCase() + rawCode.slice(1)} Leave`,
    icon: CalendarDays,
    accentColor: 'text-[#23ace3]',
    bgAccent: 'bg-[#23ace3]/12',
    borderAccent: 'border-[#23ace3]/30',
    barGradient: 'bg-[#23ace3]',
    badgeBg: 'bg-[#23ace3]/10 text-[#23ace3] border-[#23ace3]/20',
  }

  // Robust field resolution
  const title = balance.leaveTypeName || currentTheme.title
  const total = Number(balance.totalAllowance ?? balance.allocated ?? balance.total ?? 14)
  const used = Number(balance.used ?? 0)
  const remaining = Number(
    balance.remaining !== undefined ? balance.remaining : Math.max(0, total - used)
  )
  const pending = Number(balance.pending ?? 0)

  // Progress metrics
  const percentUsed = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0
  const IconComponent = currentTheme.icon

  return (
    <Card className="border border-border/80 bg-card hover:border-[#23ace3]/50 transition-all duration-200 shadow-xs hover:shadow-md rounded-2xl group overflow-hidden relative">
      {/* Subtle decorative top accent border */}
      <div
        className={`h-1 w-full ${currentTheme.barGradient} opacity-80 group-hover:opacity-100 transition-opacity`}
      />

      <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground tracking-tight">
              {title}
            </span>
          </div>

          <div
            className={`p-2 rounded-xl ${currentTheme.bgAccent} ${currentTheme.accentColor} transition-transform group-hover:scale-105`}
          >
            <IconComponent className="h-4 w-4" />
          </div>
        </div>

        {/* Big Counter Value */}
        <div className="flex items-baseline justify-between pt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-sans">
              {remaining}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              days remaining
            </span>
          </div>

          {/* Used percentage badge */}
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${currentTheme.badgeBg}`}
          >
            {total > 0 ? `${Math.round((remaining / total) * 100)}% left` : '0%'}
          </span>
        </div>

        {/* Progress Bar & Stat Details */}
        <div className="space-y-2 pt-1">
          {/* Progress Bar Track */}
          <div className="h-2 w-full bg-muted/80 dark:bg-muted/40 rounded-full overflow-hidden p-0.5 border border-border/40">
            <div
              className={`h-full rounded-full transition-all duration-500 ${currentTheme.barGradient}`}
              style={{ width: `${Math.max(4, percentUsed)}%` }}
            />
          </div>

          {/* Bottom Metric Labels */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5 font-medium">
            <div className="flex items-center gap-1.5">
              <span>Used:</span>
              <span className="text-foreground font-semibold">{used}</span>
              {pending > 0 && (
                <span className="text-[10px] text-amber-500 font-normal">
                  ({pending} pending)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span>Total:</span>
              <span className="text-foreground font-semibold">{total} days</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
