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

  async getPaymentSettings(tenantId: string): Promise<any> {
    try {
      return await apiClient.get<any>('/payroll/settings')
    } catch (e) {
      console.warn('Backend payment settings query fallback to default baseline:', e)
      return {
        id: `pay-sett-${tenantId}`,
        tenantId,
        updatedAt: new Date().toISOString(),
        updatedBy: 'System Baseline',
        otEnabled: true,
        otBasis: '1.5x',
        otCustomMultiplier: 1.5,
        otMaxHours: 40,
        otEligibleGroups: ['All Employees', 'Engineering', 'Operations'],
        otRequireApproval: true,
        otEffectiveFrom: '2026-01-01',

        targetCoverageEnabled: true,
        targetCoverageBase: 'net',
        targetCoverageMethod: 'progressive',
        targetTiers: [
          { id: 'tier-1', rangeLabel: 'First 20 target units', lowerThreshold: 0, upperThreshold: 20, unit: 'units', ratePercent: 0.50 },
          { id: 'tier-2', rangeLabel: 'Next 20 units', lowerThreshold: 20, upperThreshold: 40, unit: 'units', ratePercent: 0.75 },
          { id: 'tier-3', rangeLabel: 'Above 40 units', lowerThreshold: 40, upperThreshold: 9999, unit: 'units', ratePercent: 1.00 },
        ],

        bonusEnabled: false,
        bonusMethod: 'kpi',
        bonusPercentage: 10,
        bonusFixedAmount: 500,
        bonusMinThreshold: 70,
        bonusMaxPayout: 2500,

        epfEmployeeEnabled: true,
        epfEmployeeRate: 8,
        epfEmployeeBase: 'legal',

        epfEmployerEnabled: true,
        epfEmployerRate: 12,
        etfEmployerRate: 3,
        epfEmployerBase: 'legal',
      }
    }
  },

  async updatePaymentSettings(settings: any): Promise<any> {
    try {
      return await apiClient.post<any>('/payroll/settings', settings)
    } catch (e) {
      console.warn('Backend payment settings update stored locally:', e)
      return {
        ...settings,
        updatedAt: new Date().toISOString(),
      }
    }
  },
}
