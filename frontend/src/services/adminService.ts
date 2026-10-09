import { appDataStore } from './storage'
import { apiClient } from './apiClient'
import { AuditEvent, IntegrationStatusItem, AIUsageMetrics } from '@/types'

const useMock = () => import.meta.env.VITE_USE_MOCK_SERVICES !== 'false'

export const adminService = {
  async getDashboardStats(tenantId: string) {
    if (!useMock()) {
      return apiClient.get<{
        totalEmployees: number
        activeEmployees: number
        pendingRequests: number
        activePolicies: number
        aiRequestsToday: number
        systemHealth: string
      }>('/admin/stats', { params: { tenantId } })
    }
    await new Promise(r => setTimeout(r, 120))
    const employees = appDataStore.getUsers(tenantId)
    const leaves = appDataStore.getLeaveRequests(tenantId)
    const policies = appDataStore.getPolicies(tenantId)
    const metrics = appDataStore.getAIMetrics()

    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.role !== 'admin').length,
      pendingRequests: leaves.filter(l => l.status === 'pending').length,
      activePolicies: policies.length,
      aiRequestsToday: metrics.totalRequestsToday,
      systemHealth: 'Optimal (99.98% SLA)',
    }
  },

  async getAuditLogs(tenantId: string, filterAction?: string, filterRisk?: string): Promise<AuditEvent[]> {
    if (!useMock()) {
      return apiClient.get<AuditEvent[]>('/admin/audit-logs', {
        params: { tenantId, filterAction, filterRisk },
      })
    }
    await new Promise(r => setTimeout(r, 100))
    let logs = appDataStore.getAuditLogs(tenantId)
    if (filterAction && filterAction !== 'all') {
      logs = logs.filter(l => l.action.toLowerCase().includes(filterAction.toLowerCase()))
    }
    if (filterRisk && filterRisk !== 'all') {
      logs = logs.filter(l => l.riskLevel.toLowerCase() === filterRisk.toLowerCase())
    }
    return logs
  },

  async getIntegrations(): Promise<IntegrationStatusItem[]> {
    if (!useMock()) {
      return apiClient.get<IntegrationStatusItem[]>('/admin/integrations')
    }
    await new Promise(r => setTimeout(r, 80))
    return appDataStore.getIntegrations()
  },

  async getAIUsageMetrics(): Promise<AIUsageMetrics> {
    if (!useMock()) {
      return apiClient.get<AIUsageMetrics>('/admin/ai-usage')
    }
    await new Promise(r => setTimeout(r, 80))
    return appDataStore.getAIMetrics()
  },
}
