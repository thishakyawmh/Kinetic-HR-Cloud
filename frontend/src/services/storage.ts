import {
  MOCK_TENANTS,
  MOCK_USERS,
  MOCK_LEAVE_TYPES,
  MOCK_LEAVE_BALANCES,
  MOCK_LEAVE_REQUESTS,
  MOCK_PAYSLIPS,
  MOCK_POLICIES,
  MOCK_AUDIT_LOGS,
  MOCK_NOTIFICATIONS,
  MOCK_INTEGRATIONS,
  MOCK_AI_USAGE,
  MOCK_DOCUMENT_REQUESTS
} from '@/mock/data'
import {
  Tenant,
  User,
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  LeaveStatus,
  Payslip,
  PolicyDocument,
  AuditEvent,
  AppNotification,
  IntegrationStatusItem,
  AIUsageMetrics,
  HRDocumentRequest
} from '@/types'

class AppDataStore {
  private tenants: Tenant[] = []
  private users: User[] = []
  private leaveTypes: LeaveType[] = []
  private leaveBalances: Record<string, LeaveBalance[]> = {}
  private leaveRequests: LeaveRequest[] = []
  private payslips: Payslip[] = []
  private policies: PolicyDocument[] = []
  private auditLogs: AuditEvent[] = []
  private notifications: AppNotification[] = []
  private integrations: IntegrationStatusItem[] = []
  private aiUsage: AIUsageMetrics = MOCK_AI_USAGE
  private documentRequests: HRDocumentRequest[] = []

  constructor() {
    this.init()
  }

