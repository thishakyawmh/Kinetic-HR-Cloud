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
}
