import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import bcrypt from 'bcryptjs'
import { queryTenantItems, getTenantContainer } from '../config/cosmos'
import { authenticateRequest } from '../middleware/auth'
import { BulkImportColumnMapping, runBulkEmployeeImport } from '../services/employeeImportService'

function sanitizeEmployee<T extends Record<string, any>>(emp: T): Omit<T, 'password' | 'passwordHash'> {
  const { password: _pw, passwordHash: _ph, ...safe } = emp
  return safe
}

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
    let query = 'SELECT c.id, c.tenantId, c.name, c.email, c.role, c.department, c.jobTitle, c.employeeNumber, c.location, c.address, c.idNumber, c.phone, c.biometricStatus, c.avatarUrl, c.hireDate, c.managerId, c.managerName FROM c WHERE c.tenantId = @tenantId'
    const params: Array<{ name: string; value: any }> = [{ name: '@tenantId', value: tenantId }]

    if (department && department !== 'all') {
      query += ' AND LOWER(c.department) = @department'
      params.push({ name: '@department', value: department.toLowerCase() })
    }

    const employees = await queryTenantItems<any>('users', tenantId, query, params)
    return { status: 200, jsonBody: employees.map(sanitizeEmployee) }
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
    return { status: 200, jsonBody: sanitizeEmployee(resource) }
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
    const query = 'SELECT c.id, c.tenantId, c.name, c.email, c.role, c.department, c.jobTitle, c.employeeNumber, c.location, c.address, c.idNumber, c.phone, c.biometricStatus, c.avatarUrl, c.hireDate, c.managerId, c.managerName FROM c WHERE c.tenantId = @tenantId AND c.managerId = @managerId'
    const params = [
      { name: '@tenantId', value: tenantId },
      { name: '@managerId', value: managerId },
    ]

    const members = await queryTenantItems<any>('users', tenantId, query, params)
    return { status: 200, jsonBody: members.map(sanitizeEmployee) }
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

    // Determine if requester is admin or updating own profile
    const isSelf = auth.user!.id === employeeId
    const isAdmin = auth.user!.role === 'admin' || auth.user!.role === 'platform_admin'

    if (!isAdmin && !isSelf) {
      return { status: 403, jsonBody: { error: 'Unauthorized to modify this employee profile' } }
    }

    const newPassword = typeof body.password === 'string' && body.password.trim()
      ? await bcrypt.hash(body.password.trim(), 10)
      : undefined

    const updated = {
      ...resource,
      // Any authenticated user can update their own avatar and password in their Profile section
      ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
      ...(newPassword !== undefined && { passwordHash: newPassword }),
      // Non-admins cannot alter locked organizational parameters
      ...(isAdmin && body.phone !== undefined && { phone: body.phone }),
      ...(isAdmin && body.location !== undefined && { location: body.location }),
      ...(isAdmin && body.address !== undefined && { address: body.address }),
      ...(isAdmin && body.idNumber !== undefined && { idNumber: body.idNumber }),
      ...(isAdmin && body.jobTitle !== undefined && { jobTitle: body.jobTitle }),
      ...(isAdmin && body.department !== undefined && { department: body.department }),
      ...(isAdmin && body.name !== undefined && { name: body.name }),
      ...(isAdmin && body.role !== undefined && { role: body.role }),
      ...(isAdmin && body.managerId !== undefined && { managerId: body.managerId }),
      ...(isAdmin && body.managerName !== undefined && { managerName: body.managerName }),
      ...(isAdmin && body.biometricStatus !== undefined && { biometricStatus: body.biometricStatus }),
      updatedAt: new Date().toISOString(),
    }
    if (newPassword !== undefined) {
      delete updated.password
    }

    const { resource: saved } = await container.items.upsert(updated)
    return { status: 200, jsonBody: saved ? sanitizeEmployee(saved) : sanitizeEmployee(updated) }
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
    if (!body?.name || !String(body.name).trim() || !body?.email || !String(body.email).trim()) {
      return { status: 400, jsonBody: { error: 'Employee name and email are required.' } }
    }

    const allowedRoles = ['employee', 'manager', 'admin', 'platform_admin']
    const role = allowedRoles.includes(body.role) ? body.role : 'employee'
    const newId = body.id || `user-${Date.now().toString(36)}`

    const newEmp = {
      id: newId,
      tenantId,
      name: String(body.name).trim(),
      email: String(body.email).trim().toLowerCase(),
      role,
      department: body.department || 'Unassigned',
      employeeNumber: body.employeeNumber || (
        (body.role === 'admin' ? `A-${Math.floor(1000 + Math.random() * 9000)}` :
         body.role === 'manager' ? `M-${Math.floor(1000 + Math.random() * 9000)}` :
         `EMP-${Math.floor(1000 + Math.random() * 9000)}`)
      ),
      managerId: body.managerId || '',
      managerName: body.managerName || '',
      hireDate: body.hireDate || new Date().toISOString().split('T')[0],
      phone: body.phone || '',
      location: body.location || '',
      address: body.address || '',
      idNumber: body.idNumber || '',
      passwordHash: await bcrypt.hash(String(body.password || body.idNumber || 'password123'), 10),
      avatarUrl: body.avatarUrl || '',
      biometricStatus: body.biometricStatus || 'Pending Employee Capture',
      createdAt: new Date().toISOString(),
    }

    const container = getTenantContainer('users')
    const { resource } = await container.items.create(newEmp)
    return { status: 201, jsonBody: sanitizeEmployee(resource || newEmp) }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * POST /api/employees/import
 * Bulk imports legacy or biometric employee datasets (from fingerprint scanners / ERP),
 * automatically extracts unique department names, creates new department workspaces,
 * and links employees to those departments.
 */
export async function bulkImportEmployees(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request, 'admin')
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId

  try {
    const body = (await request.json()) as {
      mode?: 'auto_split' | 'fixed_department'
      targetDepartment?: string
      departmentColumn?: string
      columnMapping?: BulkImportColumnMapping
      dataset: Array<Record<string, any>>
    }

    const dataset = body?.dataset || []
    if (!Array.isArray(dataset) || dataset.length === 0) {
      return { status: 400, jsonBody: { error: 'Invalid or empty employee dataset' } }
    }

    const result = await runBulkEmployeeImport({
      tenantId,
      actorName: auth.user!.name || 'HR Admin',
      mode: body.mode,
      targetDepartment: body.targetDepartment,
      departmentColumn: body.departmentColumn,
      columnMapping: body.columnMapping,
      dataset,
    })

    return {
      status: 200,
      jsonBody: {
        ...result,
        employees: result.employees.map(sanitizeEmployee),
      },
    }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message || 'Error processing dataset import' } }
  }
}


