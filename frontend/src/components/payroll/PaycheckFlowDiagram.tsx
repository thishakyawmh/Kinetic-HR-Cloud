import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Sparkles, RefreshCw, Clock, ShieldCheck, Calculator, SlidersHorizontal } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PaycheckFlowProps {
  baseHourlyRate?: number
  defaultRegHours?: number
  defaultOtHours?: number
  defaultOtMultiplier?: number
  defaultPreTax401k?: number
  defaultHealthDental?: number
  defaultFedStateTaxRate?: number
}

export const PaycheckFlowDiagram: React.FC<PaycheckFlowProps> = ({
  baseHourlyRate = 37.50, // Fixed hourly rate
  defaultRegHours = 80,
  defaultOtHours = 0,
  defaultOtMultiplier = 1.5,
  defaultPreTax401k = 150,
  defaultHealthDental = 115,
  defaultFedStateTaxRate = 0.1467, // ~14.67% ($440 on $3000)
}) => {
  const navigate = useNavigate()
  // State for adjustable parameters (Defaults initialized to AI Predicted values)
  const [regHours, setRegHours] = useState<number>(defaultRegHours)
  const [otHours, setOtHours] = useState<number>(defaultOtHours)
  const [otMultiplier, setOtMultiplier] = useState<number>(defaultOtMultiplier)
  const [preTax401k, setPreTax401k] = useState<number>(defaultPreTax401k)
  const [healthDental, setHealthDental] = useState<number>(defaultHealthDental)
  const [isOptimizerOpen, setIsOptimizerOpen] = useState<boolean>(false)

  // Reset function to restore AI Predicted default values
  const handleResetToAIPrediction = () => {
    setRegHours(defaultRegHours)
    setOtHours(defaultOtHours)
    setOtMultiplier(defaultOtMultiplier)
    setPreTax401k(defaultPreTax401k)
    setHealthDental(defaultHealthDental)
  }

  // Real-time Earnings Calculations
  const regularPay = regHours * baseHourlyRate
  const overtimePay = otHours * (baseHourlyRate * otMultiplier)
  const grossSalary = regularPay + overtimePay

  // Real-time Subtractions Calculations
  const totalPreTaxDeductions = preTax401k + healthDental

  // Statutory FICA Tax is fixed at 7.65% (6.2% Social Security + 1.45% Medicare)
  const ficaTax = grossSalary * 0.0765

  // Income Tax (Federal & State Progressive Bracket)
  const fedStateTax = grossSalary * defaultFedStateTaxRate

  const totalTaxes = ficaTax + fedStateTax
  const totalDeductions = totalPreTaxDeductions + totalTaxes
  const netSalary = Math.max(0, grossSalary - totalDeductions)
  const netRatio = grossSalary > 0 ? Math.round((netSalary / grossSalary) * 100) : 0

  return (
    <div className="bg-card border border-border/60 p-6 rounded-2xl shadow-xs space-y-6">
      {/* Header & Reset Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground">Take-Home Pay Predictor</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI Predicted Baseline Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Adjust working hours and benefits to simulate take-home pay. Hourly rate and statutory taxes are locked by payroll policy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => navigate('/admin/payment-settings')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#23ace3] hover:bg-[#1b96c8] text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-xs"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Payment Configuration</span>
          </button>

          <button
            type="button"
            onClick={handleResetToAIPrediction}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 hover:bg-muted text-xs font-semibold text-foreground border border-border/60 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#23ace3]" />
            <span>Reset to AI Prediction</span>
          </button>
        </div>
      </div>

      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-muted/20 p-4 rounded-2xl border border-border/50 text-center">
        <div>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Gross Salary</div>
          <div className="text-lg font-extrabold text-foreground font-mono mt-0.5">
            {formatCurrency(grossSalary)}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Deductions</div>
          <div className="text-lg font-extrabold text-rose-500 font-mono mt-0.5">
            -{formatCurrency(totalDeductions)}
          </div>
        </div>

        <div>
          <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Net Take-Home Pay</div>
          <div className="text-xl font-black text-emerald-500 font-mono mt-0.5">
            {formatCurrency(netSalary)}
          </div>
        </div>

        <div>
          <div className="text-xs text-[#23ace3] font-semibold uppercase tracking-wider">Take-Home Ratio</div>
          <div className="text-lg font-extrabold text-[#23ace3] font-mono mt-0.5">
            {netRatio}%
          </div>
        </div>
      </div>

      {/* ADJUSTABLE CONTROLS SECTION */}
      <div className="space-y-6 pt-2">
        {/* 1. Earning Metrics (The Inputs) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#23ace3]" />
              1. Earning Metrics (The Inputs)
            </h4>
            <span className="text-[11px] text-muted-foreground">
              Adjust working and overtime hours
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-muted/20 p-4 rounded-xl border border-border/40">
            {/* Base Hourly Rate (Fixed) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-amber-400" />
                  Base Hourly Rate
                </span>
                <span className="font-mono font-bold text-foreground">
                  {formatCurrency(baseHourlyRate)} / hr
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground bg-muted/50 p-2 rounded-lg border border-border/40 flex items-center justify-between">
                <span>Fixed by Employment Contract</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Fixed
                </span>
              </div>
            </div>

            {/* Overtime Multiplier */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                <span>Overtime Multiplier</span>
                <span className="font-mono font-bold text-[#23ace3]">{otMultiplier}x Rate</span>
              </div>
              <div className="flex gap-2">
                {[1.5, 2.0].map(mult => (
                  <button
                    key={mult}
                    type="button"
                    onClick={() => setOtMultiplier(mult)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      otMultiplier === mult
                        ? 'bg-[#23ace3] text-white shadow-xs'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {mult === 1.5 ? '1.5x (Time & Half)' : '2.0x (Double Time)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Regular Working Hours */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                <span>Regular Working Hours</span>
                <span className="font-mono font-bold text-foreground">{regHours} hrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={regHours}
                onChange={e => setRegHours(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-[#23ace3]"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>0 hrs</span>
                <span>40 hrs / wk</span>
                <span>80 hrs (Bi-weekly)</span>
                <span>100 hrs</span>
              </div>
            </div>

            {/* Overtime Hours */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                <span>Overtime Hours</span>
                <span className="font-mono font-bold text-amber-400">{otHours} hrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={otHours}
                onChange={e => setOtHours(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>0 hrs (Standard)</span>
                <span>10 hrs</span>
                <span>20 hrs</span>
                <span>40 hrs</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Tax & Deduction Metrics (The Subtractions) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-rose-400" />
              2. Tax & Deduction Metrics (The Subtractions)
            </h4>
            <span className="text-[11px] text-muted-foreground">
              Adjust pre-tax contributions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-muted/20 p-4 rounded-xl border border-border/40">
            {/* Pre-Tax 401(k) Contribution */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                <span>401(k) Retirement Contribution</span>
                <span className="font-mono font-bold text-emerald-400">{formatCurrency(preTax401k)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={preTax401k}
                onChange={e => setPreTax401k(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>$0 (0%)</span>
                <span>$150 (5%)</span>
                <span>$300 (10%)</span>
                <span>$500</span>
              </div>
            </div>

            {/* Health & Dental Insurance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                <span>Health & Dental Insurance</span>
                <span className="font-mono font-bold text-yellow-400">{formatCurrency(healthDental)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="5"
                value={healthDental}
                onChange={e => setHealthDental(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-yellow-400"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>$0 (None)</span>
                <span>$115 (Standard)</span>
                <span>$200</span>
                <span>$300 (Family Plan)</span>
              </div>
            </div>

            {/* Fixed FICA Taxes (Statutory) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-amber-400" />
                  Payroll Taxes (FICA)
                </span>
                <span className="font-mono font-bold text-foreground">7.65% Fixed</span>
              </div>
              <div className="text-[11px] text-muted-foreground bg-muted/50 p-2 rounded-lg border border-border/40 flex items-center justify-between">
                <span>6.2% Social Security + 1.45% Medicare</span>
                <span className="font-mono font-bold text-rose-400">{formatCurrency(ficaTax)}</span>
              </div>
            </div>

            {/* Fixed Effective Income Tax Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-amber-400" />
                  Effective Income Tax Rate
                </span>
                <span className="font-mono font-bold text-foreground">14.67% Bracket</span>
              </div>
              <div className="text-[11px] text-muted-foreground bg-muted/50 p-2 rounded-lg border border-border/40 flex items-center justify-between">
                <span>W-4 Statutory Federal & State Withholding</span>
                <span className="font-mono font-bold text-rose-400">{formatCurrency(fedStateTax)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
