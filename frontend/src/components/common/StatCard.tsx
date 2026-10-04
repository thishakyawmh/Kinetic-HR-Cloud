import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  iconColor?: string
  trend?: {
    value: string
    positive?: boolean
  }
  className?: string
  badge?: React.ReactNode
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary bg-primary/10',
  trend,
  className,
  badge,
}) => {
  return (
    <Card className={cn('relative overflow-hidden hover:border-slate-300 transition-all shadow-sm', className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <div className="flex items-center gap-2">
            {badge}
            {Icon && (
              <div className={cn('p-2 rounded-lg', iconColor)}>
                <Icon className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
          {trend && (
            <span
              className={cn(
                'text-xs font-semibold px-1.5 py-0.5 rounded',
                trend.positive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
              )}
            >
              {trend.value}
            </span>
          )}
        </div>

        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
