import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { payrollService } from '@/services/payrollService'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Download,
  Printer,
  FileCheck,
  SlidersHorizontal,
} from 'lucide-react'

import { PayslipStatementView } from '@/components/payroll/PayslipStatementView'
import { PaymentOptimizationModal } from '@/components/payroll/PaymentOptimizationModal'

export const EmployeePayslipDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, tenant } = useAuth()
  const [isOptimizerOpen, setIsOptimizerOpen] = useState<boolean>(false)

  const { data: payslip, isLoading } = useQuery({
    queryKey: ['payslip', id],
    queryFn: () => (id ? payrollService.getPayslipById(id) : undefined),
    enabled: !!id,
  })

  if (isLoading || !payslip) {
    return (
      <div className="p-12 text-center text-sm text-muted-foreground">
        Loading payslip statement & earnings data...
      </div>
    )
  }

  const handleDownloadPDF = async () => {
    try {
      const res = await payrollService.getDownloadUrl(payslip.id)
      if (res?.downloadUrl) {
        window.open(res.downloadUrl, '_blank')
        return
      }
    } catch (e) {
      console.warn('Backend PDF download URL unavailable, launching browser PDF print viewer:', e)
    }
    // Browser print to PDF fallback
    window.print()
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        title={`Payslip Statement: ${payslip.periodMonth} ${payslip.periodYear}`}
        subtitle={`Disbursement Date: ${payslip.payDate} • Reference #${payslip.id}`}
        badge={<Badge variant="success">{payslip.status}</Badge>}
        backButton={
          <button
            type="button"
            onClick={() => navigate('/employee/payslips')}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer group py-1"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Payslips</span>
          </button>
        }
      />

      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border/60 shadow-xs">
        <div className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-[#23ace3]" />
          <div>
            <span className="text-xs font-bold text-foreground block">
              Official Authorized Earnings Record
            </span>
            <span className="text-[11px] text-muted-foreground">
              {tenant?.name || 'Acme Corp'} • Employee ID: {user?.employeeNumber || '10459'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsOptimizerOpen(true)}
            className="text-xs gap-1.5 rounded-xl bg-[#23ace3] text-slate-950 hover:bg-[#1b96c8] font-bold cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Payment Optimization</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            className="text-xs gap-1.5 rounded-xl border-border hover:bg-muted/60 font-semibold cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download PDF</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs gap-1.5 rounded-xl border-border hover:bg-muted/60 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Statement</span>
          </Button>
        </div>
      </div>

      {/* EXCLUSIVE 4-SECTION ITEMIZED STATEMENT DOCUMENT */}
      <PayslipStatementView payslip={payslip} user={user} tenant={tenant} />

      {/* Payment Optimization Modal */}
      <PaymentOptimizationModal
        isOpen={isOptimizerOpen}
        onClose={() => setIsOptimizerOpen(false)}
        baseSalary={payslip.grossSalary || 3000.0}
      />
    </div>
  )
}
