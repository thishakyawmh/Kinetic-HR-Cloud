import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { queryTenantItems, getTenantContainer } from '../config/cosmos'
import { authenticateRequest } from '../middleware/auth'
import { arbitrateLeaveConflict } from '../services/aiEngine'

/**
 * Helper: Check date range overlap (YYYY-MM-DD)
 */
function datesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  return start1 <= end2 && end1 >= start2
}

/**
 * Helper: Calculate working days between start and end date (inclusive)
 */
function calculateWorkingDays(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 1
  const start = new Date(startDateStr)
  const end = new Date(endDateStr)
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 1

  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const dayOfWeek = cur.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++
    }
    cur.setDate(cur.getDate() + 1)
  }
  return count > 0 ? count : 1
}

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

    const typeNames: Record<string, string> = {
      annual: 'Annual Leave',
      casual: 'Casual Leave',
      sick: 'Sick Leave',
      medical: 'Medical Leave',
      emergency: 'Emergency Leave',
      parental: 'Parental Leave',
      unpaid: 'Unpaid Leave',
    }

    const defaultAllowances: Record<string, number> = {
      annual: 20,
      sick: 12,
      casual: 7,
      emergency: 3,
      parental: 90,
      unpaid: 0,
    }

    if (!balances || balances.length === 0) {
      // Create initial balances for user if not existing
      const initialTypes = ['annual', 'sick', 'casual', 'emergency']
      const newBals: any[] = []
      const balContainer = getTenantContainer('leave_balances')

      for (const tCode of initialTypes) {
        const item = {
          id: `bal-${targetUserId}-${tCode}`,
          tenantId,
          userId: targetUserId,
          leaveTypeId: `lt-${tCode}`,
          leaveTypeName: typeNames[tCode],
          code: tCode,
          leaveType: tCode,
          totalAllowance: defaultAllowances[tCode] || 15,
          used: 0,
          pending: 0,
          remaining: defaultAllowances[tCode] || 15,
        }
        await balContainer.items.upsert(item)
        newBals.push(item)
      }
      return { status: 200, jsonBody: newBals }
    }

    // Query active plans for this user to dynamically compute accurate used days
    const activePlans = await queryTenantItems<any>(
      'leave_plans',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.employeeId = @userId AND c.status != "cancelled"',
      [
        { name: '@tenantId', value: tenantId },
        { name: '@userId', value: targetUserId },
      ]
    )

    const actualUsedByCode: Record<string, number> = { annual: 0, casual: 0, sick: 0, emergency: 0 }
    activePlans.forEach(p => {
      const code = (p.leaveTypeCode || p.type || 'annual').toLowerCase().includes('casual') ? 'casual' : 'annual'
      const days = p.days || calculateWorkingDays(p.startDate, p.endDate)
      actualUsedByCode[code] = (actualUsedByCode[code] || 0) + days
    })

    const normalized = balances.map(b => {
      const type = (b.code || b.leaveType || 'annual').toLowerCase()
      const total = Number(b.totalAllowance !== undefined ? b.totalAllowance : (b.allocated || defaultAllowances[type] || 20))
      const used = actualUsedByCode[type] !== undefined ? actualUsedByCode[type] : Number(b.used || 0)
      const pending = Number(b.pending || 0)
      const remaining = Math.max(0, total - used - pending)

      if (b.used !== used || b.remaining !== remaining) {
        b.used = used
        b.remaining = remaining
        b.updatedAt = new Date().toISOString()
        getTenantContainer('leave_balances').items.upsert(b).catch(() => {})
      }

      return {
        ...b,
        id: b.id || `bal-${b.userId}-${type}`,
        leaveTypeId: b.leaveTypeId || b.id || `lt-${type}`,
        leaveTypeName: b.leaveTypeName || typeNames[type] || `${type.charAt(0).toUpperCase() + type.slice(1)} Leave`,
        code: type,
        leaveType: type,
        totalAllowance: total,
        allocated: total,
        used,
        pending,
        remaining,
      }
    })

    return { status: 200, jsonBody: normalized }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * GET /api/leaves
 * Retrieves leave requests for a tenant and optional employee
 */
