import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '@/services/adminService'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Layers,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Server,
} from 'lucide-react'

export const AdminIntegrations: React.FC = () => {
  const { data: integrations = [], refetch, isFetching } = useQuery({
    queryKey: ['adminIntegrations'],
    queryFn: () => adminService.getIntegrations(),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise System Integrations"
        subtitle="Manage secure cloud connectivity to Workday HRMS, ADP Payroll, Biometric Attendance, and Microsoft Entra ID."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Sync Status</span>
        </Button>
      </PageHeader>

      {/* Integration Cards (Section 30) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map(int => (
          <Card
            key={int.id}
            className={`border transition-all ${
              int.status === 'Warning'
                ? 'border-amber-300 bg-amber-50/20'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                    <Server className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{int.systemName}</h4>
                    <span className="text-[11px] text-muted-foreground">{int.provider}</span>
                  </div>
                </div>
                <StatusBadge status={int.status} />
              </div>

              {/* System Details Box */}
              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-semibold text-slate-800">{int.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Heartbeat:</span>
                  <span className="font-mono text-slate-800">{int.lastSync}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">API Latency:</span>
                  <span
                    className={`font-mono font-semibold ${
                      int.latencyMs > 1000 ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                  >
                    {int.latencyMs} ms
                  </span>
                </div>
                <div className="pt-1 text-[11px] text-muted-foreground truncate" title={int.endpoint}>
                  Endpoint: <span className="font-mono">{int.endpoint}</span>
                </div>
              </div>

              {int.notes && (
                <p className="text-[11px] text-slate-600 italic leading-snug">
                  {int.notes}
                </p>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                <span className="text-[11px] text-muted-foreground">REST / TLS 1.3</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-sky-600">
                  <span>Diagnostics</span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
