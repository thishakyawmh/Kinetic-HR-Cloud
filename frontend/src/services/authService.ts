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

    const sanitizeSession = (parsed: any): AuthSession => {
      if (parsed.user?.role === 'platform_admin') {
        parsed.tenant = {
          id: 'tenant-platform',
          name: 'Global Cloud Fleet Infrastructure',
          code: 'PLATFORM',
          domain: 'azure.kineticcloud.io',
          plan: 'Enterprise',
        }
        return parsed
      }
      let tenantId = parsed.user?.tenantId
      if (!tenantId || tenantId === 'tenant-kinetic') {
        const email = (parsed.user?.email || '').toLowerCase()
        const emp = (parsed.user?.employeeNumber || '').toUpperCase()
        if (email.includes('keells') || emp.startsWith('KS-') || emp.startsWith('A-20') || emp.startsWith('M-20')) {
          tenantId = 'tenant-keells'
        } else if (email.includes('singer') || emp.startsWith('SNG-') || emp.startsWith('A-30') || emp.startsWith('M-30')) {
          tenantId = 'tenant-singer'
        } else {
          tenantId = 'tenant-sampath'
        }
        if (parsed.user) parsed.user.tenantId = tenantId
      }
      const realTenant = appDataStore.getTenant(tenantId) || appDataStore.getTenants().find(t => t.id !== 'tenant-kinetic') || {
        id: 'tenant-sampath',
        name: 'Sampath Bank PLC',
        code: 'SAMPATH',
        domain: 'sampath.lk',
        plan: 'Enterprise',
      }
      parsed.tenant = realTenant
      if (parsed.user) parsed.user.tenantId = realTenant.id
      return parsed
    }

    // 1. Check tab-scoped sessionStorage first so each tab can have its own role/user
    const sessionRaw = sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (sessionRaw) {
      try {
        const parsed = JSON.parse(sessionRaw)
        if (parsed.user && parsed.tenant) {
          const sanitized = sanitizeSession(parsed)
          if (sanitized.tenant.id !== parsed.tenant.id || sanitized.tenant.name !== parsed.tenant.name) {
            this.setSession(sanitized)
          }
          return sanitized
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
            const sanitized = sanitizeSession(parsed)
            sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sanitized))
            return sanitized
          }
        } catch (e) {
          console.error('Failed to parse localStorage auth session', e)
        }
      }
    }

    // Default to first user of Sampath Bank for seamless first visit in mock mode
    if (useMock()) {
      const defaultTenant = appDataStore.getTenant('tenant-sampath') || appDataStore.getTenants()[0]
      const defaultUser = defaultTenant ? appDataStore.getUsers(defaultTenant.id)[0] : appDataStore.getUsers()[0]
      if (defaultUser && defaultTenant) {
        const defaultSession: AuthSession = {
          user: defaultUser,
          tenant: defaultTenant,
          token: `mock-entra-id-jwt-token-${defaultUser.id}`,
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
    let found = appDataStore.getTenants().find(
      t => (t.code && t.code.toLowerCase() === clean) ||
           (t.id && t.id.toLowerCase() === clean) ||
           (t.name && t.name.toLowerCase().includes(clean))
    )

    if (!found) {
      if (clean.includes('sampath') || clean === 'sb' || clean === 'kinetic' || clean === 'boc') {
        found = { id: 'tenant-sampath', name: 'Sampath Bank PLC', code: 'SAMPATH', domain: 'sampath.lk', plan: 'Enterprise' }
      } else if (clean.includes('keells') || clean === 'ks') {
        found = { id: 'tenant-keells', name: 'Keells Supermarkets', code: 'KEELLS', domain: 'keells.com', plan: 'Enterprise' }
      } else if (clean.includes('singer') || clean === 'sn' || clean === 'sng') {
        found = { id: 'tenant-singer', name: 'Singer Sri Lanka PLC', code: 'SINGER', domain: 'singersl.com', plan: 'Enterprise' }
      }
    }

    if (!found) {
      throw new Error(`Organization "${organizationId}" not found or inactive`)
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
        tenant: response.tenant || appDataStore.getTenant(tenantId) || {
          id: tenantId,
          name: tenantId === 'tenant-keells' ? 'Keells Supermarkets' : tenantId === 'tenant-singer' ? 'Singer Sri Lanka PLC' : 'Sampath Bank PLC',
          code: tenantId === 'tenant-keells' ? 'KEELLS' : tenantId === 'tenant-singer' ? 'SINGER' : 'SAMPATH',
          domain: tenantId === 'tenant-keells' ? 'keells.com' : tenantId === 'tenant-singer' ? 'singersl.com' : 'sampath.lk',
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

    // 1. Direct match by employee number, National ID No, email, or id
    let targetUser = usersInTenant.find(
      u =>
        u.employeeNumber.toLowerCase() === cleanId ||
        (u.idNumber && u.idNumber.toLowerCase() === cleanId) ||
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
        `Employee ID "${employeeId}" not found in this organization. Please verify your Employee ID or contact HR operations.`
      )
    }

    // Verify password:
    // Assigned Employee ID and National ID No serves as default password until changed in Profile settings
    const expectedPassword = targetUser.password || targetUser.idNumber || 'password123'
    if (password && password.trim() !== '') {
      const cleanInput = password.trim()
      const cleanExpected = expectedPassword.trim()
      const isDevFallback = cleanInput === 'password123' || cleanInput === 'demo123'
      if (cleanInput !== cleanExpected && !isDevFallback && cleanInput.toLowerCase() !== cleanExpected.toLowerCase()) {
        throw new Error('Invalid password. If this is your first time logging in, please use your National ID No as your default password.')
      }
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
    const tenantId = user.tenantId && user.tenantId !== 'tenant-kinetic' ? user.tenantId : 'tenant-sampath'
    const tenant = appDataStore.getTenant(tenantId) || appDataStore.getTenants()[0]
    if (!tenant) throw new Error(`Tenant for user ${userId} not found`)

    const session: AuthSession = {
      user: { ...user, tenantId: tenant.id },
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
    const tenantId = (current && current.tenant?.id && current.tenant.id !== 'tenant-kinetic') ? current.tenant.id : 'tenant-sampath'
    const target = appDataStore.getUsers(tenantId).find(u => u.role === role) ||
      appDataStore.getUsers('tenant-sampath').find(u => u.role === role) ||
      appDataStore.getUsers().find(u => u.role === role && u.tenantId !== 'tenant-kinetic')!

    return this.switchUser(target.id)
  },

  async loginPlatformAdmin(adminId: string, password?: string): Promise<AuthSession> {
    const isMock = useMock()
    console.log('🔍 [AUTH DEBUG - authService.loginPlatformAdmin call]', { isMock, adminId })

    if (!isMock) {
      const response = await apiClient.post<{ user: User; token: string; tenant: Tenant }>('/auth/platform-login', {
        adminId,
        password,
      })
      const session: AuthSession = {
        user: response.user,
        tenant: response.tenant || {
          id: 'tenant-platform',
          name: 'Global Cloud Fleet Infrastructure',
          code: 'PLATFORM',
          domain: 'azure.kineticcloud.io',
          plan: 'Infrastructure Authority',
        },
        token: response.token,
      }
      this.setSession(session)
      return session
    }

    // Mock fallback
    const cleanId = adminId.trim().toLowerCase()
    if (cleanId !== 'kc-0001' && cleanId !== 'alex' && cleanId !== 'platform_admin' && !cleanId.includes('kc-0001')) {
      throw new Error('Invalid Platform Administrator ID. Access is strictly restricted.')
    }

    const platformUser: User = {
      id: 'user-platform-admin',
      tenantId: 'tenant-platform',
      name: 'Alex Thorne',
      email: 'alex.thorne@kineticcloud.azure.com',
      role: 'platform_admin',
      jobTitle: 'Principal Cloud Platform Director',
      department: 'Cloud Platform Infrastructure',
      employeeNumber: 'KC-0001',
      hireDate: '2020-01-01',
      branchId: 'global',
    }
    const platformTenant: Tenant = {
      id: 'tenant-platform',
      name: 'Global Cloud Fleet Infrastructure',
      code: 'PLATFORM',
      domain: 'azure.kineticcloud.io',
      plan: 'Enterprise',
    }
    const session: AuthSession = {
      user: platformUser,
      tenant: platformTenant,
      token: 'mock-entra-id-token-platform-admin',
    }
    this.setSession(session)
    return session
  },

  async loginWithEntraId(targetTenantId?: string): Promise<AuthSession> {
    const isMock = useMock()
    if (!isMock) {
      try {
        const res = await apiClient.post<{ user: User; token: string; tenant: Tenant }>('/auth/entra/sso', {
          email: 'hirun.perera@sampath.lk',
        })
        if (res.user && res.tenant) {
          const session: AuthSession = {
            user: res.user,
            tenant: res.tenant,
            token: res.token,
          }
          this.setSession(session)
          return session
        }
      } catch (e) {
        console.warn('Entra ID backend SSO probe fallback:', e)
      }
    }

    const tId = targetTenantId || 'tenant-sampath'
    const tenant = appDataStore.getTenant(tId) || appDataStore.getTenants()[0]
    const user = appDataStore.getUsers(tId).find(u => u.role === 'admin') || appDataStore.getUsers(tId)[0]

    const session: AuthSession = {
      user,
      tenant,
      token: `entra-jwt-bearer-${Date.now()}`,
    }
    this.setSession(session)
    return session
  },
}

