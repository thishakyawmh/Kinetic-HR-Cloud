import React from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  badge?: React.ReactNode
  backButton?: React.ReactNode
  children?: React.ReactNode
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, badge, backButton, children }) => {
  return (
    <div className="space-y-3 pb-6 mb-6 border-b border-border/60">
      {backButton && (
        <div className="flex items-center">
          {backButton}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
      </div>
    </div>
  )
}
