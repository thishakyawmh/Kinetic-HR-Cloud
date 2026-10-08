import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  X,
  Sparkles,
  CalendarDays,
  FileSpreadsheet,
  FileCheck2,
  BookOpen,
  User,
  LayoutDashboard,
  CheckSquare,
  Users,
  Building,
  History,
  Activity,
  Layers,
  Sliders,
  Shield,
  Briefcase,
  Zap,
} from 'lucide-react'
import { PlanUpgradeModal } from '@/components/subscription/PlanUpgradeModal'
import { Badge } from '@/components/ui/badge'

interface NavigationDrawerProps {
  isOpen: boolean
  onClose: () => void
  onOpenLeaves?: () => void
}

interface NavItem {
  label: string
  to: string
  icon: any
  badge?: string
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  onOpenLeaves,
}) => {
  const { role, user, tenant } = useAuth()
  const navigate = useNavigate()
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = React.useState(false)

  if (!isOpen) return null

  const employeeNav: NavItem[] = [
    { label: 'Assistant', to: '/employee/dashboard', icon: Sparkles },
    { label: 'Leaves & Balances', to: '/employee/leave', icon: CalendarDays },
    { label: 'Payslips', to: '/employee/payslips', icon: FileSpreadsheet },
    { label: 'Document Requests', to: '/employee/requests', icon: FileCheck2 },
    { label: 'Company Policies', to: '/employee/policies', icon: BookOpen },
    { label: 'Profile', to: '/employee/profile', icon: User },
  ]

  const managerNav: NavItem[] = [
    { label: 'Assistant', to: '/manager/assistant', icon: Sparkles },
    { label: 'Overview', to: '/manager/dashboard', icon: LayoutDashboard },
    { label: 'Roles', to: '/manager/roles', icon: Briefcase },
    { label: 'Workforce Management', to: '/manager/workforce', icon: Users },
    { label: 'Document Approvals', to: '/manager/approvals', icon: FileCheck2, badge: '1 pending' },
    { label: 'Team Availability', to: '/manager/team', icon: CalendarDays },
  ]

  const adminNav: NavItem[] = [
    { label: 'Assistant', to: '/admin/assistant', icon: Sparkles },
    { label: 'Overview', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Workforce Directory', to: '/admin/employees', icon: Users },
    { label: 'Workspace Directory', to: '/admin/departments', icon: Building },
    { label: 'Audit & Compliance Logs', to: '/admin/audit-logs', icon: History },
    { label: 'AI Usage & Observability', to: '/admin/ai-usage', icon: Activity, badge: 'Live' },
    { label: 'Cloud Integrations', to: '/admin/integrations', icon: Layers },
    { label: 'Tenant & Model Settings', to: '/admin/settings', icon: Sliders },
  ]

  const items = role === 'admin' ? adminNav : role === 'manager' ? managerNav : employeeNav

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex">
        <div className="w-screen max-w-xs bg-card border-r border-border shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
          {/* Drawer Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src="/kenetic_logo.webp"
                alt="Kinetic HR"
                className="h-7 w-auto object-contain"
                onError={e => {
                  const target = e.currentTarget
                  if (!target.src.endsWith('kenetic_logo.wbp')) {
                    target.src = '/kenetic_logo.wbp'
                  }
                }}
              />
              <span className="font-bold text-sm text-foreground">Kinetic HR</span>
              {role && (
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-2xs select-none ${
                    role === 'platform_admin'
                      ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30'
                      : role === 'admin'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                      : role === 'manager'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                      : 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30'
                  }`}
                >
                  {role === 'platform_admin' ? 'Platform' : role === 'admin' ? 'Admin' : role === 'manager' ? 'Manager' : 'Employee'}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User & Role Badge */}
          <div className="p-4 pb-2">
            <div className="p-3 rounded-2xl bg-muted/60 border border-border/80 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-foreground">{user?.name}</div>
                <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">{user?.jobTitle}</div>
              </div>
              <Badge variant="outline" className="text-[10px] capitalize font-medium">
                {role}
              </Badge>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {role === 'admin' ? 'Administration' : role === 'manager' ? 'Management' : 'Self-Service'}
            </div>

            {items.map(item => {
              const Icon = item.icon
              const isAiBadge = item.badge === 'Main' || item.badge === 'AI'
              const isWarningBadge = item.badge?.includes('Pending')

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#23ace3] text-white font-bold shadow-md shadow-[#23ace3]/20'
                        : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isWarningBadge
                          ? 'bg-[#ef8d46]/15 text-[#ef8d46] border border-[#ef8d46]/30'
                          : isAiBadge
                          ? 'bg-white/20 text-white font-bold'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* Footer Info */}
          <div className="p-4 border-t border-border bg-muted/30 text-xs text-muted-foreground space-y-3">
            <div className="flex items-center justify-between">
              <div className="truncate max-w-[150px]">
                <span className="font-medium text-foreground block truncate">{tenant?.name}</span>
                <span className="text-[10px] text-muted-foreground">{tenant?.domain}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>{tenant?.plan || 'Enterprise'} Plan</span>
              </div>
            </div>

            {role === 'admin' && tenant?.plan !== 'Enterprise' && (
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-[#23ace3]/15 text-[#23ace3] hover:bg-[#23ace3] hover:text-white border border-[#23ace3]/30 transition-all cursor-pointer shadow-2xs"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Upgrade Plan</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  )
}
