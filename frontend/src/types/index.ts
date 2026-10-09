export type UserRole = 'employee' | 'manager' | 'admin' | 'platform_admin'

export type SubscriptionTier = 'Starter' | 'Business' | 'Enterprise'

export interface SubscriptionPlan {
  id: string
  name: SubscriptionTier
  description: string
  priceMonthly: number
  employeeLimit: number
  adminLimit: number
  aiMonthlyLimit: number
  storageGb: number
  features: string[]
  badgeVariant?: 'outline' | 'info' | 'destructive'
}

export interface Tenant {
  id: string // e.g. "KIN-8F3A91" or "tenant-kinetic"
  name: string
  code: string
  domain: string
  plan: SubscriptionTier
  industry?: string
  country?: string
  status?: 'Active' | 'Suspended' | 'Pending'
  employeeCount?: number
  adminEmail?: string
  createdAt?: string
  primaryColor?: string
  currency?: string
}

export interface User {
  id: string
  tenantId: string
  name: string
  email: string
  role: UserRole
  department: string
  jobTitle: string
  employeeNumber: string
  avatarUrl?: string
  managerId?: string
  managerName?: string
  hireDate: string
  phone?: string
  location?: string
  branchId?: string
  branchName?: string
  address?: string
  idNumber?: string
  biometricStatus?: string
  password?: string
  passwordHash?: string
}

export interface LeaveType {
  id: string
  tenantId: string
  name: string
  code: 'annual' | 'sick' | 'casual' | 'emergency' | 'other'
  defaultAllowance: number
  requiresManagerApproval: boolean
  description: string
  color: string
}

export interface LeaveBalance {
  leaveTypeId: string
  leaveTypeName: string
  code: 'annual' | 'sick' | 'casual' | 'emergency' | 'other'
  totalAllowance: number
  used: number
  pending: number
  remaining: number
}

