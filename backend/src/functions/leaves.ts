import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { queryTenantItems, getTenantContainer } from '../config/cosmos'
import { authenticateRequest } from '../middleware/auth'
import { arbitrateLeaveConflict } from '../services/aiEngine'
import {
  VALID_LEAVE_STATUSES,
  LEAVE_TYPE_META,
  getDefaultLeaveTypes,
  datesOverlap,
  isValidIsoDate,
  calculateWorkingDays,
  getOrCreateUserLeaveBalances,
  adjustLeaveBalanceOnStatusChange,
  recalculateBalanceFromPlans,
  findAvailableBackupCandidate,
  processPendingAIApprovals,
  resolvePlanLeaveCode,
} from '../services/leaveService'

export { calculateWorkingDays }

/**
 * GET /api/leaves/balances
 * Retrieves authoritative leave balances for user
 */
export async function getLeaveBalances(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const requestedUserId = request.query.get('userId')
  if (requestedUserId && requestedUserId !== auth.user!.id && auth.user!.role === 'employee') {
    return { status: 403, jsonBody: { error: 'Forbidden: cannot access another employee leave balance' } }
  }
  const targetUserId = requestedUserId || auth.user!.id
  const tenantId = auth.user!.tenantId

  try {
    const balances = await getOrCreateUserLeaveBalances(tenantId, targetUserId)
    return { status: 200, jsonBody: balances }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * GET /api/leaves
 * Retrieves leave requests for a tenant and optional employee (read-only)
 */
export async function getLeaveRequests(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const employeeId = request.query.get('employeeId')

  try {
    let query = 'SELECT * FROM c WHERE c.tenantId = @tenantId'
    const params: Array<{ name: string; value: any }> = [{ name: '@tenantId', value: tenantId }]

    if (employeeId) {
      query += ' AND c.employeeId = @employeeId'
      params.push({ name: '@employeeId', value: employeeId })
    }

    query += ' ORDER BY c.createdAt DESC'

    const requests = await queryTenantItems<any>('leaves', tenantId, query, params)
    return { status: 200, jsonBody: requests }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * POST /api/leaves/process-pending
 * Explicitly triggers pending AI arbitration approvals for a tenant
 */
export async function processPendingLeaves(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request, 'manager')
  if (auth.errorResponse) return auth.errorResponse

  try {
    const processedCount = await processPendingAIApprovals(auth.user!.tenantId)
    return { status: 200, jsonBody: { success: true, processedCount } }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * POST /api/leaves
 * Submits a new leave application with active duty handover conflict checks and balance accounting
 */
export async function createLeaveRequest(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const userId = auth.user!.id
  const userName = auth.user!.name

  try {
    const body = (await request.json()) as any
    const { startDate, endDate } = body || {}
    if (!isValidIsoDate(startDate) || !isValidIsoDate(endDate) || endDate < startDate) {
      return {
        status: 400,
        jsonBody: { error: 'Valid startDate and endDate (YYYY-MM-DD, endDate >= startDate) are required.' },
      }
    }

    const leaveTypeCode = (body.leaveTypeCode || 'annual').toLowerCase()
    const isUrgent = !!body.isUrgent
    const requestedDaysNum = body.requestedDays ? Number(body.requestedDays) : calculateWorkingDays(startDate, endDate)

    const activePlans = await queryTenantItems<any>(
      'leave_plans',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.assignedBackupId = @userId AND c.status != "cancelled"',
      [
        { name: '@tenantId', value: tenantId },
        { name: '@userId', value: userId },
      ]
    )

    const conflictingHandover = activePlans.find(p => datesOverlap(p.startDate, p.endDate, startDate, endDate))

    if (conflictingHandover && !isUrgent) {
      return {
        status: 409,
        jsonBody: {
          error: 'ACTIVE_DUTY_HANDOVER_CONFLICT',
          message: `Active Duty Handover Conflict: Scheduled to cover ${conflictingHandover.employeeName} from ${conflictingHandover.startDate} to ${conflictingHandover.endDate}`,
          coveringForName: conflictingHandover.employeeName,
          coveringForId: conflictingHandover.employeeId,
          startDate: conflictingHandover.startDate,
          endDate: conflictingHandover.endDate,
          responsibility: `${conflictingHandover.employeeRole || 'Operational'} Duty Coverage & Handoff`,
        },
      }
    }

    const balances = await queryTenantItems<any>(
      'leave_balances',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.userId = @userId AND (c.code = @code OR c.leaveType = @code)',
      [
        { name: '@tenantId', value: tenantId },
        { name: '@userId', value: userId },
        { name: '@code', value: leaveTypeCode },
      ]
    )

    const defaultAllowance = LEAVE_TYPE_META[leaveTypeCode]?.defaultAllowance ?? 10
    const currentBal = balances[0] || {
      id: `bal-${userId}-${leaveTypeCode}`,
      tenantId,
      userId,
      code: leaveTypeCode,
      leaveType: leaveTypeCode,
      totalAllowance: defaultAllowance,
      used: 0,
      pending: 0,
      remaining: defaultAllowance,
    }

    const available = Number(
      currentBal.remaining !== undefined
        ? currentBal.remaining
        : currentBal.totalAllowance - currentBal.used - (currentBal.pending || 0)
    )

    if (available < requestedDaysNum && leaveTypeCode !== 'unpaid') {
      return {
        status: 400,
        jsonBody: {
          error: `Insufficient ${leaveTypeCode} leave balance. Available: ${available} days, Requested: ${requestedDaysNum} days.`,
        },
      }
    }

    let reassignmentSummary = ''
    if (conflictingHandover && isUrgent) {
      const [allUsers, candidateLeaves] = await Promise.all([
        queryTenantItems<any>('users', tenantId, 'SELECT * FROM c WHERE c.tenantId = @tenantId', [
          { name: '@tenantId', value: tenantId },
        ]),
        queryTenantItems<any>(
          'leaves',
          tenantId,
          'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.status IN ("approved", "pending")',
          [{ name: '@tenantId', value: tenantId }]
        ),
      ])

      const reqRole = conflictingHandover.employeeRole || auth.user!.jobTitle || 'Staff Member'
      const reqDept = conflictingHandover.department || auth.user!.department || 'Operations'

      const selectedReplacement = findAvailableBackupCandidate({
        applicantId: userId,
        excludeId: conflictingHandover.employeeId,
        role: reqRole,
        department: reqDept,
        startDate: conflictingHandover.startDate,
        endDate: conflictingHandover.endDate,
        allUsers,
        allLeaves: candidateLeaves,
        allPlans: activePlans,
      })

      const planContainer = getTenantContainer('leave_plans')
      if (selectedReplacement) {
        conflictingHandover.status = 'Reassigned'
        conflictingHandover.assignedBackupId = selectedReplacement.id
        conflictingHandover.assignedBackupName = selectedReplacement.name
        conflictingHandover.assignedBackupRole = selectedReplacement.jobTitle || reqRole
        conflictingHandover.reassignedFrom = userName
        conflictingHandover.notes = `Reassigned from ${userName} to ${selectedReplacement.name} due to urgent leave request.`
        conflictingHandover.updatedAt = new Date().toISOString()
        await planContainer.items.upsert(conflictingHandover)

        reassignmentSummary = `Responsibility for ${conflictingHandover.employeeName} successfully reassigned to ${selectedReplacement.name} (${selectedReplacement.jobTitle || reqRole}).`
      } else {
        conflictingHandover.status = 'Coverage Needed'
        conflictingHandover.assignedBackupId = ''
        conflictingHandover.assignedBackupName = 'Coverage Needed — Manager Action Required'
        conflictingHandover.notes = `Flagged: Coverage Needed — Urgent leave filed by ${userName}, no available same-role backup.`
        conflictingHandover.updatedAt = new Date().toISOString()
        await planContainer.items.upsert(conflictingHandover)

        if (auth.user!.managerId) {
          try {
            await getTenantContainer('notifications').items.create({
              id: `notif-esc-${Date.now()}`,
              tenantId,
              recipientId: auth.user!.managerId,
              title: 'Coverage Gap Escalation Required',
              message: `Urgent leave submitted by ${userName} created a coverage gap for ${conflictingHandover.employeeName}. Manager action required.`,
              read: false,
              createdAt: new Date().toISOString(),
            })
          } catch (err: any) {
            console.warn(`[Leaves] Escalation notification failed: ${err?.message || err}`)
          }
        }

        reassignmentSummary = 'No available same-role backup found. Handover flagged as "Coverage Needed — Manager Action Required" and escalated to manager.'
      }
    }

    const leaveId = `leave-${Date.now()}`
    const nowIso = new Date().toISOString()
    const newRequest = {
      id: leaveId,
      tenantId,
      employeeId: userId,
      employeeName: userName,
      department: body.department || auth.user!.department || 'Operations',
      leaveTypeId: body.leaveTypeId || `lt-${leaveTypeCode}`,
      leaveTypeName: body.leaveTypeName || LEAVE_TYPE_META[leaveTypeCode]?.name || 'Leave',
      leaveTypeCode,
      startDate,
      endDate,
      requestedDays: requestedDaysNum,
      reason: body.reason || '',
      isUrgent,
      status: 'pending',
      autoApproved: false,
      reassignmentSummary: reassignmentSummary || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
      timeline: [
        {
          id: `tl-${Date.now()}-1`,
          action: isUrgent ? 'submitted_urgent' : 'submitted',
          actorName: userName,
          timestamp: nowIso,
          comment: isUrgent ? `Urgent leave submitted: ${body.reason || ''}` : 'Leave request submitted',
        },
        ...(reassignmentSummary
          ? [
              {
                id: `tl-${Date.now()}-2`,
                action: 'reassignment_triggered',
                actorName: 'Kinetic Reassignment Engine',
                timestamp: nowIso,
                comment: reassignmentSummary,
              },
            ]
          : []),
      ],
    }

    const { resource } = await getTenantContainer('leaves').items.create(newRequest)

    currentBal.pending = (currentBal.pending || 0) + requestedDaysNum
    currentBal.remaining = Math.max(0, (currentBal.totalAllowance || 20) - (currentBal.used || 0) - currentBal.pending)
    currentBal.updatedAt = nowIso
    await getTenantContainer('leave_balances').items.upsert(currentBal)

    return { status: 201, jsonBody: resource }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * PATCH /api/leaves/{id}/status
 * Updates status and adjusts authoritative leave balances accordingly
 */
export async function updateLeaveStatus(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const leaveId = request.params.id
  if (!leaveId) {
    return { status: 400, jsonBody: { error: 'Leave ID is required in URL parameter' } }
  }

  try {
    const body = (await request.json()) as { status?: string; comment?: string; actorName?: string }
    const newStatus = body?.status
    if (!newStatus || !VALID_LEAVE_STATUSES.includes(newStatus as any)) {
      return {
        status: 400,
        jsonBody: { error: `Invalid leave status. Allowed: ${VALID_LEAVE_STATUSES.join(', ')}` },
      }
    }

    const container = getTenantContainer('leaves')
    const { resource: currentLeave } = await container.item(leaveId, tenantId).read()
    if (!currentLeave) {
      return { status: 404, jsonBody: { error: `Leave request "${leaveId}" not found` } }
    }

    if (auth.user!.role === 'employee') {
      if (currentLeave.employeeId !== auth.user!.id || newStatus !== 'cancelled') {
        return { status: 403, jsonBody: { error: 'Forbidden: employees may only cancel their own leave requests' } }
      }
    }

    const prevStatus = currentLeave.status
    const requestedDays = currentLeave.requestedDays || 1

    currentLeave.status = newStatus
    currentLeave.updatedAt = new Date().toISOString()
    currentLeave.timeline = currentLeave.timeline || []
    currentLeave.timeline.push({
      id: `tl-${Date.now()}`,
      action: newStatus,
      actorName: body.actorName || auth.user!.name,
      timestamp: currentLeave.updatedAt,
      comment: body.comment || `Status updated to ${newStatus}`,
    })

    const { resource: updated } = await container.item(leaveId, tenantId).replace(currentLeave)

    try {
      await adjustLeaveBalanceOnStatusChange(
        tenantId,
        currentLeave.employeeId,
        currentLeave.leaveTypeCode || 'annual',
        prevStatus,
        newStatus,
        requestedDays
      )
    } catch (balErr) {
      console.warn('Could not update leave balance on status change:', balErr)
    }

    return { status: 200, jsonBody: updated }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * DELETE /api/leaves/{id}
 * Deletes a leave request and restores authoritative leave balances
 */
export async function deleteLeaveRequest(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const leaveId = request.params.id
  if (!leaveId) {
    return { status: 400, jsonBody: { error: 'Leave ID is required' } }
  }

  try {
    const container = getTenantContainer('leaves')
    const { resource: currentLeave } = await container.item(leaveId, tenantId).read().catch(() => ({ resource: null }))

    if (currentLeave) {
      if (auth.user!.role === 'employee' && currentLeave.employeeId !== auth.user!.id) {
        return { status: 403, jsonBody: { error: 'Forbidden: cannot delete another employee leave request' } }
      }

      const prevStatus = currentLeave.status
      const requestedDays = currentLeave.requestedDays || 1

      await container.item(leaveId, tenantId).delete()

      try {
        await adjustLeaveBalanceOnStatusChange(
          tenantId,
          currentLeave.employeeId,
          currentLeave.leaveTypeCode || 'annual',
          prevStatus,
          null,
          requestedDays
        )
      } catch (balErr) {
        console.warn('Could not update balance on deletion:', balErr)
      }
    }

    return { status: 200, jsonBody: { success: true, message: 'Leave request deleted successfully' } }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * GET /api/leaves/types
 * Retrieves active leave policies and types for tenant
 */
export async function getLeaveTypes(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  return { status: 200, jsonBody: getDefaultLeaveTypes(auth.user!.tenantId) }
}

/**
 * POST /api/leaves/ai-evaluate
 * Evaluates department leave requests under a daily max quota using AI
 */
export async function evaluateAIFairnessLeaves(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request, 'manager')
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId

  try {
    const body = (await request.json().catch(() => ({}))) as any
    const targetDate = body?.date || new Date().toISOString().split('T')[0]
    const department = body?.department || auth.user!.department || 'Operations'
    const maxDailyQuota = Math.max(1, Number(body?.maxDailyQuota || 5))

    const report = await arbitrateLeaveConflict(tenantId, department, targetDate, maxDailyQuota)

    if (body?.autoExecute && report.evaluations.length > 0) {
      const container = getTenantContainer('leaves')
      for (const item of report.evaluations) {
        try {
          const { resource: current } = await container.item(item.candidateId, tenantId).read()
          if (current) {
            const prevStatus = current.status
            current.status = item.aiRecommendation
            current.updatedAt = new Date().toISOString()
            current.timeline = current.timeline || []
            current.timeline.push({
              id: `tl-ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              action: `ai_${item.aiRecommendation}`,
              actorName: 'Kinetic Autonomous AI Engine',
              timestamp: current.updatedAt,
              comment: item.aiRationale,
            })
            await container.item(item.candidateId, tenantId).replace(current)

            await adjustLeaveBalanceOnStatusChange(
              tenantId,
              current.employeeId,
              current.leaveTypeCode || 'annual',
              prevStatus,
              current.status,
              current.requestedDays || 1
            )
          }
        } catch (err) {
          console.warn(`Could not update leave item ${item.candidateId}:`, err)
        }
      }
    }

    return {
      status: 200,
      jsonBody: {
        ...report,
        targetDate: report.conflictDate,
        maxDailyQuota: report.allowedCapacityLimit,
      },
    }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * GET /api/leaves/plans
 * Retrieves team annual leave plans and duty handoffs from database
 */
export async function getLeavePlans(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  try {
    const plans = await queryTenantItems<any>(
      'leave_plans',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.status != "cancelled"',
      [{ name: '@tenantId', value: tenantId }]
    )

    return { status: 200, jsonBody: plans || [] }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * POST /api/leaves/plans
 * Schedules an annual leave plan and calculates non-conflicting same-role backup duty handoff
 */
export async function createLeavePlan(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const userId = auth.user!.id
  const userName = auth.user!.name
  const userRole = auth.user!.jobTitle || 'Staff Member'
  const userDept = auth.user!.department || 'Operations'

  try {
    const body = (await request.json()) as {
      startDate?: string
      endDate?: string
      notes?: string
      type?: string
      leaveTypeCode?: string
    }

    const { startDate, endDate } = body || {}
    if (!isValidIsoDate(startDate) || !isValidIsoDate(endDate) || endDate < startDate) {
      return {
        status: 400,
        jsonBody: { error: 'Valid startDate and endDate (YYYY-MM-DD, endDate >= startDate) are required.' },
      }
    }

    const daysCount = calculateWorkingDays(startDate, endDate)

    const [allUsers, allLeaves, allPlans] = await Promise.all([
      queryTenantItems<any>('users', tenantId, 'SELECT * FROM c WHERE c.tenantId = @tenantId', [
        { name: '@tenantId', value: tenantId },
      ]),
      queryTenantItems<any>(
        'leaves',
        tenantId,
        'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.status IN ("approved", "pending")',
        [{ name: '@tenantId', value: tenantId }]
      ),
      queryTenantItems<any>(
        'leave_plans',
        tenantId,
        'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.status != "cancelled"',
        [{ name: '@tenantId', value: tenantId }]
      ),
    ])

    const eligibleBackup = findAvailableBackupCandidate({
      applicantId: userId,
      role: userRole,
      department: userDept,
      startDate,
      endDate,
      allUsers,
      allLeaves,
      allPlans,
      allowDoubleBackupFallback: true,
    })

    const leaveTypeCode = resolvePlanLeaveCode(body)
    const leaveTypeName = leaveTypeCode === 'casual' ? 'Casual Leave' : 'Annual Leave'
    const nowIso = new Date().toISOString()

    const planItem = {
      id: `plan-${Date.now()}`,
      tenantId,
      employeeId: userId,
      employeeName: userName,
      employeeRole: userRole,
      department: userDept,
      startDate,
      endDate,
      days: daysCount,
      notes: body.notes || `${leaveTypeName} scheduled`,
      status: eligibleBackup ? 'confirmed' : 'Coverage Needed',
      type: leaveTypeName,
      leaveTypeCode,
      assignedBackupId: eligibleBackup ? eligibleBackup.id : '',
      assignedBackupName: eligibleBackup ? eligibleBackup.name : 'Coverage Needed — Manager Action Required',
      assignedBackupRole: eligibleBackup ? (eligibleBackup.jobTitle || userRole) : userRole,
      createdAt: nowIso,
      syncState: 'REALTIME_AZURE_CALENDAR_IN_SYNC',
    }

    await getTenantContainer('leave_plans').items.upsert(planItem)

    try {
      await adjustLeaveBalanceOnStatusChange(tenantId, userId, leaveTypeCode, null, 'approved', daysCount)
      await getTenantContainer('leaves').items.create({
        id: `leave-plan-${Date.now()}`,
        tenantId,
        employeeId: userId,
        employeeName: userName,
        department: userDept,
        leaveTypeId: `lt-${leaveTypeCode}`,
        leaveTypeName,
        leaveTypeCode,
        startDate,
        endDate,
        requestedDays: daysCount,
        reason: body.notes || `${leaveTypeName} plan scheduled on team calendar`,
        status: 'approved',
        autoApproved: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
    } catch (balErr) {
      console.warn('Could not auto-deduct balance for leave plan:', balErr)
    }

    return { status: 201, jsonBody: planItem }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * POST /api/leaves/auto-casual-leave
 * Auto-registers Casual Leave for biometric fingerprint unannounced absence and deducts 1 day
 */
export async function triggerAutoCasualLeave(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const userId = auth.user!.id
  const userName = auth.user!.name
  const userDept = auth.user!.department || 'Operations'
  const userRole = auth.user!.jobTitle || 'Staff Member'

  try {
    const body = (await request.json().catch(() => ({}))) as any
    const dateStr = isValidIsoDate(body.date) ? body.date : new Date().toISOString().split('T')[0]
    const nowIso = new Date().toISOString()

    const leaveRecord = {
      id: `leave-casual-auto-${Date.now()}`,
      tenantId,
      employeeId: userId,
      employeeName: userName,
      department: userDept,
      leaveTypeId: 'lt-casual',
      leaveTypeName: 'Casual Leave',
      leaveTypeCode: 'casual',
      startDate: dateStr,
      endDate: dateStr,
      requestedDays: 1,
      reason: '1-Hour Unannounced Absence — Biometric Fingerprint Auto Casual Leave',
      status: 'approved',
      autoApproved: true,
      isCasualAbsence: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    }
    await getTenantContainer('leaves').items.create(leaveRecord)

    const planItem = {
      id: `plan-casual-${Date.now()}`,
      tenantId,
      employeeId: userId,
      employeeName: userName,
      employeeRole: userRole,
      department: userDept,
      startDate: dateStr,
      endDate: dateStr,
      days: 1,
      notes: 'Biometric fingerprint unannounced absence auto-marked as Casual Leave',
      status: 'confirmed',
      type: 'Casual Leave',
      leaveTypeCode: 'casual',
      isCasualAbsence: true,
      assignedBackupId: '',
      assignedBackupName: 'System Duty Backup Active',
      createdAt: nowIso,
    }
    await getTenantContainer('leave_plans').items.upsert(planItem)

    const updatedBalance = await adjustLeaveBalanceOnStatusChange(tenantId, userId, 'casual', null, 'approved', 1)

    return {
      status: 201,
      jsonBody: {
        message: 'Unannounced absence successfully auto-marked as Casual Leave. 1 day deducted from Casual Leave Balance.',
        leaveRecord,
        planItem,
        updatedBalance,
      },
    }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * DELETE /api/leaves/plans/{id}
 * Cancels a scheduled leave plan and restores the employee's leave balance
 */
export async function deleteLeavePlan(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const planId = request.params.id
  if (!planId) {
    return { status: 400, jsonBody: { error: 'Plan ID is required in URL parameter' } }
  }

  try {
    const container = getTenantContainer('leave_plans')
    let currentPlan: any = null

    try {
      const { resource } = await container.item(planId, tenantId).read()
      currentPlan = resource
    } catch {
      currentPlan = null
    }

    if (!currentPlan) {
      const plans = await queryTenantItems<any>(
        'leave_plans',
        tenantId,
        'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.id = @id',
        [
          { name: '@tenantId', value: tenantId },
          { name: '@id', value: planId },
        ]
      )
      currentPlan = plans[0] || null
    }

    if (!currentPlan) {
      return { status: 404, jsonBody: { error: `Leave plan "${planId}" not found` } }
    }

    if (auth.user!.role === 'employee' && currentPlan.employeeId !== auth.user!.id) {
      return { status: 403, jsonBody: { error: 'Forbidden: cannot cancel another employee leave plan' } }
    }

    currentPlan.status = 'cancelled'
    currentPlan.updatedAt = new Date().toISOString()
    await container.items.upsert(currentPlan)

    const empId = currentPlan.employeeId
    const { startDate, endDate } = currentPlan

    try {
      const allEmpPlans = await queryTenantItems<any>(
        'leave_plans',
        tenantId,
        'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.employeeId = @empId AND c.status != "cancelled"',
        [
          { name: '@tenantId', value: tenantId },
          { name: '@empId', value: empId },
        ]
      )
      for (const ep of allEmpPlans) {
        if (ep.startDate === startDate && ep.endDate === endDate) {
          ep.status = 'cancelled'
          ep.updatedAt = new Date().toISOString()
          await container.items.upsert(ep)
        }
      }
    } catch (err: any) {
      console.warn('Could not cancel duplicate leave plans:', err?.message || err)
    }

    try {
      const code = resolvePlanLeaveCode(currentPlan)
      await recalculateBalanceFromPlans(tenantId, empId, code)

      const leavesContainer = getTenantContainer('leaves')
      const matchingLeaves = await queryTenantItems<any>(
        'leaves',
        tenantId,
        'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.employeeId = @empId AND c.startDate = @startDate AND c.endDate = @endDate',
        [
          { name: '@tenantId', value: tenantId },
          { name: '@empId', value: empId },
          { name: '@startDate', value: startDate },
          { name: '@endDate', value: endDate },
        ]
      )

      for (const ml of matchingLeaves) {
        ml.status = 'cancelled'
        ml.updatedAt = new Date().toISOString()
        await leavesContainer.items.upsert(ml)
      }

      if (currentPlan.assignedBackupId) {
        try {
          await getTenantContainer('notifications').items.create({
            id: `notif-rel-${Date.now()}`,
            tenantId,
            recipientId: currentPlan.assignedBackupId,
            title: 'Duty Coverage Released',
            message: `Scheduled leave plan for ${currentPlan.employeeName} has been cancelled. You are released from duty coverage.`,
            read: false,
            createdAt: new Date().toISOString(),
          })
        } catch (err: any) {
          console.warn('Could not notify released backup:', err?.message || err)
        }
      }
    } catch (balErr) {
      console.warn('Could not refund balance for cancelled plan:', balErr)
    }

    return { status: 200, jsonBody: { message: 'Leave plan cancelled and balance restored.', plan: currentPlan } }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}
