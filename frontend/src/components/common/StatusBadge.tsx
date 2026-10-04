import React from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, XCircle, AlertCircle, FileText } from 'lucide-react'

interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'Published' | 'Processing' | 'Indexed' | 'Failed' | 'Connected' | 'Warning' | 'Error' | 'Syncing' | string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = status.toLowerCase()

  if (s === 'approved' || s === 'published' || s === 'indexed' || s === 'connected' || s === 'success') {
    return (
      <Badge variant="success" className="gap-1 font-medium text-xs">
        <CheckCircle2 className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (s === 'pending' || s === 'processing' || s === 'syncing') {
    return (
      <Badge variant="warning" className="gap-1 font-medium text-xs">
        <Clock className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (s === 'rejected' || s === 'failed' || s === 'error' || s === 'cancelled') {
    return (
      <Badge variant="destructive" className="gap-1 font-medium text-xs">
        <XCircle className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (s === 'warning') {
    return (
      <Badge variant="warning" className="gap-1 font-medium text-xs">
        <AlertCircle className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-1 text-xs">
      <FileText className="h-3 w-3 text-muted-foreground" />
      {status}
    </Badge>
  )
}
