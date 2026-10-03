import { appDataStore } from './storage'
import { LeaveBalance, LeaveRequest, LeaveType } from '@/types'

export const leaveService = {
  async getLeaveBalances(userId: string): Promise<LeaveBalance[]> {
    await new Promise(r => setTimeout(r, 100))
    return appDataStore.getLeaveBalances(userId)
  },

  async getLeaveTypes(tenantId: string): Promise<LeaveType[]> {
    await new Promise(r => setTimeout(r, 80))
    return appDataStore.getTenants() ? appDataStore['leaveTypes'] : []
  },

  async getLeaveRequests(tenantId: string, employeeId?: string): Promise<LeaveRequest[]> {
    await new Promise(r => setTimeout(r, 120))
    return appDataStore.getLeaveRequests(tenantId, employeeId)
  },

  async applyLeave(data: {
    tenantId: string
    employeeId: string
    employeeName: string
    department: string
    leaveTypeId: string
    leaveTypeName: string
    leaveTypeCode: 'annual' | 'sick' | 'casual' | 'emergency' | 'other'
    startDate: string
    endDate: string
    requestedDays: number
    reason: string
    isEmergency?: boolean
    aiAnalysis?: LeaveRequest['aiAnalysis']
  }): Promise<LeaveRequest> {
    await new Promise(r => setTimeout(r, 250))
    return appDataStore.createLeaveRequest({
      ...data,
      isEmergency: !!data.isEmergency,
    })
  },

  async cancelLeave(requestId: string, employeeName: string): Promise<LeaveRequest | undefined> {
    await new Promise(r => setTimeout(r, 150))
    return appDataStore.updateLeaveRequestStatus(requestId, 'cancelled', employeeName, 'Cancelled by employee')
  },

  async deleteLeave(requestId: string): Promise<boolean> {
    await new Promise(r => setTimeout(r, 150))
    return appDataStore.deleteLeaveRequest(requestId)
  },
}