  private init() {
    const saved = localStorage.getItem('kinetic_data_store_v1')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        this.tenants = parsed.tenants || MOCK_TENANTS
        this.users = parsed.users || MOCK_USERS
        this.leaveTypes = parsed.leaveTypes || MOCK_LEAVE_TYPES
        this.leaveBalances = parsed.leaveBalances || MOCK_LEAVE_BALANCES
        this.leaveRequests = parsed.leaveRequests || MOCK_LEAVE_REQUESTS
        this.payslips = parsed.payslips || MOCK_PAYSLIPS
        this.policies = parsed.policies || MOCK_POLICIES
        this.auditLogs = parsed.auditLogs || MOCK_AUDIT_LOGS
        this.notifications = parsed.notifications || MOCK_NOTIFICATIONS
        this.integrations = parsed.integrations || MOCK_INTEGRATIONS
        this.documentRequests = (parsed.documentRequests && parsed.documentRequests.length > 0) ? parsed.documentRequests : MOCK_DOCUMENT_REQUESTS
        this.aiUsage = parsed.aiUsage || MOCK_AI_USAGE

        // Merge any new default mock users (e.g. separate employee accounts)
        MOCK_USERS.forEach(mu => {
          if (!this.users.some(u => u.id === mu.id || u.employeeNumber === mu.employeeNumber)) {
            this.users.push(mu)
          }
        })
        // Merge missing leave balances
        Object.keys(MOCK_LEAVE_BALANCES).forEach(k => {
          if (!this.leaveBalances[k]) {
            this.leaveBalances[k] = MOCK_LEAVE_BALANCES[k]
          }
        })
        // Merge missing payslips
        MOCK_PAYSLIPS.forEach(mp => {
          if (!this.payslips.some(p => p.id === mp.id)) {
            this.payslips.push(mp)
          }
        })
        // Merge missing document requests
        MOCK_DOCUMENT_REQUESTS.forEach(md => {
          if (!this.documentRequests.some(d => d.id === md.id)) {
            this.documentRequests.push(md)
          }
        })
        this.save()
        return
      } catch (e) {
        console.error('Failed to parse cached store', e)
      }
    }

    // Default seed
    this.tenants = [...MOCK_TENANTS]
    this.users = [...MOCK_USERS]
    this.leaveTypes = [...MOCK_LEAVE_TYPES]
    this.leaveBalances = JSON.parse(JSON.stringify(MOCK_LEAVE_BALANCES))
    this.leaveRequests = [...MOCK_LEAVE_REQUESTS]
    this.payslips = [...MOCK_PAYSLIPS]
    this.policies = [...MOCK_POLICIES]
    this.auditLogs = [...MOCK_AUDIT_LOGS]
    this.notifications = [...MOCK_NOTIFICATIONS]
    this.integrations = [...MOCK_INTEGRATIONS]
    this.documentRequests = [...MOCK_DOCUMENT_REQUESTS]
    this.aiUsage = { ...MOCK_AI_USAGE }
    this.save()
  }

  private save() {
    try {
      localStorage.setItem('kinetic_data_store_v1', JSON.stringify({
        tenants: this.tenants,
        users: this.users,
        leaveTypes: this.leaveTypes,
        leaveBalances: this.leaveBalances,
        leaveRequests: this.leaveRequests,
        payslips: this.payslips,
        policies: this.policies,
        auditLogs: this.auditLogs,
        notifications: this.notifications,
        integrations: this.integrations,
        aiUsage: this.aiUsage,
      }))
    } catch (e) {
      console.warn('Storage save failed', e)
    }
  }

  public resetToDefaults() {
    localStorage.removeItem('kinetic_data_store_v1')
    this.init()
  }

  // Tenants
  getTenants(): Tenant[] {
    return this.tenants
  }
  getTenant(id: string): Tenant | undefined {
    return this.tenants.find(t => t.id === id)
  }
  addTenant(tenant: Tenant): Tenant {
    this.tenants.unshift(tenant)
    this.save()
    return tenant
  }
  updateTenant(id: string, updates: Partial<Tenant>): Tenant | undefined {
    const idx = this.tenants.findIndex(t => t.id === id)
    if (idx !== -1) {
      this.tenants[idx] = { ...this.tenants[idx], ...updates }
      this.save()
      return this.tenants[idx]
    }
    return undefined
  }

  // Users
  getUsers(tenantId?: string): User[] {
    if (!tenantId) return this.users
    return this.users.filter(u => u.tenantId === tenantId)
  }
  getUser(id: string): User | undefined {
    return this.users.find(u => u.id === id)
  }
  addUser(user: User): User {
    this.users.unshift(user)
    this.save()
    return user
  }
  updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.users.findIndex(u => u.id === id)
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], ...updates }
      this.save()
      return this.users[idx]
    }
    return undefined
  }

  // Leave Balances
  getLeaveBalances(userId: string): LeaveBalance[] {
    return this.leaveBalances[userId] || [
      {
        leaveTypeId: 'lt-annual',
        leaveTypeName: 'Annual Leave',
        code: 'annual',
        totalAllowance: 20,
        used: 5,
        pending: 0,
        remaining: 15,
      },
      {
        leaveTypeId: 'lt-sick',
        leaveTypeName: 'Sick Leave',
        code: 'sick',
        totalAllowance: 10,
        used: 2,
        pending: 0,
        remaining: 8,
      },
    ]
  }

  // Leave Requests
  getLeaveRequests(tenantId: string, employeeId?: string): LeaveRequest[] {
    let list = this.leaveRequests.filter(r => r.tenantId === tenantId)
    if (employeeId) {
      list = list.filter(r => r.employeeId === employeeId)
    }
    return list
  }

  createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'submittedAt' | 'status'>): LeaveRequest {
    const id = `req-${Math.floor(1000 + Math.random() * 9000)}`
    const newReq: LeaveRequest = {
      ...request,
      id,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    }
    this.leaveRequests.unshift(newReq)

    // Log audit event
    this.addAuditEvent({
      id: `aud-${Date.now()}`,
      tenantId: request.tenantId,
      tenantName: 'Kinetic Technologies',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: request.employeeId,
      userName: request.employeeName,
      userRole: 'employee',
      action: request.isEmergency ? 'Emergency Leave Request Submitted' : 'Standard Leave Request Submitted',
      resource: `Leave #${id} (${request.leaveTypeName})`,
      result: 'Pending Approval',
      riskLevel: request.isEmergency ? 'Medium' : 'Low',
      details: request.reason,
    })

    // Add notification for manager
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      tenantId: request.tenantId,
      userId: 'user-david',
      title: `Pending Leave: ${request.employeeName}`,
      message: `${request.employeeName} submitted a ${request.leaveTypeName} request (${request.requestedDays} day${request.requestedDays > 1 ? 's' : ''}).`,
      type: 'leave',
      isRead: false,
      createdAt: new Date().toISOString(),
      link: '/manager/approvals',
    })

    this.save()
    return newReq
  }

  updateLeaveRequestStatus(
    id: string,
    status: LeaveStatus,
    reviewerName: string,
    comment?: string
  ): LeaveRequest | undefined {
    const idx = this.leaveRequests.findIndex(r => r.id === id)
    if (idx !== -1) {
      const current = this.leaveRequests[idx]
      const updated: LeaveRequest = {
        ...current,
        status,
        reviewedAt: new Date().toISOString(),
        reviewedBy: reviewerName,
        reviewerComment: comment || (status === 'approved' ? 'Approved by manager.' : 'Request declined.'),
      }
      this.leaveRequests[idx] = updated

      // If approved, deduct from balances
      if (status === 'approved') {
        const balances = this.leaveBalances[current.employeeId]
        if (balances) {
          const bal = balances.find(b => b.leaveTypeId === current.leaveTypeId || b.code === current.leaveTypeCode)
          if (bal) {
            bal.used += current.requestedDays
            bal.remaining = Math.max(0, bal.totalAllowance - bal.used)
          }
        }
      }

      // Add audit log
      this.addAuditEvent({
        id: `aud-${Date.now()}`,
        tenantId: current.tenantId,
        tenantName: 'Kinetic Technologies',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userId: 'user-david',
        userName: reviewerName,
        userRole: 'manager',
        action: `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        resource: `Leave #${current.id} (${current.employeeName})`,
        result: status === 'approved' ? 'Success' : 'Warning',
        riskLevel: current.isEmergency ? 'High' : 'Medium',
        details: comment || `Manager reviewed and ${status} request.`,
      })

      // Notify employee
      this.notifications.unshift({
        id: `notif-${Date.now()}`,
        tenantId: current.tenantId,
        userId: current.employeeId,
        title: `Leave Request ${status === 'approved' ? 'Approved' : 'Declined'}`,
        message: `Your ${current.leaveTypeName} for ${current.startDate} has been ${status}. ${comment ? 'Note: ' + comment : ''}`,
        type: 'leave',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/employee/leave',
      })

      this.save()
      return updated
    }
    return undefined
  }

  submitLeaveComplaint(id: string, complaintNote: string): LeaveRequest | undefined {
    const idx = this.leaveRequests.findIndex(r => r.id === id)
    if (idx !== -1) {
      const current = this.leaveRequests[idx]
      const updated: LeaveRequest = {
        ...current,
        status: 'appealed',
        complaintNote,
        complaintStatus: 'pending_human_review',
        complaintSubmittedAt: new Date().toISOString(),
      }
      this.leaveRequests[idx] = updated

      // Notify manager directly (Bypasses AI)
      this.notifications.unshift({
        id: `notif-appeal-${Date.now()}`,
        tenantId: current.tenantId,
        userId: 'user-david',
        title: `🚨 Employee Appeal Filed: ${current.employeeName}`,
        message: `${current.employeeName} appealed AI/System rejection for ${current.startDate}. Reason: "${complaintNote}". Requires Human Manager Review!`,
        type: 'leave',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/manager/approvals',
      })

      this.addAuditEvent({
        id: `aud-appeal-${Date.now()}`,
        tenantId: current.tenantId,
        tenantName: 'Kinetic Technologies',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userId: current.employeeId,
        userName: current.employeeName,
        userRole: 'employee',
        action: 'Employee Dispute / Human Appeal Filed',
        resource: `Leave #${current.id} (${current.employeeName})`,
        result: 'Pending Approval',
        riskLevel: 'High',
        details: `Employee appealed AI/System decision directly to Human Manager: ${complaintNote}`,
      })

      this.save()
      return updated
    }
    return undefined
  }

  deleteLeaveRequest(id: string): boolean {
    const idx = this.leaveRequests.findIndex(r => r.id === id)
    if (idx !== -1) {
      this.leaveRequests.splice(idx, 1)
      this.save()
      return true
    }
    return false
  }

  // Payslips
  getPayslips(tenantId: string, employeeId?: string): Payslip[] {
    let list = this.payslips.filter(p => p.tenantId === tenantId)
    if (employeeId) {
      list = list.filter(p => p.employeeId === employeeId)
    }
    return list
  }
  getPayslip(id: string): Payslip | undefined {
    return this.payslips.find(p => p.id === id)
  }

  // Policies
  getPolicies(tenantId: string): PolicyDocument[] {
    return this.policies.filter(p => p.tenantId === tenantId)
  }
  getPolicy(id: string): PolicyDocument | undefined {
    return this.policies.find(p => p.id === id)
  }
  addPolicy(policy: Omit<PolicyDocument, 'id' | 'uploadedDate' | 'status'>): PolicyDocument {
    const id = `pol-${Date.now().toString(36)}`
    const newPol: PolicyDocument = {
      ...policy,
      id,
      uploadedDate: new Date().toISOString().substring(0, 10),
      status: 'Indexed',
    }
    this.policies.unshift(newPol)
    this.save()
    return newPol
  }

  // Audit Logs
  getAuditLogs(tenantId: string): AuditEvent[] {
    return this.auditLogs.filter(a => a.tenantId === tenantId)
  }
  addAuditEvent(event: AuditEvent) {
    this.auditLogs.unshift(event)
    this.save()
  }

  // Notifications
  getNotifications(userId: string): AppNotification[] {
    return this.notifications.filter(n => n.userId === userId)
  }
  markNotificationRead(id: string) {
    const n = this.notifications.find(item => item.id === id)
    if (n) {
      n.isRead = true
      this.save()
    }
  }

  // Integrations
  getIntegrations(): IntegrationStatusItem[] {
    return this.integrations
  }

  // AI Metrics
  getAIMetrics(): AIUsageMetrics {
    return this.aiUsage
  }
  incrementAIMetrics(toolCalls: number = 0, ragSearches: number = 0) {
    this.aiUsage.totalRequestsToday += 1
    this.aiUsage.toolCallsCount += toolCalls
    this.aiUsage.ragSearchesCount += ragSearches
    this.save()
  }

  // Document Requests
  getDocumentRequests(): HRDocumentRequest[] {
    if (!this.documentRequests || this.documentRequests.length === 0) {
      this.documentRequests = JSON.parse(JSON.stringify(MOCK_DOCUMENT_REQUESTS))
      this.save()
    }
    return this.documentRequests
  }

  resetDocumentRequests(): HRDocumentRequest[] {
    this.documentRequests = JSON.parse(JSON.stringify(MOCK_DOCUMENT_REQUESTS))
    this.save()
    return this.documentRequests
  }

  createDocumentRequest(documentType: string, purpose: string): HRDocumentRequest {
    const nowIso = new Date().toISOString()
    const randomRef = Math.floor(1000 + Math.random() * 9000)
    const newDoc: HRDocumentRequest = {
      id: `doc-req-${Date.now()}`,
      tenantId: 'tenant-kinetic',
      employeeId: 'user-Alice',
      employeeName: 'Alice Johnson',
      employeeNumber: 'KT-8842',
      department: 'Engineering',
      jobTitle: 'Senior Frontend Engineer',
      managerId: 'user-david',
      managerName: 'David Wilson',
      documentType,
      purpose,
      status: 'pending_manager_signature',
      requiresManagerSignature: true,
      submittedAt: nowIso,
      referenceCode: `DOC-2026-${randomRef}`,
      aiVerification: {
        identityVerified: true,
        verificationNotes: 'AI Identity Verified: Active Senior Frontend Engineer in Engineering Dept.',
        policyCheckPassed: true,
        generatedContent: `OFFICIAL ${documentType.toUpperCase()}\n\nDate: ${new Date().toLocaleDateString('en-US')}\nTo Whom It May Concern:\n\nThis letter confirms that Alice Johnson (KT-8842) is employed full-time as Senior Frontend Engineer.\n\nPurpose: ${purpose}\n\nIssued under corporate compliance reference #DOC-2026-${randomRef}.\nKinetic HR Cloud Administration.`,
        verifiedAt: nowIso,
      },
    }
    if (!this.documentRequests) this.documentRequests = []
    this.documentRequests.unshift(newDoc)
    this.save()
    return newDoc
  }

  verify2faAndSignDocument(id: string, otpCode: string): HRDocumentRequest {
    if (!this.documentRequests) this.documentRequests = []
    const doc = this.documentRequests.find((d: HRDocumentRequest) => d.id === id)
    const nowIso = new Date().toISOString()
    if (doc) {
      doc.status = 'approved_and_signed'
      doc.issuedAt = nowIso
      doc.managerSignatureDetails = {
        signedBy: 'David Wilson',
        signedById: 'user-david',
        signedAt: nowIso,
        mobile2faVerified: true,
        phoneNumberMasked: '+1 (555) ***-8901',
        signatureHash: `SIG-2FA-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      }
      this.save()
      return doc
    }
    throw new Error('Document request not found')
  }
}

export const appDataStore = new AppDataStore()
export const storage = appDataStore


