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
      mode?: 'auto_split' | 'fixed_department'
      targetDepartment?: string
      departmentColumn?: string
      columnMapping?: {
        name?: string
        employeeNumber?: string
        email?: string
        department?: string
        jobTitle?: string
        role?: string
        managerNumber?: string
        phone?: string
        hireDate?: string
        location?: string
      }
      dataset: Array<Record<string, any>>
    }

    const dataset = body?.dataset || []
    const mode = body?.mode || 'auto_split'
    const targetDept = (body?.targetDepartment || '').trim()
    const mapping = body?.columnMapping || {}
    const deptCol = mapping.department || body?.departmentColumn || 'Department'

    if (!Array.isArray(dataset) || dataset.length === 0) {
      return { status: 400, jsonBody: { error: 'Invalid or empty employee dataset' } }
    }

    const usersContainer = getTenantContainer('users')
    const deptsContainer = getTenantContainer('departments')
    const balContainer = getTenantContainer('leave_balances')
    const auditContainer = getTenantContainer('audit_logs')

    // Fetch existing departments for tenant
    const existingDepts = await queryTenantItems<any>(
      'departments',
      tenantId,
      'SELECT c.name FROM c WHERE c.tenantId = @tenantId',
      [{ name: '@tenantId', value: tenantId }]
    )
    const existingDeptNames = new Set(existingDepts.map((d: any) => d.name.toLowerCase()))

    // If fixed department mode and target department doesn't exist, create it
    if (mode === 'fixed_department' && targetDept && !existingDeptNames.has(targetDept.toLowerCase())) {
      existingDeptNames.add(targetDept.toLowerCase())
      await deptsContainer.items.create({
        id: `dept-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
        tenantId,
        name: targetDept,
        head: auth.user!.name || 'Department Lead',
        threshold: '75% min staffing',
        status: 'Active',
        description: 'Auto-provisioned department from specific file import.',
        createdAt: new Date().toISOString(),
      })
    }

    const createdDeptNames: string[] = []
    const importedEmployees: any[] = []
    const deptBreakdown: Record<string, number> = {}
    const managerLinkRequests: Array<{ empId: string; managerIdentifier: string }> = []

    // PASS 1: Create/Upsert Employee Accounts & Departments & Leave Balances
    for (let i = 0; i < dataset.length; i++) {
      const row = dataset[i]

      // Determine Department
      let deptName = 'Operations'
      if (mode === 'fixed_department' && targetDept) {
        deptName = targetDept
      } else {
        const rawDept =
          row[deptCol] ||
          row['Department'] ||
          row['department'] ||
          row['Division'] ||
          row['dept_name'] ||
          row['Dept'] ||
          'Operations'
        deptName = String(rawDept).trim() || 'Operations'
      }

      // Auto-create department if not existing
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
          description: `Auto-generated department workspace from bulk import (${deptCol}).`,
          createdAt: new Date().toISOString(),
        }
        await deptsContainer.items.create(newDeptObj)
      }

      deptBreakdown[deptName] = (deptBreakdown[deptName] || 0) + 1

      // Extract Mapped Fields
      const name = String(
        row[mapping.name || 'Name'] ||
        row['Name'] ||
        row['name'] ||
        row['EmployeeName'] ||
        row['Full Name'] ||
        row['Staff Name'] ||
        `Staff #${i + 1}`
      ).trim()

      const empNum = String(
        row[mapping.employeeNumber || 'EmployeeNumber'] ||
        row['EmployeeNumber'] ||
        row['employeeNumber'] ||
        row['EmpID'] ||
        row['Staff ID'] ||
        row['BiometricID'] ||
        `EMP-${1000 + i}`
      ).trim()

      const email = String(
        row[mapping.email || 'Email'] ||
        row['Email'] ||
        row['email'] ||
        row['Work Email'] ||
        `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@kinetictech.io`
      ).trim()

      const rawRole = String(row[mapping.role || 'Role'] || row['Role'] || row['role'] || 'employee').toLowerCase().trim()
      const role = ['admin', 'manager', 'employee', 'platform_admin'].includes(rawRole) ? rawRole : 'employee'

      const jobTitle = String(
        row[mapping.jobTitle || 'JobTitle'] ||
        row['JobTitle'] ||
        row['jobTitle'] ||
        row['Designation'] ||
        row['Title'] ||
        'Staff Member'
      ).trim()

      const phone = String(row[mapping.phone || 'Phone'] || row['Phone'] || row['phone'] || row['Mobile'] || '').trim()
      const location = String(row[mapping.location || 'Location'] || row['Location'] || row['Branch'] || 'Colombo HQ').trim()
      const hireDate = String(row[mapping.hireDate || 'HireDate'] || row['HireDate'] || row['Joined'] || new Date().toISOString().substring(0, 10)).trim()

      const empId = `user-${Date.now().toString(36)}-${i}`

      const empObj = {
        id: empId,
        tenantId,
        name,
        email,
        role,
        department: deptName,
        jobTitle,
        employeeNumber: empNum,
        phone,
        location,
        hireDate,
        biometricStatus: 'Linked (Fingerprint Active)',
        createdAt: new Date().toISOString(),
      }

      await usersContainer.items.upsert(empObj)
      importedEmployees.push(empObj)

      // Collect Manager Link Info
      const managerIdCol = mapping.managerNumber || 'ManagerEmployeeNumber'
      const mgrRef = row[managerIdCol] || row['ManagerID'] || row['ReportsTo'] || row['Reports To'] || row['Manager']
      if (mgrRef) {
        managerLinkRequests.push({ empId, managerIdentifier: String(mgrRef).trim() })
      }

      // Initialize default leave balances for this employee
      try {
        const initialTypes = ['annual', 'casual', 'sick', 'emergency']
        const defaultAllowances: Record<string, number> = { annual: 20, casual: 7, sick: 12, emergency: 3 }
        const typeNames: Record<string, string> = { annual: 'Annual Leave', casual: 'Casual Leave', sick: 'Sick Leave', emergency: 'Emergency Leave' }

        for (const tCode of initialTypes) {
          const balItem = {
            id: `bal-${empId}-${tCode}`,
            tenantId,
            userId: empId,
            leaveTypeId: `lt-${tCode}`,
            leaveTypeName: typeNames[tCode],
            code: tCode,
            leaveType: tCode,
            totalAllowance: defaultAllowances[tCode] || 15,
            used: 0,
            pending: 0,
            remaining: defaultAllowances[tCode] || 15,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          await balContainer.items.upsert(balItem)
        }
      } catch (balErr) {
        console.warn('Could not seed initial leave balance for employee:', balErr)
      }
    }

    // PASS 2: Link Reporting Manager Hierarchy
    let linkedManagersCount = 0
    if (managerLinkRequests.length > 0) {
      // Query all users for this tenant to resolve manager identifiers
      const allTenantUsers = await queryTenantItems<any>(
        'users',
        tenantId,
        'SELECT c.id, c.name, c.email, c.employeeNumber FROM c WHERE c.tenantId = @tenantId',
        [{ name: '@tenantId', value: tenantId }]
      )

      for (const reqItem of managerLinkRequests) {
        const mgr = allTenantUsers.find(
          u =>
            u.employeeNumber?.toLowerCase() === reqItem.managerIdentifier.toLowerCase() ||
            u.email?.toLowerCase() === reqItem.managerIdentifier.toLowerCase() ||
            u.id === reqItem.managerIdentifier ||
            u.name?.toLowerCase().includes(reqItem.managerIdentifier.toLowerCase())
        )

        if (mgr) {
          try {
            const { resource: empRecord } = await usersContainer.item(reqItem.empId, tenantId).read()
            if (empRecord) {
              empRecord.managerId = mgr.id
              empRecord.managerName = mgr.name
              await usersContainer.items.upsert(empRecord)
              linkedManagersCount++
            }
          } catch (_) {}
        }
      }
    }

    // PASS 3: Create Audit Log Entry
    try {
      await auditContainer.items.create({
        id: `aud-import-${Date.now()}`,
        tenantId,
        action: 'Bulk Staff Dataset Imported',
        actor: auth.user!.name || 'HR Admin',
        actorRole: 'admin',
        timestamp: new Date().toISOString(),
        details: `Imported ${importedEmployees.length} staff records (${mode} mode). ${createdDeptNames.length} new departments provisioned. ${linkedManagersCount} manager reporting lines linked.`,
        status: 'Success',
      })
    } catch (_) {}

    return {
      status: 200,
      jsonBody: {
        success: true,
        message: `Successfully imported ${importedEmployees.length} employee records.`,
        importedCount: importedEmployees.length,
        createdDepartments: createdDeptNames,
        linkedManagersCount,
        departmentBreakdown: deptBreakdown,
        employees: importedEmployees,
      },
    }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message || 'Error processing dataset import' } }
  }
}


