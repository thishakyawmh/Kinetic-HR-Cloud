import React from 'react'
import { LeaveBalance } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

export const LeaveBalanceCard: React.FC<{ balance: LeaveBalance }> = ({ balance }) => {
  const percentUsed = Math.min(100, Math.round((balance.used / (balance.totalAllowance || 1)) * 100))
  const isEmergency = balance.code === 'emergency'
  const isCasual = balance.code === 'casual'

  return (
    <Card className="border-border bg-card hover:border-[#23ace3]/50 transition-all shadow-xs group">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            {balance.leaveTypeName}
          </span>
          <div className="p-1.5 rounded-lg bg-[#23ace3]/15 text-[#23ace3]">
            <Calendar className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-foreground tracking-tight group-hover:text-[#23ace3] transition-colors">
            {balance.remaining}
          </span>
          <span className="text-xs font-medium text-muted-foreground">days remaining</span>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 space-y-1.5">
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isEmergency
                  ? 'bg-[#ef8d46]'
                  : isCasual
                  ? 'bg-gradient-to-r from-[#23ace3] to-[#ef8d46]'
                  : 'bg-[#23ace3]'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Used: <strong className="text-foreground/90 font-semibold">{balance.used}</strong></span>
            <span>Total: <strong className="text-foreground/90 font-semibold">{balance.totalAllowance} days</strong></span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
