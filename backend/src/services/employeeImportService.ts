import { getTenantContainer, queryTenantItems } from '../config/cosmos'

export interface BulkImportColumnMapping {
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

export interface BulkImportInput {
  tenantId: string
  actorName: string
  mode?: 'auto_split' | 'fixed_department'
  targetDepartment?: string
  departmentColumn?: string
  columnMapping?: BulkImportColumnMapping
  dataset: Array<Record<string, any>>
}

const VALID_ROLES = new Set(['admin', 'manager', 'employee', 'platform_admin'])

const INITIAL_LEAVE_TYPES: Array<{ code: string; name: string; allowance: number }> = [
  { code: 'annual', name: 'Annual Leave', allowance: 20 },
  { code: 'casual', name: 'Casual Leave', allowance: 7 },
  { code: 'sick', name: 'Sick Leave', allowance: 12 },
  { code: 'emergency', name: 'Emergency Leave', allowance: 3 },
]

function pickField(row: Record<string, any>, candidates: string[], fallback: string): string {
  for (const key of candidates) {
    if (key && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return String(row[key]).trim()
    }
  }
  return fallback
}

async function createDepartmentIfMissing(
  tenantId: string,
  name: string,
  head: string,
  description: string,
  existingNames: Set<string>,
  createdList?: string[]
): Promise<void> {
  const lower = name.toLowerCase()
  if (!name || existingNames.has(lower)) return

  existingNames.add(lower)
  createdList?.push(name)

  await getTenantContainer('departments').items.create({
    id: `dept-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    tenantId,
    name,
    head,
    threshold: '75% min staffing',
    status: 'Active',
    description,
    createdAt: new Date().toISOString(),
  })
}

async function seedDefaultBalances(tenantId: string, userId: string): Promise<void> {
  const balContainer = getTenantContainer('leave_balances')
  const nowIso = new Date().toISOString()

  for (const lt of INITIAL_LEAVE_TYPES) {
    await balContainer.items.upsert({
      id: `bal-${userId}-${lt.code}`,
      tenantId,
      userId,
      leaveTypeId: `lt-${lt.code}`,
      leaveTypeName: lt.name,
      code: lt.code,
      leaveType: lt.code,
      totalAllowance: lt.allowance,
      used: 0,
      pending: 0,
      remaining: lt.allowance,
      createdAt: nowIso,
      updatedAt: nowIso,
    })
  }
}

export async function runBulkEmployeeImport(input: BulkImportInput) {
  const { tenantId, actorName, dataset } = input
  const mode = input.mode || 'auto_split'
  const targetDept = (input.targetDepartment || '').trim()
  const mapping = input.columnMapping || {}
  const deptCol = mapping.department || input.departmentColumn || 'Department'
  const leadName = actorName || 'Department Lead'

  const usersContainer = getTenantContainer('users')
  const auditContainer = getTenantContainer('audit_logs')

  const existingDepts = await queryTenantItems<any>(
    'departments',
    tenantId,
    'SELECT c.name FROM c WHERE c.tenantId = @tenantId',
    [{ name: '@tenantId', value: tenantId }]
  )
  const existingDeptNames = new Set(existingDepts.map((d: any) => d.name.toLowerCase()))

  if (mode === 'fixed_department' && targetDept) {
    await createDepartmentIfMissing(
      tenantId,
      targetDept,
      leadName,
      'Auto-provisioned department from specific file import.',
      existingDeptNames
    )
  }

  const createdDeptNames: string[] = []
  const importedEmployees: any[] = []
  const deptBreakdown: Record<string, number> = {}
  const managerLinkRequests: Array<{ empId: string; managerIdentifier: string }> = []

  for (let i = 0; i < dataset.length; i++) {
    const row = dataset[i]

    const deptName =
      mode === 'fixed_department' && targetDept
        ? targetDept
        : pickField(row, [deptCol, 'Department', 'department', 'Division', 'dept_name', 'Dept'], 'Operations')

    await createDepartmentIfMissing(
      tenantId,
      deptName,
      leadName,
      `Auto-generated department workspace from bulk import (${deptCol}).`,
      existingDeptNames,
      createdDeptNames
    )

    deptBreakdown[deptName] = (deptBreakdown[deptName] || 0) + 1

    const name = pickField(
      row,
      [mapping.name || '', 'Name', 'name', 'EmployeeName', 'Full Name', 'Staff Name'],
      `Staff #${i + 1}`
    )
    const empNum = pickField(
      row,
      [mapping.employeeNumber || '', 'EmployeeNumber', 'employeeNumber', 'EmpID', 'Staff ID', 'BiometricID'],
      `EMP-${1000 + i}`
    )
    const email = pickField(
      row,
      [mapping.email || '', 'Email', 'email', 'Work Email'],
      `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@kinetictech.io`
    )
    const rawRole = pickField(row, [mapping.role || '', 'Role', 'role'], 'employee').toLowerCase()
    const role = VALID_ROLES.has(rawRole) ? rawRole : 'employee'
    const jobTitle = pickField(
      row,
      [mapping.jobTitle || '', 'JobTitle', 'jobTitle', 'Designation', 'Title'],
      'Staff Member'
    )
    const phone = pickField(row, [mapping.phone || '', 'Phone', 'phone', 'Mobile'], '')
    const location = pickField(row, [mapping.location || '', 'Location', 'Branch'], 'Colombo HQ')
    const hireDate = pickField(
      row,
      [mapping.hireDate || '', 'HireDate', 'Joined'],
      new Date().toISOString().slice(0, 10)
    )

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

    const mgrRef = pickField(
      row,
      [mapping.managerNumber || 'ManagerEmployeeNumber', 'ManagerID', 'ReportsTo', 'Reports To', 'Manager'],
      ''
    )
    if (mgrRef) {
      managerLinkRequests.push({ empId, managerIdentifier: mgrRef })
    }

    try {
      await seedDefaultBalances(tenantId, empId)
    } catch (balErr: any) {
      console.warn('Could not seed initial leave balance for employee:', balErr?.message || balErr)
    }
  }

  let linkedManagersCount = 0
  if (managerLinkRequests.length > 0) {
    const allTenantUsers = await queryTenantItems<any>(
      'users',
      tenantId,
      'SELECT c.id, c.name, c.email, c.employeeNumber FROM c WHERE c.tenantId = @tenantId',
      [{ name: '@tenantId', value: tenantId }]
    )

    for (const reqItem of managerLinkRequests) {
      const target = reqItem.managerIdentifier.toLowerCase()
      const mgr = allTenantUsers.find(
        u =>
          u.employeeNumber?.toLowerCase() === target ||
          u.email?.toLowerCase() === target ||
          u.id === reqItem.managerIdentifier ||
          u.name?.toLowerCase().includes(target)
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
        } catch (err: any) {
          console.warn(`Could not link manager for ${reqItem.empId}:`, err?.message || err)
        }
      }
    }
  }

  try {
    await auditContainer.items.create({
      id: `aud-import-${Date.now()}`,
      tenantId,
      action: 'Bulk Staff Dataset Imported',
      actor: actorName || 'HR Admin',
      actorRole: 'admin',
      timestamp: new Date().toISOString(),
      details: `Imported ${importedEmployees.length} staff records (${mode} mode). ${createdDeptNames.length} new departments provisioned. ${linkedManagersCount} manager reporting lines linked.`,
      status: 'Success',
    })
  } catch (err: any) {
    console.warn('Could not write import audit log:', err?.message || err)
  }

  return {
    success: true,
    message: `Successfully imported ${importedEmployees.length} employee records.`,
    importedCount: importedEmployees.length,
    createdDepartments: createdDeptNames,
    linkedManagersCount,
    departmentBreakdown: deptBreakdown,
    employees: importedEmployees,
  }
}
