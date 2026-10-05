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
  Menu,
  X,
} from 'lucide-react'

export const LandingPage: React.FC = () => {
  const { isAuthenticated, role } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [isAnnual, setIsAnnual] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const dashboardPath =
    role === 'platform_admin'
      ? '/platform/dashboard'
      : role === 'admin'
        ? '/admin/dashboard'
        : role === 'manager'
          ? '/manager/dashboard'
          : '/employee/dashboard'

  const partners = [
    { name: 'Microsoft Azure', tag: 'Cloud Platform', icon: Cloud },
    { name: 'Entra ID', tag: 'Single Sign-On', icon: Lock },
    { name: 'ADP Vantage', tag: 'Payroll Engine', icon: FileSpreadsheet },
    { name: 'Slack', tag: 'Approvals & Bots', icon: Zap },
    { name: 'Workday', tag: 'HRIS Sync', icon: Building2 },
    { name: 'SOC 2 Type II', tag: 'Certified', icon: ShieldCheck },
  ]

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

      {/* =========================================================================
          TOP NAVBAR (Clean with prominent Login button on top right)
          ========================================================================= */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/85 border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/kenetic_logo.webp"
              alt="Kinetic HR Logo"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg object-contain"
            />
            <span className="font-bold text-base sm:text-lg tracking-tight text-foreground flex items-center">
              Kinetic
              <span className="font-extrabold ml-1 flex items-center">
                <span className="text-[#23ace3]">H</span>
                <span className="text-[#ef8d46]">R</span>
              </span>
              <span className="ml-1.5 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#23ace3]/12 text-[#23ace3] border border-[#23ace3]/25">
                Cloud
              </span>
            </span>
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#partners" className="hover:text-foreground transition-colors">
              Partners
            </a>
            <a href="#plans" className="hover:text-foreground transition-colors">
              Plans
            </a>
          </nav>

          {/* Right Controls: Theme + Prominent Login Button */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-border/70 bg-card/80 text-muted-foreground hover:text-foreground hover:bg-card transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {isAuthenticated && (
              <button
                onClick={() => navigate(dashboardPath)}
                className="hidden sm:inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-muted/40 cursor-pointer"
              >
                Workspace
              </button>
            )}

            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#23ace3] hover:bg-[#1da0d4] text-white font-semibold text-xs transition-all cursor-pointer shadow-sm hover:shadow-[#23ace3]/20"
            >
              <span>Login</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-border/70 bg-card text-muted-foreground"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 py-3 border-t border-border/60 bg-background/95 backdrop-blur-md space-y-2 text-xs">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-foreground">
              Features
            </a>
            <a href="#partners" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-foreground">
              Partners
            </a>
            <a href="#plans" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-foreground">
              Plans
            </a>
            <div className="pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#23ace3] text-white font-semibold text-xs shadow-xs"
              >
                <span>Login</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          HERO SECTION (Punchy, balanced spacing, cohesive stats bar)
          ========================================================================= */}
      <section className="pt-12 pb-10 sm:pt-16 sm:pb-12 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-5">

          {/* 1-Line Headline */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Intelligent HR cloud for{' '}
            <span className="text-[#23ace3]">modern teams</span>
          </h1>

          {/* 1-Sentence Description */}
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Unified leave tracking, secure payroll vaults, and automated compliance under strict tenant data isolation.
          </p>

          {/* CTAs */}
          <div className="flex flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-[#23ace3] hover:bg-[#1da0d4] text-white font-semibold text-xs sm:text-sm shadow-md shadow-[#23ace3]/20 transition-all cursor-pointer"
            >
              <span>Sign In to Org</span>
            </Link>
            <a
              href="#plans"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-card/80 hover:bg-card border border-border/90 hover:border-foreground/30 text-foreground font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-2xs"
            >
              <span>View Plans</span>
            </a>
          </div>

          {/* Sleek Unified 3-Item Metrics Bar */}
          <div className="pt-4 max-w-2xl mx-auto">
            <div className="rounded-2xl bg-card/70 border border-border/80 backdrop-blur-md p-3 sm:p-4 grid grid-cols-3 divide-x divide-border/60 shadow-xs">
              <div className="px-2 text-center">
                <div className="text-lg sm:text-2xl font-extrabold font-mono text-[#23ace3]">99.99%</div>
                <div className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-0.5">Cloud SLA</div>
              </div>
              <div className="px-2 text-center">
                <div className="text-lg sm:text-2xl font-extrabold font-mono text-foreground">Isolated</div>
                <div className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-0.5">Tenant Partitions</div>
              </div>
              <div className="px-2 text-center">
                <div className="text-lg sm:text-2xl font-extrabold font-mono text-[#ef8d46]">AES-256</div>
                <div className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-0.5">Blob Encryption</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PARTNERS (Sleek horizontal ribbon, zero dead space)
          ========================================================================= */}
      <section id="partners" className="py-8 sm:py-10 border-y border-border/60 bg-muted/20 backdrop-blur-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-4 text-center">
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Trusted Platform Integrations
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {partners.map((p, idx) => {
              const Icon = p.icon
              return (
                <div
                  key={idx}
                  className="px-3 py-2.5 rounded-xl bg-card/75 border border-border/70 hover:border-[#23ace3]/50 flex items-center justify-center gap-2.5 text-center transition-all group shadow-2xs hover:-translate-y-0.5 duration-150"
                >
                  <div className="p-1.5 rounded-lg bg-[#23ace3]/10 text-[#23ace3] group-hover:bg-[#23ace3] group-hover:text-white transition-colors shrink-0">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{p.tag}</div>
                  </div>
                </div>
              )
            })}
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
