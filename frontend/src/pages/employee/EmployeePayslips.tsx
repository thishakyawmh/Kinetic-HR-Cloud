import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { payrollService } from '@/services/payrollService'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  FileSpreadsheet,
  Download,
  ArrowRight,
  Sparkles,
  DollarSign,
  TrendingDown,
  ShieldCheck,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '@/lib/utils'

import { TakeHomePredictionChart } from '@/components/payroll/TakeHomePredictionChart'
import { PaycheckFlowDiagram } from '@/components/payroll/PaycheckFlowDiagram'

export const EmployeePayslips: React.FC = () => {
  const { user, tenant } = useAuth()
  const navigate = useNavigate()

  const { data: payslips = [] } = useQuery({
    queryKey: ['payslips', tenant?.id, user?.id],
    queryFn: () => (tenant?.id && user?.id ? payrollService.getPayslips(tenant.id, user.id) : []),
    enabled: !!tenant?.id && !!user?.id,
  })

  const latestPayslip = payslips.length > 0 ? payslips[0] : null

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <PageHeader
        title="Payslips & Compensation"
        subtitle="Access your authorized monthly earnings statements, tax withholdings, and benefits deductions."
      />

      {/* 1. TAKE-HOME PAY PREDICTION LINE GRAPH */}
      <TakeHomePredictionChart />

      {/* 2. INTERACTIVE TAKE-HOME PAY PREDICTOR & SLICING FLOW */}
      <PaycheckFlowDiagram
        baseHourlyRate={37.50}
        defaultRegHours={80}
        defaultOtHours={latestPayslip?.overtimeHours || 0}
        defaultPreTax401k={latestPayslip?.preTax401k || 150}
        defaultHealthDental={(latestPayslip?.preTaxMedical || 100) + (latestPayslip?.preTaxDental || 15)}
      />

      {/* Payslip History Cards */}
      <div className="space-y-3 pt-2">
        <h3 className="text-base font-bold text-foreground">Recent Statements</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {payslips.map((p, idx) => (
            <Card
              key={p.id}
              onClick={() => navigate(`/employee/payslips/${p.id}`)}
              className={`cursor-pointer transition-all hover:border-[#23ace3]/50 hover:shadow-md bg-card border-border/60 ${
                idx === 0 ? 'border-[#23ace3]/40 bg-[#23ace3]/5' : ''
              }`}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {p.periodMonth} {p.periodYear}
                  </span>
                  <Badge
                    variant={idx === 0 ? 'info' : 'outline'}
                    className={`text-[10px] ${idx === 0 ? 'bg-[#23ace3]/15 text-[#23ace3] border-[#23ace3]/30' : ''}`}
                  >
                    {p.status}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Gross Salary:</span>
                    <span className="font-semibold text-foreground">{formatCurrency(p.grossSalary)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Total Deductions:</span>
                    <span className="font-semibold text-rose-500">
                      -{formatCurrency(p.tax + p.deductions)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t border-border/50">
                    <span className="text-foreground">Take-Home Pay:</span>
                    <span className="text-[#23ace3] font-mono">{formatCurrency(p.netSalary)}</span>
                  </div>
                </div>

                {idx === 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400 flex items-center gap-2">
                    <TrendingDown className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>$120 delta from Sep due to Q4 tax tier adjustments.</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 text-xs font-medium text-[#23ace3] hover:underline">
                  <span>View itemized statement</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Comprehensive Statement Ledger Table */}
      <div className="space-y-3 pt-2">
        <h3 className="text-base font-bold text-foreground">Compensation History</h3>
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/50">
                <TableHead>Pay Period</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Taxes</TableHead>
                <TableHead>Benefits & Deductions</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips.map(p => (
                <TableRow
                  key={p.id}
                  onClick={() => navigate(`/employee/payslips/${p.id}`)}
                  className="cursor-pointer hover:bg-muted/40 border-border/40 transition-colors"
                >
                  <TableCell className="font-bold text-xs text-foreground">
                    {p.periodMonth} {p.periodYear}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.payDate}</TableCell>
                  <TableCell className="text-xs text-foreground font-medium">
                    {formatCurrency(p.grossSalary)}
                  </TableCell>
                  <TableCell className="text-xs text-rose-400">-{formatCurrency(p.tax)}</TableCell>
                  <TableCell className="text-xs text-rose-400">-{formatCurrency(p.deductions)}</TableCell>
                  <TableCell className="text-xs font-bold text-[#23ace3] font-mono">
                    {formatCurrency(p.netSalary)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation()
                        navigate(`/employee/payslips/${p.id}`)
                      }}
                      className="text-xs text-[#23ace3] hover:text-white hover:bg-[#23ace3]/20 rounded-lg"
                    >
                      View Statement
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
