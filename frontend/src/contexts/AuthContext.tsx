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
  loginWithCredentials: (tenantId: string, employeeId: string, password?: string) => Promise<AuthSession>
  loginWithEntraId: (tenantId?: string) => Promise<AuthSession>
  loginPlatformAdmin: (adminId: string, password?: string) => Promise<AuthSession>
  validateOrganization: (organizationId: string) => Promise<Tenant>
  logout: () => void
  refreshUser: () => void
  updateCurrentUser: (updates: Partial<User>) => void
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

  const updateCurrentUser = (updates: Partial<User>) => {
    if (!session?.user) return
    const updatedUser = { ...session.user, ...updates }
    const updatedSession = { ...session, user: updatedUser }
    authService.setSession(updatedSession)
    setSession(updatedSession)
    appDataStore.updateUser(session.user.id, updates)
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

  const handleLoginWithCredentials = async (tenantId: string, employeeId: string, password?: string) => {
    const newSession = await authService.login(tenantId, employeeId, password)
    setSession(newSession)
    return newSession
  }

  const handleLoginWithEntraId = async (tenantId?: string) => {
    const newSession = await authService.loginWithEntraId(tenantId)
    setSession(newSession)
    return newSession
  }

  const handleLoginPlatformAdmin = async (adminId: string, password?: string) => {
    const newSession = await authService.loginPlatformAdmin(adminId, password)
    setSession(newSession)
    return newSession
  }

  const handleValidateOrganization = async (organizationId: string) => {
    return authService.validateOrganization(organizationId)
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

  // Resolve genuine active tenant for the logged-in user
  const activeTenant = React.useMemo<Tenant | null>(() => {
    if (!session?.user) return null
    if (session.user.role === 'platform_admin') {
      return {
        id: 'tenant-platform',
        name: 'Global Cloud Fleet Infrastructure',
        code: 'PLATFORM',
        domain: 'azure.kineticcloud.io',
        plan: 'Enterprise',
      }
    }

    // Always prefer user's direct assigned tenantId if valid
    const userTenantId = session.user.tenantId
    if (userTenantId && userTenantId !== 'tenant-kinetic') {
      const match = allTenants.find(t => t.id === userTenantId || t.code?.toLowerCase() === userTenantId.toLowerCase())
      if (match && match.name && match.name !== 'Kinetic Technologies') return match
      const fromStore = appDataStore.getTenant(userTenantId)
      if (fromStore && fromStore.name && fromStore.name !== 'Kinetic Technologies') return fromStore
    }

    // If session.tenant exists and is valid
    if (session.tenant && session.tenant.name && session.tenant.name !== 'Kinetic Technologies' && session.tenant.id !== 'tenant-kinetic') {
      return session.tenant
    }

    // Deduce from user email / employee number
    const email = (session.user.email || '').toLowerCase()
    const emp = (session.user.employeeNumber || '').toUpperCase()
    if (email.includes('keells') || emp.startsWith('KS-') || emp.startsWith('A-20') || emp.startsWith('M-20')) {
      return appDataStore.getTenant('tenant-keells') || allTenants[1] || null
    }
    if (email.includes('singer') || emp.startsWith('SNG-') || emp.startsWith('A-30') || emp.startsWith('M-30')) {
      return appDataStore.getTenant('tenant-singer') || allTenants[2] || null
    }
    return appDataStore.getTenant('tenant-sampath') || allTenants[0] || null
  }, [session, allTenants])

  React.useEffect(() => {
    if (session && activeTenant && (session.tenant?.id !== activeTenant.id || session.tenant?.name !== activeTenant.name)) {
      const updated = { ...session, tenant: activeTenant, user: { ...session.user, tenantId: activeTenant.id } }
      authService.setSession(updated)
      setSession(updated)
    }
  }, [activeTenant])

  const role: UserRole = session?.user.role || 'employee'

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        tenant: activeTenant,
        role,
        isAuthenticated: !!session,
        allTenants,
        allUsers,
        switchUser: handleSwitchUser,
        switchRole: handleSwitchRole,
        switchTenant: handleSwitchTenant,
        loginWithCredentials: handleLoginWithCredentials,
        loginWithEntraId: handleLoginWithEntraId,
        loginPlatformAdmin: handleLoginPlatformAdmin,
        validateOrganization: handleValidateOrganization,
        logout: handleLogout,
        refreshUser,
        updateCurrentUser,
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
