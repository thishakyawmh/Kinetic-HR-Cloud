import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { queryTenantItems, getTenantContainer } from '../config/cosmos'
import { authenticateRequest } from '../middleware/auth'

/**
 * GET /api/departments
 * Retrieves all departments and divisions for the tenant, with headcount stats
 */
export async function getDepartments(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId

  try {
    const query = 'SELECT * FROM c WHERE c.tenantId = @tenantId'
    const params = [{ name: '@tenantId', value: tenantId }]
    const depts = await queryTenantItems<any>('departments', tenantId, query, params)

    // Calculate real-time headcount per department from users container
    const usersQuery = 'SELECT c.department FROM c WHERE c.tenantId = @tenantId'
    const users = await queryTenantItems<any>('users', tenantId, usersQuery, params)

    const headcountMap: Record<string, number> = {}
    users.forEach((u: any) => {
      const deptName = u.department || 'General'
      headcountMap[deptName] = (headcountMap[deptName] || 0) + 1
    })

    const enrichedDepts = depts.map((d: any) => ({
      ...d,
      count: headcountMap[d.name] || d.count || 0,
    }))

    return { status: 200, jsonBody: enrichedDepts }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * POST /api/departments
 * Creates a new department or organizational division workspace
 */
export async function createDepartment(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request, 'admin')
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId

  try {
    const body = (await request.json()) as any
    if (!body.name || !body.name.trim()) {
      return { status: 400, jsonBody: { error: 'Department name is required' } }
    }

    const newDept = {
      id: body.id || `dept-${Date.now().toString(36)}`,
      tenantId,
      name: body.name.trim(),
      head: body.head || auth.user!.name || 'Unassigned Lead',
      threshold: body.threshold || '75% min staffing',
      status: body.status || 'Active',
      description: body.description || 'Department workspace division.',
      createdAt: new Date().toISOString(),
    }

    const container = getTenantContainer('departments')
    const { resource } = await container.items.create(newDept)
    return { status: 201, jsonBody: resource }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}
