import { appDataStore } from './storage'
import { User } from '@/types'

export const employeeService = {
  async getEmployees(tenantId: string, department?: string): Promise<User[]> {
    await new Promise(r => setTimeout(r, 120)) // simulated latency
    let list = appDataStore.getUsers(tenantId)
    if (department && department !== 'all') {
      list = list.filter(u => u.department.toLowerCase() === department.toLowerCase())
    }
    return list
  },

  async getEmployeeById(id: string): Promise<User | undefined> {
    await new Promise(r => setTimeout(r, 80))
    return appDataStore.getUser(id)
  },

  async createEmployee(employee: Omit<User, 'id'>): Promise<User> {
    await new Promise(r => setTimeout(r, 200))
    const id = `user-${Math.random().toString(36).substring(2, 9)}`
    return appDataStore.addUser({ ...employee, id })
  },

  async updateEmployee(id: string, updates: Partial<User>): Promise<User | undefined> {
    await new Promise(r => setTimeout(r, 150))
    return appDataStore.updateUser(id, updates)
  },

  async getTeamMembers(managerId: string): Promise<User[]> {
    await new Promise(r => setTimeout(r, 100))
    return appDataStore.getUsers().filter(u => u.managerId === managerId)
  },
}
