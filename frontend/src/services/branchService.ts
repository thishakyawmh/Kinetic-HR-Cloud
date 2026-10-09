import { appDataStore } from './storage'
import { apiClient } from './apiClient'
import { Branch } from '@/types'

const useMock = () => import.meta.env.VITE_USE_MOCK_SERVICES !== 'false'

export const branchService = {
  async getBranches(tenantId?: string): Promise<Branch[]> {
    if (!useMock()) {
      try {
        const branches = await apiClient.get<Branch[]>('/branches', { params: { tenantId } })
        if (Array.isArray(branches) && branches.length > 0) {
          branches.forEach(b => appDataStore.addBranch(b))
          return branches
        }
      } catch (e) {
        console.warn('Backend API /branches failed, falling back to store:', e)
      }
    }
    await new Promise(r => setTimeout(r, 80))
    return appDataStore.getBranches(tenantId)
  },

  async getBranchById(id: string): Promise<Branch | undefined> {
    if (!useMock()) {
      try {
        return await apiClient.get<Branch>(`/branches/${id}`)
      } catch (e) {
        console.warn(`Backend API /branches/${id} failed:`, e)
      }
    }
    await new Promise(r => setTimeout(r, 60))
    return appDataStore.getBranchById(id)
  },

  async createBranch(branchData: Omit<Branch, 'id' | 'createdAt' | 'employeeCount'>): Promise<Branch> {
    if (!useMock()) {
      try {
        const res = await apiClient.post<Branch>('/branches', branchData)
        appDataStore.addBranch(res)
        return res
      } catch (e) {
        console.warn('Backend API /branches failed, saving to local store failover:', e)
        const fallbackBranch: Branch = {
          ...branchData,
          id: `br-${Date.now().toString(36)}`,
          employeeCount: 0,
          createdAt: new Date().toISOString(),
        }
        return appDataStore.addBranch(fallbackBranch)
      }
    }
    await new Promise(r => setTimeout(r, 120))
    const newBranch: Branch = {
      ...branchData,
      id: `br-${Date.now().toString(36)}`,
      employeeCount: 0,
      createdAt: new Date().toISOString(),
    }
    return appDataStore.addBranch(newBranch)
  },

  async updateBranch(id: string, branchData: Partial<Branch>): Promise<Branch> {
    if (!useMock()) {
      try {
        const res = await apiClient.put<Branch>(`/branches/${id}`, branchData)
        appDataStore.updateBranch(res)
        return res
      } catch (e) {
        console.warn(`Backend API PUT /branches/${id} failed, updating local store:`, e)
      }
    }
    await new Promise(r => setTimeout(r, 100))
    const existing = appDataStore.getBranchById(id)
    if (!existing) throw new Error('Branch not found')
    const updated: Branch = { ...existing, ...branchData, id }
    return appDataStore.updateBranch(updated)
  },

  async deleteBranch(id: string): Promise<void> {
    if (!useMock()) {
      try {
        await apiClient.delete(`/branches/${id}`)
      } catch (e) {
        console.warn(`Backend API DELETE /branches/${id} failed, removing from local store:`, e)
      }
    }
    await new Promise(r => setTimeout(r, 80))
    appDataStore.deleteBranch(id)
  },
}
