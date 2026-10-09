import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { payrollService } from '@/services/payrollService'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  FileSpreadsheet,
  Download,
  Sparkles,
  DollarSign,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '@/lib/utils'

import { TakeHomePredictionChart } from '@/components/payroll/TakeHomePredictionChart'
import { PaycheckFlowDiagram } from '@/components/payroll/PaycheckFlowDiagram'
import { PaymentOptimizationModal } from '@/components/payroll/PaymentOptimizationModal'

export const EmployeePayslips: React.FC = () => {
  const { user, tenant } = useAuth()
  const navigate = useNavigate()
  const [isOptimizerOpen, setIsOptimizerOpen] = useState<boolean>(false)

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
      >
        <Button
          onClick={() => setIsOptimizerOpen(true)}
          className="bg-[#23ace3] hover:bg-[#1b96c8] text-slate-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2 px-4 py-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Payment Optimization</span>
        </Button>
      </PageHeader>

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

      {/* Payment Optimization Modal */}
      <PaymentOptimizationModal
        isOpen={isOptimizerOpen}
        onClose={() => setIsOptimizerOpen(false)}
        baseSalary={latestPayslip?.grossSalary || 3000.0}
      />
    </div>
  )
}