async function processPendingAIApprovals(tenantId: string) {
  try {
    const pendingRequests = await queryTenantItems<any>(
      'leaves',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.status = "pending"',
      [{ name: '@tenantId', value: tenantId }]
    )

    if (!pendingRequests || pendingRequests.length === 0) return

    const now = Date.now()
    const leaveContainer = getTenantContainer('leaves')
    const balanceContainer = getTenantContainer('leave_balances')
    const notifContainer = getTenantContainer('notifications')
    const planContainer = getTenantContainer('leave_plans')

    // Fetch all users and active plans for candidate availability check
    const allUsers = await queryTenantItems<any>(
      'users',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @tenantId',
      [{ name: '@tenantId', value: tenantId }]
    )

    const allLeaves = await queryTenantItems<any>(
      'leaves',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.status IN ("approved", "pending")',
      [{ name: '@tenantId', value: tenantId }]
    )

    const allPlans = await queryTenantItems<any>(
      'leave_plans',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.status != "cancelled"',
      [{ name: '@tenantId', value: tenantId }]
    )

    for (const req of pendingRequests) {
      const createdTime = req.createdAt ? new Date(req.createdAt).getTime() : 0
      // Auto-approve after 8 seconds of submission (configurable 2-minute demo workflow)
      if (now - createdTime >= 8000 || !req.createdAt) {

        // Find available replacement colleague
        const reqRole = req.employeeRole || 'Senior Credit Officer'
        const reqDept = req.department || 'Retail Banking & Branches'

        // Candidate check: Not applicant, not on leave, not already double-assigned
        const isUserOnLeave = (userId: string) =>
          allLeaves.some(l => l.id !== req.id && l.employeeId === userId && l.status !== 'cancelled' && datesOverlap(l.startDate, l.endDate, req.startDate, req.endDate)) ||
          allPlans.some(p => p.employeeId === userId && p.status !== 'cancelled' && datesOverlap(p.startDate, p.endDate, req.startDate, req.endDate))

        const isUserDoubleAssigned = (userId: string) =>
          allPlans.some(p => p.assignedBackupId === userId && p.status !== 'cancelled' && datesOverlap(p.startDate, p.endDate, req.startDate, req.endDate))

        const candidates = allUsers.filter(u => {
          if (u.id === req.employeeId) return false
          const onLeave = isUserOnLeave(u.id)
          const doubleAssigned = isUserDoubleAssigned(u.id)
          return !onLeave && !doubleAssigned
        })

        // Preferred 1st candidate: Kasun Perera (user-kasun)
        let selectedReplacement = candidates.find(c => c.id === 'user-kasun' || c.name.includes('Kasun'))
        if (!selectedReplacement && candidates.length > 0) {
          // Cascade 2nd candidate: Same role/dept candidate
          selectedReplacement = candidates.find(c => c.jobTitle === reqRole || c.department === reqDept) || candidates[0]
        }

        const applicantName = req.employeeName || 'Dinuka Perera'

        if (selectedReplacement) {
          // Replacement found: Approve leave request & assign replacement
          req.status = 'approved'
          req.autoApproved = true
          req.updatedAt = new Date().toISOString()
          req.reassignmentSummary = `Responsibility covered by ${selectedReplacement.name} (${selectedReplacement.jobTitle || reqRole}).`
          req.timeline = req.timeline || []
          req.timeline.push({
            id: `tl-appr-${Date.now()}`,
            action: 'approved',
            actorName: 'Kinetic AI Arbitration Engine',
            timestamp: new Date().toISOString(),
            comment: `AI Priority Arbitration: First annual leave request approved. Staffing threshold satisfied. ${selectedReplacement.name} assigned on-call duty coverage.`,
          })

          await leaveContainer.items.upsert(req)

          // Update balances
          const code = (req.leaveTypeCode || 'annual').toLowerCase()
          const balances = await queryTenantItems<any>(
            'leave_balances',
            tenantId,
            'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.userId = @userId AND (c.code = @code OR c.leaveType = @code)',
            [
              { name: '@tenantId', value: tenantId },
              { name: '@userId', value: req.employeeId },
              { name: '@code', value: code },
            ]
          )

          if (balances.length > 0) {
            const bal = balances[0]
            const daysNum = req.requestedDays || 1
            bal.pending = Math.max(0, (bal.pending || 0) - daysNum)

            // Recalculate used days from active leave plans
            const userActivePlans = await queryTenantItems<any>(
              'leave_plans',
              tenantId,
              'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.employeeId = @userId AND c.status != "cancelled"',
              [
                { name: '@tenantId', value: tenantId },
                { name: '@userId', value: req.employeeId },
              ]
            )
            let calculatedUsed = 0
            userActivePlans.forEach(p => {
              const pCode = (p.leaveTypeCode || p.type || 'annual').toLowerCase().includes('casual') ? 'casual' : 'annual'
              if (pCode === code) {
                calculatedUsed += (p.days || calculateWorkingDays(p.startDate, p.endDate))
              }
            })

            bal.used = calculatedUsed
            bal.remaining = Math.max(0, (bal.totalAllowance || 20) - bal.used - bal.pending)
            bal.updatedAt = new Date().toISOString()
            await balanceContainer.items.upsert(bal)
          }

          // 1. Notification for applicant (Dinuka)
          try {
            await notifContainer.items.create({
              id: `notif-dinuka-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              tenantId,
              recipientId: req.employeeId,
              title: '🎉 AI Priority Handoff: Leave Approved',
              message: `Your ${req.leaveTypeName || 'Annual Leave'} request (${req.startDate} to ${req.endDate}) has been approved by Kinetic AI Arbitration! ${selectedReplacement.name} has been assigned on-call duty coverage.`,
              read: false,
              createdAt: new Date().toISOString(),
            })
          } catch (_) {}

          // 2. Notification for Replacement (In-app notification dispatched)
          try {
            await notifContainer.items.create({
              id: `notif-rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              tenantId,
              recipientId: selectedReplacement.id,
              title: '🚨 Emergency On-Call Duty Assignment',
              message: `You have been assigned on-call duty coverage for ${req.startDate} to ${req.endDate} (${applicantName} on approved leave). (In-app notification dispatched — ACS Voice Gateway Simulated).`,
              read: false,
              createdAt: new Date().toISOString(),
            })
          } catch (_) {}

          // 3. Upsert calendar plan item for replacement assignment (Only if not already present)
          try {
            const hasExisting = allPlans.some(p => p.employeeId === req.employeeId && p.status !== 'cancelled' && datesOverlap(p.startDate, p.endDate, req.startDate, req.endDate))
            if (!hasExisting) {
              await planContainer.items.upsert({
                id: `plan-auto-${req.id}`,
                tenantId,
                employeeId: req.employeeId,
                employeeName: applicantName,
                employeeRole: reqRole,
                department: reqDept,
                startDate: req.startDate,
                endDate: req.endDate,
                days: req.requestedDays || 1,
                notes: `Approved Annual Leave — On-Call Duty Coverage assigned to ${selectedReplacement.name}`,
                status: 'confirmed',
                type: req.leaveTypeName || 'Annual Leave',
                leaveTypeCode: code,
                assignedBackupId: selectedReplacement.id,
                assignedBackupName: selectedReplacement.name,
                assignedBackupRole: selectedReplacement.jobTitle || reqRole,
                createdAt: new Date().toISOString(),
                syncState: 'REALTIME_AZURE_CALENDAR_IN_SYNC',
              })
            }
          } catch (_) {}
        } else {
          // No replacement candidate available: Flag coverage gap & escalate to Branch Manager
          req.status = 'Coverage Needed'
          req.autoApproved = false
          req.reassignmentSummary = `No eligible replacement available without staffing conflicts. Escalated to Branch Manager.`
          req.updatedAt = new Date().toISOString()
          await leaveContainer.items.upsert(req)

          try {
            await notifContainer.items.create({
              id: `notif-esc-${Date.now()}`,
              tenantId,
              recipientId: 'user-chamari', // Branch Manager
              title: '🚨 Coverage Gap Escalation Required',
              message: `Leave request by ${applicantName} created an unassigned duty coverage gap from ${req.startDate} to ${req.endDate}. Manager review required.`,
              read: false,
              createdAt: new Date().toISOString(),
            })
          } catch (_) {}
        }
      }
    }
  } catch (err) {
    console.error('Error processing pending AI approvals:', err)
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
    // Automatically process pending requests with AI Arbitration engine
    await processPendingAIApprovals(tenantId)

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
    const startDate = body.startDate
    const endDate = body.endDate
    const leaveTypeCode = (body.leaveTypeCode || 'annual').toLowerCase()
    const isUrgent = !!body.isUrgent

    // Calculate working days
    const requestedDaysNum = body.requestedDays ? Number(body.requestedDays) : calculateWorkingDays(startDate, endDate)

    // 1. Check for Active Duty Handover Conflict (User is assigned to cover someone else during this period)
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

    // If there is an active handover conflict and user hasn't explicitly confirmed urgency:
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

    // 2. Authoritative Balance Check
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

    let currentBal = balances[0]
    if (!currentBal) {
      currentBal = {
        id: `bal-${userId}-${leaveTypeCode}`,
        tenantId,
        userId,
        code: leaveTypeCode,
        leaveType: leaveTypeCode,
        totalAllowance: leaveTypeCode === 'annual' ? 20 : 10,
        used: 0,
        pending: 0,
        remaining: leaveTypeCode === 'annual' ? 20 : 10,
      }
    }

    const available = Number(currentBal.remaining !== undefined ? currentBal.remaining : (currentBal.totalAllowance - currentBal.used - (currentBal.pending || 0)))

    if (available < requestedDaysNum && leaveTypeCode !== 'unpaid') {
      return {
        status: 400,
        jsonBody: {
          error: `Insufficient ${leaveTypeCode} leave balance. Available: ${available} days, Requested: ${requestedDaysNum} days.`,
        },
      }
    }

    // Initial status is ALWAYS pending so user sees it in Pending Requests tab first
    const initialStatus = 'pending'
    const leaveId = `leave-${Date.now()}`

    // 4. Handle Conflicting Duty Handover Reassignment Workflow (If Urgent Leave Confirmed)
    let reassignmentSummary = ''
    if (conflictingHandover && isUrgent) {
      // Find replacement candidate in same tenant & role
      const allUsers = await queryTenantItems<any>(
        'users',
        tenantId,
        'SELECT * FROM c WHERE c.tenantId = @tenantId',
        [{ name: '@tenantId', value: tenantId }]
      )

      const reqRole = conflictingHandover.employeeRole || auth.user!.jobTitle || 'Senior Frontend Engineer'
      const reqDept = conflictingHandover.department || auth.user!.department || 'Engineering'

      // Filter eligible candidates in same role/dept excluding absent user and original leave taker
      const eligibleCandidates = allUsers.filter(u => {
        if (u.id === userId || u.id === conflictingHandover.employeeId) return false
        return (u.jobTitle === reqRole || u.department === reqDept)
      })

      // Query leaves to check candidate availability
      const candidateLeaves = await queryTenantItems<any>(
        'leaves',
        tenantId,
        'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.status IN ("approved", "pending")',
        [{ name: '@tenantId', value: tenantId }]
      )

      const availableCandidates = eligibleCandidates.filter(cand => {
        const hasOverlappingLeave = candidateLeaves.some(l => l.employeeId === cand.id && datesOverlap(l.startDate, l.endDate, conflictingHandover.startDate, conflictingHandover.endDate))
        return !hasOverlappingLeave
      })

      const planContainer = getTenantContainer('leave_plans')

      if (availableCandidates.length > 0) {
        const selectedReplacement = availableCandidates[0]
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

        // Create manager escalation notification
        try {
          const notifContainer = getTenantContainer('notifications')
          await notifContainer.items.create({
            id: `notif-esc-${Date.now()}`,
            tenantId,
            recipientId: auth.user!.managerId || 'user-david',
            title: '🚨 Coverage Gap Escalation Required',
            message: `Urgent leave submitted by ${userName} created a coverage gap for ${conflictingHandover.employeeName}. Manager action required to assign replacement.`,
            read: false,
            createdAt: new Date().toISOString(),
          })
        } catch (_) {}

        reassignmentSummary = `No available same-role backup found. Handover flagged as "Coverage Needed — Manager Action Required" and escalated to manager.`
      }
    }

    const leaveTypeMap: Record<string, string> = {
      annual: 'Annual Leave',
      sick: 'Sick Leave',
      casual: 'Casual Leave',
      emergency: 'Emergency Leave',
      parental: 'Parental Leave',
      unpaid: 'Unpaid Leave',
      other: 'Other Leave',
    }

    const newRequest = {
      id: leaveId,
      tenantId,
      employeeId: userId,
      employeeName: userName,
      department: body.department || auth.user!.department || 'Engineering',
      leaveTypeId: body.leaveTypeId || `lt-${leaveTypeCode}`,
      leaveTypeName: body.leaveTypeName || leaveTypeMap[leaveTypeCode] || 'Leave',
      leaveTypeCode,
      startDate,
      endDate,
      requestedDays: requestedDaysNum,
      reason: body.reason,
      isUrgent,
      status: initialStatus,
      autoApproved: false,
      reassignmentSummary: reassignmentSummary || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          id: `tl-${Date.now()}-1`,
          action: isUrgent ? 'submitted_urgent' : 'submitted',
          actorName: userName,
          timestamp: new Date().toISOString(),
          comment: isUrgent ? `Urgent leave submitted: ${body.reason}` : 'Leave request submitted',
        },
        ...(reassignmentSummary ? [{
          id: `tl-${Date.now()}-2`,
          action: 'reassignment_triggered',
          actorName: 'Kinetic Reassignment Engine',
          timestamp: new Date().toISOString(),
          comment: reassignmentSummary,
        }] : []),
      ],
    }

    const container = getTenantContainer('leaves')
    const { resource } = await container.items.create(newRequest)

    // Update Authoritative Leave Balances
    const balanceContainer = getTenantContainer('leave_balances')
    if ((initialStatus as string) === 'approved') {
      currentBal.used = (currentBal.used || 0) + requestedDaysNum
    } else {
      currentBal.pending = (currentBal.pending || 0) + requestedDaysNum
    }
    currentBal.remaining = Math.max(0, (currentBal.totalAllowance || 20) - (currentBal.used || 0) - (currentBal.pending || 0))
    currentBal.updatedAt = new Date().toISOString()
    await balanceContainer.items.upsert(currentBal)

    return { status: 201, jsonBody: resource }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * PATCH /api/leaves/{id}/status
 * Updates status (approved, rejected, cancelled) and reverses/updates leave balances accordingly
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

    const { resource: currentLeave } = await container.item(leaveId, tenantId).read()
    if (!currentLeave) {
      return { status: 404, jsonBody: { error: `Leave request "${leaveId}" not found` } }
    }

    const prevStatus = currentLeave.status
    const newStatus = body.status
    const requestedDays = currentLeave.requestedDays || 1
    const empId = currentLeave.employeeId
    const code = currentLeave.leaveTypeCode || 'annual'

    currentLeave.status = newStatus
    currentLeave.updatedAt = new Date().toISOString()
    if (!currentLeave.timeline) currentLeave.timeline = []

    currentLeave.timeline.push({
      id: `tl-${Date.now()}`,
      action: newStatus,
      actorName: body.actorName || auth.user!.name,
      timestamp: new Date().toISOString(),
      comment: body.comment || `Status updated to ${newStatus}`,
    })

    const { resource: updated } = await container.item(leaveId, tenantId).replace(currentLeave)

    // Update Authoritative Leave Balances in Database
    try {
      const balContainer = getTenantContainer('leave_balances')
      const balances = await queryTenantItems<any>(
        'leave_balances',
        tenantId,
        'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.userId = @userId AND (c.code = @code OR c.leaveType = @code)',
        [
          { name: '@tenantId', value: tenantId },
          { name: '@userId', value: empId },
          { name: '@code', value: code },
        ]
      )

      if (balances.length > 0) {
        const bal = balances[0]
        if (prevStatus === 'pending') {
          bal.pending = Math.max(0, (bal.pending || 0) - requestedDays)
        } else if (prevStatus === 'approved') {
          bal.used = Math.max(0, (bal.used || 0) - requestedDays)
        }

        if (newStatus === 'approved') {
          bal.used = (bal.used || 0) + requestedDays
        } else if (newStatus === 'pending') {
          bal.pending = (bal.pending || 0) + requestedDays
        }
        // If rejected or cancelled, neither used nor pending holds the days

        bal.remaining = Math.max(0, (bal.totalAllowance || 20) - (bal.used || 0) - (bal.pending || 0))
        bal.updatedAt = new Date().toISOString()
        await balContainer.items.upsert(bal)
      }
    } catch (balErr) {
      console.warn('Could not update leave balance on status change:', balErr)
    }

    return { status: 200, jsonBody: updated }
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

  const defaultLeaveTypes = [
    {
      id: 'lt-annual',
      tenantId: auth.user!.tenantId,
      name: 'Annual Leave',
      code: 'annual',
      defaultDays: 20,
      defaultAllowance: 20,
      requiresApproval: true,
      requiresManagerApproval: true,
      color: '#23ace3',
      description: 'Paid standard vacation and planned personal time off.',
    },
    {
      id: 'lt-sick',
      tenantId: auth.user!.tenantId,
      name: 'Sick Leave',
      code: 'sick',
      defaultDays: 12,
      defaultAllowance: 12,
      requiresApproval: true,
      requiresManagerApproval: true,
      color: '#f43f5e',
      description: 'Medical recuperation and health visits.',
    },
    {
      id: 'lt-casual',
      tenantId: auth.user!.tenantId,
      name: 'Casual Leave',
      code: 'casual',
      defaultDays: 7,
      defaultAllowance: 7,
      requiresApproval: false,
      requiresManagerApproval: false,
      color: '#10b981',
      description: 'Short unplanned personal leave.',
    },
    {
      id: 'lt-emergency',
      tenantId: auth.user!.tenantId,
      name: 'Emergency Leave',
      code: 'emergency',
      defaultDays: 3,
      defaultAllowance: 3,
      requiresApproval: true,
      requiresManagerApproval: true,
      color: '#f59e0b',
      description: 'Immediate family or critical emergent circumstances.',
    },
    {
      id: 'lt-parental',
      tenantId: auth.user!.tenantId,
      name: 'Parental Leave',
      code: 'parental',
      defaultDays: 90,
      defaultAllowance: 90,
      requiresApproval: true,
      requiresManagerApproval: true,
      color: '#8b5cf6',
      description: 'Maternity, paternity and adoption leave.',
    },
    {
      id: 'lt-unpaid',
      tenantId: auth.user!.tenantId,
      name: 'Unpaid Leave',
      code: 'unpaid',
      defaultDays: 0,
      defaultAllowance: 0,
      requiresApproval: true,
      requiresManagerApproval: true,
      color: '#64748b',
      description: 'Extended sabbatical or authorized absence beyond balance.',
    },
  ]

  return { status: 200, jsonBody: defaultLeaveTypes }
}

