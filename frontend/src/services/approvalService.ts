import { appDataStore } from './storage'
import { LeaveRequest } from '@/types'

export const approvalService = {
  async getPendingApprovals(tenantId: string): Promise<LeaveRequest[]> {
    await new Promise(r => setTimeout(r, 100))
    return appDataStore.getLeaveRequests(tenantId).filter(r => r.status === 'pending')
  },

  async getAllApprovals(tenantId: string): Promise<LeaveRequest[]> {
    await new Promise(r => setTimeout(r, 100))
    return appDataStore.getLeaveRequests(tenantId)
  },

  async approveRequest(requestId: string, reviewerName: string, comment?: string): Promise<LeaveRequest | undefined> {
    await new Promise(r => setTimeout(r, 200))
    return appDataStore.updateLeaveRequestStatus(requestId, 'approved', reviewerName, comment)
  },

  async rejectRequest(requestId: string, reviewerName: string, reason: string): Promise<LeaveRequest | undefined> {
    await new Promise(r => setTimeout(r, 200))
    return appDataStore.updateLeaveRequestStatus(requestId, 'rejected', reviewerName, reason)
  },
}
