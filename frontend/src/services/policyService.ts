import { appDataStore } from './storage'
import { apiClient } from './apiClient'
import { PolicyDocument } from '@/types'

const useMock = () => import.meta.env.VITE_USE_MOCK_SERVICES !== 'false'

export const policyService = {
  async getPolicies(tenantId: string, category?: string, search?: string): Promise<PolicyDocument[]> {
    if (!useMock()) {
      return apiClient.get<PolicyDocument[]>('/policies', { params: { tenantId, category, search } })
    }
    await new Promise(r => setTimeout(r, 100))
    let list = appDataStore.getPolicies(tenantId)
    if (category && category !== 'all') {
      list = list.filter(p => p.category === category)
    }
    if (search && search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.keyTerms.some(k => k.toLowerCase().includes(q))
      )
    }
    return list
  },

  async getPolicyById(id: string): Promise<PolicyDocument | undefined> {
    if (!useMock()) {
      return apiClient.get<PolicyDocument>(`/policies/${id}`)
    }
    await new Promise(r => setTimeout(r, 60))
    return appDataStore.getPolicy(id)
  },

  async uploadPolicy(data: {
    tenantId: string
    title: string
    category: PolicyDocument['category']
    version: string
    fileSize: string
    summary: string
    keyTerms: string[]
    contentExcerpt?: string
  }): Promise<PolicyDocument> {
    if (!useMock()) {
      return apiClient.post<PolicyDocument>('/policies', data)
    }
    await new Promise(r => setTimeout(r, 300))
    return appDataStore.addPolicy(data)
  },
}
