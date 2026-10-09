import React, { useState } from 'react'
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { KineticSidebar } from './KineticSidebar'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { leaveService } from '@/services/leaveService'
import { notificationService } from '@/services/notificationService'
import {
  Bell,
  Building2,
} from 'lucide-react'

export const AppShell: React.FC = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)
  const [showNotifMenu, setShowNotifMenu] = useState(false)

  const location = useLocation()
  const navigate = useNavigate()
  const { user, tenant, role, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    if (location.pathname.startsWith('/platform')) {
      return <Navigate to="/platform" replace />
    }
    return <Navigate to="/login" replace />
  }

  // Strictly guard /platform routes for platform_admin role only
  if (location.pathname.startsWith('/platform') && role !== 'platform_admin') {
    return <Navigate to="/platform" replace />
  }

  // Fetch balances for quick drawer
  const { data: balances = [] } = useQuery({
    queryKey: ['leaveBalances', user?.id],
    queryFn: () => (user?.id ? leaveService.getLeaveBalances(user.id) : []),
    enabled: !!user?.id && role === 'employee',
  })

  const { data: requests = [] } = useQuery({
    queryKey: ['leaveRequests', tenant?.id, user?.id],
    queryFn: () => (tenant?.id && user?.id ? leaveService.getLeaveRequests(tenant.id, user.id) : []),
    enabled: !!tenant?.id && !!user?.id && role === 'employee',
  })

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => (user?.id ? notificationService.getNotifications(user.id) : []),
    enabled: !!user?.id,
    refetchInterval: 5000,
  })

  const unreadCount = notifications.filter(n => !n.isRead).length
  const isMainAIWorkspace =
    location.pathname === '/employee/dashboard' ||
    location.pathname === '/employee/assistant' ||
    location.pathname === '/manager/assistant' ||
    location.pathname === '/admin/assistant' ||
    location.pathname === '/'

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground font-sans transition-colors duration-200">
      {/* Kinetic Collapsible Sidebar */}
      <KineticSidebar
        isExpanded={isSidebarExpanded}
        onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
        {/* Subtle Kinetic Ambient Center Glow */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,rgba(35,172,227,0.04),rgba(0,0,0,0))] dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,rgba(35,172,227,0.08),rgba(0,0,0,0))]" />

        {/* Minimal Kinetic Top Right Controls Bar */}
        <header className="h-14 w-full flex items-center justify-end px-4 sm:px-6 gap-2 z-20 shrink-0">

          {/* Active Organization Pill Badge */}
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-card border border-border text-xs font-medium text-foreground shadow-xs">
            <Building2 className="h-3.5 w-3.5 text-[#23ace3]" />
            <span>{tenant?.name || 'Kinetic HR Cloud'}</span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#ef8d46]" />
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-popover p-2 shadow-2xl z-50 animate-in fade-in">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border text-xs font-semibold text-foreground">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[11px] text-[#ef8d46] font-medium">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-border no-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">No new notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          notificationService.markAsRead(n.id)
                          if (n.link) navigate(n.link)
                          setShowNotifMenu(false)
                        }}
                        className="p-3 text-left hover:bg-muted/50 cursor-pointer rounded-xl transition-colors"
                      >
                        <div className="text-xs font-medium text-foreground">{n.title}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-6 relative z-10">
          <div className={`mx-auto h-full ${isMainAIWorkspace ? 'max-w-4xl' : 'max-w-7xl'}`}>
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  )
}