/**
 * POST /api/leaves/ai-evaluate
 * Evaluates department leave requests under a daily max quota using AI
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

    const report = await arbitrateLeaveConflict(tenantId, department, targetDate, maxDailyQuota)

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
    const plans = await queryTenantItems<any>('leave_plans', tenantId, 'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.status != "cancelled"', [
      { name: '@tenantId', value: tenantId },
    ])

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
  const userRole = auth.user!.jobTitle || 'Senior Frontend Engineer'
  const userDept = auth.user!.department || 'Engineering'

  try {
    const body = (await request.json()) as {
      startDate: string
      endDate: string
      notes?: string
    }

    const startDate = body.startDate
    const endDate = body.endDate
    const daysCount = calculateWorkingDays(startDate, endDate)

    // Fetch team members in same tenant
    const allUsers = await queryTenantItems<any>('users', tenantId, 'SELECT * FROM c WHERE c.tenantId = @tenantId', [
      { name: '@tenantId', value: tenantId },
    ])

    // Fetch existing leaves and plans to verify backup availability
    const allLeaves = await queryTenantItems<any>('leaves', tenantId, 'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.status IN ("approved", "pending")', [
      { name: '@tenantId', value: tenantId },
    ])

    const allPlans = await queryTenantItems<any>('leave_plans', tenantId, 'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.status != "cancelled"', [
      { name: '@tenantId', value: tenantId },
    ])

    // Helper: Check if candidate is on leave during requested dates (in either leaves or leave_plans)
    const isCandidateOnLeave = (candId: string) => {
      const inLeaves = allLeaves.some(l => l.employeeId === candId && l.status !== 'cancelled' && datesOverlap(l.startDate, l.endDate, startDate, endDate))
      const inPlans = allPlans.some(p => p.employeeId === candId && p.status !== 'cancelled' && datesOverlap(p.startDate, p.endDate, startDate, endDate))
      return inLeaves || inPlans
    }

    // Cascading Candidate Backup Search:
    // Level 1: Same job title & same department
    let candidates = allUsers.filter(u => u.id !== userId && u.jobTitle === userRole && u.department === userDept)

    // Level 2: Same department
    if (candidates.length === 0) {
      candidates = allUsers.filter(u => u.id !== userId && u.department === userDept)
    }

    // Level 3: Same job title across org
    if (candidates.length === 0) {
      candidates = allUsers.filter(u => u.id !== userId && u.jobTitle === userRole)
    }

    // Level 4: Any colleague in organization
    if (candidates.length === 0) {
      candidates = allUsers.filter(u => u.id !== userId)
    }

    // Select candidate who is NOT on leave AND NOT already assigned another backup duty during these dates
    let eligibleBackup = candidates.find(cand => {
      const isOnLeave = isCandidateOnLeave(cand.id)
      const isBackup = allPlans.some(p => p.assignedBackupId === cand.id && p.status !== 'cancelled' && datesOverlap(p.startDate, p.endDate, startDate, endDate))
      return !isOnLeave && !isBackup
    })

    // Fallback: Pick candidate not on leave (even if they already have another backup duty)
    if (!eligibleBackup && candidates.length > 0) {
      eligibleBackup = candidates.find(cand => !isCandidateOnLeave(cand.id))
    }

    // CRITICAL: If no candidate is available without being on leave themselves,
    // eligibleBackup remains undefined! DO NOT force assign someone who is on leave!

    const rawType = ((body as any).type || (body as any).leaveTypeCode || 'Annual Leave').toString()
    const isCasual = rawType.toLowerCase().includes('casual')
    const leaveTypeCode = isCasual ? 'casual' : 'annual'
    const leaveTypeName = isCasual ? 'Casual Leave' : 'Annual Leave'

    const planId = `plan-${Date.now()}`
    const planItem = {
      id: planId,
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
      createdAt: new Date().toISOString(),
      syncState: 'REALTIME_AZURE_CALENDAR_IN_SYNC',
    }

    const container = getTenantContainer('leave_plans')
    await container.items.upsert(planItem)

    // Automatically Update Authoritative Leave Balance in Database (Annual or Casual)
    try {
      const balContainer = getTenantContainer('leave_balances')
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

      if (balances.length > 0) {
        const bal = balances[0]
        bal.used = (bal.used || 0) + daysCount
        bal.remaining = Math.max(0, (bal.totalAllowance || (isCasual ? 7 : 20)) - bal.used - (bal.pending || 0))
        bal.updatedAt = new Date().toISOString()
        await balContainer.items.upsert(bal)
      }

      // Also create an approved leave request item in leaves container
      const leavesContainer = getTenantContainer('leaves')
      await leavesContainer.items.create({
        id: `leave-plan-${Date.now()}`,
        tenantId,
        employeeId: userId,
        employeeName: userName,
        department: userDept,
        leaveTypeId: isCasual ? 'lt-casual' : 'lt-annual',
        leaveTypeName,
        leaveTypeCode,
        startDate,
        endDate,
        requestedDays: daysCount,
        reason: body.notes || `${leaveTypeName} plan scheduled on team calendar`,
        status: 'approved',
        autoApproved: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
 * Auto-registers Casual Leave for biometric fingerprint unannounced absence and deducts 1 day from Casual Leave balance
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
  const userDept = auth.user!.department || 'Banking Operations'
  const userRole = auth.user!.jobTitle || 'Senior Credit Officer'

  try {
    const body = (await request.json().catch(() => ({}))) as any
    const dateStr = body.date || new Date().toISOString().split('T')[0]

    // 1. Create Casual Leave item in `leaves` container
    const leavesContainer = getTenantContainer('leaves')
    const leaveId = `leave-casual-auto-${Date.now()}`
    const leaveRecord = {
      id: leaveId,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await leavesContainer.items.create(leaveRecord)

    // 2. Create Casual Leave Plan item in `leave_plans` container so it displays on Team Calendar
    const plansContainer = getTenantContainer('leave_plans')
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
      createdAt: new Date().toISOString(),
    }
    await plansContainer.items.upsert(planItem)

    // 3. Deduct 1 day from Casual Leave Balance in `leave_balances` container
    const balContainer = getTenantContainer('leave_balances')
    const balances = await queryTenantItems<any>(
      'leave_balances',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.userId = @userId AND (c.code = "casual" OR c.leaveType = "casual")',
      [
        { name: '@tenantId', value: tenantId },
        { name: '@userId', value: userId },
      ]
    )

    let casualBal = balances[0]
    if (casualBal) {
      casualBal.used = (casualBal.used || 0) + 1
      casualBal.remaining = Math.max(0, (casualBal.totalAllowance || 7) - casualBal.used - (casualBal.pending || 0))
      casualBal.updatedAt = new Date().toISOString()
      await balContainer.items.upsert(casualBal)
    }

    return {
      status: 201,
      jsonBody: {
        message: 'Unannounced absence successfully auto-marked as Casual Leave. 1 day deducted from Casual Leave Balance.',
        leaveRecord,
        planItem,
        updatedBalance: casualBal,
      },
    }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * DELETE /api/leaves/plans/{id}
 * Cancels a scheduled leave plan and restores the employee's leave balance in the database
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
    } catch (_) {}

    if (!currentPlan) {
      const plans = await queryTenantItems<any>('leave_plans', tenantId, 'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.id = @id', [
        { name: '@tenantId', value: tenantId },
        { name: '@id', value: planId },
      ])
      if (plans.length > 0) {
        currentPlan = plans[0]
      }
    }

    if (!currentPlan) {
      const allActivePlans = await queryTenantItems<any>('leave_plans', tenantId, 'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.status != "cancelled"', [
        { name: '@tenantId', value: tenantId },
      ])
      currentPlan = allActivePlans.find(p => p.id === planId || p.id.includes(planId) || planId.includes(p.id))
    }

    if (!currentPlan) {
      return { status: 404, jsonBody: { error: `Leave plan "${planId}" not found` } }
    }

    // Mark plan as cancelled
    currentPlan.status = 'cancelled'
    currentPlan.updatedAt = new Date().toISOString()
    await container.items.upsert(currentPlan)

    const empId = currentPlan.employeeId
    const startDate = currentPlan.startDate
    const endDate = currentPlan.endDate

    // Also cancel any auto-generated or duplicate plan items for the same employee & dates
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
    } catch (_) {}

    // Restore Authoritative Leave Balance in Database
    try {
      const balContainer = getTenantContainer('leave_balances')
      const code = (currentPlan.leaveTypeCode || currentPlan.type || 'annual').toLowerCase().includes('casual') ? 'casual' : 'annual'
      
      // Compute actual used count from remaining active plans
      const remainingActivePlans = await queryTenantItems<any>(
        'leave_plans',
        tenantId,
        'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.employeeId = @empId AND c.status != "cancelled"',
        [
          { name: '@tenantId', value: tenantId },
          { name: '@empId', value: empId },
        ]
      )

      let newUsed = 0
      remainingActivePlans.forEach(p => {
        const pCode = (p.leaveTypeCode || p.type || 'annual').toLowerCase().includes('casual') ? 'casual' : 'annual'
        if (pCode === code) {
          newUsed += (p.days || calculateWorkingDays(p.startDate, p.endDate))
        }
      })

      const balances = await queryTenantItems<any>(
        'leave_balances',
        tenantId,
        'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.userId = @userId AND (c.code = @code OR c.leaveType = @code)',
        [
          { name: '@tenantId', value: tenantId },
          { name: '@userId', value: empId },
          { name: '@code', value: code },
        ]
      )

      if (balances.length > 0) {
        const bal = balances[0]
        bal.used = newUsed
        bal.remaining = Math.max(0, (bal.totalAllowance || (code === 'casual' ? 7 : 20)) - newUsed - (bal.pending || 0))
        bal.updatedAt = new Date().toISOString()
        await balContainer.items.upsert(bal)
      }

      // Mark corresponding leave request as cancelled in leaves container
      const leavesContainer = getTenantContainer('leaves')
      const matchingLeaves = await queryTenantItems<any>(
        'leaves',
        tenantId,
        'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.employeeId = @empId AND c.startDate = @startDate AND c.endDate = @endDate',
        [
          { name: '@tenantId', value: tenantId },
          { name: '@empId', value: empId },
          { name: '@startDate', value: currentPlan.startDate },
          { name: '@endDate', value: currentPlan.endDate },
        ]
      )

      for (const ml of matchingLeaves) {
        ml.status = 'cancelled'
        ml.updatedAt = new Date().toISOString()
        await leavesContainer.items.upsert(ml)
      }

      // Release backup duty assignment notification
      if (currentPlan.assignedBackupId) {
        try {
          const notifContainer = getTenantContainer('notifications')
          await notifContainer.items.create({
            id: `notif-rel-${Date.now()}`,
            tenantId,
            recipientId: currentPlan.assignedBackupId,
            title: 'ℹ️ Duty Coverage Released',
            message: `Scheduled annual leave plan for ${currentPlan.employeeName} has been cancelled. You are released from duty coverage.`,
            read: false,
            createdAt: new Date().toISOString(),
          })
        } catch (_) {}
      }
    } catch (balErr) {
      console.warn('Could not refund balance for cancelled plan:', balErr)
    }

    return { status: 200, jsonBody: { message: 'Leave plan cancelled and balance restored.', plan: currentPlan } }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}



