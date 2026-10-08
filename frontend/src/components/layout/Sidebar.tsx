import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  CalendarDays,
  FileSpreadsheet,
  Bot,
  BookOpen,
  User,
  Users,
  CheckSquare,
  FileCheck2,
  Building,
  Sliders,
  History,
  Activity,
  Layers,
  Sparkles,
  CalendarCheck,
  Shield,
  Briefcase,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
  badge?: string
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role, user } = useAuth()
  const location = useLocation()

  const employeeNav: NavItem[] = [
    { label: 'Kinetic AI Assistant', to: '/employee/dashboard', icon: Sparkles, badge: 'Main' },
    { label: 'My Leaves & Balances', to: '/employee/leave', icon: CalendarDays },
    { label: 'My Payslips', to: '/employee/payslips', icon: FileSpreadsheet },
    { label: 'Document Requests', to: '/employee/requests', icon: FileCheck2 },
    { label: 'Company Policies', to: '/employee/policies', icon: BookOpen },
    { label: 'My Profile', to: '/employee/profile', icon: User },
    { label: 'HR Overview Hub', to: '/employee/overview', icon: LayoutDashboard },
  ]

  const managerNav: NavItem[] = [
    { label: 'Assistant', to: '/manager/assistant', icon: Sparkles, badge: 'AI' },
    { label: 'Overview', to: '/manager/dashboard', icon: LayoutDashboard },
    { label: 'Roles', to: '/manager/roles', icon: Briefcase },
    { label: 'Workforce Management', to: '/manager/workforce', icon: Users },
    { label: 'Document Approvals', to: '/manager/approvals', icon: FileCheck2, badge: '1 Pending' },
    { label: 'Team Availability', to: '/manager/team', icon: CalendarDays },
  ]

  const adminNav: NavItem[] = [
    { label: 'Assistant', to: '/admin/assistant', icon: Sparkles },
    { label: 'Overview', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Workforce Directory', to: '/admin/employees', icon: Users },
    { label: 'Workspace Directory', to: '/admin/departments', icon: Building },
    { label: 'Company Holidays', to: '/admin/holidays', icon: CalendarCheck },
    { label: 'Global Approvals', to: '/admin/approvals', icon: CheckSquare },
    { label: 'Audit & Compliance Logs', to: '/admin/audit-logs', icon: History },
    { label: 'AI Usage & Observability', to: '/admin/ai-usage', icon: Activity, badge: 'Telemetry' },
    { label: 'Cloud Integrations', to: '/admin/integrations', icon: Layers, badge: '5 Connected' },
    { label: 'Tenant & AI Settings', to: '/admin/settings', icon: Sliders },
  ]

  const items = role === 'admin' ? adminNav : role === 'manager' ? managerNav : employeeNav

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 text-slate-100 transition-transform duration-200 ease-in-out md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-2.5 px-6 border-b border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500 text-white font-bold shadow-md shadow-sky-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold tracking-tight text-white text-base leading-tight">
              Kinetic <span className="text-sky-400 font-semibold">HR</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
              Cloud Layer v2.6
            </div>
          </div>
        </div>

        {/* Role Scope Notice */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between rounded-lg bg-slate-800/80 px-3 py-2 border border-slate-700/60">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-sky-400" />
              <div>
                <div className="text-xs font-semibold text-white capitalize">{role} Portal</div>
                <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{user?.jobTitle}</div>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] uppercase font-mono border-slate-600',
                role === 'admin' ? 'text-amber-400 border-amber-400/30' : role === 'manager' ? 'text-sky-400 border-sky-400/30' : 'text-emerald-400 border-emerald-400/30'
              )}
            >
              {role}
            </Badge>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {role === 'admin' ? 'Administration' : role === 'manager' ? 'Management & Team' : 'Employee Self-Service'}
          </div>

          {items.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.to || (item.to !== '/employee/dashboard' && item.to !== '/manager/dashboard' && item.to !== '/admin/dashboard' && location.pathname.startsWith(item.to))

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all group',
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn('h-4 w-4 transition-colors', isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-400')} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-sky-400 group-hover:bg-slate-700'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* AI Agent Status Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-slate-300">Kinetic AI Agent</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">Online</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-tight">
            Connected to Azure OpenAI & Enterprise RAG
          </p>
        </div>
      </aside>
    </>
  )
}
