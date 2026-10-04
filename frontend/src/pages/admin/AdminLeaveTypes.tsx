import React from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CalendarDays, ShieldCheck, Settings, PlusCircle } from 'lucide-react'

export const AdminLeaveTypes: React.FC = () => {
  const leaveConfigs = [
    {
      name: 'Annual Leave',
      allowance: '20 days',
      approval: 'Required (Direct Manager)',
      carryForward: 'Max 5 days into Q1',
      emergency: 'No',
      thresholdRule: 'Checked against 70% sprint quota',
    },
    {
      name: 'Sick Leave',
      allowance: '10 days',
      approval: 'Auto-approved up to 2 days',
      carryForward: 'Non-accruing (Resets Jan 1)',
      emergency: 'No',
      thresholdRule: 'Medical cert required if > 3 days',
    },
    {
      name: 'Emergency Leave',
      allowance: '3 days',
      approval: 'Required (Expedited SLA)',
      carryForward: 'Non-accruing',
      emergency: 'Yes (Dependent Illness Sec 4.2)',
      thresholdRule: 'AI Evaluated with Manager Override',
    },
    {
      name: 'Casual Leave',
      allowance: '5 days',
      approval: 'Required',
      carryForward: 'None',
      emergency: 'No',
      thresholdRule: '48hr notice required',
    },
    {
      name: 'Unpaid / Special Leave',
      allowance: 'Discretionary',
      approval: 'Required (HR Admin + Manager)',
      carryForward: 'N/A',
      emergency: 'Case by Case',
      thresholdRule: 'Requires Executive Sign-Off',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Types & Statutory Quota Configuration"
        subtitle="Manage company-wide leave entitlements, carry-over rules, and automated approval workflows."
      />

      {/* Leave Types Configuration Table (Section 25) */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/50">
              <TableHead>Leave Type</TableHead>
              <TableHead>Default Annual Allowance</TableHead>
              <TableHead>Approval Workflow</TableHead>
              <TableHead>Carry-Forward Rule</TableHead>
              <TableHead>Emergency Protocol</TableHead>
              <TableHead>Threshold Governance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaveConfigs.map((cfg, i) => (
              <TableRow key={i} className="border-border/40 hover:bg-muted/30 transition-colors">
                <TableCell className="font-bold text-xs text-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[#23ace3]" />
                    <span>{cfg.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-semibold text-foreground">
                  {cfg.allowance}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    {cfg.approval}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{cfg.carryForward}</TableCell>
                <TableCell>
                  <Badge
                    variant={cfg.emergency.startsWith('Yes') ? 'destructive' : 'outline'}
                    className={`text-[10px] ${
                      cfg.emergency.startsWith('Yes')
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'border-border/60 text-muted-foreground'
                    }`}
                  >
                    {cfg.emergency}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{cfg.thresholdRule}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
