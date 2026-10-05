import { appDataStore } from './storage'
import { apiClient } from './apiClient'
import { LeaveRequest } from '@/types'

const useMock = () => import.meta.env.VITE_USE_MOCK_SERVICES !== 'false'

export const approvalService = {
  async getPendingApprovals(tenantId: string): Promise<LeaveRequest[]> {
    if (!useMock()) {
      const all = await apiClient.get<LeaveRequest[]>('/leaves', { params: { tenantId } })
      return (all || []).filter(r => r.status === 'pending')
    }
    await new Promise(r => setTimeout(r, 100))
    return appDataStore.getLeaveRequests(tenantId).filter(r => r.status === 'pending')
  },

  async getAllApprovals(tenantId: string): Promise<LeaveRequest[]> {
    if (!useMock()) {
      return apiClient.get<LeaveRequest[]>('/leaves', { params: { tenantId } })
    }
    await new Promise(r => setTimeout(r, 100))
    return appDataStore.getLeaveRequests(tenantId)
  },

  async approveRequest(requestId: string, reviewerName: string, comment?: string): Promise<LeaveRequest | undefined> {
    if (!useMock()) {
      return apiClient.patch<LeaveRequest>(`/leaves/${requestId}/status`, {
        status: 'approved',
        actorName: reviewerName,
        comment: comment || 'Approved by reviewer',
      })
    }
    await new Promise(r => setTimeout(r, 200))
    return appDataStore.updateLeaveRequestStatus(requestId, 'approved', reviewerName, comment)
  },

  async rejectRequest(requestId: string, reviewerName: string, reason: string): Promise<LeaveRequest | undefined> {
    if (!useMock()) {
      return apiClient.patch<LeaveRequest>(`/leaves/${requestId}/status`, {
        status: 'rejected',
        actorName: reviewerName,
        comment: reason || 'Request rejected by reviewer',
      })
    }
    await new Promise(r => setTimeout(r, 200))
    return appDataStore.updateLeaveRequestStatus(requestId, 'rejected', reviewerName, reason)
  },
}
