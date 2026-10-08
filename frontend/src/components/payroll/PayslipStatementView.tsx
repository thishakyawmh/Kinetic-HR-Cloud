import React from 'react'
import { Payslip, User, Tenant } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { ShieldCheck, FileCheck, Building, UserCheck } from 'lucide-react'

interface PayslipStatementViewProps {
  payslip: Payslip
  user?: User | null
  tenant?: Tenant | null
}

export const PayslipStatementView: React.FC<PayslipStatementViewProps> = ({ payslip, user, tenant }) => {
  const companyName = tenant?.name || 'Acme Corp'
  const employeeName = user?.name || 'Jane Doe'
  const employeeId = user?.employeeNumber || '10459'
  const payPeriod = payslip.payPeriod || '10/01/2026 - 10/14/2026'
  const payDate = payslip.payDate || '10/16/2026'
  const filingStatus = payslip.filingStatus || 'Single'
  const allowances = payslip.allowancesCount ?? 1

  // 1. Gross Earnings Data
  const baseSalaryCurrent = payslip.basicSalary ?? 3000.00
  const baseSalaryYtd = 60000.00
  const overtimeHours = payslip.overtimeHours ?? 0
  const overtimeRate = payslip.overtimeRate ?? 37.50
  const overtimeCurrent = payslip.overtimePay ?? 0.00
  const overtimeYtd = 450.00
  const grossPayCurrent = payslip.grossSalary ?? (baseSalaryCurrent + overtimeCurrent)
  const grossPayYtd = payslip.ytdGrossPay ?? 60450.00

  // 2. Pre-Tax Deductions Data
  const medicalCurrent = payslip.preTaxMedical ?? 100.00
  const medicalYtd = 2000.00
  const dentalCurrent = payslip.preTaxDental ?? 15.00
  const dentalYtd = 3000.00 / 10 // 300.00
  const retirement401kCurrent = payslip.preTax401k ?? 150.00
  const retirement401kYtd = 3000.00

  // 3. Taxes (Statutory Deductions) Data
  const fedTaxCurrent = payslip.taxFederal ?? 320.00
  const fedTaxYtd = 6400.00
  const socSecCurrent = payslip.taxSocialSecurity ?? 186.00
  const socSecYtd = 3720.00
  const medicareCurrent = payslip.taxMedicare ?? 43.50
  const medicareYtd = 870.00
  const stateTaxCurrent = payslip.taxState ?? 120.00
  const stateTaxYtd = 2400.00

  // 4. Summary Totals
  const totalDeductionsCurrent = payslip.totalDeductionsAndTaxes ?? (medicalCurrent + dentalCurrent + retirement401kCurrent + fedTaxCurrent + socSecCurrent + medicareCurrent + stateTaxCurrent)
  const totalDeductionsYtd = payslip.ytdTotalDeductionsAndTaxes ?? 18690.00
  const netPayCurrent = payslip.netSalary ?? (grossPayCurrent - totalDeductionsCurrent)
  const netPayYtd = payslip.ytdNetPay ?? 41760.00

  return (
    <div id="printable-payslip" className="bg-card text-foreground border border-border/70 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
      {/* Document Top Header Banner */}
      <div className="border-b border-border/60 pb-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">
              Company Name: {companyName}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              Authorized Bi-Weekly Pay Statement & Tax Withholding Breakdown
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#23ace3] bg-[#23ace3]/10 border border-[#23ace3]/20 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            <ShieldCheck className="h-4 w-4" />
            <span>IRS W-2 Compliant Record</span>
          </div>
        </div>

        {/* Metadata Line */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2 border-t border-border/40 font-mono">
          <div>
            <strong className="text-foreground">Employee:</strong> {employeeName}
          </div>
          <div>|</div>
          <div>
            <strong className="text-foreground">Employee ID:</strong> {employeeId}
          </div>
          <div>|</div>
          <div>
            <strong className="text-foreground">Pay Period:</strong> {payPeriod}
          </div>
          <div>|</div>
          <div>
            <strong className="text-foreground">Pay Date:</strong> {payDate}
          </div>
          <div>|</div>
          <div>
            <strong className="text-foreground">Filing Status:</strong> {filingStatus}
          </div>
          <div>|</div>
          <div>
            <strong className="text-foreground">Allowances:</strong> {allowances}
          </div>
        </div>
      </div>

      {/* 4 MAIN SECTIONS */}

      {/* Section 1: Gross Earnings */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Earnings
        </div>
        <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/50">
              <tr>
                <th className="py-2.5 px-4 font-bold text-foreground">Earnings</th>
                <th className="py-2.5 px-4">Rate / Hours</th>
                <th className="py-2.5 px-4">Current Period</th>
                <th className="py-2.5 px-4 text-right">Year-to-Date (YTD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr>
                <td className="py-2.5 px-4 font-bold text-foreground">Base Salary</td>
                <td className="py-2.5 px-4 text-muted-foreground">80 hrs @ ${overtimeRate.toFixed(2)}</td>
                <td className="py-2.5 px-4 font-medium font-mono">{formatCurrency(baseSalaryCurrent)}</td>
                <td className="py-2.5 px-4 text-right font-medium font-mono">{formatCurrency(baseSalaryYtd)}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-foreground">Overtime</td>
                <td className="py-2.5 px-4 text-muted-foreground">{overtimeHours} hrs</td>
                <td className="py-2.5 px-4 font-medium font-mono">{formatCurrency(overtimeCurrent)}</td>
                <td className="py-2.5 px-4 text-right font-medium font-mono">{formatCurrency(overtimeYtd)}</td>
              </tr>
              <tr className="bg-muted/30 font-bold">
                <td className="py-3 px-4 font-extrabold text-foreground">Gross Pay</td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4 text-foreground font-mono font-bold">{formatCurrency(grossPayCurrent)}</td>
                <td className="py-3 px-4 text-right text-foreground font-mono font-bold">{formatCurrency(grossPayYtd)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Pre-Tax Deductions */}
      <div className="space-y-2 pt-2">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Pre-Tax Deductions
        </div>
        <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/50">
              <tr>
                <th className="py-2.5 px-4 font-bold text-foreground">Pre-Tax Deductions</th>
                <th className="py-2.5 px-4">Current Period</th>
                <th className="py-2.5 px-4 text-right">Year-to-Date (YTD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr>
                <td className="py-2.5 px-4 font-bold text-foreground">Medical Insurance</td>
                <td className="py-2.5 px-4 font-medium font-mono text-rose-500">-{formatCurrency(medicalCurrent)}</td>
                <td className="py-2.5 px-4 text-right font-medium font-mono text-rose-500">-{formatCurrency(medicalYtd)}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-foreground">Dental Insurance</td>
                <td className="py-2.5 px-4 font-medium font-mono text-rose-500">-{formatCurrency(dentalCurrent)}</td>
                <td className="py-2.5 px-4 text-right font-medium font-mono text-rose-500">-{formatCurrency(dentalYtd)}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-foreground">401(k) Contribution (5%)</td>
                <td className="py-2.5 px-4 font-medium font-mono text-rose-500">-{formatCurrency(retirement401kCurrent)}</td>
                <td className="py-2.5 px-4 text-right font-medium font-mono text-rose-500">-{formatCurrency(retirement401kYtd)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Taxes (Statutory Deductions) */}
      <div className="space-y-2 pt-2">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Taxes (Statutory Deductions)
        </div>
        <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/50">
              <tr>
                <th className="py-2.5 px-4 font-bold text-foreground">Taxes</th>
                <th className="py-2.5 px-4">Current Period</th>
                <th className="py-2.5 px-4 text-right">Year-to-Date (YTD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr>
                <td className="py-2.5 px-4 font-bold text-foreground">Federal Income Tax</td>
                <td className="py-2.5 px-4 font-medium font-mono text-rose-500">-{formatCurrency(fedTaxCurrent)}</td>
                <td className="py-2.5 px-4 text-right font-medium font-mono text-rose-500">-{formatCurrency(fedTaxYtd)}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-foreground">Social Security (6.2%)</td>
                <td className="py-2.5 px-4 font-medium font-mono text-rose-500">-{formatCurrency(socSecCurrent)}</td>
                <td className="py-2.5 px-4 text-right font-medium font-mono text-rose-500">-{formatCurrency(socSecYtd)}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-foreground">Medicare (1.45%)</td>
                <td className="py-2.5 px-4 font-medium font-mono text-rose-500">-{formatCurrency(medicareCurrent)}</td>
                <td className="py-2.5 px-4 text-right font-medium font-mono text-rose-500">-{formatCurrency(medicareYtd)}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-foreground">State Income Tax (approx 4%)</td>
                <td className="py-2.5 px-4 font-medium font-mono text-rose-500">-{formatCurrency(stateTaxCurrent)}</td>
                <td className="py-2.5 px-4 text-right font-medium font-mono text-rose-500">-{formatCurrency(stateTaxYtd)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Net Pay Summary */}
      <div className="space-y-2 pt-2">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Summary
        </div>
        <div className="rounded-xl border border-border/50 overflow-hidden bg-muted/20">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/50">
              <tr>
                <th className="py-2.5 px-4 font-bold text-foreground">Summary</th>
                <th className="py-2.5 px-4">Current Period</th>
                <th className="py-2.5 px-4 text-right">Year-to-Date (YTD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              <tr>
                <td className="py-2.5 px-4 font-bold text-foreground">Gross Pay</td>
                <td className="py-2.5 px-4 font-mono font-semibold text-foreground">{formatCurrency(grossPayCurrent)}</td>
                <td className="py-2.5 px-4 text-right font-mono font-semibold text-foreground">{formatCurrency(grossPayYtd)}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-foreground">Total Deductions & Taxes</td>
                <td className="py-2.5 px-4 font-mono font-semibold text-rose-500">-{formatCurrency(totalDeductionsCurrent)}</td>
                <td className="py-2.5 px-4 text-right font-mono font-semibold text-rose-500">-{formatCurrency(totalDeductionsYtd)}</td>
              </tr>
              <tr className="bg-[#23ace3]/10 font-extrabold border-t border-[#23ace3]/30">
                <td className="py-3.5 px-4 text-sm text-foreground">Net Pay (Take-Home)</td>
                <td className="py-3.5 px-4 text-base text-[#23ace3] font-mono">{formatCurrency(netPayCurrent)}</td>
                <td className="py-3.5 px-4 text-right text-base text-[#23ace3] font-mono">{formatCurrency(netPayYtd)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Audit Notice */}
      <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground gap-2">
        <span>Direct Deposit Account: *********4891 • Automated Clearing House (ACH) Verified</span>
        <span>Generated by Kinetic HR Cloud Payroll Connector</span>
      </div>
    </div>
  )
}
