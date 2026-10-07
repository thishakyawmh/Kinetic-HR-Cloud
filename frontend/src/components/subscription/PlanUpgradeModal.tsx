import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { appDataStore } from '@/services/storage'
import { authService } from '@/services/authService'
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  Users,
  Bot,
  Building,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { SubscriptionTier } from '@/types'

interface PlanUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
}

interface PlanOption {
  name: SubscriptionTier
  tagline: string
  monthlyPrice: number
  annualPrice: number
  employees: string
  admins: string
  aiMonthlyQuota: string
  features: string[]
  recommended?: boolean
  color: string
}

const PLAN_OPTIONS: PlanOption[] = [
  {
    name: 'Starter',
    tagline: 'Core HR automation for agile teams and growing startups.',
    monthlyPrice: 199,
    annualPrice: 159,
    employees: 'Up to 25 employees',
    admins: '1 HR Admin',
    aiMonthlyQuota: '500 AI requests / mo',
    features: [
      'Kinetic AI Employee Assistant',
      'Automated Leave Request Pipeline',
      'Basic Payroll PDF Parsing',
      'Standard Email Support',
      '5 GB Secure Cloud Storage',
    ],
    color: 'border-slate-700/50',
  },
  {
    name: 'Business',
    tagline: 'Deep reasoning, staffing risk analytics, and full policy RAG grounding.',
    monthlyPrice: 499,
    annualPrice: 399,
    employees: 'Up to 100 employees',
    admins: '3 HR Admins',
    aiMonthlyQuota: '2,500 AI requests / mo',
    features: [
      'Everything in Starter',
      'Advanced Staffing & Overlap Analysis',
      'Payslip Delta Explanation Engine',
      'Up to 3 Admin Accounts',
      '4-Hour Priority SLA Support',
      '25 GB Secure Cloud Storage',
    ],
    recommended: true,
    color: 'border-[#23ace3]/60 bg-[#23ace3]/5',
  },
  {
    name: 'Enterprise',
    tagline: 'Full-spectrum enterprise SaaS with unlimited scale, and dedicated SLAs.',
    monthlyPrice: 1299,
    annualPrice: 999,
    employees: 'Up to 1,000+ employees',
    admins: 'Unlimited Admins',
    aiMonthlyQuota: '15,000 AI requests / mo',
    features: [
      'Everything in Business',
      'Dedicated Azure Tenant Perimeter',
      'Custom Multi-Level Approval Chains',
      'Continuous Audit Logs & AI Observability',
      '24/7 Dedicated Account Director',
      '200 GB Secure Cloud Storage',
    ],
    color: 'border-purple-500/60 bg-purple-500/5',
  },
]

