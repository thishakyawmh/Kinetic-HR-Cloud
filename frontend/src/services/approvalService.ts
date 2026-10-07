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

  async evaluateAIFairness(
    tenantId: string,
    department: string = 'Engineering',
    date: string = '2026-10-25',
    maxDailyQuota: number = 5,
    autoExecute: boolean = false
  ): Promise<any> {
    if (!useMock()) {
      return apiClient.post('/leaves/ai-evaluate', {
        tenantId,
        department,
        date,
        maxDailyQuota,
        autoExecute,
      })
    }
    await new Promise(r => setTimeout(r, 300))
    const requests = appDataStore.getLeaveRequests(tenantId).filter(
      r => r.startDate <= date && r.endDate >= date && (!department || r.department === department)
    )

    const evaluated = requests.map(req => {
      const priorCount = req.priorLeavesCount ?? (req.employeeId === 'user-Alice' ? 8 : 4)
      const isEmergency = req.isEmergency || /medical|emergency|urgent|hospital|dental|child/i.test(req.reason || '')
      const isFirstTime = priorCount === 0

      let score = 70 - priorCount * 4 + (isEmergency ? 25 : 0) + (isFirstTime ? 35 : 0)
      score = Math.max(15, Math.min(99, score))

      return {
        ...req,
        aiScore: score,
        isFirstTime,
        priorLeavesCount: priorCount,
      }
    })

    evaluated.sort((a, b) => b.aiScore - a.aiScore)

    const results = evaluated.map((req, index) => {
      const isApproved = index < maxDailyQuota
      const rank = index + 1
      let rationale = ''
      if (req.isFirstTime) {
        rationale = `🌟 TOP AI PRIORITY (Rank #${rank}): Employee has 0 prior leaves (100% attendance). Autonomous AI elevated 8th applicant into Top 5 Approved List!`
      } else if (isApproved) {
        rationale = `✅ APPROVED BY AI (Rank #${rank}): Prior leaves (${req.priorLeavesCount}) within fairness limit under 5-person daily quota.`
      } else {
        rationale = `⚠️ DEFERRED BY AI (Rank #${rank}): Exceeds 5-person daily quota limit. High prior leave count (${req.priorLeavesCount} days) re-allocated priority.`
      }

      if (autoExecute) {
        appDataStore.updateLeaveRequestStatus(
          req.id,
          isApproved ? 'approved' : 'rejected',
          'Kinetic AI Autonomous Engine',
          rationale
        )
      }

      return {
        ...req,
        aiRecommendation: isApproved ? 'approved' : 'rejected',
        aiRank: rank,
        aiRationale: rationale,
      }
    })

    return {
      department,
      targetDate: date,
      totalRequests: evaluated.length,
      maxDailyQuota,
      approvedCount: Math.min(evaluated.length, maxDailyQuota),
      rejectedCount: Math.max(0, evaluated.length - maxDailyQuota),
      evaluations: results,
    }
  },
}
