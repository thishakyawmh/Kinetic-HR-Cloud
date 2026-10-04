import { appDataStore } from './storage'
import { User, Tenant, UserRole } from '@/types'

export interface AuthSession {
  user: User
  tenant: Tenant
  token: string
}

const AUTH_STORAGE_KEY = 'kinetic_auth_session'
const LOGGED_OUT_KEY = 'kinetic_logged_out'

export const authService = {
  getCurrentSession(): AuthSession | null {
    if (localStorage.getItem(LOGGED_OUT_KEY) === 'true') {
      return null
    }

    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        // Verify user still exists in store
        const liveUser = appDataStore.getUser(parsed.user.id)
        const liveTenant = appDataStore.getTenant(parsed.tenant.id)
        if (liveUser && liveTenant) {
          return {
            user: liveUser,
            tenant: liveTenant,
            token: parsed.token || 'mock-bearer-jwt-token',
          }
        }
      } catch (e) {
        console.error('Failed to parse auth session', e)
      }
    }
    // Default to Alice Johnson (Employee) of Kinetic Technologies for seamless first visit
    const defaultUser = appDataStore.getUser('user-Alice')!
    const defaultTenant = appDataStore.getTenant('tenant-kinetic')!
    const defaultSession: AuthSession = {
      user: defaultUser,
      tenant: defaultTenant,
      token: 'mock-entra-id-jwt-token-Alice',
    }
    this.setSession(defaultSession)
    return defaultSession
  },

  setSession(session: AuthSession): void {
    localStorage.removeItem(LOGGED_OUT_KEY)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  },

  logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.setItem(LOGGED_OUT_KEY, 'true')
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
    // Find first user in that tenant
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
