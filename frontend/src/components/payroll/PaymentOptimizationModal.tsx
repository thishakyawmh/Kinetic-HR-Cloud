import React, { useState } from 'react'
import {
  Sparkles,
  SlidersHorizontal,
  X,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Zap,
  Info,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

interface PaymentOptimizationModalProps {
  isOpen: boolean
  onClose: () => void
  baseSalary?: number
}

export const PaymentOptimizationModal: React.FC<PaymentOptimizationModalProps> = ({
  isOpen,
  onClose,
  baseSalary = 3000.0,
}) => {
  // 5 Toggles requested by user: OT, Target Coverage, Bonus, EPF, ETF
  const [enableOT, setEnableOT] = useState<boolean>(true)
  const [enableTargetCoverage, setEnableTargetCoverage] = useState<boolean>(true)
  const [enableBonus, setEnableBonus] = useState<boolean>(true)
  const [enableEPF, setEnableEPF] = useState<boolean>(true)
  const [enableETF, setEnableETF] = useState<boolean>(true)

  if (!isOpen) return null

  // Parameter Amounts
  const otAmount = 450.0 // 12 Hours OT Pay
  const targetCoverageAmount = 350.0 // Duty Handoff / On-Call Coverage Allowance
  const bonusAmount = 500.0 // Quarterly Performance Target Bonus
  const epfRate = 0.08 // EPF 8% Employee Contribution
  const etfRate = 0.03 // ETF 3% Employer Contribution
  const epfEmployerRate = 0.12 // EPF 12% Employer Contribution

  // Dynamic Calculated Earnings
  const activeOT = enableOT ? otAmount : 0
  const activeTargetCoverage = enableTargetCoverage ? targetCoverageAmount : 0
  const activeBonus = enableBonus ? bonusAmount : 0

  const calculatedGross = baseSalary + activeOT + activeTargetCoverage + activeBonus

  // Statutory & Tax Deductions
  const activeEPF = enableEPF ? baseSalary * epfRate : 0
  const activeETF = enableETF ? baseSalary * etfRate : 0
  const activeEmployerEPF = enableETF ? baseSalary * epfEmployerRate : 0

  // Estimated Tax withholding (~12% on Gross)
  const taxEstimate = calculatedGross * 0.12

  const totalDeductions = activeEPF + taxEstimate
  const netTakeHome = Math.max(0, calculatedGross - totalDeductions)

  // Baseline Comparison (Everything OFF)
  const baselineGross = baseSalary
  const baselineDeductions = baseSalary * epfRate + baseSalary * 0.12
  const baselineNet = baselineGross - baselineDeductions
  const netDifference = netTakeHome - baselineNet

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="max-w-2xl w-full bg-card border border-border/80 rounded-[28px] shadow-2xl p-6 sm:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted/60 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 border-b border-border/50 pb-5">
          <div className="h-12 w-12 rounded-2xl bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30 flex items-center justify-center font-bold shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">Kinetic AI Payment Optimizer</h3>
              <Badge variant="outline" className="bg-[#23ace3]/10 text-[#23ace3] border-[#23ace3]/30 text-[10px] font-bold">
                Realtime Calculator
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure component toggles to optimize take-home pay, statutory EPF/ETF contributions, and OT coverage allowances.
            </p>
          </div>
        </div>

        {/* Live Calculation Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/30 p-4 rounded-2xl border border-border/60">
          <div className="p-3 rounded-xl bg-card border border-border/40">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block">Calculated Gross</span>
            <span className="text-lg font-extrabold text-foreground font-mono mt-1 block">
              {formatCurrency(calculatedGross)}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">Base: {formatCurrency(baseSalary)}</span>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border/40">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block">Total Deductions & Tax</span>
            <span className="text-lg font-extrabold text-rose-400 font-mono mt-1 block">
              -{formatCurrency(totalDeductions)}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">EPF: {formatCurrency(activeEPF)}</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider block">Optimized Net Take-Home</span>
            <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">
              {formatCurrency(netTakeHome)}
            </span>
            <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {netDifference >= 0 ? `+${formatCurrency(netDifference)} vs base` : `${formatCurrency(netDifference)} vs base`}
            </span>
          </div>
        </div>

        {/* 5 TOGGLE CONTROLS SECTION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[#23ace3]" />
              <span>Payment Component Toggle Controls</span>
            </h4>
            <span className="text-[11px] text-muted-foreground">Toggle components ON / OFF</span>
          </div>

          <div className="space-y-2.5">
            {/* 1. Overtime (OT) Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-card hover:border-[#23ace3]/40 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">Overtime Pay (OT)</span>
                  <Badge variant="outline" className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[10px]">
                    1.5x Hourly Rate
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Approved 12 hours overtime shift payout entitlement.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-emerald-400">+{formatCurrency(otAmount)}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enableOT}
                  onClick={() => setEnableOT(!enableOT)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    enableOT ? 'bg-[#23ace3]' : 'bg-slate-700/60'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      enableOT ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 2. Target Coverage Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-card hover:border-[#23ace3]/40 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">Target Coverage Allowance</span>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-[10px]">
                    On-Call Handoff
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Incentive allowance for taking duty coverage & on-call handoffs.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-emerald-400">+{formatCurrency(targetCoverageAmount)}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enableTargetCoverage}
                  onClick={() => setEnableTargetCoverage(!enableTargetCoverage)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    enableTargetCoverage ? 'bg-[#23ace3]' : 'bg-slate-700/60'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      enableTargetCoverage ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 3. Performance Bonus Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-card hover:border-[#23ace3]/40 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">Performance Bonus</span>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                    Quarterly Target
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Executive key performance indicator (KPI) incentive reward.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-emerald-400">+{formatCurrency(bonusAmount)}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enableBonus}
                  onClick={() => setEnableBonus(!enableBonus)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    enableBonus ? 'bg-[#23ace3]' : 'bg-slate-700/60'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      enableBonus ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 4. EPF Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-card hover:border-[#23ace3]/40 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">EPF (Employee Provident Fund - 8%)</span>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                    Statutory Employee Deduction
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Mandatory 8% employee statutory contribution deducted from basic pay.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-rose-400">
                  -{formatCurrency(enableEPF ? baseSalary * epfRate : 0)}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enableEPF}
                  onClick={() => setEnableEPF(!enableEPF)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    enableEPF ? 'bg-[#23ace3]' : 'bg-slate-700/60'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      enableEPF ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 5. ETF Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-card hover:border-[#23ace3]/40 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">ETF (3% Employer) & Employer EPF (12%)</span>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                    Employer Statutory Trust
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Employer-contributed Employees Trust Fund (3%) & EPF (12%) accumulation.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-emerald-400">
                  +{formatCurrency(enableETF ? baseSalary * (etfRate + epfEmployerRate) : 0)}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enableETF}
                  onClick={() => setEnableETF(!enableETF)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    enableETF ? 'bg-[#23ace3]' : 'bg-slate-700/60'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      enableETF ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendation Box */}
        <div className="p-4 rounded-2xl bg-[#23ace3]/10 border border-[#23ace3]/20 space-y-1.5 text-xs text-[#23ace3]">
          <div className="font-bold flex items-center gap-1.5">
            <Zap className="h-4 w-4" /> Kinetic AI Compensation Recommendation:
          </div>
          <p className="text-[11px] text-sky-200/90 leading-relaxed">
            By toggling <strong>Target Coverage</strong> and <strong>OT Pay</strong> ON, your monthly net take-home increases by <strong>+{formatCurrency(otAmount + targetCoverageAmount)}</strong> while maintaining full EPF (8%) & ETF (3%) statutory compliance.
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-border/50">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            Close Optimizer
          </Button>
          <Button
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs font-bold bg-[#23ace3] hover:bg-[#1b96c8] text-slate-950 cursor-pointer"
          >
            Apply Payment Optimization
          </Button>
        </div>
      </Card>
    </div>
  )
}
