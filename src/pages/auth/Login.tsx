import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  ShieldCheck,
  Building2,
  User,
  ArrowRight,
  Lock,
  ChevronRight,
} from 'lucide-react'

export const Login: React.FC = () => {
  const { switchUser, switchTenant, allTenants, allUsers } = useAuth()
  const navigate = useNavigate()
  const [selectedTenantId, setSelectedTenantId] = useState('tenant-kinetic')

  const handleSelectRole = (userId: string, targetPath: string) => {
    switchUser(userId)
    navigate(targetPath)
  }

  // Preset demo personas (Section 8)
  const personas = [
    {
      role: 'Employee',
      userId: 'user-Alice',
      name: 'Alice Johnson',
      title: 'Senior Frontend Engineer',
      dept: 'Engineering',
      badgeVariant: 'outline' as const,
      route: '/employee/dashboard',
      desc: 'Annual leave (12 days), sick leave (7 days), payslips, AI emergency assistant',
    },
    {
      role: 'Manager',
      userId: 'user-david',
      name: 'David Wilson',
      title: 'Engineering Director',
      dept: 'Engineering',
      badgeVariant: 'info' as const,
      route: '/manager/dashboard',
      desc: 'Team coverage matrix, pending approvals with AI decision support',
    },
    {
      role: 'HR Administrator',
      userId: 'user-sarah',
      name: 'Sarah Miller',
      title: 'VP of People & Operations',
      dept: 'Human Resources',
      badgeVariant: 'destructive' as const,
      route: '/admin/dashboard',
      desc: 'Organization telemetry, employee provisioning, RAG policy upload, AI observability',
    },
    {
      role: 'Platform Administrator',
      userId: 'user-platform-admin',
      name: 'Alex Thorne',
      title: 'Principal Cloud Platform Director',
      dept: 'Kinetic SaaS Operations',
      badgeVariant: 'info' as const,
      route: '/platform/dashboard',
      desc: 'Multi-tenant SaaS command, organization onboarding wizard, plan quotas, Azure health',
    },
  ]

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 text-slate-100 p-4 relative overflow-hidden font-sans">
      {/* Background ambient subtle tech lighting */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-sky-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg space-y-6 relative z-10">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/30 mb-2">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Kinetic <span className="text-sky-400">HR Cloud</span>
          </h1>
          <p className="text-sm text-slate-400">Your intelligent HR workspace</p>
        </div>

        {/* Login Shell Card */}
        <Card className="border-slate-800 bg-slate-950/80 backdrop-blur shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Microsoft Entra ID Primary Button (Section 8) */}
          <div className="space-y-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleSelectRole('user-Alice', '/employee/dashboard')}
              className="w-full h-12 bg-white text-slate-900 hover:bg-slate-100 border-none font-semibold text-sm gap-3 shadow-md"
            >
              {/* Microsoft 4-square logo */}
              <svg className="h-4 w-4" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
              <span>Continue with Microsoft</span>
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Microsoft Entra ID (Azure AD) SSO Protected</span>
            </div>
          </div>

          {/* Development Authentication Mode Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-950 px-3 text-[11px] font-mono font-semibold tracking-wider text-amber-400">
                Development / Demo Auth Mode
              </span>
            </div>
          </div>

          {/* Development Personas Selector (Section 8 requirement) */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-300">
              Select Demo Role Persona:
            </div>

            <div className="space-y-2.5">
              {personas.map(p => (
                <button
                  key={p.userId}
                  onClick={() => handleSelectRole(p.userId, p.route)}
                  className="w-full flex items-start justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-sky-500/50 hover:bg-slate-900 transition-all text-left group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white group-hover:text-sky-300 transition-colors">
                        {p.name}
                      </span>
                      <Badge variant={p.badgeVariant} className="text-[10px] uppercase font-mono">
                        {p.role}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-400">
                      {p.title} • {p.dept}
                    </div>
                    <p className="text-[11px] text-slate-500 pt-0.5 leading-snug">
                      {p.desc}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-sky-400 transition-colors mt-1 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Tenant Isolation Test Shortcut */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Tenant: <strong className="text-white">Kinetic Technologies</strong></span>
            <button
              onClick={() => {
                switchTenant('tenant-nova')
                navigate('/employee/dashboard')
              }}
              className="text-sky-400 hover:underline"
            >
              Test Nova Systems (Tenant 2)
            </button>
          </div>
        </Card>

        {/* Footer Disclaimer */}
        <p className="text-center text-xs text-slate-500">
          Kinetic HR Cloud is an enterprise AI cloud layer. All transactions are logged for SOC2 compliance.
        </p>
      </div>
    </div>
  )
}
