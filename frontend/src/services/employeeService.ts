import { appDataStore } from './storage'
import { apiClient } from './apiClient'
import { User } from '@/types'

const useMock = () => import.meta.env.VITE_USE_MOCK_SERVICES !== 'false'

export const employeeService = {
  async getEmployees(tenantId: string, department?: string): Promise<User[]> {
    if (!useMock()) {
      return apiClient.get<User[]>('/employees', { params: { tenantId, department } })
    }
    await new Promise(r => setTimeout(r, 120))
    let list = appDataStore.getUsers(tenantId)
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
    const users = appDataStore.getUsers(tenantId)
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

  async bulkImportEmployees(data: { dataset: Array<Record<string, any>>; departmentColumn?: string }): Promise<{
    success: boolean
    importedCount: number
    createdDepartments: string[]
    employees: User[]
  }> {
    if (!useMock()) {
      return apiClient.post('/employees/import', data)
    }
    await new Promise(r => setTimeout(r, 300))
    const imported: User[] = []
    const createdDepts: string[] = []
    const deptCol = data.departmentColumn || 'Department'

    data.dataset.forEach((row, i) => {
      const deptName = row[deptCol] || row['Department'] || row['department'] || 'Operations'
      const newUser: User = {
        id: `user-imp-${Date.now()}-${i}`,
        tenantId: 'tenant-kinetic',
        name: row['Name'] || row['name'] || `Employee ${i + 1}`,
        email: row['Email'] || row['email'] || `user${i + 1}@kinetictech.io`,
        role: 'employee',
        department: deptName,
        jobTitle: row['JobTitle'] || row['Title'] || 'Staff Member',
        employeeNumber: row['EmployeeNumber'] || row['EmpID'] || `EMP-${2000 + i}`,
        hireDate: new Date().toISOString().substring(0, 10),
      }
      appDataStore.addUser(newUser)
      imported.push(newUser)
    })
    return { success: true, importedCount: imported.length, createdDepartments: createdDepts, employees: imported }
  },
}
