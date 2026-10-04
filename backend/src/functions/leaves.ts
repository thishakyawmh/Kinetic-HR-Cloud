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
    return { status: 200, jsonBody: updated }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}
