import React, { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  CalendarDays,
  Calendar,
  FileSpreadsheet,
  FileCheck2,
  BookOpen,
  Settings,
  Sparkles,
  LayoutDashboard,
  CheckSquare,
  Users,
  Building,
  History,
  Activity,
  Layers,
  Sliders,
  LogOut,
  X,
  Sun,
  Moon,
  HelpCircle,
  ChevronRight,
} from 'lucide-react'

interface KineticSidebarProps {
  isExpanded: boolean
  onToggle: () => void
  onOpenLeaves?: () => void
  onNewChat?: () => void
}

export const KineticSidebar: React.FC<KineticSidebarProps> = ({
  isExpanded,
  onToggle,
  onOpenLeaves,
  onNewChat,
}) => {
  const { user, tenant, role, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const employeeNav = [
    { label: 'Assistant', to: '/employee/dashboard', icon: Sparkles },
    { label: 'Overview', to: '/employee/overview', icon: LayoutDashboard },
    { label: 'My Leaves', to: '/employee/leave', icon: CalendarDays },
    { label: 'Payslips', to: '/employee/payslips', icon: FileSpreadsheet },
    { label: 'My Requests', to: '/employee/requests', icon: FileCheck2 },
    { label: 'Company Policies', to: '/employee/policies', icon: BookOpen },
  ]

  const managerNav = [
    { label: 'Manager Assistant', to: '/manager/assistant', icon: Sparkles },
    { label: 'Team Approvals', to: '/manager/approvals', icon: CheckSquare, badge: '1' },
    { label: 'Team Availability', to: '/manager/team', icon: Users },
    { label: 'Manager Overview', to: '/manager/dashboard', icon: LayoutDashboard },
    { label: 'Personal Leaves', to: '/employee/leave', icon: CalendarDays },
    { label: 'Payslips', to: '/employee/payslips', icon: FileSpreadsheet },
    { label: 'Policies', to: '/employee/policies', icon: BookOpen },
  ]

  const adminNav = [
    { label: 'Command Center', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Employee Directory', to: '/admin/employees', icon: Users },
    { label: 'Departments', to: '/admin/departments', icon: Building },
    { label: 'Leave Rules', to: '/admin/leave-types', icon: CalendarDays },
    { label: 'Policy Documents', to: '/admin/policies', icon: BookOpen },
    { label: 'Audit Logs', to: '/admin/audit-logs', icon: History },
    { label: 'AI Observability', to: '/admin/ai-usage', icon: Activity },
    { label: 'Integrations', to: '/admin/integrations', icon: Layers },
    { label: 'Settings', to: '/admin/settings', icon: Sliders },
  ]

  const platformAdminNav = [
    { label: 'Platform Command', to: '/platform/dashboard', icon: LayoutDashboard },
    { label: 'Organizations', to: '/platform/organizations', icon: Building, badge: 'SaaS' },
    { label: 'Subscriptions & Limits', to: '/platform/subscriptions', icon: FileSpreadsheet },
    { label: 'Azure Health Fleet', to: '/platform/system-health', icon: Activity },
    { label: 'Platform Audit Logs', to: '/platform/audit-logs', icon: History },
  ]

  const items =
    role === 'platform_admin'
      ? platformAdminNav
      : role === 'admin'
      ? adminNav
      : role === 'manager'
      ? managerNav
      : employeeNav


  const handleStartNewChat = () => {
    if (onNewChat) {
      onNewChat()
    }
    navigate(`/employee/dashboard?new=${Date.now()}`)
  }

  return (
    <aside
      className={`h-screen shrink-0 transition-all duration-300 ease-in-out font-sans flex flex-col justify-between border-r border-border/60 bg-[#1e1f20] dark:bg-[#18191a] text-foreground select-none z-30 ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
    >
      {/* Top Section */}
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header: Logo & Sidebar Toggle */}
        <div
          className={`h-14 flex items-center border-b border-border/30 transition-all ${
            isExpanded ? 'justify-between px-3.5 py-3' : 'justify-center p-2'
          }`}
        >
          {isExpanded ? (
            <>
              <div
                onClick={() => {
                  if (role === 'platform_admin') navigate('/platform/dashboard')
                  else if (role === 'employee') navigate('/employee/dashboard')
                  else if (role === 'manager') navigate('/manager/dashboard')
                  else navigate('/admin/dashboard')
                }}
                className="flex items-center gap-2.5 cursor-pointer overflow-hidden group"
                title="Kinetic Home"
              >
                <img
                  src="/kenetic_logo.webp"
                  alt="Kinetic"
                  className="h-7 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
                  onError={e => {
                    const target = e.currentTarget
                    if (!target.src.endsWith('kenetic_logo.wbp')) {
                      target.src = '/kenetic_logo.wbp'
                    }
                  }}
                />
                <span className="font-semibold text-sm tracking-tight text-foreground truncate flex items-center">
                  Kinetic
                  <span className="font-bold ml-1 flex items-center">
                    <span className="text-[#23ace3]">H</span>
                    <span className="text-[#ef8d46]">R</span>
                  </span>
                </span>
              </div>

              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer shrink-0"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </>
          ) : (
            /* Collapsed State: Logo clearly appears centered, clicking it expands the sidebar */
            <button
              onClick={onToggle}
              className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted/60 transition-all cursor-pointer group"
              title="Click to expand menu"
            >
              <img
                src="/kenetic_logo.webp"
                alt="Kinetic - Click to expand menu"
                className="h-7 w-auto object-contain shrink-0 group-hover:scale-110 transition-transform"
                onError={e => {
                  const target = e.currentTarget
                  if (!target.src.endsWith('kenetic_logo.wbp')) {
                    target.src = '/kenetic_logo.wbp'
                  }
                }}
              />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="px-2 pt-2 space-y-1 overflow-y-auto no-scrollbar">
          {items.map(item => {
            const Icon = item.icon
            const isAssistant = item.label === 'Assistant' || item.label === 'Manager Assistant'

            return (
              <div key={item.to} className="relative group/nav flex items-center">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center w-full rounded-full transition-colors cursor-pointer ${
                      isExpanded
                        ? `gap-3 px-3.5 py-2 text-xs font-medium ${isAssistant ? 'pr-9' : ''}`
                        : 'h-10 w-10 mx-auto justify-center'
                    } ${
                      isActive
                        ? 'bg-muted text-foreground font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`
                  }
                  title={!isExpanded ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {isExpanded && <span className="truncate flex-1">{item.label}</span>}
                </NavLink>

                {/* + Mark Button at the corner of Assistant tab */}
                {isAssistant && isExpanded && (
                  <button
                    onClick={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleStartNewChat()
                    }}
                    className="absolute right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#23ace3]/15 text-[#23ace3] hover:bg-[#23ace3]/30 hover:scale-110 transition-all cursor-pointer border border-[#23ace3]/30"
                    title="Start new chat"
                  >
                    <Plus className="h-3 w-3 stroke-[2.5]" />
                  </button>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Bottom Profile & Settings Section */}
      <div className="p-3 border-t border-border/30 relative">
        {isExpanded ? (
          <div className="flex items-center justify-between">
            {/* User Profile Card */}
            <div className="flex items-center gap-2.5 overflow-hidden p-1.5 rounded-xl flex-1 pr-2 min-w-0">
              <div className="h-8 w-8 rounded-full bg-[#23ace3] text-white text-xs font-semibold flex items-center justify-center shrink-0 shadow-xs">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="truncate text-left min-w-0">
                <div className="text-xs font-medium text-foreground truncate">{user?.name || 'User'}</div>
                <div className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                  {user?.jobTitle || user?.department || 'Employee'}
                </div>
              </div>
            </div>

            {/* Settings Trigger - Opens Settings Menu */}
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* Collapsed Icons */
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <div
              className="h-8 w-8 rounded-full bg-[#23ace3] text-white text-xs font-semibold flex items-center justify-center shadow-xs"
              title={user?.name || 'User'}
            >
              {user?.name?.[0] || 'U'}
            </div>
          </div>
        )}

        {/* Kinetic Settings Popup: Theme Toggle & Logout Only */}
        {showSettingsMenu && (
          <div className="absolute bottom-16 left-8 w-56 rounded-[20px] border border-[#3c4043]/60 bg-[#1e1f20] text-[#e3e3e3] p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 text-left space-y-0.5 text-xs font-sans">
            {/* Theme Change Option */}
            <button
              onClick={() => {
                toggleTheme()
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#282a2c] rounded-xl transition-colors cursor-pointer text-left text-xs"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="h-4 w-4 text-[#9aa0a6]" />
                ) : (
                  <Sun className="h-4 w-4 text-[#9aa0a6]" />
                )}
                <span>Theme</span>
              </div>
              <div className="flex items-center gap-1 text-[#9aa0a6]">
                <span className="capitalize text-[11px] font-medium">{theme}</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </button>

            <div className="border-t border-[#3c4043]/40 my-1" />

            {/* Logout Button */}
            <button
              onClick={() => {
                setShowSettingsMenu(false)
                logout()
                navigate('/login')
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#282a2c] rounded-xl cursor-pointer text-left transition-colors text-[#e3e3e3] hover:text-rose-400 group text-xs"
            >
              <LogOut className="h-4 w-4 text-[#9aa0a6] group-hover:text-rose-400 transition-colors shrink-0" />
              <span className="font-medium">Log out</span>
            </button>
          </div>
        )}
      </div>

    </aside>
  )
}
