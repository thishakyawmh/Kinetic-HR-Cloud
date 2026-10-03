import { appDataStore } from './storage'
import { Payslip } from '@/types'

export const payrollService = {
  async getPayslips(tenantId: string, employeeId?: string): Promise<Payslip[]> {
    await new Promise(r => setTimeout(r, 120))
    return appDataStore.getPayslips(tenantId, employeeId)
  },

  async getPayslipById(id: string): Promise<Payslip | undefined> {
    await new Promise(r => setTimeout(r, 80))
    return appDataStore.getPayslip(id)
  },

  async getLatestPayslip(tenantId: string, employeeId: string): Promise<Payslip | undefined> {
    const list = await this.getPayslips(tenantId, employeeId)
    return list[0]
  },
}
