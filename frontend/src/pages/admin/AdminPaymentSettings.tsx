import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { payrollService } from '@/services/payrollService'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Zap,
  Target,
  Gift,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  ChevronDown,
  Calculator,
  SlidersHorizontal,
} from 'lucide-react'

interface TargetTier {
  id: string
  rangeLabel: string
  lowerThreshold: number
  upperThreshold: number
  unit: string
  ratePercent: number
}

export const AdminPaymentSettings: React.FC = () => {
  const { tenant, user } = useAuth()
  const queryClient = useQueryClient()

  // Saved Server State Query
  const { data: serverSettings, isLoading } = useQuery({
    queryKey: ['paymentSettings', tenant?.id],
    queryFn: () => (tenant?.id ? payrollService.getPaymentSettings(tenant.id) : undefined),
    enabled: !!tenant?.id,
  })

  // Local Editable Settings State
  const [otEnabled, setOtEnabled] = useState<boolean>(true)
  const [otBasis, setOtBasis] = useState<'1.5x' | '2x' | 'custom'>('1.5x')
  const [otCustomMultiplier, setOtCustomMultiplier] = useState<number>(1.5)
  const [otMaxHours, setOtMaxHours] = useState<number>(40)
  const [otRequireApproval, setOtRequireApproval] = useState<boolean>(true)
  const [otEffectiveFrom, setOtEffectiveFrom] = useState<string>('2026-01-01')

  const [targetCoverageEnabled, setTargetCoverageEnabled] = useState<boolean>(true)
  const [targetCoverageBase, setTargetCoverageBase] = useState<'net' | 'basic' | 'fixed'>('net')
  const [targetCoverageMethod, setTargetCoverageMethod] = useState<'progressive' | 'highest'>('progressive')
  const [targetTiers, setTargetTiers] = useState<TargetTier[]>([
    { id: 'tier-1', rangeLabel: 'First 20 target units', lowerThreshold: 0, upperThreshold: 20, unit: 'units', ratePercent: 0.50 },
    { id: 'tier-2', rangeLabel: 'Next 20 units', lowerThreshold: 20, upperThreshold: 40, unit: 'units', ratePercent: 0.75 },
    { id: 'tier-3', rangeLabel: 'Above 40 units', lowerThreshold: 40, upperThreshold: 9999, unit: 'units', ratePercent: 1.00 },
  ])

  const [bonusEnabled, setBonusEnabled] = useState<boolean>(false)
  const [bonusMethod, setBonusMethod] = useState<'percentage' | 'fixed' | 'kpi' | 'rating'>('kpi')
  const [bonusPercentage, setBonusPercentage] = useState<number>(10)
  const [bonusFixedAmount, setBonusFixedAmount] = useState<number>(500)
  const [bonusMinThreshold, setBonusMinThreshold] = useState<number>(70)
  const [bonusMaxPayout, setBonusMaxPayout] = useState<number>(2500)

  const [epfEmployeeEnabled, setEpfEmployeeEnabled] = useState<boolean>(true)
  const [epfEmployeeBase, setEpfEmployeeBase] = useState<'legal' | 'basic'>('legal')

  const [epfEmployerEnabled, setEpfEmployerEnabled] = useState<boolean>(true)
  const [epfEmployerBase, setEpfEmployerBase] = useState<'legal' | 'basic'>('legal')

  // Preview State Calculations
  const [previewSalary, setPreviewSalary] = useState<number>(100000)
  const [previewTargetUnits, setPreviewTargetUnits] = useState<number>(50)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState<boolean>(false)

  // Load server state into form when query returns
  useEffect(() => {
    if (serverSettings) {
      setOtEnabled(serverSettings.otEnabled ?? true)
      setOtBasis(serverSettings.otBasis || '1.5x')
      setOtCustomMultiplier(serverSettings.otCustomMultiplier || 1.5)
      setOtMaxHours(serverSettings.otMaxHours || 40)
      setOtRequireApproval(serverSettings.otRequireApproval ?? true)
      setOtEffectiveFrom(serverSettings.otEffectiveFrom || '2026-01-01')

      setTargetCoverageEnabled(serverSettings.targetCoverageEnabled ?? true)
      setTargetCoverageBase(serverSettings.targetCoverageBase || 'net')
      setTargetCoverageMethod(serverSettings.targetCoverageMethod || 'progressive')
      if (serverSettings.targetTiers?.length) {
        setTargetTiers(serverSettings.targetTiers)
      }

      setBonusEnabled(serverSettings.bonusEnabled ?? false)
      setBonusMethod(serverSettings.bonusMethod || 'kpi')
      setBonusPercentage(serverSettings.bonusPercentage || 10)
      setBonusFixedAmount(serverSettings.bonusFixedAmount || 500)
      setBonusMinThreshold(serverSettings.bonusMinThreshold || 70)
      setBonusMaxPayout(serverSettings.bonusMaxPayout || 2500)

      setEpfEmployeeEnabled(serverSettings.epfEmployeeEnabled ?? true)
      setEpfEmployeeBase(serverSettings.epfEmployeeBase || 'legal')

      setEpfEmployerEnabled(serverSettings.epfEmployerEnabled ?? true)
      setEpfEmployerBase(serverSettings.epfEmployerBase || 'legal')

      setIsDirty(false)
    }
  }, [serverSettings])

  // Save Settings Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        tenantId: tenant?.id || 'tenant-sampath',
        otEnabled,
        otBasis,
        otCustomMultiplier,
        otMaxHours,
        otRequireApproval,
        otEffectiveFrom,
        targetCoverageEnabled,
        targetCoverageBase,
        targetCoverageMethod,
        targetTiers,
        bonusEnabled,
        bonusMethod,
        bonusPercentage,
        bonusFixedAmount,
        bonusMinThreshold,
        bonusMaxPayout,
        epfEmployeeEnabled,
        epfEmployeeRate: 8,
        epfEmployeeBase,
        epfEmployerEnabled,
        epfEmployerRate: 12,
        etfEmployerRate: 3,
        epfEmployerBase,
        updatedBy: user?.name || 'Administrator',
      }
      return payrollService.updatePaymentSettings(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentSettings'] })
      setIsDirty(false)
      setSaveSuccessMsg('Payment settings saved successfully to backend!')
      setTimeout(() => setSaveSuccessMsg(null), 3000)
    },
  })

  // Add / Remove Target Tier handlers
  const handleAddTier = () => {
    const newTier: TargetTier = {
      id: `tier-${Date.now()}`,
      rangeLabel: `Next tier`,
      lowerThreshold: 40,
      upperThreshold: 60,
      unit: 'units',
      ratePercent: 1.25,
    }
    setTargetTiers([...targetTiers, newTier])
    setIsDirty(true)
  }

  const handleRemoveTier = (id: string) => {
    setTargetTiers(targetTiers.filter(t => t.id !== id))
    setIsDirty(true)
  }

  const handleUpdateTier = (id: string, field: keyof TargetTier, val: any) => {
    setTargetTiers(targetTiers.map(t => (t.id === id ? { ...t, [field]: val } : t)))
    setIsDirty(true)
  }

  // Calculate Target Coverage Progressive Allowance Preview
  const calculateTargetPreview = () => {
    if (!targetCoverageEnabled || previewTargetUnits <= 0) return { total: 0, breakdown: [] }

    let remaining = previewTargetUnits
    let totalAllowance = 0
    const breakdown: Array<{ label: string; units: number; rate: number; amount: number }> = []

    if (targetCoverageMethod === 'progressive') {
      // Tier 1: 0 to 20
      const tier1Units = Math.min(remaining, 20)
      if (tier1Units > 0) {
        const amt = (previewSalary * (0.50 / 100)) * (tier1Units / 20)
        breakdown.push({ label: 'First 20 target units', units: tier1Units, rate: 0.50, amount: amt })
        totalAllowance += amt
        remaining -= tier1Units
      }

      // Tier 2: Next 20 (20 to 40)
      const tier2Units = Math.min(remaining, 20)
      if (tier2Units > 0) {
        const amt = (previewSalary * (0.75 / 100)) * (tier2Units / 20)
        breakdown.push({ label: 'Next 20 units', units: tier2Units, rate: 0.75, amount: amt })
        totalAllowance += amt
        remaining -= tier2Units
      }

      // Tier 3: Above 40
      if (remaining > 0) {
        const amt = (previewSalary * (1.00 / 100)) * (remaining / 20)
        breakdown.push({ label: 'Above 40 units', units: remaining, rate: 1.00, amount: amt })
        totalAllowance += amt
      }
    } else {
      // Highest tier applied to whole base
      const rate = previewTargetUnits > 40 ? 1.00 : previewTargetUnits > 20 ? 0.75 : 0.50
      const amt = previewSalary * (rate / 100)
      breakdown.push({ label: `Highest Reached Tier (${rate}%)`, units: previewTargetUnits, rate, amount: amt })
      totalAllowance = amt
    }

    return { total: totalAllowance, breakdown }
  }

  const targetPreviewRes = calculateTargetPreview()

  // EPF / ETF Illustrative Calculation
  const previewEpfEmployee = previewSalary * 0.08
  const previewEpfEmployer = previewSalary * 0.12
  const previewEtfEmployer = previewSalary * 0.03

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 font-sans">
      {/* Page Header */}
      <PageHeader
        title="Payment Configuration"
        subtitle="Interactive example of the intended toggle behavior. These values are illustrative settings, not saved payroll configuration."
      >
        <div className="flex items-center gap-2.5">
          {isDirty && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs px-3 py-1 font-bold">
              Unsaved Changes
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['paymentSettings'] })}
            className="text-xs rounded-xl gap-1.5 border-border/80 hover:bg-muted cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </Button>

          <Button
            size="sm"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="bg-[#23ace3] hover:bg-[#1b97ca] text-slate-950 font-bold text-xs rounded-xl shadow-xs gap-1.5 px-4 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saveMutation.isPending ? 'Saving to Backend...' : 'Save Configuration'}</span>
          </Button>
        </div>
      </PageHeader>

      {/* Toast Banner */}
      {saveSuccessMsg && (
        <Card className="border border-emerald-500/40 bg-emerald-500/10 p-4 rounded-2xl animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-3 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        </Card>
      )}

      {/* 5 VERTICALLY STACKED SETTINGS CARDS */}
      <div className="space-y-6">

        {/* 1. OVERTIME PAY (OT) CARD */}
        <Card className="border border-border/60 bg-card rounded-2xl p-6 space-y-5 shadow-xs">
          {/* Card Header & Toggle Switch */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Zap className="h-4.5 w-4.5 text-[#23ace3]" />
                <span>Overtime Pay (OT)</span>
              </h3>
              <p className="text-xs text-muted-foreground">Hours, eligibility, and overtime multipliers</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setOtEnabled(!otEnabled)
                setIsDirty(true)
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                otEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-muted text-muted-foreground border-border/60'
              }`}
            >
              {otEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Expanded Configuration Form */}
          {otEnabled && (
            <div className="bg-muted/30 p-5 rounded-2xl border border-border/60 space-y-4 text-xs animate-in fade-in duration-200">
              <h4 className="font-bold text-foreground text-sm">Overtime rules</h4>

              <div className="space-y-2">
                <label className="text-muted-foreground font-semibold block">Overtime calculation basis</label>
                <div className="space-y-2">
                  {[
                    { key: '1.5x', label: '1.5× eligible hourly rate' },
                    { key: '2x', label: '2× eligible hourly rate' },
                    { key: 'custom', label: 'Custom multiplier (subject to legal validation)' },
                  ].map(opt => (
                    <label
                      key={opt.key}
                      className="flex items-center gap-2.5 cursor-pointer text-foreground font-medium hover:text-[#23ace3] transition-colors"
                    >
                      <input
                        type="radio"
                        name="otBasis"
                        checked={otBasis === opt.key}
                        onChange={() => {
                          setOtBasis(opt.key as any)
                          setIsDirty(true)
                        }}
                        className="accent-[#23ace3] h-4 w-4"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-muted-foreground font-semibold block mb-1">Max Monthly OT Hours</label>
                  <Input
                    type="number"
                    value={otMaxHours}
                    onChange={e => {
                      setOtMaxHours(parseInt(e.target.value) || 0)
                      setIsDirty(true)
                    }}
                    className="h-9 text-xs bg-background rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground font-semibold block mb-1">Effective Date</label>
                  <Input
                    type="date"
                    value={otEffectiveFrom}
                    onChange={e => {
                      setOtEffectiveFrom(e.target.value)
                      setIsDirty(true)
                    }}
                    className="h-9 text-xs bg-background rounded-xl"
                  />
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground border-t border-border/40 pt-3">
                Additional fields: eligible employee groups, weekday/rest-day/public-holiday rules, maximum hours, approval requirement, rounding, and effective date.
                <br />
                <span className="text-sky-400">The correct multiplier and eligibility must be determined for the applicable employee category and Sri Lankan legal requirements.</span>
              </p>
            </div>
          )}
        </Card>

        {/* 2. TARGET COVERAGE ALLOWANCE CARD */}
        <Card className="border border-border/60 bg-card rounded-2xl p-6 space-y-5 shadow-xs">
          {/* Card Header & Toggle Switch */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Target className="h-4.5 w-4.5 text-[#23ace3]" />
                <span>Target Coverage Allowance</span>
              </h3>
              <p className="text-xs text-muted-foreground">Tiered percentage based on target achievement</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setTargetCoverageEnabled(!targetCoverageEnabled)
                setIsDirty(true)
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                targetCoverageEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-muted text-muted-foreground border-border/60'
              }`}
            >
              {targetCoverageEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Expanded Configuration Form */}
          {targetCoverageEnabled && (
            <div className="bg-muted/30 p-5 rounded-2xl border border-border/60 space-y-5 text-xs animate-in fade-in duration-200">
              <h4 className="font-bold text-foreground text-sm">Target coverage configuration</h4>

              {/* Calculation Base Radio */}
              <div className="space-y-2">
                <label className="text-muted-foreground font-semibold block">Percentage calculation base</label>
                <div className="space-y-2">
                  {[
                    { key: 'net', label: 'Net salary' },
                    { key: 'basic', label: 'Basic salary' },
                    { key: 'fixed', label: 'Fixed amount per achieved target' },
                  ].map(opt => (
                    <label key={opt.key} className="flex items-center gap-2.5 cursor-pointer text-foreground font-medium">
                      <input
                        type="radio"
                        name="targetCoverageBase"
                        checked={targetCoverageBase === opt.key}
                        onChange={() => {
                          setTargetCoverageBase(opt.key as any)
                          setIsDirty(true)
                        }}
                        className="accent-[#23ace3] h-4 w-4"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tier Calculation Method Radio */}
              <div className="space-y-2">
                <label className="text-muted-foreground font-semibold block">Tier calculation method</label>
                <div className="space-y-2">
                  {[
                    { key: 'progressive', label: 'Progressive tiers — each rate applies only within its tier' },
                    { key: 'highest', label: 'Highest reached tier — one rate applies to the entire eligible base' },
                  ].map(opt => (
                    <label key={opt.key} className="flex items-center gap-2.5 cursor-pointer text-foreground font-medium">
                      <input
                        type="radio"
                        name="targetCoverageMethod"
                        checked={targetCoverageMethod === opt.key}
                        onChange={() => {
                          setTargetCoverageMethod(opt.key as any)
                          setIsDirty(true)
                        }}
                        className="accent-[#23ace3] h-4 w-4"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Editable Target Tiers Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-foreground text-xs uppercase tracking-wider">Illustrative target tiers</h5>
                  <Button variant="outline" size="sm" onClick={handleAddTier} className="text-[11px] h-7 gap-1 rounded-lg">
                    <Plus className="h-3 w-3" /> Add Target Tier
                  </Button>
                </div>

                <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border/50 text-muted-foreground">
                      <tr>
                        <th className="p-2.5 font-semibold">Achievement range</th>
                        <th className="p-2.5 font-semibold text-right">Rate</th>
                        <th className="p-2.5 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono">
                      {targetTiers.map(t => (
                        <tr key={t.id} className="hover:bg-muted/20">
                          <td className="p-2.5 font-sans font-medium text-foreground">{t.rangeLabel}</td>
                          <td className="p-2.5 text-right font-bold text-[#23ace3]">{t.ratePercent.toFixed(2)}%</td>
                          <td className="p-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveTier(t.id)}
                              className="text-muted-foreground hover:text-rose-400 p-1 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Configure actual thresholds, units, eligible base, and caps. These are sample values; a target of 20 units is not the same as 20% of a salary.
                </p>
              </div>

              {/* Interactive Target Coverage Calculation Preview Box */}
              <div className="p-4 rounded-xl bg-card border border-[#23ace3]/30 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#23ace3]">
                  <span className="flex items-center gap-1.5">
                    <Calculator className="h-4 w-4" /> Live Progressive Tier Calculation Preview
                  </span>
                  <Badge variant="outline" className="bg-[#23ace3]/10 text-[#23ace3] text-[10px]">
                    {targetCoverageMethod === 'progressive' ? 'Progressive Marginal' : 'Whole Base'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-muted-foreground block mb-1">Sample Calculation Base Salary (Rs.)</label>
                    <Input
                      type="number"
                      value={previewSalary}
                      onChange={e => setPreviewSalary(parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs bg-background rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1">Achieved Target Units</label>
                    <Input
                      type="number"
                      value={previewTargetUnits}
                      onChange={e => setPreviewTargetUnits(parseInt(e.target.value) || 0)}
                      className="h-8 text-xs bg-background rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/40 text-xs">
                  {targetPreviewRes.breakdown.map((b, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">{b.label} ({b.units} units @ {b.rate}%):</span>
                      <span className="font-mono text-foreground font-semibold">Rs. {b.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-extrabold text-xs text-emerald-400 pt-1.5 border-t border-border/40">
                    <span>Total Calculated Coverage Allowance:</span>
                    <span className="font-mono text-sm">Rs. {targetPreviewRes.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* 3. PERFORMANCE BONUS CARD */}
        <Card className="border border-border/60 bg-card rounded-2xl p-6 space-y-5 shadow-xs">
          {/* Card Header & Toggle Switch */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Gift className="h-4.5 w-4.5 text-[#23ace3]" />
                <span>Performance Bonus</span>
              </h3>
              <p className="text-xs text-muted-foreground">KPI, rating, fixed, or tiered bonus rules</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setBonusEnabled(!bonusEnabled)
                setIsDirty(true)
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                bonusEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-muted text-muted-foreground border-border/60'
              }`}
            >
              {bonusEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Expanded Configuration Form */}
          {bonusEnabled && (
            <div className="bg-muted/30 p-5 rounded-2xl border border-border/60 space-y-4 text-xs animate-in fade-in duration-200">
              <h4 className="font-bold text-foreground text-sm">Performance bonus settings</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-muted-foreground font-semibold block mb-1">Bonus Calculation Method</label>
                  <select
                    value={bonusMethod}
                    onChange={e => {
                      setBonusMethod(e.target.value as any)
                      setIsDirty(true)
                    }}
                    className="w-full h-9 text-xs bg-background border border-border/80 rounded-xl px-3 text-foreground"
                  >
                    <option value="kpi">KPI Achievement Tiers</option>
                    <option value="percentage">Percentage of Eligible Salary</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="rating">Performance-Rating Multiplier</option>
                  </select>
                </div>

                <div>
                  <label className="text-muted-foreground font-semibold block mb-1">Minimum Achievement Threshold (%)</label>
                  <Input
                    type="number"
                    value={bonusMinThreshold}
                    onChange={e => {
                      setBonusMinThreshold(parseFloat(e.target.value) || 0)
                      setIsDirty(true)
                    }}
                    className="h-9 text-xs bg-background rounded-xl font-mono"
                  />
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground pt-1">
                Bonus calculations read persistent KPI scores and performance reviews directly from authorized employee records.
              </p>
            </div>
          )}
        </Card>

        {/* 4. EPF — EMPLOYEE CONTRIBUTION (8%) CARD */}
        <Card className="border border-border/60 bg-card rounded-2xl p-6 space-y-5 shadow-xs">
          {/* Card Header & Toggle Switch */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-[#23ace3]" />
                <span>EPF — Employee Contribution (8%)</span>
              </h3>
              <p className="text-xs text-muted-foreground">Deduct from employee earnings</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEpfEmployeeEnabled(!epfEmployeeEnabled)
                setIsDirty(true)
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                epfEmployeeEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-muted text-muted-foreground border-border/60'
              }`}
            >
              {epfEmployeeEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Expanded Configuration Form */}
          {epfEmployeeEnabled && (
            <div className="bg-muted/30 p-5 rounded-2xl border border-border/60 space-y-4 text-xs animate-in fade-in duration-200">
              <h4 className="font-bold text-foreground text-sm">Employee EPF settings</h4>

              <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/40">
                <span className="font-semibold text-muted-foreground">Statutory Contribution Rate:</span>
                <span className="font-mono font-extrabold text-sm text-foreground">8%</span>
              </div>

              <div className="space-y-2">
                <label className="text-muted-foreground font-semibold block">Calculation base</label>
                <div className="space-y-2">
                  {[
                    { key: 'legal', label: 'Legally applicable earnings (recommended)' },
                    { key: 'basic', label: 'Basic salary only — only where legally appropriate' },
                  ].map(opt => (
                    <label key={opt.key} className="flex items-center gap-2.5 cursor-pointer text-foreground font-medium">
                      <input
                        type="radio"
                        name="epfEmployeeBase"
                        checked={epfEmployeeBase === opt.key}
                        onChange={() => {
                          setEpfEmployeeBase(opt.key as any)
                          setIsDirty(true)
                        }}
                        className="accent-[#23ace3] h-4 w-4"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground border-t border-border/40 pt-3">
                The statutory rate must not be freely overridden by ordinary tenant administrators. The system should determine eligible earnings under the applicable rules and provide controlled, versioned legal updates.
              </p>
            </div>
          )}
        </Card>

        {/* 5. EMPLOYER EPF (12%) AND ETF (3%) CARD */}
        <Card className="border border-border/60 bg-card rounded-2xl p-6 space-y-5 shadow-xs">
          {/* Card Header & Toggle Switch */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-4.5 w-4.5 text-[#23ace3]" />
                <span>Employer EPF (12%) and ETF (3%)</span>
              </h3>
              <p className="text-xs text-muted-foreground">Employer-paid contributions; not employee deductions</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEpfEmployerEnabled(!epfEmployerEnabled)
                setIsDirty(true)
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                epfEmployerEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-muted text-muted-foreground border-border/60'
              }`}
            >
              {epfEmployerEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Expanded Configuration Form */}
          {epfEmployerEnabled && (
            <div className="bg-muted/30 p-5 rounded-2xl border border-border/60 space-y-5 text-xs animate-in fade-in duration-200">
              <h4 className="font-bold text-foreground text-sm">Employer contribution settings</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-card border border-border/40 flex justify-between items-center">
                  <span className="font-semibold text-muted-foreground">Employer EPF:</span>
                  <span className="font-mono font-extrabold text-sm text-foreground">12%</span>
                </div>
                <div className="p-3.5 rounded-xl bg-card border border-border/40 flex justify-between items-center">
                  <span className="font-semibold text-muted-foreground">Employer ETF:</span>
                  <span className="font-mono font-extrabold text-sm text-foreground">3%</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Additional fields: eligible earnings base, employee eligibility, effective date, payroll period, contribution report format, and reconciliation status.
                <br />
                <span className="text-emerald-400 font-semibold">ETF is employer-paid and must not reduce employee take-home pay. Rates and earnings treatment require compliance validation.</span>
              </p>

              {/* Illustrative Calculation Preview Box */}
              <div className="p-4 rounded-xl bg-card border border-border/60 space-y-3">
                <div>
                  <h5 className="font-bold text-foreground text-xs uppercase tracking-wider">Illustrative calculation preview</h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Enter a monthly salary to see a simple percentage example. This preview does not include tax, allowances, eligibility exclusions, or a complete payroll calculation.
                  </p>
                </div>

                <div className="max-w-xs">
                  <Input
                    type="number"
                    value={previewSalary}
                    onChange={e => setPreviewSalary(parseFloat(e.target.value) || 0)}
                    className="h-9 text-xs bg-background rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-border/40 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-muted/40">
                    <span className="text-foreground font-medium">Employee EPF (8%):</span>
                    <span className="font-mono font-bold text-rose-400">
                      {previewEpfEmployee.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-lg bg-muted/40">
                    <span className="text-foreground font-medium">Employer EPF (12%):</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {previewEpfEmployer.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-lg bg-muted/40">
                    <span className="text-foreground font-medium">Employer ETF (3%):</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {previewEtfEmployer.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground italic">
                  Preview assumes the entered amount is the applicable calculation base. Actual payroll must use validated earnings rules and backend calculations.
                </p>
              </div>
            </div>
          )}
        </Card>

      </div>
    </div>
  )
}
