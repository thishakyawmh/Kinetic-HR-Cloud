import { queryTenantItems } from '../config/cosmos'
import { callAzureOpenAIChat, getOpenAIConfig } from '../config/openai'

export interface LeaveConflictCandidate {
  id: string
  employeeId: string
  employeeName: string
  department: string
  startDate: string
  endDate: string
  reason: string
  leaveTypeName: string
  leaveTypeCode: string
  isEmergency?: boolean
  submittedAt?: string
  createdAt?: string
  priorLeavesCount?: number
}

export interface AIEvaluationResult {
  candidateId: string
  employeeId: string
  employeeName: string
  aiScore: number // 0 - 100
  aiRank: number
  isFirstTimeApplicant: boolean
  historicalAbsencesCount: number
  urgencyLevel: 'Critical Emergency' | 'Medical / High' | 'Personal Milestone' | 'Routine'
  aiRecommendation: 'approved' | 'rejected'
  aiRationale: string
}

export interface AIConflictArbitrationReport {
  department: string
  conflictDate: string
  totalRequestsCount: number
  allowedCapacityLimit: number
  approvedCount: number
  rejectedCount: number
  evaluatedAt: string
  aiEngineMode: 'OpenAI/Azure OpenAI LLM' | 'Kinetic Autonomous NLP & Audit Log Engine'
  summaryText: string
  evaluations: AIEvaluationResult[]
}

/**
 * Kinetic Autonomous AI Engine: Arbitrates leave conflicts based on actual database logs,
 * historical leave frequency, reason urgency analysis, and departmental SLA thresholds.
 */
