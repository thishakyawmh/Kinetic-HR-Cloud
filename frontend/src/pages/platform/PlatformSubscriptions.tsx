import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  Check,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
  GraduationCap,
  Award,
  HeartPulse,
  UserPlus,
  ShieldAlert,
  CalendarDays,
  Fingerprint,
  Calculator,
  BrainCircuit,
  FileSignature,
  ArrowRight,
  Zap,
  Info,
} from 'lucide-react'

export interface HRModuleOption {
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

const AVAILABLE_MODULES: HRModuleOption[] = [
  // 1. Core Kinetic HR Modules
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

  // 2. Showcase Training & Additional HR Modules
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

export const PlatformSubscriptions: React.FC = () => {
  const navigate = useNavigate()
  
  // Default selected modules: Core modules selected by default
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([
    'mod-leave-ai',
    'mod-attendance',
    'mod-payroll',
    'mod-training-suite',
  ])

  const [activeCategory, setActiveCategory] = useState<'All' | 'Core Operations' | 'Training & Showcase' | 'Additional HR & Compliance'>('All')

  const toggleModule = (id: string) => {
    setSelectedModuleIds(prev =>
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    )
  }

  // Calculations
  const selectedModules = AVAILABLE_MODULES.filter(m => selectedModuleIds.includes(m.id))
  const baseCost = selectedModules.reduce((sum, m) => sum + m.priceMonthly, 0)
  
  // 10% Integration & Module Commission Fee
  const commissionRate = 0.10
  const integrationCommission = Math.round(baseCost * commissionRate)
  const totalMonthlyCost = baseCost + integrationCommission

  const filteredModules = AVAILABLE_MODULES.filter(m => {
    if (activeCategory === 'All') return true
    return m.category === activeCategory
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Modular SaaS Architecture & Pricing Configurator"
        subtitle="Select individual HR, AI, and Training modules tailored to your organization. Pay only for what you deploy."
        badge={
          <Badge variant="outline" className="text-xs bg-[#23ace3]/15 text-[#23ace3] border-[#23ace3]/30">
            Custom Modular SaaS Tiers
          </Badge>
        }
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-3 py-1 text-xs">
            <Zap className="h-3.5 w-3.5 mr-1 animate-pulse" />
            <span>10% Integration Synergy Fee Applied</span>
          </Badge>
        </div>
      </PageHeader>

      {/* Live Selected Modules Cost Breakdown Summary Banner */}
      <Card className="border border-[#23ace3]/40 bg-gradient-to-r from-[#23ace3]/10 via-card to-emerald-500/10 p-6 rounded-3xl shadow-md">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <Badge className="bg-[#23ace3] text-white text-xs px-2.5 py-0.5 font-bold">
                {selectedModuleIds.length} Modules Selected
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">
                Custom Enterprise SaaS Package Configuration
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
              Combine independent HR, Training, and AI modules seamlessly. Integrated modules operate on a shared multi-tenant Azure architecture with unified database sync.
            </p>
          </div>

          {/* Pricing Box */}
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-6 bg-card/80 p-4 rounded-2xl border border-border/80 shadow-xs">
            <div className="text-center sm:text-left border-r border-border/60 pr-4">
              <span className="text-[11px] text-muted-foreground block font-medium">Base Modules Sum:</span>
              <span className="text-xl font-bold font-mono text-foreground">${baseCost}</span>
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
                <span className="text-3xl font-black font-mono text-foreground">${totalMonthlyCost}</span>
                <span className="text-xs text-muted-foreground">/ month</span>
              </div>
            </div>

            <Button
              onClick={() => navigate(`/platform/organizations?register=true&modules=${selectedModuleIds.join(',')}&total=${totalMonthlyCost}`)}
              disabled={selectedModuleIds.length === 0}
              className="bg-[#23ace3] hover:bg-[#1b97ca] text-white font-bold rounded-xl text-xs px-5 py-2.5 shadow-md gap-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>Provision Tenant (${totalMonthlyCost}/mo)</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {(['All', 'Core Operations', 'Training & Showcase', 'Additional HR & Compliance'] as const).map(cat => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className={`text-xs rounded-xl transition-all ${
                activeCategory === cat
                  ? 'bg-[#23ace3] text-white hover:bg-[#1b97ca]'
                  : 'bg-card hover:bg-muted text-muted-foreground'
              }`}
            >
              {cat === 'Training & Showcase' && <GraduationCap className="h-3.5 w-3.5 mr-1.5 text-amber-400" />}
              {cat === 'Core Operations' && <Layers className="h-3.5 w-3.5 mr-1.5 text-sky-400" />}
              <span>{cat}</span>
            </Button>
          ))}
        </div>

        <span className="text-xs text-muted-foreground font-mono">
          Showing {filteredModules.length} available module{filteredModules.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Module Selection Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map(mod => {
          const isSelected = selectedModuleIds.includes(mod.id)
          const IconComp = mod.icon

          return (
            <Card
              key={mod.id}
              onClick={() => toggleModule(mod.id)}
              className={`rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'border-[#23ace3] bg-[#23ace3]/5 shadow-lg shadow-[#23ace3]/10 ring-1 ring-[#23ace3]/50'
                  : 'border-border/60 hover:border-border bg-card'
              }`}
            >
              {/* Top Banner Tag */}
              {mod.isShowcase && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-bl-xl shadow-xs flex items-center gap-1">
                  <Sparkles className="h-3 w-3 fill-current" />
                  <span>Showcase Feature</span>
                </div>
              )}

              {mod.isCore && (
                <div className="absolute top-0 right-0 bg-sky-500/10 text-sky-400 border-b border-l border-sky-500/30 text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-bl-xl">
                  Core HR Engine
                </div>
              )}

              <CardHeader className="p-5 pb-3 space-y-3">
                <div className="flex items-start justify-between gap-3 pr-12">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#23ace3] text-white shadow-xs'
                          : 'bg-muted/60 text-muted-foreground'
                      }`}
                    >
                      <IconComp className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground leading-snug">{mod.name}</h3>
                      <span className="text-[10px] text-muted-foreground font-medium">{mod.category}</span>
                    </div>
                  </div>
                </div>

                <CardDescription className="text-xs text-muted-foreground leading-relaxed min-h-[38px]">
                  {mod.description}
                </CardDescription>

                <div className="pt-2 flex items-baseline justify-between border-t border-border/40">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono text-foreground">${mod.priceMonthly}</span>
                    <span className="text-[11px] text-muted-foreground">/ mo</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono font-medium">
                    +${Math.round(mod.priceMonthly * 0.10)} integration fee
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2 pt-2 text-xs border-t border-border/40">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Module Capabilities:
                  </span>
                  {mod.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-tight">{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex items-center justify-between gap-3 border-t border-border/40">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleModule(mod.id)
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-[#23ace3] text-white hover:bg-[#1b97ca] shadow-xs'
                        : 'bg-muted/80 hover:bg-muted text-foreground'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckSquare className="h-4 w-4 text-white" />
                        <span>Module Selected (${mod.priceMonthly}/mo)</span>
                      </>
                    ) : (
                      <>
                        <Square className="h-4 w-4 text-muted-foreground" />
                        <span>Add Module (+${mod.priceMonthly}/mo)</span>
                      </>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Formula Explanation Footer Banner */}
      <Card className="border border-border/60 bg-card p-5 rounded-2xl shadow-xs text-xs text-muted-foreground space-y-2">
        <div className="flex items-center gap-2 font-bold text-foreground">
          <Info className="h-4 w-4 text-[#23ace3]" />
          <span>Transparent Pricing & 10% Module Integration Formula</span>
        </div>
        <p className="leading-relaxed">
          <strong>Formula:</strong> Total Subscription = Sum of Selected Module Base Costs + (10% Integration &amp; Module Sync Commission).
          The 10% integration commission covers unified Azure Cosmos DB data synchronization, multi-tenant RBAC security, and cross-module AI orchestration workflows across all selected services.
        </p>
      </Card>
    </div>
  )
}
