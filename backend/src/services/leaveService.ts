import { getTenantContainer, queryTenantItems } from '../config/cosmos'

export const VALID_LEAVE_STATUSES = ['pending', 'approved', 'rejected', 'cancelled', 'Coverage Needed'] as const

export const LEAVE_TYPE_META: Record<string, { name: string; defaultAllowance: number; color: string; requiresApproval: boolean; description: string }> = {
  annual: {
    name: 'Annual Leave',
    defaultAllowance: 20,
    color: '#23ace3',
    requiresApproval: true,
    description: 'Paid standard vacation and planned personal time off.',
  },
  sick: {
    name: 'Sick Leave',
    defaultAllowance: 12,
    color: '#f43f5e',
    requiresApproval: true,
    description: 'Medical recuperation and health visits.',
  },
  casual: {
    name: 'Casual Leave',
    defaultAllowance: 7,
    color: '#10b981',
    requiresApproval: false,
    description: 'Short unplanned personal leave.',
  },
  emergency: {
    name: 'Emergency Leave',
    defaultAllowance: 3,
    color: '#f59e0b',
    requiresApproval: true,
    description: 'Immediate family or critical emergent circumstances.',
  },
  parental: {
    name: 'Parental Leave',
    defaultAllowance: 90,
    color: '#8b5cf6',
    requiresApproval: true,
    description: 'Maternity, paternity and adoption leave.',
  },
  unpaid: {
    name: 'Unpaid Leave',
    defaultAllowance: 0,
    color: '#64748b',
    requiresApproval: true,
    description: 'Extended sabbatical or authorized absence beyond balance.',
  },
}

export function getDefaultLeaveTypes(tenantId: string) {
  return Object.entries(LEAVE_TYPE_META).map(([code, meta]) => ({
    id: `lt-${code}`,
    tenantId,
    name: meta.name,
    code,
    defaultDays: meta.defaultAllowance,
    defaultAllowance: meta.defaultAllowance,
    requiresApproval: meta.requiresApproval,
    requiresManagerApproval: meta.requiresApproval,
    color: meta.color,
    description: meta.description,
  }))
}

export function datesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  return start1 <= end2 && end1 >= start2
}

export function isValidIsoDate(dateStr: unknown): dateStr is string {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false
  }
  const d = new Date(`${dateStr}T00:00:00Z`)
  return !isNaN(d.getTime()) && d.toISOString().startsWith(dateStr)
}

