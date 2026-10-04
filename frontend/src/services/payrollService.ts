import { appDataStore } from './storage'
import { apiClient } from './apiClient'
import { Payslip } from '@/types'

const useMock = () => import.meta.env.VITE_USE_MOCK_SERVICES !== 'false'

export const payrollService = {
  async getPayslips(tenantId: string, employeeId?: string): Promise<Payslip[]> {
    if (!useMock()) {
      return apiClient.get<Payslip[]>('/payroll/payslips', { params: { tenantId, employeeId } })
    }
    await new Promise(r => setTimeout(r, 120))
    return appDataStore.getPayslips(tenantId, employeeId)
  },

  async getPayslipById(id: string): Promise<Payslip | undefined> {
    if (!useMock()) {
      return apiClient.get<Payslip>(`/payroll/payslips/${id}`)
    }
    await new Promise(r => setTimeout(r, 80))
    return appDataStore.getPayslip(id)
  },

  async getLatestPayslip(tenantId: string, employeeId: string): Promise<Payslip | undefined> {
    const list = await this.getPayslips(tenantId, employeeId)
    return list[0]
  },

  async getDownloadUrl(payslipId: string): Promise<{ downloadUrl: string }> {
    if (!useMock()) {
      return apiClient.get<{ downloadUrl: string }>(`/payroll/payslips/${payslipId}/download-url`)
    }
    return { downloadUrl: '#' }
  },
}
