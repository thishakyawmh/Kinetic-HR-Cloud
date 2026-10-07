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
    <Card className={cn('relative overflow-hidden border border-border/80 bg-card hover:border-[#23ace3]/40 transition-all shadow-xs rounded-2xl', className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">{title}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            {badge}
            {Icon && (
              <div className={cn('p-2 rounded-xl shrink-0', iconColor)}>
                <Icon className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2.5">
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{value}</h3>
          {trend && (
            <span
              className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap',
                trend.positive
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
                  : 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25'
              )}
            >
              {trend.value}
            </span>
          )}
        </div>

        {subtitle && <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