export function calculateWorkingDays(startDateStr: string, endDateStr: string): number {
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

export function resolvePlanLeaveCode(plan: any): 'casual' | 'annual' {
  return (plan.leaveTypeCode || plan.type || 'annual').toLowerCase().includes('casual') ? 'casual' : 'annual'
}

export async function getOrCreateUserLeaveBalances(tenantId: string, userId: string): Promise<any[]> {
  const balances = await queryTenantItems<any>(
    'leave_balances',
    tenantId,
    'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.userId = @userId',
    [
      { name: '@tenantId', value: tenantId },
      { name: '@userId', value: userId },
    ]
  )

  if (!balances || balances.length === 0) {
    const initialTypes = ['annual', 'sick', 'casual', 'emergency'] as const
    const balContainer = getTenantContainer('leave_balances')
    const created: any[] = []

    for (const code of initialTypes) {
      const meta = LEAVE_TYPE_META[code]
      const item = {
        id: `bal-${userId}-${code}`,
        tenantId,
        userId,
        leaveTypeId: `lt-${code}`,
        leaveTypeName: meta.name,
        code,
        leaveType: code,
        totalAllowance: meta.defaultAllowance,
        used: 0,
        pending: 0,
        remaining: meta.defaultAllowance,
      }
      await balContainer.items.upsert(item)
      created.push(item)
    }
    return created
  }

  const activePlans = await queryTenantItems<any>(
    'leave_plans',
    tenantId,
    'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.employeeId = @userId AND c.status != "cancelled"',
    [
      { name: '@tenantId', value: tenantId },
      { name: '@userId', value: userId },
    ]
  )

  const actualUsedByCode: Record<string, number> = { annual: 0, casual: 0, sick: 0, emergency: 0 }
  for (const p of activePlans) {
    const code = resolvePlanLeaveCode(p)
    const days = p.days || calculateWorkingDays(p.startDate, p.endDate)
    actualUsedByCode[code] = (actualUsedByCode[code] || 0) + days
  }

  const balContainer = getTenantContainer('leave_balances')
  return balances.map(b => {
    const type = (b.code || b.leaveType || 'annual').toLowerCase()
    const defaultTotal = LEAVE_TYPE_META[type]?.defaultAllowance ?? 20
    const total = Number(b.totalAllowance !== undefined ? b.totalAllowance : (b.allocated || defaultTotal))
    const used = actualUsedByCode[type] !== undefined ? actualUsedByCode[type] : Number(b.used || 0)
    const pending = Number(b.pending || 0)
    const remaining = Math.max(0, total - used - pending)

    if (b.used !== used || b.remaining !== remaining) {
      b.used = used
      b.remaining = remaining
      b.updatedAt = new Date().toISOString()
      balContainer.items.upsert(b).catch(err => {
        console.warn(`[LeaveService] Balance sync failed for ${b.id}:`, err?.message || err)
      })
    }

    return {
      ...b,
      id: b.id || `bal-${b.userId}-${type}`,
      leaveTypeId: b.leaveTypeId || b.id || `lt-${type}`,
      leaveTypeName:
        b.leaveTypeName || LEAVE_TYPE_META[type]?.name || `${type.charAt(0).toUpperCase() + type.slice(1)} Leave`,
      code: type,
      leaveType: type,
      totalAllowance: total,
      allocated: total,
      used,
      pending,
      remaining,
    }
  })
}

export async function adjustLeaveBalanceOnStatusChange(
  tenantId: string,
  userId: string,
  leaveTypeCode: string,
  prevStatus: string | null,
  newStatus: string | null,
  requestedDays: number
): Promise<any | null> {
  const code = (leaveTypeCode || 'annual').toLowerCase()
  const balances = await queryTenantItems<any>(
    'leave_balances',
    tenantId,
    'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.userId = @userId AND (c.code = @code OR c.leaveType = @code)',
    [
      { name: '@tenantId', value: tenantId },
      { name: '@userId', value: userId },
      { name: '@code', value: code },
    ]
  )

  if (balances.length === 0) return null

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

  const defaultAllowance = LEAVE_TYPE_META[code]?.defaultAllowance ?? 20
  bal.remaining = Math.max(0, (bal.totalAllowance || defaultAllowance) - (bal.used || 0) - (bal.pending || 0))
  bal.updatedAt = new Date().toISOString()
  await getTenantContainer('leave_balances').items.upsert(bal)
  return bal
}

export async function recalculateBalanceFromPlans(
  tenantId: string,
  userId: string,
  leaveTypeCode: string
): Promise<any | null> {
  const code = resolvePlanLeaveCode({ leaveTypeCode })
  const remainingActivePlans = await queryTenantItems<any>(
    'leave_plans',
    tenantId,
    'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.employeeId = @empId AND c.status != "cancelled"',
    [
      { name: '@tenantId', value: tenantId },
      { name: '@empId', value: userId },
    ]
  )

  let usedDays = 0
  for (const plan of remainingActivePlans) {
    if (resolvePlanLeaveCode(plan) === code) {
      usedDays += plan.days || calculateWorkingDays(plan.startDate, plan.endDate)
    }
  }

  const balances = await queryTenantItems<any>(
    'leave_balances',
    tenantId,
    'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.userId = @userId AND (c.code = @code OR c.leaveType = @code)',
    [
      { name: '@tenantId', value: tenantId },
      { name: '@userId', value: userId },
      { name: '@code', value: code },
    ]
  )

  if (balances.length === 0) return null

  const bal = balances[0]
  const defaultAllowance = LEAVE_TYPE_META[code]?.defaultAllowance ?? 20
  bal.used = usedDays
  bal.remaining = Math.max(0, (bal.totalAllowance || defaultAllowance) - usedDays - (bal.pending || 0))
  bal.updatedAt = new Date().toISOString()
  await getTenantContainer('leave_balances').items.upsert(bal)
  return bal
}

export interface BackupSearchOptions {
  applicantId: string
  excludeId?: string
  role: string
  department: string
  startDate: string
  endDate: string
  allUsers: any[]
  allLeaves: any[]
  allPlans: any[]
  allowDoubleBackupFallback?: boolean
}

export function findAvailableBackupCandidate(opts: BackupSearchOptions): any | undefined {
  const {
    applicantId,
    excludeId,
    role,
    department,
    startDate,
    endDate,
    allUsers,
    allLeaves,
    allPlans,
    allowDoubleBackupFallback = false,
  } = opts

  const isOnLeave = (candId: string) =>
    allLeaves.some(
      l =>
        l.id !== excludeId &&
        l.employeeId === candId &&
        l.status !== 'cancelled' &&
        datesOverlap(l.startDate, l.endDate, startDate, endDate)
    ) ||
    allPlans.some(
      p => p.employeeId === candId && p.status !== 'cancelled' && datesOverlap(p.startDate, p.endDate, startDate, endDate)
    )

  const hasBackupDuty = (candId: string) =>
    allPlans.some(
      p =>
        p.assignedBackupId === candId &&
        p.status !== 'cancelled' &&
        datesOverlap(p.startDate, p.endDate, startDate, endDate)
    )

  const tiers = [
    allUsers.filter(u => u.id !== applicantId && u.jobTitle === role && u.department === department),
    allUsers.filter(u => u.id !== applicantId && u.department === department),
    allUsers.filter(u => u.id !== applicantId && u.jobTitle === role),
    allUsers.filter(u => u.id !== applicantId),
  ]

  for (const tier of tiers) {
    const clean = tier.find(c => !isOnLeave(c.id) && !hasBackupDuty(c.id))
    if (clean) return clean
  }

  if (allowDoubleBackupFallback) {
    for (const tier of tiers) {
      const notOnLeave = tier.find(c => !isOnLeave(c.id))
      if (notOnLeave) return notOnLeave
    }
  }

  return undefined
}

async function createNotificationSafe(item: Record<string, any>): Promise<void> {
  try {
    await getTenantContainer('notifications').items.create(item)
  } catch (err: any) {
    console.warn(`[LeaveService] Failed to dispatch notification: ${err?.message || err}`)
  }
}

export async function processPendingAIApprovals(tenantId: string): Promise<number> {
  const pendingRequests = await queryTenantItems<any>(
    'leaves',
    tenantId,
    'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.status = "pending"',
    [{ name: '@tenantId', value: tenantId }]
  )

  if (!pendingRequests || pendingRequests.length === 0) return 0

  const now = Date.now()
  const leaveContainer = getTenantContainer('leaves')
  const planContainer = getTenantContainer('leave_plans')

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

  let processedCount = 0

  for (const req of pendingRequests) {
    const createdTime = req.createdAt ? new Date(req.createdAt).getTime() : 0
    if (now - createdTime < 8000 && req.createdAt) continue

    const reqRole = req.employeeRole || 'Staff Member'
    const reqDept = req.department || 'Operations'
    const applicantName = req.employeeName || req.employeeId

    const selectedReplacement = findAvailableBackupCandidate({
      applicantId: req.employeeId,
      excludeId: req.id,
      role: reqRole,
      department: reqDept,
      startDate: req.startDate,
      endDate: req.endDate,
      allUsers,
      allLeaves,
      allPlans,
    })

    if (selectedReplacement) {
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
        comment: `AI Priority Arbitration: Request approved. ${selectedReplacement.name} assigned on-call duty coverage.`,
      })

      await leaveContainer.items.upsert(req)

      const code = (req.leaveTypeCode || 'annual').toLowerCase()
      await adjustLeaveBalanceOnStatusChange(
        tenantId,
        req.employeeId,
        code,
        'pending',
        'approved',
        req.requestedDays || 1
      )

      await createNotificationSafe({
        id: `notif-appr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tenantId,
        recipientId: req.employeeId,
        title: 'AI Priority Handoff: Leave Approved',
        message: `Your ${req.leaveTypeName || 'Annual Leave'} request (${req.startDate} to ${req.endDate}) has been approved. ${selectedReplacement.name} has been assigned coverage.`,
        read: false,
        createdAt: new Date().toISOString(),
      })

      await createNotificationSafe({
        id: `notif-rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tenantId,
        recipientId: selectedReplacement.id,
        title: 'Emergency On-Call Duty Assignment',
        message: `You have been assigned on-call duty coverage for ${req.startDate} to ${req.endDate} (${applicantName} on approved leave).`,
        read: false,
        createdAt: new Date().toISOString(),
      })

      const hasExisting = allPlans.some(
        p => p.employeeId === req.employeeId && p.status !== 'cancelled' && datesOverlap(p.startDate, p.endDate, req.startDate, req.endDate)
      )
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
          notes: `Approved ${req.leaveTypeName || 'Annual Leave'} — Coverage assigned to ${selectedReplacement.name}`,
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
    } else {
      const applicant = allUsers.find(u => u.id === req.employeeId)
      const fallbackManager = allUsers.find(u => u.role === 'manager' || u.role === 'admin')
      const escalationRecipient = applicant?.managerId || fallbackManager?.id

      req.status = 'Coverage Needed'
      req.autoApproved = false
      req.reassignmentSummary = 'No eligible replacement available without staffing conflicts. Escalated to Manager.'
      req.updatedAt = new Date().toISOString()
      await leaveContainer.items.upsert(req)

      if (escalationRecipient) {
        await createNotificationSafe({
          id: `notif-esc-${Date.now()}`,
          tenantId,
          recipientId: escalationRecipient,
          title: 'Coverage Gap Escalation Required',
          message: `Leave request by ${applicantName} created an unassigned duty coverage gap from ${req.startDate} to ${req.endDate}. Manager review required.`,
          read: false,
          createdAt: new Date().toISOString(),
        })
      }
    }

    processedCount++
  }

  return processedCount
}
