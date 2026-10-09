import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import {
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  FileSpreadsheet,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Lock,
  Cloud,
  Database,
  Sun,
  Moon,
  Zap,
  Activity,
} from 'lucide-react'

export const LandingPage: React.FC = () => {
  const { isAuthenticated, role } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [isAnnual, setIsAnnual] = useState(true)

  const dashboardPath =
    role === 'platform_admin'
      ? '/platform/dashboard'
      : role === 'admin'
        ? '/admin/dashboard'
        : role === 'manager'
          ? '/manager/dashboard'
          : '/employee/dashboard'

  const features = [
    {
      icon: Database,
      title: 'Tenant Isolation',
      description: 'Dedicated Azure Cosmos DB partitions per organization with zero cross-tenant access.',
      color: '#23ace3',
    },
    {
      icon: CalendarDays,
      title: 'Leave & Attendance',
      description: 'Dynamic quota tracking, manager approvals, and team calendar sync.',
      color: '#ef8d46',
    },
    {
      icon: FileSpreadsheet,
      title: 'Encrypted Payroll',
      description: 'Itemized salary statements with secure 15-minute SAS token downloads.',
      color: '#23ace3',
    },
    {
      icon: BookOpen,
      title: 'Policy Hub',
      description: 'Centralized, searchable corporate handbook and compliance documentation.',
      color: '#ef8d46',
    },
    {
      icon: Users,
      title: 'Role-Based Portals',
      description: 'Tailored workspaces for Employees, Managers, and HR Administrators.',
      color: '#23ace3',
    },
    {
      icon: Activity,
      title: 'Audit & Telemetry',
      description: 'Real-time SOC 2 compliance logging with automated risk tracking.',
      color: '#ef8d46',
    },
  ]

  const plans = [
    {
      name: 'Starter',
      description: 'For growing teams starting cloud HR.',
      monthlyPrice: 199,
      annualPrice: 159,
      seats: 'Up to 25 employees',
      features: [
        'Cosmos DB tenant isolation',
        'Leave & absence tracking',
        'Official electronic payslips',
        'Company policy repository',
      ],
      recommended: false,
      orgId: 'KINETIC',
    },
    {
      name: 'Business',
      description: 'For scaling companies with multiple teams.',
      monthlyPrice: 499,
      annualPrice: 399,
      seats: 'Up to 100 employees',
      features: [
        'Everything in Starter',
        'Department staffing safeguards',
        'Manager decision support',
        'SOC 2 compliance audit logs',
        'Priority 4-hour SLA',
      ],
      recommended: true,
      orgId: 'KINETIC',
    },
    {
      name: 'Enterprise',
      description: 'For multi-subsidiary global enterprises.',
      monthlyPrice: 1299,
      annualPrice: 1039,
      seats: '1,000+ employees',
      features: [
        'Everything in Business',
        'Custom Entra ID / SSO',
        'Automated ADP & Workday sync',
        'Dedicated blob storage vaults',
        '24/7 dedicated account team',
      ],
      recommended: false,
      orgId: 'NOVA',
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 font-sans selection:bg-[#23ace3]/30 selection:text-[#23ace3]">
      {/* Subtle background glow & mesh pattern */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[500px] bg-[#23ace3]/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-20 right-1/4 w-[450px] h-[400px] bg-[#ef8d46]/8 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(#23ace3_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.035] pointer-events-none -z-10" />

      {/* Discreet floating theme toggle in top right corner */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-border/70 bg-card/85 text-muted-foreground hover:text-foreground hover:bg-card shadow-md backdrop-blur-md transition-all cursor-pointer hover:scale-105"
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {/* =========================================================================
          COVER HERO SECTION (Centered logo, cover layout with action buttons)
          ========================================================================= */}
      <section className="relative min-h-[82vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 py-16 sm:py-24">
        {/* Ambient glow accent behind hero center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[520px] h-[340px] sm:h-[520px] bg-[#23ace3]/15 rounded-full blur-[130px] pointer-events-none -z-10" />

        <div className="max-w-3xl mx-auto space-y-6 w-full">
          {/* Centered Kinetic HR Cloud Logo & Platform Name */}
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative p-3.5 sm:p-4 rounded-3xl bg-card/85 border border-border/80 shadow-2xl shadow-[#23ace3]/20 backdrop-blur-xl group hover:scale-105 transition-all duration-300">
              <img
                src="/kenetic_logo.webp"
                alt="Kinetic HR Logo"
                className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow-md"
              />
            </div>

            <h1 className="flex items-center justify-center gap-2 text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground">
              <span>Kinetic</span>
              <span className="flex items-center">
                <span className="text-[#23ace3]">H</span>
                <span className="text-[#ef8d46]">R</span>
              </span>
              <span className="ml-2 text-xs sm:text-sm md:text-base font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30">
                Cloud
              </span>
            </h1>
          </div>

          {/* Platform Description */}
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Effortless time off, instant payslips, and AI-powered team approvals.
          </p>

          {/* Cover Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate(dashboardPath)}
                className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 rounded-xl bg-[#23ace3] hover:bg-[#1da0d4] text-white font-semibold text-xs sm:text-sm shadow-lg shadow-[#23ace3]/25 hover:shadow-[#23ace3]/40 transition-all cursor-pointer hover:-translate-y-0.5"
              >
                <span>Go to Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 rounded-xl bg-[#23ace3] hover:bg-[#1da0d4] text-white font-semibold text-xs sm:text-sm shadow-lg shadow-[#23ace3]/25 hover:shadow-[#23ace3]/40 transition-all cursor-pointer hover:-translate-y-0.5"
              >
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            <a
              href="#plans"
              className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 rounded-xl bg-card/80 hover:bg-card border border-border/80 hover:border-[#23ace3]/40 text-foreground font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-xs hover:-translate-y-0.5 backdrop-blur-xs"
            >
              <span>View Plans</span>
            </a>
          </div>
        </div>
      </section>


      {/* =========================================================================
          FEATURES (Bite-sized cards, short 1-line copy)
          ========================================================================= */}
      <section id="features" className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#23ace3]">
              Core Features
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Essential workforce tools, simplified
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feat, idx) => {
              const Icon = feat.icon
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-card/80 border border-border/70 hover:border-[#23ace3]/40 hover:-translate-y-0.5 transition-all duration-200 shadow-2xs space-y-2.5 backdrop-blur-xs group"
                >
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{ backgroundColor: `${feat.color}15`, color: feat.color }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{feat.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          PLANS & PRICING (Clean cards, brief checklists)
          ========================================================================= */}
      <section id="plans" className="py-14 sm:py-16 border-t border-border/60 bg-muted/15 backdrop-blur-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#ef8d46]">
              Subscription Plans
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Predictable cloud pricing
            </h2>

            {/* Toggle */}
            <div className="pt-2 flex items-center justify-center gap-2.5 text-xs">
              <span
                onClick={() => setIsAnnual(false)}
                className={`cursor-pointer ${!isAnnual ? 'font-bold text-foreground' : 'text-muted-foreground'}`}
              >
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full bg-muted border border-border/70 transition-colors"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-[#23ace3] shadow transition-transform ${isAnnual ? 'translate-x-4' : 'translate-x-0.5'
                    } mt-0.5`}
                />
              </button>
              <span
                onClick={() => setIsAnnual(true)}
                className={`cursor-pointer ${isAnnual ? 'font-bold text-foreground' : 'text-muted-foreground'}`}
              >
                Annual <span className="text-[#ef8d46] text-[10px] font-semibold">(Save 20%)</span>
              </span>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((plan, idx) => {
              const price = isAnnual ? plan.annualPrice : plan.monthlyPrice
              return (
                <div
                  key={idx}
                  className={`rounded-2xl p-6 flex flex-col justify-between transition-all bg-card/85 backdrop-blur-xs border ${plan.recommended
                    ? 'border-[#23ace3] shadow-md ring-1 ring-[#23ace3]/30 hover:border-[#23ace3]'
                    : 'border-border/70 shadow-xs hover:border-border'
                    }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                      {plan.recommended && (
                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#23ace3]/15 text-[#23ace3]">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>

                    <div className="pt-1 pb-3 border-b border-border/50">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold font-mono text-foreground">${price}</span>
                        <span className="text-xs text-muted-foreground">/mo</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{plan.seats}</span>
                    </div>

                    <div className="space-y-2 pt-1">
                      {plan.features.map((f, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 text-xs text-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6">
                    <Link
                      to={`/login/${plan.orgId}`}
                      className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${plan.recommended
                        ? 'bg-[#23ace3] hover:bg-[#1b97ca] text-white shadow-xs'
                        : 'bg-muted/50 hover:bg-muted text-foreground border border-border/60'
                        }`}
                    >
                      <span>Choose {plan.name}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          BOTTOM CTA (Short & uncluttered)
          ========================================================================= */}
      <section className="py-14 text-center">
        <div className="max-w-2xl mx-auto px-4 space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Ready to access your workspace?</h2>
          <p className="text-xs text-muted-foreground">
            Sign in with your organization ID and employee credentials to get started.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#23ace3] hover:bg-[#1b97ca] text-white font-semibold text-xs shadow-xs transition-all"
            >
              <span>Access Organization Portal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MINIMAL FOOTER
          ========================================================================= */}
      <footer className="py-6 border-t border-border/50 text-[11px] text-muted-foreground">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/kenetic_logo.webp" alt="Logo" className="h-4 w-4 object-contain" />
            <span className="font-semibold text-foreground">Kinetic HR Cloud</span>
            <span>• © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#plans" className="hover:text-foreground">
              Pricing
            </a>
            <Link to="/login" className="text-[#23ace3] hover:underline font-medium">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
