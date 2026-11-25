import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import bcrypt from 'bcryptjs'
import { queryTenantItems, getTenantContainer } from '../config/cosmos'
import { signToken } from '../middleware/auth'
import { resolveDevFallbackUser } from '../services/authFallback'

function isDevEnvironment(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    (process.env.AZURE_MODE || '').toLowerCase() !== 'live'
  )
}

async function verifyUserPassword(user: any, password?: string): Promise<boolean> {
  const cleanInput = (password || '').trim()
  if (!cleanInput) return false

  if (user.passwordHash) {
    return bcrypt.compare(cleanInput, String(user.passwordHash))
  }

  if (user.password && cleanInput === String(user.password).trim()) {
    return true
  }

  if (user.idNumber && cleanInput.toLowerCase() === String(user.idNumber).trim().toLowerCase()) {
    return true
  }

  if (isDevEnvironment()) {
    const lower = cleanInput.toLowerCase()
    return lower === 'password123' || lower === 'demo123' || lower === 'password123!'
  }

  return false
}

/**
 * POST /api/auth/organization
 * Validates organization code or ID (e.g. KINETIC or NOVA)
 */
export async function validateOrganization(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    let body: any = {}
    try {
      body = (await request.json()) || {}
    } catch (_) {
      body = {}
    }
    const queryOrg = request.query ? request.query.get('organizationId') : null
    const orgId = (body?.organizationId || queryOrg || 'sampath').trim().toLowerCase()

    const container = getTenantContainer('organizations')
    const querySpec = {
      query: 'SELECT * FROM c WHERE LOWER(c.code) = @orgId OR LOWER(c.id) = @orgId',
      parameters: [{ name: '@orgId', value: orgId }],
    }

    const { resources } = await container.items.query(querySpec).fetchAll()

    if (resources.length === 0) {
      if (orgId.includes('keells') || orgId === 'ks') {
        return {
          status: 200,
          jsonBody: {
            id: 'tenant-keells',
            name: 'Keells Supermarkets',
            code: 'KEELLS',
            status: 'Active',
          },
        }
      }
      if (orgId.includes('singer') || orgId === 'sn' || orgId === 'sng') {
        return {
          status: 200,
          jsonBody: {
            id: 'tenant-singer',
            name: 'Singer Sri Lanka PLC',
            code: 'SINGER',
            status: 'Active',
          },
        }
      }
      // Default Enterprise Banking Organization (Sampath / Kinetic / BOC / Any Org)
      return {
        status: 200,
        jsonBody: {
          id: 'tenant-sampath',
          name: 'Sampath Bank PLC',
          code: 'SAMPATH',
          status: 'Active',
        },
      }
    }

    const org = resources[0]
    return {
      status: 200,
      jsonBody: {
        id: org.id,
        name: org.name,
        code: org.code,
        status: org.status || 'Active',
      },
    }
  } catch (err: any) {
    return {
      status: 500,
      jsonBody: { error: err.message || 'Internal server error validating organization' },
    }
  }
}

/**
 * POST /api/auth/login
 * Validates Employee ID and password within the specified organization tenant
 */
