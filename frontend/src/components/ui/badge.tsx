import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'ai'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
    destructive: 'border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400',
    outline: 'text-foreground border-border bg-card/50',
    success: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    warning: 'border-[#ef8d46]/30 bg-[#ef8d46]/15 text-[#c86b25] dark:text-[#ef8d46]',
    info: 'border-[#23ace3]/30 bg-[#23ace3]/15 text-[#0284c7] dark:text-[#23ace3]',
    ai: 'border-[#23ace3]/40 bg-[#23ace3]/15 text-[#0284c7] dark:text-[#23ace3] font-medium',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
