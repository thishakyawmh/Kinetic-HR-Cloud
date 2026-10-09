import { Tenant, User, SubscriptionPlan, SubscriptionTier, AuditEvent } from '@/types'
import { appDataStore } from './storage'
import { apiClient } from './apiClient'

const useMock = () => import.meta.env.VITE_USE_MOCK_SERVICES !== 'false'

export const PLATFORM_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-starter',
    name: 'Starter',
    description: 'Designed for small organizations and agile startups starting their HR transformation.',
    priceMonthly: 199,
    employeeLimit: 25,
    adminLimit: 1,
    aiMonthlyLimit: 500,
    storageGb: 5,
    features: [
      'Up to 25 employees',
      '1 HR Administrator account',
      '500 Kinetic AI requests / month',
      'Basic leave & attendance tracking',
      'Company policy library',
      'Standard email support',
    ],
    badgeVariant: 'outline',
  },
  {
    id: 'plan-business',
    name: 'Business',
    description: 'Ideal for scaling businesses requiring advanced AI orchestration and multi-department rules.',
    priceMonthly: 499,
    employeeLimit: 100,
    adminLimit: 3,
    aiMonthlyLimit: 2500,
    storageGb: 25,
    features: [
      'Up to 100 employees',
      '3 HR Administrator accounts',
      '2,500 Kinetic AI requests / month',
      'Advanced staffing threshold analytics',
      'RAG semantic vector search on company policies',
      'Payslip breakdown & delta comparison AI',
      'Manager decision support co-pilot',
      'Priority support SLA (4h response)',
    ],
    badgeVariant: 'info',
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise',
    description: 'Full-spectrum enterprise SaaS with unlimited scale, custom integrations, and dedicated SLAs.',
    priceMonthly: 1299,
    employeeLimit: 1000,
    adminLimit: 999,
    aiMonthlyLimit: 15000,
    storageGb: 200,
    features: [
      'Up to 1,000+ employees',
      'Unlimited HR Administrators & Managers',
      '15,000 Kinetic AI requests / month',
      'Dedicated Microsoft Foundry Agent fine-tuning',
      'Custom ADP, Workday, and Biometric connectors',
      'Action Gateway custom compliance rules',
      'Immutable SOC2 / HIPAA audit log archiving',
      'Dedicated Customer Success Manager & 24/7 SLA',
    ],
    badgeVariant: 'destructive',
  },
]

export interface OrganizationRegistrationInput {
  name: string
  domain: string
  industry: string
  country: string
  plan: SubscriptionTier
  adminName: string
  adminEmail: string
}

export const platformService = {
  getSubscriptionPlans(): SubscriptionPlan[] {
    return PLATFORM_PLANS
  },

  getPlanByTier(tier: SubscriptionTier): SubscriptionPlan {
    return PLATFORM_PLANS.find(p => p.name === tier) || PLATFORM_PLANS[1]
  },

  async getOrganizations(): Promise<Tenant[]> {
    if (!useMock()) {
      try {
        const orgs = await apiClient.get<Tenant[]>('/platform/organizations')
        if (orgs && Array.isArray(orgs) && orgs.length > 0) {
          return orgs
        }
      } catch (err) {
        console.warn('API /platform/organizations call failed, falling back to local store:', err)
      }
    }
    const tenants = appDataStore.getTenants()
    const allUsers = appDataStore.getUsers()

    return tenants.map(t => {
      const userCount = allUsers.filter(u => u.tenantId === t.id).length
      return {
        ...t,
        employeeCount: userCount || 1,
        status: t.status || 'Active',
        createdAt: t.createdAt || '2024-01-01',
        industry: t.industry || (t.id === 'tenant-sampath' ? 'Banking & Financial Services' : t.id === 'tenant-keells' ? 'Retail & FMCG' : t.id === 'tenant-singer' ? 'Consumer Electronics & Retail' : 'Technology & Services'),
        country: t.country || 'Sri Lanka',
      }
    })
  },

  async getOrganizationById(id: string): Promise<Tenant | undefined> {
    const orgs = await this.getOrganizations()
    return orgs.find(o => o.id === id)
  },

  async registerOrganization(input: OrganizationRegistrationInput): Promise<{ tenant: Tenant; adminUser: User }> {
    if (!useMock()) {
      return apiClient.post<{ tenant: Tenant; adminUser: User }>('/platform/organizations', input)
    }

    // Generate unique Tenant ID according to Section 5: e.g. "KIN-8F3A91"
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase()
    const tenantId = `KIN-${randomHex}`
    const tenantCode = input.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase()

    const newTenant: Tenant = {
      id: tenantId,
      name: input.name.trim(),
      code: tenantCode,
      domain: input.domain.trim().toLowerCase(),
      plan: input.plan,
      industry: input.industry,
      country: input.country,
      status: 'Active',
      employeeCount: 1,
      adminEmail: input.adminEmail.trim(),
      createdAt: new Date().toISOString().split('T')[0],
      primaryColor: '#23ace3',
    }

    // Auto-provision initial HR Administrator according to Section 7 & 52
    const adminUser: User = {
      id: `user-admin-${Date.now()}`,
      tenantId: newTenant.id,
      name: input.adminName.trim(),
      email: input.adminEmail.trim().toLowerCase(),
      role: 'admin',
      department: 'Human Resources',
      jobTitle: 'VP of People & Operations',
      employeeNumber: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      hireDate: new Date().toISOString().split('T')[0],
      location: input.country,
    }

    // Persist to store
    appDataStore.addTenant(newTenant)
    appDataStore.addUser(adminUser)

    // Audit log (Section 47)
    appDataStore.addAuditEvent({
      id: `aud-${Date.now()}`,
      tenantId: 'platform-kinetic',
      tenantName: 'Kinetic SaaS Platform',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: 'user-platform-admin',
      userName: 'Kinetic Platform Admin',
      userRole: 'platform_admin',
      action: 'ORGANIZATION_PROVISIONED',
      resource: `Tenant #${newTenant.id} (${newTenant.name})`,
      result: 'Success',
      riskLevel: 'Medium',
      details: `Registered organization ${newTenant.name} under ${newTenant.plan} tier. Initial HR Admin: ${adminUser.name} (${adminUser.email}).`,
    })

    return { tenant: newTenant, adminUser }
  },

  async getPlatformMetrics() {
    if (!useMock()) {
      return apiClient.get<any>('/platform/metrics')
    }

    const orgs = await this.getOrganizations()
    const allUsers = appDataStore.getUsers()

    const starterCount = orgs.filter(o => o.plan === 'Starter').length
    const businessCount = orgs.filter(o => o.plan === 'Business').length
    const enterpriseCount = orgs.filter(o => o.plan === 'Enterprise').length

    // Simulated ARR calculation
    const arr = (starterCount * 199 + businessCount * 499 + enterpriseCount * 1299) * 12

    return {
      totalOrganizations: orgs.length,
      activeTenants: orgs.filter(o => o.status !== 'Suspended').length,
      totalUsers: allUsers.length,
      arr,
      azureCloudHealth: '100% Operational',
      activeRegions: ['East US', 'West Europe', 'Southeast Asia'],
      monthlyAITokenConsumption: '4.8M Tokens',
    }
  },
}
