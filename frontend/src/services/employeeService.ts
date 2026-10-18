import { appDataStore } from './storage'
import { apiClient } from './apiClient'
import { User } from '@/types'

const useMock = () => import.meta.env.VITE_USE_MOCK_SERVICES !== 'false'

export const employeeService = {
  async getEmployees(tenantId?: string, department?: string): Promise<User[]> {
    if (!useMock()) {
      return apiClient.get<User[]>('/employees', { params: { tenantId, department } })
    }
    await new Promise(r => setTimeout(r, 120))
    let list = appDataStore.getUsers(tenantId && tenantId !== 'all' ? tenantId : undefined).filter(u => u.role !== 'platform_admin')
    if (department && department !== 'all') {
      list = list.filter(u => u.department.toLowerCase() === department.toLowerCase())
    }
    return list
  },

  async getEmployeeById(id: string): Promise<User | undefined> {
    if (!useMock()) {
      return apiClient.get<User>(`/employees/${id}`)
    }
    await new Promise(r => setTimeout(r, 80))
    return appDataStore.getUser(id)
  },

  async createEmployee(employee: Omit<User, 'id'>): Promise<User> {
    if (!useMock()) {
      return apiClient.post<User>('/employees', employee)
    }
    await new Promise(r => setTimeout(r, 200))
    const id = `user-${Math.random().toString(36).substring(2, 9)}`
    return appDataStore.addUser({ ...employee, id })
  },

  async updateEmployee(id: string, updates: Partial<User>): Promise<User | undefined> {
    if (!useMock()) {
      return apiClient.patch<User>(`/employees/${id}`, updates)
    }
    await new Promise(r => setTimeout(r, 150))
    return appDataStore.updateUser(id, updates)
  },

  async getTeamMembers(managerId: string): Promise<User[]> {
    if (!useMock()) {
      return apiClient.get<User[]>('/employees/team', { params: { managerId } })
    }
    await new Promise(r => setTimeout(r, 100))
    return appDataStore.getUsers().filter(u => u.managerId === managerId)
  },

  async getDepartments(tenantId?: string): Promise<any[]> {
    if (!useMock()) {
      return apiClient.get<any[]>('/departments', { params: { tenantId } })
    }
    await new Promise(r => setTimeout(r, 120))
    const users = appDataStore.getUsers(tenantId).filter(u => u.role !== 'platform_admin')
    const headcountMap: Record<string, number> = {}
    users.forEach(u => {
      headcountMap[u.department] = (headcountMap[u.department] || 0) + 1
    })

    const depts = [
      { id: 'dept-eng', name: 'Engineering', head: 'David Wilson', threshold: '70% min staffing', status: 'Active', count: headcountMap['Engineering'] || 14 },
      { id: 'dept-hr', name: 'Human Resources', head: 'Sarah Miller', threshold: '80% min staffing', status: 'Active', count: headcountMap['Human Resources'] || 6 },
      { id: 'dept-prod', name: 'Product Management', head: 'Claire Underwood', threshold: '75% min staffing', status: 'Active', count: headcountMap['Product Management'] || 4 },
      { id: 'dept-design', name: 'Design & UX', head: 'Carlos Mendoza', threshold: '65% min staffing', status: 'Active', count: headcountMap['Design & UX'] || 5 },
      { id: 'dept-ops', name: 'Operations & Cloud', head: 'Brandon Lee', threshold: '85% min staffing', status: 'Active', count: headcountMap['Operations & Cloud'] || 8 },
    ]
    return depts
  },

  async createDepartment(dept: { name: string; head?: string; threshold?: string; description?: string }): Promise<any> {
    if (!useMock()) {
      return apiClient.post<any>('/departments', dept)
    }
    await new Promise(r => setTimeout(r, 150))
    return { id: `dept-${Date.now()}`, ...dept, count: 0, status: 'Active' }
  },

  async bulkImportEmployees(data: {
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
  }): Promise<{
    success: boolean
    message: string
    importedCount: number
    createdDepartments: string[]
    linkedManagersCount: number
    departmentBreakdown?: Record<string, number>
    employees: User[]
  }> {
    if (!useMock()) {
      return apiClient.post('/employees/import', data)
    }
    await new Promise(r => setTimeout(r, 400))
    const imported: User[] = []
    const createdDepts: string[] = []
    const mapping = data.columnMapping || {}
    const deptCol = mapping.department || data.departmentColumn || 'Department'
    const deptBreakdown: Record<string, number> = {}

    data.dataset.forEach((row, i) => {
      let deptName = 'Operations'
      if (data.mode === 'fixed_department' && data.targetDepartment) {
        deptName = data.targetDepartment
      } else {
        const rawDept =
          row[deptCol] ||
          row['Department'] ||
          row['department'] ||
          row['Division'] ||
          'Operations'
        deptName = String(rawDept).trim() || 'Operations'
      }

      deptBreakdown[deptName] = (deptBreakdown[deptName] || 0) + 1

      const name = String(row[mapping.name || 'Name'] || row['Name'] || row['name'] || `Staff #${i + 1}`).trim()
      const empNum = String(row[mapping.employeeNumber || 'EmployeeNumber'] || row['EmployeeNumber'] || row['EmpID'] || `EMP-${1000 + i}`).trim()
      const email = String(row[mapping.email || 'Email'] || row['Email'] || `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@kinetictech.io`).trim()
      const rawRole = String(row[mapping.role || 'Role'] || 'employee').toLowerCase().trim()
      const role = ['admin', 'manager', 'employee', 'platform_admin'].includes(rawRole) ? (rawRole as any) : 'employee'
      const jobTitle = String(row[mapping.jobTitle || 'JobTitle'] || row['JobTitle'] || 'Staff Member').trim()
      const phone = String(row[mapping.phone || 'Phone'] || row['Mobile'] || '').trim()
      const location = String(row[mapping.location || 'Location'] || row['Branch'] || 'Colombo HQ').trim()
      const hireDate = String(row[mapping.hireDate || 'HireDate'] || new Date().toISOString().substring(0, 10)).trim()

      const newUser: User = {
        id: `user-imp-${Date.now().toString(36)}-${i}`,
        tenantId: 'tenant-sampath',
        name,
        email,
        role,
        department: deptName,
        jobTitle,
        employeeNumber: empNum,
        phone,
        location,
        hireDate,
      }
      appDataStore.addUser(newUser)
      imported.push(newUser)
    })
    return {
      success: true,
      message: `Successfully imported ${imported.length} employee records.`,
      importedCount: imported.length,
      createdDepartments: createdDepts,
      linkedManagersCount: 0,
      departmentBreakdown: deptBreakdown,
      employees: imported,
    }
  },
}
