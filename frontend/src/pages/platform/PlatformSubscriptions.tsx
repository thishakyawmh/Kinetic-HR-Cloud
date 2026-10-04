import React from 'react'
import { useNavigate } from 'react-router-dom'
import { platformService, PLATFORM_PLANS } from '@/services/platformService'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  Check,
  ShieldAlert,
  Sparkles,
  Users,
  HardDrive,
  Cpu,
  Layers,
  CheckCircle2,
} from 'lucide-react'

export const PlatformSubscriptions: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Business Model & Plan Limits"
        subtitle="Manage commercial SaaS tiers, monthly AI request quotas, and backend quota enforcement policies (§12)."
        badge={
          <Badge variant="outline" className="text-xs bg-[#23ace3]/15 text-[#23ace3] border-[#23ace3]/30">
            Commercial SaaS Engine
          </Badge>
        }
      >
        <Button
          variant="default"
          size="sm"
          onClick={() => navigate('/platform/organizations?register=true')}
          className="gap-1.5 text-xs bg-[#23ace3] hover:bg-[#1b97ca] text-white rounded-xl shadow-xs"
        >
          <CreditCard className="h-3.5 w-3.5" />
          <span>Provision Tenant on Plan</span>
        </Button>
      </PageHeader>

      {/* Backend Enforcement Principle Callout (§12) */}
      <Card className="border-[#23ace3]/30 bg-[#23ace3]/10 p-5 rounded-2xl shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-[#23ace3]/20 text-[#23ace3] shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">
              Backend Quota Enforcement Architecture (§12)
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Subscription limits are strictly enforced at the backend service layer, not merely in the client UI. If an organization on the <strong>Starter Plan (25 seats)</strong> attempts to add a 26th employee, or exceeds its <strong>500 monthly AI request quota</strong>, the backend API rejects the operation with a plan upgrade prompt.
            </p>
          </div>
        </div>
      </Card>

      {/* 3 Tier Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLATFORM_PLANS.map(plan => {
          const isBusiness = plan.name === 'Business'
          const isEnterprise = plan.name === 'Enterprise'

          return (
            <Card
              key={plan.id}
              className={`rounded-2xl flex flex-col justify-between transition-all bg-card border ${
                isBusiness
                  ? 'border-[#23ace3] shadow-lg shadow-[#23ace3]/10 relative'
                  : 'border-border/60 hover:border-border'
              }`}
            >
              {isBusiness && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#23ace3] text-white text-[10px] font-bold tracking-wider uppercase shadow-xs">
                  Most Popular
                </div>
              )}

              <CardHeader className="p-6 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">{plan.name} Plan</h3>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      isEnterprise
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : isBusiness
                        ? 'bg-[#23ace3]/15 text-[#23ace3] border-[#23ace3]/30'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    {plan.name} Tier
                  </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground min-h-[36px]">
                  {plan.description}
                </CardDescription>
                <div className="pt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-foreground font-mono">
                    ${plan.priceMonthly}
                  </span>
                  <span className="text-xs text-muted-foreground">/ month</span>
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-0 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3 pt-4 border-t border-border/50 text-xs">
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/40 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5 text-[#23ace3]" />
                      <span>{plan.employeeLimit} Seats</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Cpu className="h-3.5 w-3.5 text-[#ef8d46]" />
                      <span>{plan.aiMonthlyLimit.toLocaleString()} AI calls</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
                      Included Capabilities:
                    </span>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-xs">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={() => navigate('/platform/organizations?register=true')}
                    className={`w-full rounded-xl text-xs font-semibold shadow-xs ${
                      isBusiness
                        ? 'bg-[#23ace3] hover:bg-[#1b97ca] text-white'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                  >
                    Onboard on {plan.name}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
