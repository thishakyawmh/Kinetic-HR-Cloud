import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import {
  Bell,
  Menu,
  Sun,
  Moon,
  LogOut,
  Check,
  UserPlus,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { notificationService } from '@/services/notificationService'
import { useQuery } from '@tanstack/react-query'
import { AddAccountModal } from '@/components/account/AddAccountModal'

interface HeaderProps {
  onToggleMenu: () => void
  onOpenLeaves?: () => void
}

export const Header: React.FC<HeaderProps> = ({ onToggleMenu }) => {
  const { user, tenant, role, allUsers, switchUser, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [showNotifMenu, setShowNotifMenu] = useState(false)
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => (user?.id ? notificationService.getNotifications(user.id) : []),
    enabled: !!user?.id,
    refetchInterval: 5000,
  })

  const unreadCount = notifications.filter(n => !n.isRead).length
  const currentTenantUsers = allUsers.filter(u => u.tenantId === tenant?.id)

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border/80 bg-background/95 px-4 md:px-6 backdrop-blur-sm">
      {/* Left: Hamburger & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMenu}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title="Main menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div
          onClick={() => {
            if (role === 'employee') navigate('/employee/dashboard')
            else if (role === 'manager') navigate('/manager/dashboard')
            else navigate('/admin/dashboard')
          }}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <img
            src="/kenetic_logo.webp"
            alt="Kinetic"
            className="h-7 w-auto object-contain"
            onError={e => {
              const target = e.currentTarget
              if (!target.src.endsWith('kenetic_logo.wbp')) {
                target.src = '/kenetic_logo.wbp'
              }
            }}
          />
          <span className="font-semibold text-sm tracking-tight text-foreground flex items-center">
            Kinetic
            <span className="font-bold ml-1 flex items-center">
              <span className="text-[#23ace3]">H</span>
              <span className="text-[#ef8d46]">R</span>
            </span>
          </span>
        </div>
      </div>

      {/* Right: Google-style Clean Controls */}
      <div className="flex items-center gap-1.5">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu)
              setShowRoleMenu(false)
            }}
            className="relative p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#ef8d46]" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-popover p-2 shadow-xl z-50 animate-in fade-in">
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
                      className={`p-3 text-left hover:bg-muted/50 cursor-pointer rounded-xl transition-colors ${
                        !n.isRead ? 'bg-muted/30' : ''
                      }`}
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

        {/* Google-style Profile Avatar */}
        <div className="relative ml-1">
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu)
              setShowNotifMenu(false)
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#23ace3] text-white text-xs font-medium cursor-pointer shadow-xs hover:opacity-90 transition-opacity"
            title="Account & persona"
          >
            {user?.name.charAt(0)}
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-border bg-popover p-3 shadow-xl z-50 animate-in fade-in">
              {/* Profile Card */}
              <div className="px-2 py-2 border-b border-border mb-2 text-left">
                <div className="font-semibold text-xs text-foreground">{user?.name}</div>
                <div className="text-[11px] text-muted-foreground">{user?.email}</div>
                <div className="text-[10px] text-muted-foreground mt-1 capitalize font-medium">
                  {role} • {user?.department}
                </div>
              </div>

              {/* Persona Switcher for Testing */}
              <div className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1">
                Switch user
              </div>
              <div className="space-y-0.5">
                {currentTenantUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id)
                      setShowRoleMenu(false)
                      if (u.role === 'employee') navigate('/employee/dashboard')
                      else if (u.role === 'manager') navigate('/manager/dashboard')
                      else if (u.role === 'admin') navigate('/admin/dashboard')
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-xl transition-colors ${
                      u.id === user?.id ? 'bg-muted text-foreground font-semibold' : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <span>{u.name} ({u.role})</span>
                    {u.id === user?.id && <Check className="h-3.5 w-3.5 text-[#23ace3]" />}
                  </button>
                ))}
              </div>

              {/* Add More Account Button */}
              <div className="border-t border-border mt-2 pt-2">
                <button
                  onClick={() => {
                    setShowRoleMenu(false)
                    setIsAddAccountOpen(true)
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="h-6 w-6 rounded-full border border-dashed border-border group-hover:border-[#23ace3] flex items-center justify-center text-muted-foreground group-hover:text-[#23ace3] transition-colors">
                    <UserPlus className="h-3.5 w-3.5" />
                  </div>
                  <span>Add more account</span>
                </button>
              </div>

              {/* Sign Out */}
              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-500 hover:bg-muted rounded-xl transition-colors text-left"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
      />
    </header>
  )
}
