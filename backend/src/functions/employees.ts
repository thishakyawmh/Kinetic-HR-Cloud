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

/**
 * GET /api/employees/team
 * Retrieves team members managed by managerId (or current user if manager)
 */
export async function getTeamMembers(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const managerId = request.query.get('managerId') || auth.user!.id

  try {
    const query = 'SELECT c.id, c.tenantId, c.name, c.email, c.role, c.department, c.jobTitle, c.employeeNumber, c.location, c.hireDate, c.managerId, c.managerName FROM c WHERE c.tenantId = @tenantId AND c.managerId = @managerId'
    const params = [
      { name: '@tenantId', value: tenantId },
      { name: '@managerId', value: managerId },
    ]

    const members = await queryTenantItems<any>('users', tenantId, query, params)
    return { status: 200, jsonBody: members }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * PATCH /api/employees/{id}
 * Updates employee profile details
 */
export async function updateEmployee(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const employeeId = request.params.id

  try {
    const body = (await request.json()) as any
    const container = getTenantContainer('users')
    const { resource } = await container.item(employeeId, tenantId).read()
    if (!resource) {
      return { status: 404, jsonBody: { error: 'Employee not found' } }
    }

    const updated = {
      ...resource,
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.location !== undefined && { location: body.location }),
      ...(body.jobTitle !== undefined && { jobTitle: body.jobTitle }),
      ...(body.department !== undefined && { department: body.department }),
      ...(body.name !== undefined && { name: body.name }),
      updatedAt: new Date().toISOString(),
    }

    const { resource: saved } = await container.items.upsert(updated)
    if (saved) {
      delete (saved as any).passwordHash
    }
    return { status: 200, jsonBody: saved }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * POST /api/employees
 * Creates a new employee record (Admin only)
 */
export async function createEmployee(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request, 'admin')
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId

  try {
    const body = (await request.json()) as any
    const newId = body.id || `user-${Date.now().toString(36)}`

    const newEmp = {
      id: newId,
      tenantId,
      name: body.name,
      email: body.email,
      role: body.role || 'employee',
      department: body.department || 'General',
      jobTitle: body.jobTitle || 'Team Member',
      employeeNumber: body.employeeNumber || `EMP-${Date.now().toString().slice(-4)}`,
      managerId: body.managerId,
      managerName: body.managerName,
      hireDate: body.hireDate || new Date().toISOString().split('T')[0],
      phone: body.phone || '',
      location: body.location || '',
      createdAt: new Date().toISOString(),
    }

    const container = getTenantContainer('users')
    const { resource } = await container.items.create(newEmp)
    return { status: 201, jsonBody: resource }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

