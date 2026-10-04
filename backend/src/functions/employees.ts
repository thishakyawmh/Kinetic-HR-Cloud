import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { queryTenantItems, getTenantContainer } from '../config/cosmos'
import { authenticateRequest } from '../middleware/auth'

/**
 * GET /api/employees
 * Lists employees belonging strictly to the requester's tenant
 */
export async function getEmployees(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const department = request.query.get('department')

  try {
    let query = 'SELECT c.id, c.tenantId, c.name, c.email, c.role, c.department, c.jobTitle, c.employeeNumber, c.location, c.hireDate, c.managerId, c.managerName FROM c WHERE c.tenantId = @tenantId'
    const params: Array<{ name: string; value: any }> = [{ name: '@tenantId', value: tenantId }]

    if (department && department !== 'all') {
      query += ' AND LOWER(c.department) = @department'
      params.push({ name: '@department', value: department.toLowerCase() })
    }

    const employees = await queryTenantItems<any>('users', tenantId, query, params)
    return { status: 200, jsonBody: employees }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * GET /api/employees/{id}
 */
export async function getEmployeeById(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const employeeId = request.params.id

  try {
    const container = getTenantContainer('users')
    const { resource } = await container.item(employeeId, tenantId).read()
    if (!resource) {
      return { status: 404, jsonBody: { error: 'Employee not found' } }
    }
    delete resource.passwordHash
    return { status: 200, jsonBody: resource }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}
