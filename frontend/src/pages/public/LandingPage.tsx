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
  CheckSquare,
  Square,
  Sparkles,
  GraduationCap,
  Award,
  HeartPulse,
  UserPlus,
  ShieldAlert,
  Fingerprint,
  Calculator,
  BrainCircuit,
  FileSignature,
  CreditCard,
  Info,
} from 'lucide-react'

export interface LandingModuleOption {
  id: string
  name: string
  category: 'Core Operations' | 'Training & Showcase' | 'Additional HR & Compliance'
  description: string
  priceMonthly: number
  isCore?: boolean
  isShowcase?: boolean
  icon: React.ComponentType<{ className?: string }>
  features: string[]
}

const LANDING_MODULES: LandingModuleOption[] = [
  // Core Operations
  {
    id: 'mod-leave-ai',
    name: 'Leave Management & Kinetic AI Arbitrator',
    category: 'Core Operations',
    description: 'Automated leave requests, team calendar duty wiring, and AI priority arbitration.',
    priceMonthly: 120,
    isCore: true,
    icon: CalendarDays,
    features: [
      'Interactive team annual leave calendar',
      'AI Priority Fairness Arbitration Engine',
      'Duty backup handoff auto-wiring',
      'Employee appeal & complaint workflow',
    ],
  },
  {
    id: 'mod-attendance',
    name: 'Biometric Attendance & Shift Rostering',
    category: 'Core Operations',
    description: 'Live biometric fingerprint device syncing, shift rosters, and unannounced absence tracking.',
    priceMonthly: 95,
    isCore: true,
    icon: Fingerprint,
    features: [
      'Fingerprint hardware integration logs',
      'Biometric unannounced absence auto-casual leave',
      'Multi-branch shift roster management',
      'Real-time overtime (OT) tracking',
    ],
  },
  {
    id: 'mod-payroll',
    name: 'Payroll & Statutory EPF/ETF Engine',
    category: 'Core Operations',
    description: 'Automated salary calculations, Sri Lanka Shop & Office statutory EPF (8%/12%) and ETF (3%) processing.',
    priceMonthly: 150,
    isCore: true,
    icon: Calculator,
    features: [
      'Statutory EPF 8% / 12% & ETF 3% calculations',
      'Configurable Overtime, Target Coverage & Bonuses',
      'Instant PDF payslip generation & download',
      'Payslip anomaly & delta AI detector',
    ],
  },
  {
    id: 'mod-talent-ai',
    name: 'Performance & AI Talent Analytics',
    category: 'Core Operations',
    description: 'AI performance metrics, employee KPI tracking, and automated appraisal insights.',
    priceMonthly: 110,
    isCore: true,
    icon: BrainCircuit,
    features: [
      'AI-driven employee performance scoring',
      'KPI & quarterly goal tracking',
      'Manager review co-pilot assistant',
      'Department staffing SLA analytics',
    ],
  },
  {
    id: 'mod-doc-verify',
    name: 'HR Digital Document Signing & Verification',
    category: 'Core Operations',
    description: 'Secure 2FA document signature, contract distribution, and digital employee files.',
    priceMonthly: 80,
    isCore: true,
    icon: FileSignature,
    features: [
      '2FA SMS/Email digital signature verification',
      'Policy document distribution library',
      'Employee softcopy dispatch via ACS',
      'Vector AI semantic policy search (RAG)',
    ],
  },

  // Showcase Training & Additional HR Modules
  {
    id: 'mod-training-suite',
    name: 'Employee Training & Skill Development Suite',
    category: 'Training & Showcase',
    description: 'Modular training course distribution, skill matrix tracking, and compliance certifications.',
    priceMonthly: 90,
    isShowcase: true,
    icon: GraduationCap,
    features: [
      'Interactive employee training portal',
      'Skill gap matrix & role competency maps',
      'Mandatory banking & retail compliance courses',
      'Manager course completion tracking',
    ],
  },
  {
    id: 'mod-lms-cert',
    name: 'Learning Management System (LMS) & Certification',
    category: 'Training & Showcase',
    description: 'Interactive employee video courses, quiz assessments, and auto-generated completion certificates.',
    priceMonthly: 105,
    isShowcase: true,
    icon: Award,
    features: [
      'Video lesson hosting & SCORM support',
      'Automated quiz assessment engine',
      'Digital verifiable PDF certificates',
      'AI course recommendation assistant',
    ],
  },
  {
    id: 'mod-engagement',
    name: 'Employee Engagement & Mood Wellness Surveys',
    category: 'Additional HR & Compliance',
    description: 'Pulse sentiment surveys, anonymous feedback channels, and AI attrition risk prediction.',
    priceMonthly: 75,
    isShowcase: true,
    icon: HeartPulse,
    features: [
      'Weekly pulse mood & wellness check-ins',
      'Anonymous whistleblowing & feedback box',
      'AI sentiment analysis dashboard',
      'Burnout & attrition risk alerts',
    ],
  },
  {
    id: 'mod-recruitment-ats',
    name: 'Recruitment & AI Applicant Tracking (ATS)',
    category: 'Additional HR & Compliance',
    description: 'Resume parsing, candidate interview scheduling, and AI candidate scoring.',
    priceMonthly: 130,
    isShowcase: true,
    icon: UserPlus,
    features: [
      'AI resume parsing & candidate matching',
      'Kanban hiring pipeline board',
      'Automated interview invitation dispatches',
      'Offer letter generation & e-signing',
    ],
  },
  {
    id: 'mod-health-safety',
    name: 'Workplace Health, Safety & Incident Tracker',
    category: 'Additional HR & Compliance',
    description: 'Incident logging, hazard reporting, OSHA/SL labor safety audits, and corrective action workflows.',
    priceMonthly: 65,
    isShowcase: true,
    icon: ShieldAlert,
    features: [
      'Workplace accident & hazard reporting',
      'Corrective & Preventive Action (CAPA) tracking',
      'Safety inspection checklists',
      'Statutory labor safety audit exports',
    ],
  },
]

