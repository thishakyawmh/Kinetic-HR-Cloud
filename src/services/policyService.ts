import { appDataStore } from './storage'
import { PolicyDocument } from '@/types'

export const policyService = {
  async getPolicies(tenantId: string, category?: string, search?: string): Promise<PolicyDocument[]> {
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
    await new Promise(r => setTimeout(r, 300))
    return appDataStore.addPolicy(data)
  },
}
