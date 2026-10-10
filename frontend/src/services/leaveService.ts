import { appDataStore } from './storage'
import { apiClient } from './apiClient'
import { LeaveBalance, LeaveRequest, LeaveType } from '@/types'

const useMock = () => import.meta.env.VITE_USE_MOCK_SERVICES !== 'false'

export const leaveService = {
  async getLeaveBalances(userId: string): Promise<LeaveBalance[]> {
    if (!useMock()) {
      return apiClient.get<LeaveBalance[]>('/leaves/balances', { params: { userId } })
    }
    await new Promise(r => setTimeout(r, 100))
    return appDataStore.getLeaveBalances(userId)
  },

  async getLeaveTypes(tenantId: string): Promise<LeaveType[]> {
    if (!useMock()) {
      return apiClient.get<LeaveType[]>('/leaves/types', { params: { tenantId } })
    }
    await new Promise(r => setTimeout(r, 80))
    return appDataStore.getTenants() ? appDataStore['leaveTypes'] : []
  },

  async getLeaveRequests(tenantId: string, employeeId?: string): Promise<LeaveRequest[]> {
    if (!useMock()) {
      return apiClient.get<LeaveRequest[]>('/leaves', { params: { tenantId, employeeId } })
    }
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
    leaveTypeCode: LeaveRequest['leaveTypeCode']
    startDate: string
    endDate: string
    requestedDays: number
    reason: string
    isEmergency?: boolean
    isUrgent?: boolean
    aiAnalysis?: LeaveRequest['aiAnalysis']
  }): Promise<LeaveRequest> {
    if (!useMock()) {
      return apiClient.post<LeaveRequest>('/leaves', data)
    }
    await new Promise(r => setTimeout(r, 250))
    return appDataStore.createLeaveRequest({
      ...data,
      isEmergency: !!data.isEmergency,
    })
  },

  async getLeavePlans(): Promise<any[]> {
    if (!useMock()) {
      return apiClient.get<any[]>('/leaves/plans')
    }
    await new Promise(r => setTimeout(r, 100))
    return appDataStore.getLeavePlans()
  },

  async createLeavePlan(data: { startDate: string; endDate: string; notes?: string; type?: string; leaveTypeCode?: string }): Promise<any> {
    if (!useMock()) {
      return apiClient.post<any>('/leaves/plans', data)
    }
    await new Promise(r => setTimeout(r, 150))
    return appDataStore.createLeavePlan(data)
  },

  async cancelLeavePlan(planId: string): Promise<any> {
    if (!useMock()) {
      await apiClient.delete(`/leaves/plans/${planId}`)
    }
    await new Promise(r => setTimeout(r, 150))
    return appDataStore.cancelLeavePlan(planId)
  },

  async triggerAutoCasualLeave(date?: string): Promise<any> {
    if (!useMock()) {
      return apiClient.post('/leaves/auto-casual-leave', { date })
    }
    await new Promise(r => setTimeout(r, 150))
    return true
  },

  async cancelLeave(requestId: string, employeeName: string): Promise<LeaveRequest | undefined> {
    if (!useMock()) {
      return apiClient.patch<LeaveRequest>(`/leaves/${requestId}/status`, {
        status: 'cancelled',
        actorName: employeeName,
        comment: 'Cancelled by employee',
      })
    }
    await new Promise(r => setTimeout(r, 150))
    return appDataStore.updateLeaveRequestStatus(requestId, 'cancelled', employeeName, 'Cancelled by employee')
  },

  async deleteLeave(requestId: string): Promise<boolean> {
    if (!useMock()) {
      await apiClient.delete(`/leaves/${requestId}`)
      return true
    }
    await new Promise(r => setTimeout(r, 150))
    return appDataStore.deleteLeaveRequest(requestId)
  },

  async submitComplaint(requestId: string, complaintNote: string): Promise<LeaveRequest | undefined> {
    if (!useMock()) {
      return apiClient.post<LeaveRequest>(`/leaves/${requestId}/complaint`, { complaintNote })
    }
    await new Promise(r => setTimeout(r, 200))
    return appDataStore.submitLeaveComplaint(requestId, complaintNote)
  },
}

