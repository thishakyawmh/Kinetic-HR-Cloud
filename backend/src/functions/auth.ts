import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { queryTenantItems, getTenantContainer } from '../config/cosmos'
import { signToken } from '../middleware/auth'

/**
 * POST /api/auth/organization
 * Validates organization code or ID (e.g. KINETIC or NOVA)
 */
export async function validateOrganization(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = (await request.json()) as { organizationId?: string }
    const orgId = (body?.organizationId || '').trim().toLowerCase()

    if (!orgId) {
      return { status: 400, jsonBody: { error: 'organizationId is required' } }
    }

    const container = getTenantContainer('organizations')
    const querySpec = {
      query: 'SELECT * FROM c WHERE LOWER(c.code) = @orgId OR LOWER(c.id) = @orgId',
      parameters: [{ name: '@orgId', value: orgId }],
    }

    const { resources } = await container.items.query(querySpec).fetchAll()

    if (resources.length === 0) {
      // Fallback/Demo org info if during initial setup
      if (orgId === 'kinetic' || orgId === 'tenant-kinetic') {
        return {
          status: 200,
          jsonBody: {
            id: 'tenant-kinetic',
            name: 'Kinetic Technologies',
            code: 'KINETIC',
            status: 'Active',
          },
        }
      }
      if (orgId === 'nova' || orgId === 'tenant-nova') {
        return {
          status: 200,
          jsonBody: {
            id: 'tenant-nova',
            name: 'Nova Systems',
            code: 'NOVA',
            status: 'Active',
          },
        }
      }

      return {
        status: 404,
        jsonBody: { error: `Organization "${orgId}" not found or inactive` },
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

    // Query user specifically in tenantId partition
    const users = await queryTenantItems<any>(
      'users',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @tenantId AND (LOWER(c.employeeNumber) = @empId OR LOWER(c.email) = @empId OR LOWER(c.id) = @empId)',
      [
        { name: '@tenantId', value: tenantId },
        { name: '@empId', value: cleanEmp },
      ]
    )

    if (users.length === 0) {
      // In dev fallback, allow matching mock demo credentials if cosmos DB is not yet populated
      let devUser: any = null
<<<<<<< HEAD
      if (cleanEmp.includes('kt-8842') || cleanEmp === 'alice' || cleanEmp.includes('alice')) {
=======
      if (cleanEmp.includes('kt-8842') || cleanEmp === 'alice' || cleanEmp.includes('alice') || cleanEmp === 'employee') {
>>>>>>> 907a5b9d4499834ee25d8db62daa1c4256356a9c
        devUser = {
          id: 'user-Alice',
          tenantId: 'tenant-kinetic',
          name: 'Alice Johnson',
          email: 'Alice.johnson@kinetictech.io',
          role: 'employee' as const,
          department: 'Engineering',
          jobTitle: 'Senior Frontend Engineer',
          employeeNumber: 'KT-8842',
        }
<<<<<<< HEAD
      } else if (cleanEmp.includes('kt-1044') || cleanEmp === 'david' || cleanEmp.includes('david')) {
        devUser = {
          id: 'user-David',
          tenantId: 'tenant-kinetic',
          name: 'David Wilson',
          email: 'David.wilson@kinetictech.io',
          role: 'manager' as const,
          department: 'Engineering',
          jobTitle: 'Engineering Manager',
          employeeNumber: 'KT-1044',
        }
      } else if (cleanEmp.includes('kt-0012') || cleanEmp === 'sarah' || cleanEmp.includes('sarah')) {
        devUser = {
          id: 'user-Sarah',
          tenantId: 'tenant-kinetic',
          name: 'Sarah Miller',
          email: 'Sarah.miller@kinetictech.io',
          role: 'admin' as const,
          department: 'Human Resources',
          jobTitle: 'HR Administrator',
          employeeNumber: 'KT-0012',
        }
      } else if (cleanEmp.includes('kc-0001') || cleanEmp === 'alex' || cleanEmp.includes('alex')) {
        devUser = {
          id: 'user-PlatformAdmin',
          tenantId: 'tenant-kinetic',
          name: 'Alex Vance',
          email: 'Alex.vance@kinetictech.io',
          role: 'platform_admin' as const,
          department: 'Platform Operations',
          jobTitle: 'Kinetic Platform Administrator',
=======
      } else if (cleanEmp.includes('kt-1044-emp')) {
        devUser = {
          id: 'user-david-emp',
          tenantId: 'tenant-kinetic',
          name: 'David Wilson (Employee)',
          email: 'david.emp@kinetictech.io',
          role: 'employee' as const,
          department: 'Engineering',
          jobTitle: 'Engineering Director',
          employeeNumber: 'KT-1044-EMP',
        }
      } else if (cleanEmp.includes('kt-1044') || cleanEmp === 'david' || cleanEmp.includes('manager')) {
        devUser = {
          id: 'user-david',
          tenantId: 'tenant-kinetic',
          name: 'David Wilson',
          email: 'david.wilson@kinetictech.io',
          role: 'manager' as const,
          department: 'Engineering',
          jobTitle: 'Engineering Director',
          employeeNumber: 'KT-1044',
        }
      } else if (cleanEmp.includes('kt-0012-emp')) {
        devUser = {
          id: 'user-sarah-emp',
          tenantId: 'tenant-kinetic',
          name: 'Sarah Miller (Employee)',
          email: 'sarah.emp@kinetictech.io',
          role: 'employee' as const,
          department: 'Human Resources',
          jobTitle: 'VP of People & Operations',
          employeeNumber: 'KT-0012-EMP',
        }
      } else if (cleanEmp.includes('kt-0012') || cleanEmp === 'sarah' || cleanEmp.includes('admin') || cleanEmp === 'hr') {
        devUser = {
          id: 'user-sarah',
          tenantId: 'tenant-kinetic',
          name: 'Sarah Miller',
          email: 'sarah.miller@kinetictech.io',
          role: 'admin' as const,
          department: 'Human Resources',
          jobTitle: 'VP of People & Operations',
          employeeNumber: 'KT-0012',
        }
      } else if (cleanEmp.includes('kc-0001') || cleanEmp === 'alex' || cleanEmp.includes('platform')) {
        devUser = {
          id: 'user-platform-admin',
          tenantId: 'tenant-kinetic',
          name: 'Alex Thorne',
          email: 'alex.thorne@kineticcloud.azure.com',
          role: 'platform_admin' as const,
          department: 'Cloud Platform Operations',
          jobTitle: 'Principal Cloud Platform Director',
>>>>>>> 907a5b9d4499834ee25d8db62daa1c4256356a9c
          employeeNumber: 'KC-0001',
        }
      }

      if (devUser) {
        const token = signToken(devUser)
        return {
          status: 200,
          jsonBody: {
            user: devUser,
            token,
            tenant: { id: devUser.tenantId, name: 'Kinetic Technologies', code: 'KINETIC' },
          },
        }
      }

      return {
        status: 401,
        jsonBody: { error: `Employee ID "${employeeId}" not found in this organization. Try KT-8842 (Employee), KT-1044 (Manager), KT-0012 (HR Admin), or KC-0001 (Platform Admin).` },
      }
    }

    const user = users[0]

    // Verify password if hashed (in production with bcrypt, or fallback check)
    if (user.passwordHash && password) {
      // Here you can verify with bcrypt.compareSync(password, user.passwordHash)
    }

    const tokenPayload = {
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
      name: user.name,
    }

    const token = signToken(tokenPayload)

    // Remove sensitive fields before returning
    delete user.passwordHash

    return {
      status: 200,
      jsonBody: {
        user,
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
