import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { payrollService } from '@/services/payrollService'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  ArrowLeft,
  Sparkles,
  Download,
  Building,
  Calendar,
  AlertCircle,
  TrendingDown,
  Printer,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export const EmployeePayslipDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, tenant } = useAuth()

  const { data: payslip, isLoading } = useQuery({
    queryKey: ['payslip', id],
    queryFn: () => (id ? payrollService.getPayslipById(id) : undefined),
    enabled: !!id,
  })

  if (isLoading || !payslip) {
    return (
      <div className="p-12 text-center text-sm text-muted-foreground">
        Loading payslip statement...
      </div>
    )
  }

  const handleAskAI = () => {
    const prompt =
      payslip.periodMonth === 'October'
        ? 'Explain why my October take-home salary is lower than September.'
        : `Explain the tax and benefits breakdown for my ${payslip.periodMonth} ${payslip.periodYear} payslip.`
    navigate(`/employee/assistant?prompt=${encodeURIComponent(prompt)}&payslipId=${payslip.id}`)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={`Payslip: ${payslip.periodMonth} ${payslip.periodYear}`}
        subtitle={`Disbursement Date: ${payslip.payDate} • Reference #${payslip.id}`}
        badge={<Badge variant="success">{payslip.status}</Badge>}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/employee/payslips')}
          className="gap-1 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Payslips</span>
        </Button>
      </PageHeader>

      {/* Payslip Header Card */}
      <Card className="border border-border/60 shadow-sm bg-card rounded-2xl overflow-hidden">
        <CardContent className="p-6 space-y-6">
          {/* Company & Employee Identity Banner */}
          <div className="flex flex-col sm:flex-row justify-between pb-6 border-b border-border/50 gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-foreground">{tenant?.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Corporate HR & Payroll Administration</p>
              <div className="text-xs text-muted-foreground mt-2 space-y-0.5 font-mono">
                <div>Employer Tax ID: US-EIN-9482104</div>
                <div className="text-[#23ace3]">Payroll Engine: ADP Vantage Connector (Synced)</div>
              </div>
            </div>
            <div className="sm:text-right">
              <div className="text-sm font-bold text-foreground">{user?.name}</div>
              <div className="text-xs text-muted-foreground">{user?.jobTitle}</div>
              <div className="text-xs text-muted-foreground mt-2 space-y-0.5 font-mono">
                <div>Employee ID: {user?.employeeNumber}</div>
                <div>Department: {user?.department}</div>
              </div>
            </div>
          </div>

          {/* Salary Summary Key Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/30 p-4 rounded-2xl border border-border/50">
            <div>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Basic Contract
              </span>
              <span className="text-base font-bold text-foreground">
                {formatCurrency(payslip.basicSalary)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Gross Earnings
              </span>
              <span className="text-base font-bold text-foreground">
                {formatCurrency(payslip.grossSalary)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Total Deductions
              </span>
              <span className="text-base font-bold text-rose-500">
                -{formatCurrency(payslip.tax + payslip.deductions)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#23ace3] block">
                Net Take-Home Pay
              </span>
              <span className="text-lg font-extrabold text-[#23ace3] font-mono">
                {formatCurrency(payslip.netSalary)}
              </span>
            </div>
          </div>

          {/* Detailed Itemized Ledger */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-foreground">Earnings & Deductions Itemization</h4>
            <div className="rounded-2xl border border-border/60 overflow-hidden bg-card/60">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="border-border/50">
                    <TableHead>Line Item Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslip.breakdown.map((item, idx) => (
                    <TableRow key={idx} className="border-border/40">
                      <TableCell className="font-medium text-xs text-foreground">
                        {item.name}
                        {item.description && (
                          <span className="block text-[11px] text-muted-foreground font-normal">
                            {item.description}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.category === 'earning' ? 'success' : 'destructive'}
                          className={`text-[10px] capitalize font-medium ${
                            item.category === 'earning'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-xs text-foreground font-mono">
                        {item.category === 'deduction' ? '-' : '+'}
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="bg-muted/30 font-bold border-t border-border/60">
                    <TableCell colSpan={2} className="text-xs text-foreground font-semibold">
                      Total Net Disbursed via Direct Deposit
                    </TableCell>
                    <TableCell className="text-right text-sm text-[#23ace3] font-extrabold font-mono">
                      {formatCurrency(payslip.netSalary)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Statement Actions Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/50">
            <span className="text-xs text-muted-foreground">
              Official electronic payroll document generated under IRS Form W-2 compliance.
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs gap-1.5 rounded-xl border-border hover:bg-muted/60"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Statement</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