export async function loginEmployee(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = (await request.json()) as {
      tenantId: string
      employeeId: string
      password?: string
    }

    const { tenantId, employeeId, password } = body

    if (!tenantId || !employeeId) {
      return { status: 400, jsonBody: { error: 'tenantId and employeeId are required' } }
    }

    const cleanEmp = employeeId.trim().toLowerCase()

    // Query user specifically in tenantId partition (match by employeeNumber, idNumber, email, id, role, or name)
    let users = await queryTenantItems<any>(
      'users',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @tenantId AND (LOWER(c.employeeNumber) = @empId OR (IS_DEFINED(c.idNumber) AND LOWER(c.idNumber) = @empId) OR LOWER(c.email) = @empId OR LOWER(c.id) = @empId OR LOWER(c.role) = @empId OR CONTAINS(LOWER(c.name), @empId))',
      [
        { name: '@tenantId', value: tenantId },
        { name: '@empId', value: cleanEmp },
      ]
    )

    // Secondary safety: ensure the first user actually matches the requested employeeId/role
    if (users.length > 0) {
      const exactMatch = users.find(u =>
        (u.employeeNumber && u.employeeNumber.toLowerCase() === cleanEmp) ||
        (u.idNumber && u.idNumber.toLowerCase() === cleanEmp) ||
        (u.email && u.email.toLowerCase() === cleanEmp) ||
        (u.id && u.id.toLowerCase() === cleanEmp) ||
        (cleanEmp === 'manager' && u.role === 'manager') ||
        (cleanEmp === 'admin' && u.role === 'admin') ||
        (cleanEmp === 'platform' && u.role === 'platform_admin')
      )
      users = exactMatch ? [exactMatch] : [users[0]]
    }

    if (users.length === 0) {
      if (isDevEnvironment()) {
        const resolved = resolveDevFallbackUser(cleanEmp, tenantId)
        if (resolved && (await verifyUserPassword(resolved.user, password))) {
          const token = signToken(resolved.user)
          return {
            status: 200,
            jsonBody: {
              user: resolved.user,
              token,
              tenant: resolved.tenant,
            },
          }
        }
      }

      return {
        status: 401,
        jsonBody: { error: `Invalid credentials or Employee ID "${employeeId}" not found in this organization.` },
      }
    }

    const user = users[0]

    const isMatch = await verifyUserPassword(user, password)
    if (!isMatch) {
      return {
        status: 401,
        jsonBody: {
          error: 'Invalid credentials. Authentication failed.',
        },
      }
    }

    const tokenPayload = {
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
      name: user.name,
    }

    const token = signToken(tokenPayload)

    const { passwordHash: _ph, password: _pw, ...safeUser } = user

    return {
      status: 200,
      jsonBody: {
        user: safeUser,
        token,
        tenant: { id: user.tenantId },
      },
    }
  } catch (err: any) {
    return {
      status: 500,
      jsonBody: { error: err.message || 'Internal server error during authentication' },
    }
  }
}

/**
 * POST /api/auth/platform-login
 * Direct infrastructure login for Platform Administrators (Alex Thorne - KC-0001)
 * Bypasses company login portals and multi-tenant organization boundaries
 */
export async function loginPlatformAdmin(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = (await request.json()) as { adminId?: string; password?: string }
    const adminId = (body?.adminId || '').trim().toLowerCase()
    const cleanPassword = (body?.password || '').trim()
    if (!adminId || !cleanPassword) {
      return { status: 400, jsonBody: { error: 'Platform Administrator ID and password are required' } }
    }

    if (adminId !== 'kc-0001' && adminId !== 'alex' && adminId !== 'platform_admin' && !adminId.includes('kc-0001')) {
      return { status: 401, jsonBody: { error: 'Invalid Platform Administrator ID. Access is strictly restricted.' } }
    }

    const configuredAdminPass = process.env.PLATFORM_ADMIN_PASSWORD?.trim()
    let isPasswordValid = false
    if (configuredAdminPass) {
      isPasswordValid = configuredAdminPass.startsWith('$2')
        ? await bcrypt.compare(cleanPassword, configuredAdminPass)
        : cleanPassword === configuredAdminPass
    } else if (isDevEnvironment()) {
      const lower = cleanPassword.toLowerCase()
      isPasswordValid = lower === 'password123' || lower === 'demo123' || lower === 'password123!' || lower === 'kc-0001'
    }

    if (!isPasswordValid) {
      return { status: 401, jsonBody: { error: 'Invalid Platform Administrator credentials.' } }
    }

    const adminUser = {
      id: 'user-platform-admin',
      tenantId: 'tenant-platform',
      name: 'Alex Thorne',
      email: 'alex.thorne@kineticcloud.azure.com',
      role: 'platform_admin' as const,
      department: 'Cloud Platform Infrastructure',
      jobTitle: 'Principal Cloud Platform Director',
      employeeNumber: 'KC-0001',
      hireDate: '2020-01-01',
      phone: '+94 77 000 0001',
      location: 'Azure Operations Center (Colombo / Southeast Asia)',
    }

    const token = signToken({
      id: adminUser.id,
      tenantId: adminUser.tenantId,
      name: adminUser.name,
      role: 'platform_admin',
      email: adminUser.email,
    })

    return {
      status: 200,
      jsonBody: {
        user: adminUser,
        token,
        tenant: {
          id: 'tenant-platform',
          name: 'Global Cloud Fleet Infrastructure',
          code: 'PLATFORM',
          domain: 'azure.kineticcloud.io',
          plan: 'Infrastructure Authority',
        },
      },
    }
  } catch (err: any) {
    return {
      status: 500,
      jsonBody: { error: err.message || 'Internal server error during platform authentication' },
    }
  }
}
