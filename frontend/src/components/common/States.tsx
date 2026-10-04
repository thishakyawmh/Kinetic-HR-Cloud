import React from 'react'
import { Button } from '@/components/ui/button'
import { FolderOpen, AlertTriangle, Loader2 } from 'lucide-react'

export const EmptyState: React.FC<{
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ReactNode
}> = ({
  title = 'No records found',
  description = 'There are no active records in this view.',
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-slate-50/50">
      <div className="p-3 bg-slate-100 rounded-full text-slate-500 mb-3">
        {icon || <FolderOpen className="h-6 w-6" />}
      </div>
      <h4 className="text-base font-semibold text-slate-800">{title}</h4>
      <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'Loading your HR data...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[220px] p-8 text-center">
      <Loader2 className="h-7 w-7 text-primary animate-spin mb-3" />
      <p className="text-sm text-muted-foreground font-medium">{message}</p>
    </div>
  )
}

export const ErrorState: React.FC<{
  title?: string
  message?: string
  onRetry?: () => void
}> = ({
  title = 'Unable to load data',
  message = 'A connection error occurred while querying the HR service.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-rose-200 rounded-xl bg-rose-50/40">
      <div className="p-3 bg-rose-100 rounded-full text-rose-600 mb-3">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h4 className="text-base font-semibold text-slate-900">{title}</h4>
      <p className="text-sm text-muted-foreground max-w-md mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  )
}