export interface AIAnalysisSummary {
  applicablePolicy: string
  employeeRemainingDays: number
  scheduledAbsencesCount: number
  teamCoverageWarning?: string
  recommendationText: string
  requiresHumanApproval: boolean
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'appealed'

export interface LeaveRequest {
  id: string
  tenantId: string
  employeeId: string
  employeeName: string
  department: string
  leaveTypeId: string
  leaveTypeName: string
  leaveTypeCode: 'annual' | 'sick' | 'medical' | 'casual' | 'emergency' | 'other'
  startDate: string
  endDate: string
  requestedDays: number
  reason: string
  status: LeaveStatus
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  reviewerComment?: string
  isEmergency: boolean
  priorLeavesCount?: number
  submissionOrder?: number
  complaintNote?: string
  complaintStatus?: 'pending_human_review' | 'resolved_override' | 'sustained'
  complaintSubmittedAt?: string
  autoApproved?: boolean
  aiAnalysis?: AIAnalysisSummary
}

export interface PayslipBreakdownItem {
  name: string
  amount: number
  category: 'earning' | 'deduction'
  description?: string
}

export interface Payslip {
  id: string
  tenantId: string
  employeeId: string
  periodMonth: string // e.g. "October"
  periodYear: number // e.g. 2026
  payPeriod?: string // e.g. "10/01/2026 - 10/14/2026"
  payDate: string
  filingStatus?: string
  allowancesCount?: number
  basicSalary: number
  allowances: number
  overtime: number
  overtimeHours?: number
  overtimeRate?: number
  overtimePay?: number
  grossSalary: number
  grossPay?: number
  ytdGrossPay?: number
  preTaxMedical?: number
  preTaxDental?: number
  preTax401k?: number
  totalPreTaxDeductions?: number
  ytdPreTaxDeductions?: number
  taxFederal?: number
  taxSocialSecurity?: number
  taxMedicare?: number
  taxState?: number
  statutoryTaxes?: number
  tax: number
  deductions: number
  totalDeductionsAndTaxes?: number
  ytdTotalDeductionsAndTaxes?: number
  netSalary: number
  netPay?: number
  ytdNetPay?: number
  currency: string
  status: 'Published' | 'Processing'
  notes?: string
  breakdown: PayslipBreakdownItem[]
  salaryDiffExplanation?: string
}

export interface PolicyDocument {
  id: string
  tenantId: string
  title: string
  category: 'Leave & Attendance' | 'Compensation & Benefits' | 'Workplace & Remote' | 'Conduct & Compliance' | 'Statutory' | 'Operational' | 'Health & Safety' | string
  version: string
  uploadedDate: string
  status: 'Indexed' | 'Processing' | 'Failed'
  fileSize: string
  summary: string
  keyTerms: string[]
  contentExcerpt?: string
  fileName?: string
  department?: string
}

export interface AuditEvent {
  id: string
  tenantId: string
  tenantName: string
  timestamp: string
  userId: string
  userName: string
  userRole: UserRole
  action: string
  resource: string
  result: 'Success' | 'Pending Approval' | 'Failed' | 'Warning'
  riskLevel: 'Low' | 'Medium' | 'High'
  details: string
}

export interface AIToolExecution {
  name: string
  label: string
  status: 'pending' | 'running' | 'completed' | 'failed'
}

export interface AIMessageSource {
  title: string
  policyId?: string
  section?: string
  snippet?: string
}

export interface AIActionCard {
  type: 'leave_submission' | 'payslip_drilldown' | 'approval_review'
  title: string
  description: string
  data: Record<string, any>
  actionLabel: string
  status?: 'ready' | 'submitted' | 'approved'
}

export interface AIMessageSuggestedOption {
  id: string
  label: string
  actionValue: string
  description?: string
}

export interface AIMessage {
  id: string
  sender: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  sources?: AIMessageSource[]
  toolExecutions?: AIToolExecution[]
  recommendation?: {
    text: string
    approvalRequired: boolean
    approvalRole?: string
  }
  actionCard?: AIActionCard
  suggestedOptions?: AIMessageSuggestedOption[]
  investigationData?: {
    requestId: string
    employeeName: string
    status: string
  }
}

export interface AppNotification {
  id: string
  tenantId: string
  userId: string
  title: string
  message: string
  type: 'leave' | 'payroll' | 'policy' | 'system'
  isRead: boolean
  createdAt: string
  link?: string
}

export interface IntegrationStatusItem {
  id: string
  systemName: string
  category: 'HRMS' | 'Payroll' | 'Attendance' | 'Identity' | 'Notifications'
  status: 'Connected' | 'Warning' | 'Error' | 'Syncing'
  lastSync: string
  latencyMs: number
  endpoint: string
  provider: string
  notes?: string
}

export interface AIUsageMetrics {
  totalRequestsToday: number
  avgResponseTimeMs: number
  toolCallsCount: number
  ragSearchesCount: number
  approvalsCount: number
  failedRequestsCount: number
  tokenUsage: {
    prompt: number
    completion: number
    total: number
  }
}

export type HRDocumentStatus =
  | 'submitted'
  | 'ai_verifying'
  | 'pending_manager_signature'
  | 'approved_and_signed'
  | 'auto_issued'
  | 'rejected'

export interface HRDocumentRequest {
  id: string
  tenantId: string
  employeeId: string
  employeeName: string
  employeeNumber: string
  department: string
  jobTitle: string
  managerId?: string
  managerName?: string
  documentType: string
  purpose: string
  status: HRDocumentStatus
  requiresManagerSignature: boolean
  submittedAt: string
  issuedAt?: string
  referenceCode: string
  aiVerification: {
    identityVerified: boolean
    verificationNotes: string
    policyCheckPassed: boolean
    generatedContent: string
    verifiedAt: string
  }
  managerSignatureDetails?: {
    signedBy: string
    signedById: string
    signedAt: string
    mobile2faVerified: boolean
    phoneNumberMasked: string
    signatureHash: string
  }
}

export interface WorkspaceRole {
  id: string
  name: string
  department?: string
  baseSalary: number
  currency: string
  salaryPeriod: 'annual' | 'monthly' | 'hourly'
  overtimeMultiplier: number
  description?: string
  responsibilities?: string[]
  assignedCount?: number
  updatedAt?: string
}

export type BranchType = 'Headquarters' | 'Regional Branch' | 'Hub' | 'Warehouse / Facility' | 'Remote Hub'

export interface BranchHoliday {
  id: string
  name: string
  date: string
  type: string
  notes?: string
}

export interface Branch {
  id: string
  tenantId: string
  name: string
  code: string
  type: BranchType
  address: string
  city: string
  country: string
  phone?: string
  email?: string
  timezone?: string
  branchManagerId?: string
  branchManagerName?: string
  employeeCount?: number
  isHeadquarters: boolean
  status: 'Active' | 'Inactive'
  holidays?: BranchHoliday[]
  createdAt: string
}

export interface Department {
  id: string
  tenantId: string
  name: string
  head: string
  threshold?: string
  description?: string
  status?: 'Active' | 'Inactive'
  count?: number
  createdAt?: string
}
