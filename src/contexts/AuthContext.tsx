import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, Tenant, UserRole } from '@/types'
import { authService, AuthSession } from '@/services/authService'
import { appDataStore } from '@/services/storage'

interface AuthContextType {
  session: AuthSession | null
  user: User | null
  tenant: Tenant | null
  role: UserRole
  isAuthenticated: boolean
  allTenants: Tenant[]
  allUsers: User[]
  switchUser: (userId: string) => void
  switchRole: (role: UserRole) => void
  switchTenant: (tenantId: string) => void
  logout: () => void
  refreshUser: () => void
  addAccount: (data: {
    name: string
    email: string
    role: UserRole
    department: string
    jobTitle?: string
  }) => User
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(() => authService.getCurrentSession())
  const [allTenants, setAllTenants] = useState<Tenant[]>(() => appDataStore.getTenants())
  const [allUsers, setAllUsers] = useState<User[]>(() => appDataStore.getUsers())

  const refreshUser = () => {
    if (session?.user.id) {
      const freshUser = appDataStore.getUser(session.user.id)
      const freshTenant = appDataStore.getTenant(session.tenant.id)
      if (freshUser && freshTenant) {
        setSession({
          ...session,
          user: freshUser,
          tenant: freshTenant,
        })
      }
    }
    setAllUsers(appDataStore.getUsers())
  }

  const handleSwitchUser = (userId: string) => {
    const newSession = authService.switchUser(userId)
    setSession(newSession)
  }

  const handleSwitchRole = (role: UserRole) => {
    const newSession = authService.switchRole(role)
    setSession(newSession)
  }

  const handleSwitchTenant = (tenantId: string) => {
    const newSession = authService.switchTenant(tenantId)
    setSession(newSession)
  }

  const handleLogout = () => {
    authService.logout()
    setSession(null)
  }

  const handleAddAccount = (data: {
    name: string
    email: string
    role: UserRole
    department: string
    jobTitle?: string
  }): User => {
    const newId = `user-${Date.now()}`
    const empNum = `EMP-${Math.floor(1000 + Math.random() * 9000)}`
    const defaultJob =
      data.role === 'admin'
        ? 'HR Administrator'
        : data.role === 'manager'
        ? 'Engineering Manager'
        : 'Software Engineer'

    const newUser: User = {
      id: newId,
      tenantId: session?.tenant.id || 'tenant-kinetic',
      name: data.name.trim(),
      email: data.email.trim(),
      role: data.role,
      department: data.department || 'Engineering',
      jobTitle: data.jobTitle?.trim() || defaultJob,
      employeeNumber: empNum,
      hireDate: new Date().toISOString().split('T')[0],
      location: 'Colombo / Remote',
      managerId: data.role === 'employee' ? 'user-Bob' : undefined,
      managerName: data.role === 'employee' ? 'Bob Smith' : undefined,
    }

    appDataStore.addUser(newUser)
    setAllUsers(appDataStore.getUsers())
    handleSwitchUser(newUser.id)
    return newUser
  }

  const role: UserRole = session?.user.role || 'employee'

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        tenant: session?.tenant || null,
        role,
        isAuthenticated: !!session,
        allTenants,
        allUsers,
        switchUser: handleSwitchUser,
        switchRole: handleSwitchRole,
        switchTenant: handleSwitchTenant,
        logout: handleLogout,
        refreshUser,
        addAccount: handleAddAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
