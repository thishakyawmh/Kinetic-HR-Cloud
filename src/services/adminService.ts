import { appDataStore } from './storage'
import { AuditEvent, IntegrationStatusItem, AIUsageMetrics } from '@/types'

export const adminService = {
  async getDashboardStats(tenantId: string) {
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
    await new Promise(r => setTimeout(r, 80))
    return appDataStore.getIntegrations()
  },

  async getAIUsageMetrics(): Promise<AIUsageMetrics> {
    await new Promise(r => setTimeout(r, 80))
    return appDataStore.getAIMetrics()
  },
}
