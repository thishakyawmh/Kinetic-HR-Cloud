import { appDataStore } from './storage'
import { apiClient } from './apiClient'
import { User, Tenant, UserRole } from '@/types'

export interface AuthSession {
  user: User
  tenant: Tenant
  token: string
}

const AUTH_STORAGE_KEY = 'kinetic_auth_session'
const LOGGED_OUT_KEY = 'kinetic_logged_out'
const useMock = () => import.meta.env.VITE_USE_MOCK_SERVICES !== 'false'

export const authService = {
  getCurrentSession(): AuthSession | null {
    if (sessionStorage.getItem(LOGGED_OUT_KEY) === 'true') {
      return null
    }

    // 1. Check tab-scoped sessionStorage first so each tab can have its own role/user
    const sessionRaw = sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (sessionRaw) {
      try {
        const parsed = JSON.parse(sessionRaw)
        if (parsed.user && parsed.tenant) {
          return parsed as AuthSession
        }
      } catch (e) {
        console.error('Failed to parse tab auth session', e)
      }
    }

    // 2. If this is a newly opened tab, check localStorage fallback
    if (localStorage.getItem(LOGGED_OUT_KEY) !== 'true') {
      const localRaw = localStorage.getItem(AUTH_STORAGE_KEY)
      if (localRaw) {
        try {
          const parsed = JSON.parse(localRaw)
          if (parsed.user && parsed.tenant) {
            // Adopt into this tab's sessionStorage so future tab switches remain isolated
            sessionStorage.setItem(AUTH_STORAGE_KEY, localRaw)
            return parsed as AuthSession
          }
        } catch (e) {
          console.error('Failed to parse localStorage auth session', e)
        }
      }
    }

    // Default to Alice Johnson (Employee) of Kinetic Technologies for seamless first visit in mock mode
    if (useMock()) {
      const defaultUser = appDataStore.getUser('user-Alice')
      const defaultTenant = appDataStore.getTenant('tenant-kinetic')
      if (defaultUser && defaultTenant) {
        const defaultSession: AuthSession = {
          user: defaultUser,
          tenant: defaultTenant,
          token: 'mock-entra-id-jwt-token-Alice',
        }
        this.setSession(defaultSession)
        return defaultSession
      }
    }

    return null
  },

  setSession(session: AuthSession): void {
    const raw = JSON.stringify(session)
    // Save to tab-isolated sessionStorage so each tab can independently hold a role
    sessionStorage.removeItem(LOGGED_OUT_KEY)
    sessionStorage.setItem(AUTH_STORAGE_KEY, raw)
    // Also save to localStorage as a convenient default for new browser windows
    localStorage.removeItem(LOGGED_OUT_KEY)
    localStorage.setItem(AUTH_STORAGE_KEY, raw)
  },

  logout(): void {
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
    sessionStorage.setItem(LOGGED_OUT_KEY, 'true')
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.setItem(LOGGED_OUT_KEY, 'true')
  },

  async validateOrganization(organizationId: string): Promise<Tenant> {
    if (!useMock()) {
      return apiClient.post<Tenant>('/auth/organization', { organizationId })
    }
    const clean = organizationId.trim().toLowerCase()
    const found = appDataStore.getTenants().find(
      t => t.code.toLowerCase() === clean || t.id.toLowerCase() === clean
    )
    if (!found) {
      throw new Error(`Organization "${organizationId}" not found`)
    }
    return found
  },

  async login(tenantId: string, employeeId: string, password?: string): Promise<AuthSession> {
    const isMock = useMock()
    console.log('🔍 [AUTH DEBUG - authService.login call]', {
      isMockMode: isMock,
      tenantId,
      employeeId,
      hasPassword: !!password
    })

    if (!isMock) {
      console.log('🔍 [AUTH DEBUG - Sending POST /auth/login to backend...]')
      const response = await apiClient.post<{ user: User; token: string; tenant: Tenant }>('/auth/login', {
        tenantId,
        employeeId,
        password,
      })
      console.log('🔍 [AUTH DEBUG - Backend returned user]', response.user)
      const session: AuthSession = {
        user: response.user,
        tenant: response.tenant || {
          id: tenantId,
          name: tenantId === 'tenant-nova' ? 'Nova Systems' : 'Kinetic Technologies',
          code: tenantId === 'tenant-nova' ? 'NOVA' : 'KINETIC',
          domain: 'kinetictech.io',
          plan: 'Enterprise',
        },
        token: response.token,
      }
      this.setSession(session)
      return session
    }

    // Mock mode resolution
    const cleanId = employeeId.trim().toLowerCase()
    const usersInTenant = appDataStore.getUsers(tenantId)
    console.log('🔍 [AUTH DEBUG - Mock mode searching in users list]', {
      tenantId,
      usersFoundInStore: usersInTenant.length,
      sampleIds: usersInTenant.map(u => `${u.name} (${u.employeeNumber}: ${u.role})`)
    })

    // 1. Direct match by employee number, email, or id
    let targetUser = usersInTenant.find(
      u =>
        u.employeeNumber.toLowerCase() === cleanId ||
        u.email.toLowerCase() === cleanId ||
        u.id.toLowerCase() === cleanId
    )

    // 2. Convenience aliases for testing & demos
    if (!targetUser) {
      if (cleanId === 'manager' || cleanId === 'david' || cleanId.includes('manager')) {
        targetUser = usersInTenant.find(u => u.role === 'manager')
      } else if (cleanId === 'admin' || cleanId === 'hr' || cleanId === 'sarah' || cleanId.includes('admin')) {
        targetUser = usersInTenant.find(u => u.role === 'admin')
      } else if (cleanId === 'platform' || cleanId === 'platform_admin' || cleanId === 'alex') {
        targetUser = usersInTenant.find(u => u.role === 'platform_admin')
      } else if (cleanId === 'employee' || cleanId === 'alice') {
        targetUser = usersInTenant.find(u => u.role === 'employee' && u.employeeNumber === 'KT-8842')
      } else {
        // Match by partial name or email prefix
        targetUser = usersInTenant.find(u =>
          u.name.toLowerCase().includes(cleanId) ||
          u.email.toLowerCase().startsWith(cleanId)
        )
      }
    }

    if (!targetUser) {
      throw new Error(
        `Employee ID "${employeeId}" not found. Try KT-8842 (Employee), KT-1044 (Manager), KT-0012 (HR Admin), or KC-0001 (Platform Admin).`
      )
    }

    const tenant = appDataStore.getTenant(targetUser.tenantId) || appDataStore.getTenants()[0]

    const session: AuthSession = {
      user: targetUser,
      tenant,
      token: `mock-token-${targetUser.id}`,
    }
    this.setSession(session)
    return session
  },

  switchUser(userId: string): AuthSession {
    const user = appDataStore.getUser(userId)
    if (!user) throw new Error(`User ${userId} not found`)
    const tenant = appDataStore.getTenant(user.tenantId)
    if (!tenant) throw new Error(`Tenant for user ${userId} not found`)

    const session: AuthSession = {
      user,
      tenant,
      token: `mock-entra-id-token-${user.id}`,
    }
    this.setSession(session)
    return session
  },

  switchTenant(tenantId: string): AuthSession {
    const tenant = appDataStore.getTenant(tenantId)
    if (!tenant) throw new Error(`Tenant ${tenantId} not found`)
    const usersInTenant = appDataStore.getUsers(tenantId)
    const user = usersInTenant[0] || appDataStore.getUsers()[0]

    const session: AuthSession = {
      user,
      tenant,
      token: `mock-entra-id-token-${user.id}`,
    }
    this.setSession(session)
    return session
  },

  switchRole(role: UserRole): AuthSession {
    const current = this.getCurrentSession()
    const tenantId = current ? current.tenant.id : 'tenant-kinetic'
    const target = appDataStore.getUsers(tenantId).find(u => u.role === role) ||
      appDataStore.getUsers().find(u => u.role === role)!

    return this.switchUser(target.id)
  },
}