export const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({ isOpen, onClose }) => {
  const { tenant, refreshUser } = useAuth()
  const [isAnnual, setIsAnnual] = useState(true)
  const [upgradingTo, setUpgradingTo] = useState<SubscriptionTier | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const currentPlan = (tenant?.plan || 'Enterprise') as SubscriptionTier

  const handleSelectPlan = async (newPlan: SubscriptionTier) => {
    if (newPlan === currentPlan) return
    setUpgradingTo(newPlan)

    try {
      await new Promise(r => setTimeout(r, 600))

      if (tenant?.id) {
        appDataStore.updateTenant(tenant.id, { plan: newPlan })
      }

      // Update active session in storage
      const session = authService.getCurrentSession()
      if (session) {
        session.tenant.plan = newPlan
        sessionStorage.setItem('kinetic_auth_session', JSON.stringify(session))
        localStorage.setItem('kinetic_auth_session', JSON.stringify(session))
      }

      refreshUser()
      setSuccessMessage(`Organization successfully upgraded to ${newPlan} Plan!`)
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3500)
    } catch (err) {
      console.error('Plan update failed', err)
    } finally {
      setUpgradingTo(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose} className="max-w-4xl p-6 sm:p-8">
      <DialogHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-lg bg-[#23ace3]/15 text-[#23ace3]">
                <Zap className="h-4 w-4" />
              </span>
              <DialogTitle className="text-xl font-bold">Subscription & Plan Management</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Manage subscription tier, employee seat limits, and AI monthly quotas for{' '}
              <strong className="text-foreground">{tenant?.name || 'Kinetic HR'}</strong>.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-3 my-4">
        <span className={`text-xs ${!isAnnual ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
          Monthly Billing
        </span>
        <button
          type="button"
          onClick={() => setIsAnnual(!isAnnual)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isAnnual ? 'bg-[#23ace3]' : 'bg-muted'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              isAnnual ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs ${isAnnual ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
            Annual Billing
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ef8d46]/15 text-[#ef8d46] border border-[#ef8d46]/30">
            Save 20%
          </span>
        </div>
      </div>

      {/* 3 Interactive Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {PLAN_OPTIONS.map(plan => {
          const isCurrent = plan.name === currentPlan
          const isUpgrading = upgradingTo === plan.name
          const price = isAnnual ? plan.annualPrice : plan.monthlyPrice

          return (
            <div
              key={plan.name}
              className={`rounded-2xl p-5 border flex flex-col justify-between transition-all relative ${
                isCurrent
                  ? 'border-[#23ace3] ring-2 ring-[#23ace3]/30 bg-card shadow-lg'
                  : `${plan.color} bg-card/60 hover:border-border/80`
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#23ace3] to-indigo-500 text-white text-[10px] font-bold shadow-xs">
                  Most Popular
                </div>
              )}

              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-base text-foreground">{plan.name}</h3>
                  {isCurrent && (
                    <Badge variant="outline" className="text-[10px] bg-[#23ace3]/15 text-[#23ace3] border-[#23ace3]/30 font-semibold">
                      Current Plan
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground min-h-[32px] mb-4 leading-relaxed">
                  {plan.tagline}
                </p>

                {/* Pricing */}
                <div className="mb-4 pb-4 border-b border-border/50">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-foreground">${price}</span>
                    <span className="text-xs text-muted-foreground">/ month</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {isAnnual ? 'Billed annually' : 'Billed month-to-month'}
                  </div>
                </div>

                {/* Quota Highlights */}
                <div className="space-y-2 mb-4 text-xs">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Users className="h-3.5 w-3.5 text-[#23ace3]" />
                    <span>{plan.employees}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Bot className="h-3.5 w-3.5 text-[#ef8d46]" />
                    <span>{plan.aiMonthlyQuota}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{plan.admins}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2 pt-2 border-t border-border/40 mb-6">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Features Included:
                  </span>
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                      <Check className="h-3.5 w-3.5 text-[#23ace3] shrink-0 mt-0.5" />
                      <span className="leading-tight">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div>
                {isCurrent ? (
                  <Button
                    disabled
                    variant="outline"
                    className="w-full text-xs font-semibold rounded-xl border-border/80 bg-muted/40 cursor-default"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#23ace3] mr-1.5" />
                    Active Plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSelectPlan(plan.name)}
                    disabled={isUpgrading}
                    className={`w-full text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition-all ${
                      plan.name === 'Enterprise'
                        ? 'bg-gradient-to-r from-[#23ace3] to-purple-600 hover:opacity-90 text-white'
                        : 'bg-[#23ace3] hover:bg-[#1b97ca] text-white'
                    }`}
                  >
                    {isUpgrading ? (
                      'Switching Plan...'
                    ) : (
                      <span className="flex items-center justify-center gap-1">
                        Switch to {plan.name}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <Building className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Need custom enterprise terms or dedicated Azure hosting?</span>
        </div>
        <span className="text-[#23ace3] font-medium cursor-pointer hover:underline">
          Contact Kinetic Enterprise Solutions
        </span>
      </div>
    </Dialog>
  )
}
