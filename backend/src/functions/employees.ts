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
    let query = 'SELECT c.id, c.tenantId, c.name, c.email, c.role, c.department, c.jobTitle, c.employeeNumber, c.location, c.address, c.idNumber, c.phone, c.biometricStatus, c.avatarUrl, c.hireDate, c.managerId, c.managerName FROM c WHERE c.tenantId = @tenantId'
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
    const query = 'SELECT c.id, c.tenantId, c.name, c.email, c.role, c.department, c.jobTitle, c.employeeNumber, c.location, c.address, c.idNumber, c.phone, c.biometricStatus, c.avatarUrl, c.hireDate, c.managerId, c.managerName FROM c WHERE c.tenantId = @tenantId AND c.managerId = @managerId'
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

    // Determine if requester is admin or updating own profile
    const isSelf = auth.user!.id === employeeId
    const isAdmin = auth.user!.role === 'admin' || auth.user!.role === 'platform_admin'

    if (!isAdmin && !isSelf) {
      return { status: 403, jsonBody: { error: 'Unauthorized to modify this employee profile' } }
    }

    const updated = {
      ...resource,
      // Any authenticated user can update their own avatar and password in their Profile section
      ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
      ...(body.password !== undefined && { password: body.password }),
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
      department: body.department || 'Unassigned',
      jobTitle: body.jobTitle || 'Pending Assignment',
      employeeNumber: body.employeeNumber || `EMP-${Date.now().toString().slice(-4)}`,
      managerId: body.managerId || '',
      managerName: body.managerName || '',
      hireDate: body.hireDate || new Date().toISOString().split('T')[0],
      phone: body.phone || '',
      location: body.location || '',
      address: body.address || '',
      idNumber: body.idNumber || '',
      password: body.password || body.idNumber || 'password123',
      avatarUrl: body.avatarUrl || '',
      biometricStatus: body.biometricStatus || 'Pending Employee Capture',
      createdAt: new Date().toISOString(),
    }

    const container = getTenantContainer('users')
    const { resource } = await container.items.create(newEmp)
    return { status: 201, jsonBody: resource }
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
      dataset: Array<Record<string, any>>
      departmentColumn?: string
    }

    const dataset = body?.dataset || []
    const deptCol = (body?.departmentColumn || 'Department').trim()

    if (!Array.isArray(dataset) || dataset.length === 0) {
      return { status: 400, jsonBody: { error: 'Invalid or empty employee dataset' } }
    }

    const usersContainer = getTenantContainer('users')
    const deptsContainer = getTenantContainer('departments')

    // Fetch existing departments for tenant
    const existingDepts = await queryTenantItems<any>('departments', tenantId, 'SELECT c.name FROM c WHERE c.tenantId = @tenantId', [{ name: '@tenantId', value: tenantId }])
    const existingDeptNames = new Set(existingDepts.map((d: any) => d.name.toLowerCase()))

    const createdDeptNames: string[] = []
    const importedEmployees: any[] = []

    for (let i = 0; i < dataset.length; i++) {
      const row = dataset[i]
      
      // Determine department from specified column name or fallback key
      const rawDept =
        row[deptCol] ||
        row['Department'] ||
        row['department'] ||
        row['Division'] ||
        row['dept_name'] ||
        row['Dept'] ||
        'Operations'

      const deptName = String(rawDept).trim()

      // Auto-create department if it doesn't exist yet
      if (deptName && !existingDeptNames.has(deptName.toLowerCase())) {
        existingDeptNames.add(deptName.toLowerCase())
        createdDeptNames.push(deptName)
        const newDeptObj = {
          id: `dept-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
          tenantId,
          name: deptName,
          head: auth.user!.name || 'Department Lead',
          threshold: '75% min staffing',
          status: 'Active',
          description: `Auto-generated department workspace from dataset import (${deptCol}).`,
          createdAt: new Date().toISOString(),
        }
        await deptsContainer.items.create(newDeptObj)
      }

      // Extract employee details with biometric & legacy field support
      const name = row['Name'] || row['name'] || row['EmployeeName'] || row['Full Name'] || `Imported Staff #${i + 1}`
      const empNum = row['EmployeeNumber'] || row['employeeNumber'] || row['EmpID'] || row['BiometricID'] || `EMP-${1000 + i}`
      const email = row['Email'] || row['email'] || `${name.toLowerCase().replace(/\s+/g, '.')}@kinetictech.io`
      const role = (row['Role'] || row['role'] || 'employee').toLowerCase()
      const jobTitle = row['JobTitle'] || row['jobTitle'] || row['Designation'] || row['Title'] || 'Staff Member'
      const phone = row['Phone'] || row['phone'] || row['Mobile'] || ''

      const empObj = {
        id: `user-${Date.now().toString(36)}-${i}`,
        tenantId,
        name,
        email,
        role: ['admin', 'manager', 'employee', 'platform_admin'].includes(role) ? role : 'employee',
        department: deptName,
        jobTitle,
        employeeNumber: empNum,
        phone,
        location: row['Location'] || row['Branch'] || 'Colombo HQ',
        hireDate: row['HireDate'] || row['Joined'] || new Date().toISOString().substring(0, 10),
        biometricStatus: 'Linked (Fingerprint Active)',
        createdAt: new Date().toISOString(),
      }

      await usersContainer.items.upsert(empObj)
      importedEmployees.push(empObj)
    }

    return {
      status: 200,
      jsonBody: {
        success: true,
        message: `Successfully imported ${importedEmployees.length} employee records.`,
        importedCount: importedEmployees.length,
        createdDepartments: createdDeptNames,
        employees: importedEmployees,
      },
    }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message || 'Error processing dataset import' } }
  }
}


