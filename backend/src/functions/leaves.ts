import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { queryTenantItems, getTenantContainer } from '../config/cosmos'
import { authenticateRequest } from '../middleware/auth'

/**
 * GET /api/leaves/balances
 */
export async function getLeaveBalances(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const targetUserId = request.query.get('userId') || auth.user!.id
  const tenantId = auth.user!.tenantId

  try {
    const balances = await queryTenantItems<any>(
      'leave_balances',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.userId = @userId',
      [
        { name: '@tenantId', value: tenantId },
        { name: '@userId', value: targetUserId },
      ]
    )

    return { status: 200, jsonBody: balances }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * GET /api/leaves
 * Retrieves leave requests for a tenant and optional employee
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
 * POST /api/leaves
 * Submits a new leave application
 */
export async function createLeaveRequest(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId

  try {
    const body = (await request.json()) as any
    const leaveId = `leave-${Date.now()}`

    const newRequest = {
      id: leaveId,
      tenantId,
      employeeId: auth.user!.id,
      employeeName: auth.user!.name,
      department: body.department || 'Engineering',
      leaveTypeId: body.leaveTypeId,
      leaveTypeName: body.leaveTypeName,
      leaveTypeCode: body.leaveTypeCode,
      startDate: body.startDate,
      endDate: body.endDate,
      requestedDays: Number(body.requestedDays || 1),
      reason: body.reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          id: `tl-${Date.now()}`,
          action: 'submitted',
          actorName: auth.user!.name,
          timestamp: new Date().toISOString(),
          comment: 'Leave request submitted',
        },
      ],
    }

    const container = getTenantContainer('leaves')
    const { resource } = await container.items.create(newRequest)

    return { status: 201, jsonBody: resource }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * PATCH /api/leaves/{id}/status
 * Updates status (approved, rejected, cancelled)
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
    const body = (await request.json()) as { status: string; comment?: string; actorName?: string }
    const container = getTenantContainer('leaves')

    // Read current item from Cosmos DB with partition key
    const { resource: currentLeave } = await container.item(leaveId, tenantId).read()
    if (!currentLeave) {
      return { status: 404, jsonBody: { error: `Leave request "${leaveId}" not found` } }
    }

    currentLeave.status = body.status
    currentLeave.updatedAt = new Date().toISOString()
    if (!currentLeave.timeline) currentLeave.timeline = []

    currentLeave.timeline.push({
      id: `tl-${Date.now()}`,
      action: body.status,
      actorName: body.actorName || auth.user!.name,
      timestamp: new Date().toISOString(),
      comment: body.comment || `Status updated to ${body.status}`,
    })

    const { resource: updated } = await container.item(leaveId, tenantId).replace(currentLeave)

    // If approved, deduct used and update remaining in leave_balances container
    if (body.status === 'approved' && currentLeave.leaveTypeCode && currentLeave.employeeId) {
      try {
        const balContainer = getTenantContainer('leave_balances')
        const { resources: balances } = await balContainer.items
          .query({
            query: 'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.userId = @userId AND c.code = @code',
            parameters: [
              { name: '@tenantId', value: tenantId },
              { name: '@userId', value: currentLeave.employeeId },
              { name: '@code', value: currentLeave.leaveTypeCode },
            ],
          })
          .fetchAll()

        if (balances.length > 0) {
          const bal = balances[0]
          bal.used = (bal.used || 0) + (currentLeave.requestedDays || 1)
          bal.remaining = Math.max(0, (bal.totalAllowance || 0) - bal.used)
          await balContainer.items.upsert(bal)
        }
      } catch (balErr) {
        console.warn('Could not auto-deduct leave balance:', balErr)
      }
    }

    return { status: 200, jsonBody: updated }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * GET /api/leaves/types
 * Retrieves active leave policies and types for the tenant
 */
export async function getLeaveTypes(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const defaultLeaveTypes = [
    {
      id: 'lt-annual',
      name: 'Annual Leave',
      code: 'annual',
      defaultDays: 20,
      requiresApproval: true,
      description: 'Paid standard vacation and planned personal time off.',
    },
    {
      id: 'lt-sick',
      name: 'Sick Leave',
      code: 'sick',
      defaultDays: 10,
      requiresApproval: true,
      description: 'Medical recuperation and health visits.',
    },
    {
      id: 'lt-casual',
      name: 'Casual Leave',
      code: 'casual',
      defaultDays: 5,
      requiresApproval: false,
      description: 'Short unplanned personal leave.',
    },
    {
      id: 'lt-emergency',
      name: 'Emergency Leave',
      code: 'emergency',
      defaultDays: 3,
      requiresApproval: true,
      description: 'Immediate family or critical emergent circumstances.',
    },
    {
      id: 'lt-parental',
      name: 'Parental Leave',
      code: 'parental',
      defaultDays: 60,
      requiresApproval: true,
      description: 'Maternity, paternity and adoption leave.',
    },
    {
      id: 'lt-unpaid',
      name: 'Unpaid Leave',
      code: 'unpaid',
      defaultDays: 0,
      requiresApproval: true,
      description: 'Extended sabbatical or authorized absence beyond balance.',
    },
  ]

  return { status: 200, jsonBody: defaultLeaveTypes }
}

import { arbitrateLeaveConflict } from '../services/aiEngine'

/**
 * POST /api/leaves/ai-evaluate
 * Evaluates department leave requests under a daily max quota (e.g. 5 approvals out of 8 requests)
 * using historical leave frequency logs, urgency sentiment, and fairness rules.
 */
export async function evaluateAIFairnessLeaves(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId

  try {
    const body = (await request.json().catch(() => ({}))) as any
    const targetDate = body?.date || '2026-10-25'
    const department = body?.department || 'Engineering'
    const maxDailyQuota = Number(body?.maxDailyQuota || 5)

    // Call real AI arbitration engine
    const report = await arbitrateLeaveConflict(tenantId, department, targetDate, maxDailyQuota)

    // If autoExecute requested, update database status for all evaluated items
    if (body?.autoExecute && report.evaluations.length > 0) {
      const container = getTenantContainer('leaves')
      for (const item of report.evaluations) {
        try {
          const { resource: current } = await container.item(item.candidateId, tenantId).read()
          if (current) {
            current.status = item.aiRecommendation
            current.updatedAt = new Date().toISOString()
            if (!current.timeline) current.timeline = []
            current.timeline.push({
              id: `tl-ai-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              action: `ai_${item.aiRecommendation}`,
              actorName: 'Kinetic Autonomous AI Engine',
              timestamp: new Date().toISOString(),
              comment: item.aiRationale,
            })
            await container.item(item.candidateId, tenantId).replace(current)
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


