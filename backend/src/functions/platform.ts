import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { getTenantContainer, queryTenantItems } from '../config/cosmos'
import { authenticateRequest } from '../middleware/auth'

export const PLATFORM_PLANS = [
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

/**
 * GET /api/platform/organizations
 * Retrieves all registered client organizations
 */
export async function getOrganizations(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request, 'platform_admin')
  if (auth.errorResponse) return auth.errorResponse

  try {
    const orgContainer = getTenantContainer('organizations')
    const { resources: organizations } = await orgContainer.items.query('SELECT * FROM c').fetchAll()

    // Enrich with employee counts
    const usersContainer = getTenantContainer('users')
    const { resources: allUsers } = await usersContainer.items.query('SELECT c.tenantId FROM c').fetchAll()

    const enriched = (organizations || []).map((t: any) => {
      const userCount = allUsers.filter((u: any) => u.tenantId === t.id).length
      return {
        ...t,
        employeeCount: userCount || 1,
        status: t.status || 'Active',
        createdAt: t.createdAt || '2026-01-15',
        industry: t.industry || 'Technology & Services',
        country: t.country || 'United States',
      }
    })

    return { status: 200, jsonBody: enriched }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * POST /api/platform/organizations
 * Provisions a brand new tenant with isolated tenantId and primary admin
 */
export async function createOrganization(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request, 'platform_admin')
  if (auth.errorResponse) return auth.errorResponse

  try {
    const input = (await request.json()) as any
    if (!input.name || !input.adminEmail) {
      return { status: 400, jsonBody: { error: 'Organization name and admin email are required' } }
    }

    // Generate unique Tenant ID: e.g. "KIN-8F3A91"
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase()
    const tenantId = `KIN-${randomHex}`
    const tenantCode = input.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase()

    const newTenant = {
      id: tenantId,
      tenantId: tenantId,
      name: input.name.trim(),
      code: tenantCode,
      domain: (input.domain || '').trim().toLowerCase(),
      plan: input.plan || 'Business',
      industry: input.industry || 'Technology & Cloud',
      country: input.country || 'United States',
      status: 'Active',
      employeeCount: 1,
      adminEmail: input.adminEmail.trim(),
      createdAt: new Date().toISOString().split('T')[0],
      primaryColor: '#23ace3',
    }

    // Provision initial HR Administrator in users container
    const adminUser = {
      id: `user-admin-${Date.now()}`,
      tenantId: newTenant.id,
      name: (input.adminName || 'HR Administrator').trim(),
      email: input.adminEmail.trim().toLowerCase(),
      role: 'admin',
      department: 'Human Resources',
      jobTitle: 'VP of People & Operations',
      employeeNumber: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      hireDate: new Date().toISOString().split('T')[0],
      location: input.country || 'United States',
    }

    const orgContainer = getTenantContainer('organizations')
    await orgContainer.items.create(newTenant)

    const usersContainer = getTenantContainer('users')
    await usersContainer.items.create(adminUser)

    // Audit Event
    try {
      const auditContainer = getTenantContainer('audit_logs')
      await auditContainer.items.create({
        id: `aud-${Date.now()}`,
        tenantId: 'platform-kinetic',
        tenantName: 'Kinetic SaaS Platform',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userId: auth.user!.id,
        userName: auth.user!.name,
        userRole: 'platform_admin',
        action: 'ORGANIZATION_PROVISIONED',
        resource: `Tenant #${newTenant.id} (${newTenant.name})`,
        result: 'Success',
        riskLevel: 'Medium',
        details: `Registered organization ${newTenant.name} under ${newTenant.plan} tier. Initial HR Admin: ${adminUser.name} (${adminUser.email}).`,
      })
    } catch {
      // Non-blocking audit error
    }

    return { status: 201, jsonBody: { tenant: newTenant, adminUser } }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * GET /api/platform/metrics
 * System-wide telemetry and billing ARR metrics
 */
export async function getPlatformMetrics(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request, 'platform_admin')
  if (auth.errorResponse) return auth.errorResponse

  try {
    const orgContainer = getTenantContainer('organizations')
    const { resources: organizations } = await orgContainer.items.query('SELECT * FROM c').fetchAll()

    const usersContainer = getTenantContainer('users')
    const { resources: allUsers } = await usersContainer.items.query('SELECT c.id FROM c').fetchAll()

    const orgs = organizations || []
    const starterCount = orgs.filter((o: any) => o.plan === 'Starter').length
    const businessCount = orgs.filter((o: any) => o.plan === 'Business').length
    const enterpriseCount = orgs.filter((o: any) => o.plan === 'Enterprise').length

    const arr = (starterCount * 199 + businessCount * 499 + enterpriseCount * 1299) * 12

    return {
      status: 200,
      jsonBody: {
        totalOrganizations: orgs.length,
        activeTenants: orgs.filter((o: any) => o.status !== 'Suspended').length,
        totalUsers: (allUsers || []).length,
        arr,
        azureCloudHealth: '100% Operational',
        activeRegions: ['East US', 'West Europe', 'Southeast Asia'],
        monthlyAITokenConsumption: '4.8M Tokens',
      },
    }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * GET /api/platform/subscriptions
 */
export async function getSubscriptionPlans(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  return { status: 200, jsonBody: PLATFORM_PLANS }
}