export const LandingPage: React.FC = () => {
  const { isAuthenticated, role } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // Selected Modules State (Default: 4 popular modules selected)
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([
    'mod-leave-ai',
    'mod-attendance',
    'mod-payroll',
    'mod-training-suite',
  ])

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All')

  const toggleModule = (id: string) => {
    setSelectedModuleIds(prev =>
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    )
  }

  // Calculations
  const selectedModules = LANDING_MODULES.filter(m => selectedModuleIds.includes(m.id))
  const baseSubtotal = selectedModules.reduce((sum, m) => sum + m.priceMonthly, 0)
  
  // 10% Integration & Module Synergy Commission Fee
  const integrationCommission = Math.round(baseSubtotal * 0.10)
  const totalMonthlyPrice = baseSubtotal + integrationCommission

  const filteredModules = LANDING_MODULES.filter(m => {
    if (activeCategoryFilter === 'All') return true
    return m.category === activeCategoryFilter
  })

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
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-[#ef8d46]" />
          ) : (
            <Moon className="h-4 w-4 text-[#23ace3]" />
          )}
        </button>
      </div>

      {/* =========================================================================
          COMPACT NAVBAR
          ========================================================================= */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/kenetic_logo.webp" alt="Kinetic Logo" className="h-7 w-7 object-contain" />
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Kinetic HR Cloud
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30">
              Enterprise Multi-Tenant
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#features"
              className="hidden md:inline-block text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Features
            </a>
            <a
              href="#plans"
              className="hidden md:inline-block text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Modular Pricing
            </a>

            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="px-3.5 py-1.5 rounded-xl bg-[#23ace3] hover:bg-[#1b97ca] text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-foreground hover:bg-muted transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/login/SAMPATH"
                  className="px-3.5 py-1.5 rounded-xl bg-[#23ace3] hover:bg-[#1b97ca] text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1"
                >
                  <span>Launch Sampath Demo</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          HERO SECTION (Compact, high-density)
          ========================================================================= */}
      <section className="pt-10 pb-12 sm:pt-16 sm:pb-16 max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/80 bg-muted/40 backdrop-blur-xs text-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-[#23ace3]" />
          <span className="text-muted-foreground">SOC 2 Type II Certified • Multi-Tenant Azure Cosmos DB</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-[1.15]">
          Autonomous Modular HR Cloud <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#23ace3] via-sky-400 to-[#ef8d46] bg-clip-text text-transparent">
            Built for Modern Enterprise Teams
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Select individual independent HR, Training, and AI modules. Powered by Azure OpenAI, biometric hardware integrations, and automated Sri Lanka statutory EPF/ETF compliance.
        </p>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/login/SAMPATH"
            className="px-5 py-2.5 rounded-xl bg-[#23ace3] hover:bg-[#1b97ca] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <span>Explore Demo Portal</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#plans"
            className="px-5 py-2.5 rounded-xl border border-border/80 bg-card hover:bg-muted font-semibold text-xs text-foreground transition-all"
          >
            Customize Modular Package
          </a>
        </div>
      </section>

      {/* =========================================================================
          FEATURES GRID (2x3 compact cards)
          ========================================================================= */}
      <section id="features" className="py-12 border-t border-border/60 bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#23ace3]">
              Enterprise Platform Features
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Engineered for Enterprise HR Operations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((f, idx) => {
              const IconComp = f.icon
              return (
                <div
                  key={idx}
                  className="rounded-2xl p-5 border border-border/70 bg-card/90 backdrop-blur-xs space-y-2.5 shadow-xs hover:border-[#23ace3]/50 transition-all group"
                >
                  <div className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <IconComp className="h-4 w-4" style={{ color: f.color }} />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          MODULAR SAAS PURCHASING & PRICING CONFIGURATOR (Checkboxes & 10% Fee)
          ========================================================================= */}
      <section id="plans" className="py-14 sm:py-16 border-t border-border/60 bg-muted/15 backdrop-blur-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#ef8d46]">
              Custom Modular Purchasing
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Build Your Custom Modular HR Package
            </h2>
            <p className="text-xs text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Select only the independent HR, Training, and AI modules your enterprise needs. Pay for selected modules + 10% integration commission.
            </p>
          </div>

          {/* Live Price & Commission Calculation Banner */}
          <div className="p-6 rounded-3xl border border-[#23ace3]/40 bg-card shadow-lg space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#23ace3] text-white text-xs font-bold">
                    {selectedModuleIds.length} Modules Selected
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    Integrated Multi-Tenant Azure Deployment
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Includes full multi-tenant Cosmos DB isolation, biometric device syncing, and AI arbitration capabilities.
                </p>
              </div>

              {/* Price Calculation Card */}
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-6 bg-muted/40 p-4 rounded-2xl border border-border/80">
                <div className="text-center sm:text-left border-r border-border/60 pr-4">
                  <span className="text-[11px] text-muted-foreground block font-medium">Base Modules Sum:</span>
                  <span className="text-xl font-bold font-mono text-foreground">${baseSubtotal}</span>
                </div>

                <div className="text-center sm:text-left border-r border-border/60 pr-4">
                  <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                    <span>10% Integration Fee:</span>
                    <Info className="h-3 w-3 text-emerald-400 shrink-0" />
                  </div>
                  <span className="text-xl font-bold font-mono text-emerald-400">+${integrationCommission}</span>
                </div>

                <div className="text-center sm:text-left">
                  <span className="text-[11px] text-[#23ace3] uppercase tracking-wider block font-bold">Total Monthly SaaS:</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black font-mono text-foreground">${totalMonthlyPrice}</span>
                    <span className="text-xs text-muted-foreground">/ month</span>
                  </div>
                </div>

                <Link
                  to="/login/SAMPATH"
                  className="px-5 py-2.5 rounded-xl bg-[#23ace3] hover:bg-[#1b97ca] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Purchase & Provision (${totalMonthlyPrice}/mo)</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              {['All', 'Core Operations', 'Training & Showcase', 'Additional HR & Compliance'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeCategoryFilter === cat
                      ? 'bg-[#23ace3] text-white shadow-xs'
                      : 'bg-card border border-border/70 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {cat === 'Training & Showcase' && '🎓 '}
                  {cat}
                </button>
              ))}
            </div>

            <span className="text-xs text-muted-foreground font-mono">
              Showing {filteredModules.length} modular components
            </span>
          </div>

          {/* Modules Grid with Checkboxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredModules.map(mod => {
              const isChecked = selectedModuleIds.includes(mod.id)
              const IconComp = mod.icon

              return (
                <div
                  key={mod.id}
                  onClick={() => toggleModule(mod.id)}
                  className={`rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                    isChecked
                      ? 'border-[#23ace3] bg-[#23ace3]/5 shadow-md ring-1 ring-[#23ace3]/40'
                      : 'border-border/70 bg-card hover:border-border'
                  }`}
                >
                  {mod.isShowcase && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-orange-500 text-slate-950 text-[9px] font-black uppercase px-3 py-0.5 rounded-bl-xl shadow-xs flex items-center gap-1">
                      <Sparkles className="h-3 w-3 fill-current" />
                      <span>Showcase Feature</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3 pr-10">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                            isChecked ? 'bg-[#23ace3] text-white' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <IconComp className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-foreground leading-snug">{mod.name}</h3>
                          <span className="text-[10px] text-muted-foreground font-medium">{mod.category}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed min-h-[36px]">
                      {mod.description}
                    </p>

                    <div className="pt-2 flex items-baseline justify-between border-t border-border/40">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black font-mono text-foreground">${mod.priceMonthly}</span>
                        <span className="text-[10px] text-muted-foreground">/ mo</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono font-medium">
                        +${Math.round(mod.priceMonthly * 0.10)} integration fee
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-border/40">
                      {mod.features.map((f, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-border/40">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleModule(mod.id)
                      }}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        isChecked
                          ? 'bg-[#23ace3] text-white hover:bg-[#1b97ca] shadow-xs'
                          : 'bg-muted/80 hover:bg-muted text-foreground'
                      }`}
                    >
                      {isChecked ? (
                        <>
                          <CheckSquare className="h-4 w-4 text-white" />
                          <span>Selected (${mod.priceMonthly}/mo)</span>
                        </>
                      ) : (
                        <>
                          <Square className="h-4 w-4 text-muted-foreground" />
                          <span>Add Module (+${mod.priceMonthly}/mo)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/70 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Info className="h-4 w-4 text-[#23ace3]" />
              <span>Transparent Pricing & 10% Module Integration Formula</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              Total Subscription = Sum of Selected Module Base Costs + (10% Integration &amp; Module Sync Commission).
              The 10% integration commission covers unified Azure Cosmos DB data synchronization, multi-tenant RBAC security, and cross-module AI orchestration workflows across all selected services.
            </p>
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
              Modular Pricing
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