export async function arbitrateLeaveConflict(
  tenantId: string,
  department: string,
  conflictDate: string,
  allowedCapacityLimit: number = 5
): Promise<AIConflictArbitrationReport> {
  const allLeaves = await queryTenantItems<any>(
    'leaves',
    tenantId,
    'SELECT * FROM c WHERE c.tenantId = @tenantId',
    [{ name: '@tenantId', value: tenantId }]
  )

  const conflictingRequests: LeaveConflictCandidate[] = allLeaves.filter(
    l => l.startDate <= conflictDate && l.endDate >= conflictDate && (!department || l.department === department) && l.status === 'pending'
  )

  const candidatesToEvaluate = conflictingRequests.length > 0
    ? conflictingRequests
    : allLeaves.filter(l => (!department || l.department === department) && l.status === 'pending')

  const evaluatedCandidates: AIEvaluationResult[] = []

  for (const candidate of candidatesToEvaluate) {
    const employeePastApprovedLeaves = allLeaves.filter(
      l => l.employeeId === candidate.employeeId && l.status === 'approved' && l.id !== candidate.id
    )

    const historicalAbsencesCount = candidate.priorLeavesCount ?? employeePastApprovedLeaves.reduce((acc, curr) => acc + (curr.requestedDays || 1), 0)

    const reasonText = (candidate.reason || '').toLowerCase()
    let urgencyLevel: AIEvaluationResult['urgencyLevel'] = 'Routine'
    let urgencyWeight = 10

    if (/emergency|urgent|hospital|surgery|doctor|illness|child|family crisis|medical/i.test(reasonText) || candidate.isEmergency) {
      urgencyLevel = 'Critical Emergency'
      urgencyWeight = 35
    } else if (/appointment|dental|treatment|legal|court|exam/i.test(reasonText)) {
      urgencyLevel = 'Medical / High'
      urgencyWeight = 25
    } else if (/wedding|birthday|graduation|anniversary|bereavement/i.test(reasonText)) {
      urgencyLevel = 'Personal Milestone'
      urgencyWeight = 18
    }

    const isFirstTime = historicalAbsencesCount === 0
    const firstTimeBonus = isFirstTime ? 35 : 0
    const frequencyPenalty = historicalAbsencesCount * 4

    const rawScore = 65 + urgencyWeight + firstTimeBonus - frequencyPenalty
    const aiScore = Math.max(10, Math.min(99, Math.round(rawScore)))

    evaluatedCandidates.push({
      candidateId: candidate.id,
      employeeId: candidate.employeeId,
      employeeName: candidate.employeeName,
      aiScore,
      aiRank: 0,
      isFirstTimeApplicant: isFirstTime,
      historicalAbsencesCount,
      urgencyLevel,
      aiRecommendation: 'rejected',
      aiRationale: '',
    })
  }

  evaluatedCandidates.sort((a, b) => b.aiScore - a.aiScore)

  const capacityLimit = Math.max(1, Number(allowedCapacityLimit) || 5)
  const aiConfig = getOpenAIConfig()
  let engineMode: 'OpenAI/Azure OpenAI LLM' | 'Kinetic Autonomous NLP & Audit Log Engine' = 'Kinetic Autonomous NLP & Audit Log Engine'
  let llmSummary: string | undefined

  if (aiConfig.isConfigured) {
    try {
      const llmResult = await callAzureOpenAIChat([
        {
          role: 'system',
          content: 'You are Kinetic HR Autonomous AI. Arbitrate department leave conflicts based on attendance integrity, urgency, and capacity limits. Provide concise reasoning for your evaluations.',
        },
        {
          role: 'user',
          content: `Arbitrate leaves for ${department} on ${conflictDate}. Capacity limit: ${capacityLimit}. Candidates: ${JSON.stringify(evaluatedCandidates.map(c => ({ name: c.employeeName, score: c.aiScore, urgency: c.urgencyLevel })))}`,
        },
      ], { maxTokens: 400 })

      if (llmResult.content) {
        engineMode = 'OpenAI/Azure OpenAI LLM'
        llmSummary = llmResult.content.trim()
      }
    } catch (e) {
      console.warn('Live LLM request skipped, falling back to Kinetic Autonomous NLP & Rule Engine:', e)
    }
  }

  evaluatedCandidates.forEach((cand, idx) => {
    cand.aiRank = idx + 1
    const isApproved = idx < capacityLimit
    cand.aiRecommendation = isApproved ? 'approved' : 'rejected'

    if (cand.isFirstTimeApplicant) {
      cand.aiRationale = `TOP AI PRIORITY (Rank #${cand.aiRank}): Employee has 0 recorded absences in database history (100% attendance). Elevated over frequent applicants in conflict arbitration.`
    } else if (isApproved) {
      cand.aiRationale = `APPROVED BY AI (Rank #${cand.aiRank}): Reason urgency (${cand.urgencyLevel}) and low leave frequency (${cand.historicalAbsencesCount} prior days) qualify within the ${capacityLimit}-person daily department limit.`
    } else {
      cand.aiRationale = `DEFERRED BY AI (Rank #${cand.aiRank}): Exceeds ${capacityLimit}-person daily department limit. High prior absence frequency (${cand.historicalAbsencesCount} days taken) re-allocated priority to first-time/emergency applicants.`
    }
  })

  const topApplicant = evaluatedCandidates[0]
  const summaryText = llmSummary
    ? llmSummary
    : topApplicant
    ? `Kinetic AI evaluated ${evaluatedCandidates.length} conflicting leave requests for ${department} on ${conflictDate} using ${engineMode}. Top priority granted to ${topApplicant.employeeName} (AI Score: ${topApplicant.aiScore}%) based on historical attendance integrity and request urgency.`
    : `No conflicting pending leave requests evaluated.`

  return {
    department,
    conflictDate,
    totalRequestsCount: evaluatedCandidates.length,
    allowedCapacityLimit: capacityLimit,
    approvedCount: Math.min(evaluatedCandidates.length, capacityLimit),
    rejectedCount: Math.max(0, evaluatedCandidates.length - capacityLimit),
    evaluatedAt: new Date().toISOString(),
    aiEngineMode: engineMode,
    summaryText,
    evaluations: evaluatedCandidates,
  }
}
