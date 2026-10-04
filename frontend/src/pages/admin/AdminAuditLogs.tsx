import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '@/services/adminService'
import { PageHeader } from '@/components/common/PageHeader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ShieldAlert, Download, Filter } from 'lucide-react'

export const AdminAuditLogs: React.FC = () => {
  const { tenant } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [riskFilter, setRiskFilter] = useState('all')

  const { data: logs = [] } = useQuery({
    queryKey: ['adminAuditLogs', tenant?.id, riskFilter],
    queryFn: () => (tenant?.id ? adminService.getAuditLogs(tenant.id, undefined, riskFilter) : []),
    enabled: !!tenant?.id,
  })

  const filteredLogs = logs.filter(l => {
    if (!searchTerm.trim()) return true
    const q = searchTerm.toLowerCase()
    return (
      l.action.toLowerCase().includes(q) ||
      l.userName.toLowerCase().includes(q) ||
      l.resource.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit & Compliance Logs"
        subtitle="Immutable audit trail recording all AI tool invocations, leave decisions, and sensitive HR operations."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const json = JSON.stringify(logs, null, 2)
            const blob = new Blob([json], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `audit-logs-${tenant?.code}-${new Date().toISOString().substring(0, 10)}.json`
            a.click()
          }}
          className="gap-1.5 text-xs"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Audit Trail</span>
        </Button>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search audit trail by actor, action, or resource ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            className="h-10 rounded-xl"
          >
            <option value="all">All Risk Levels</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
          </Select>
        </div>
      </div>

      {/* Audit Log Table (Section 28) */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/50">
              <TableHead>Timestamp</TableHead>
              <TableHead>User / Actor</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Risk Level</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map(log => (
              <TableRow key={log.id} className="border-border/40 hover:bg-muted/30 transition-colors">
                <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                  {log.timestamp}
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-xs text-foreground">{log.userName}</div>
                  <div className="text-[10px] text-muted-foreground capitalize">{log.userRole}</div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{log.tenantName}</TableCell>
                <TableCell>
                  <div className="font-medium text-xs text-foreground">{log.action}</div>
                  <div className="text-[11px] text-muted-foreground line-clamp-1">{log.details}</div>
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground max-w-xs truncate">
                  {log.resource}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      log.result === 'Success'
                        ? 'success'
                        : log.result === 'Pending Approval'
                        ? 'warning'
                        : 'outline'
                    }
                    className="text-[10px]"
                  >
                    {log.result}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      log.riskLevel === 'High'
                        ? 'destructive'
                        : log.riskLevel === 'Medium'
                        ? 'warning'
                        : 'outline'
                    }
                    className="text-[10px] font-bold"
                  >
                    {log.riskLevel}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
