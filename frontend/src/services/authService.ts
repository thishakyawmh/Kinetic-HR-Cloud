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
const useMock = () => import.meta.env.VITE_USE_MOCK_SERVICES === 'true'

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
    if (!useMock()) {
      const response = await apiClient.post<{ user: User; token: string; tenant: Tenant }>('/auth/login', {
        tenantId,
        employeeId,
        password,
      })
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

    // Mock mode fallback
    const targetUser = appDataStore.getUsers(tenantId).find(
      u =>
        u.employeeNumber.toLowerCase() === employeeId.toLowerCase() ||
        u.email.toLowerCase() === employeeId.toLowerCase() ||
        u.id.toLowerCase() === employeeId.toLowerCase()
    ) || appDataStore.getUsers(tenantId)[0]

    if (!targetUser) throw new Error(`Employee ID "${employeeId}" not found`)
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
