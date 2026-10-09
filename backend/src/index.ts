import { app } from '@azure/functions'
import { validateOrganization, loginEmployee, loginPlatformAdmin } from './functions/auth'
import {
  getLeaveBalances,
  getLeaveRequests,
  createLeaveRequest,
  updateLeaveStatus,
  evaluateAIFairnessLeaves,
  getLeaveTypes,
} from './functions/leaves'
import {
  getEmployees,
  getEmployeeById,
  getTeamMembers,
  updateEmployee,
  createEmployee,
  bulkImportEmployees,
} from './functions/employees'
import { getPayslips, getPayslipById, getPayslipDownloadUrl } from './functions/payroll'
import { getPolicies, getPolicyById, createPolicy, getPolicyDownloadUrl } from './functions/policies'
import {
  createDocumentRequest,
  getDocumentRequests,
  verify2faAndSignDocument,
  sendDocumentSoftcopy,
} from './functions/documents'
import {
  getDepartments,
  createDepartment,
} from './functions/departments'
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from './functions/branches'
import {
  getAdminDashboardStats,
  getAdminAuditLogs,
  getAdminIntegrations,
  getAdminAIUsage,
  getAzureFleetDiagnostic,
  getDRStatusHandler,
  simulateDRFailoverHandler,
} from './functions/admin'
import {
  getOrganizations,
  createOrganization,
  getPlatformMetrics,
  getSubscriptionPlans,
} from './functions/platform'
import {
  getAttendanceRecords,
  recordAttendanceClock,
} from './functions/attendance'
import {
  getNotifications,
  markNotificationRead,
} from './functions/notifications'


// Auth Routes
app.http('validateOrganization', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/organization',
  handler: validateOrganization,
})

app.http('loginEmployee', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: loginEmployee,
})

app.http('loginPlatformAdmin', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/platform-login',
  handler: loginPlatformAdmin,
})

// Leaves & Approvals
app.http('getLeaveBalances', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'leaves/balances',
  handler: getLeaveBalances,
})

app.http('getLeaveRequests', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'leaves',
  handler: getLeaveRequests,
})

app.http('createLeaveRequest', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'leaves',
  handler: createLeaveRequest,
})

app.http('updateLeaveStatus', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'leaves/{id}/status',
  handler: updateLeaveStatus,
})

app.http('getLeaveTypes', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'leaves/types',
  handler: getLeaveTypes,
})

app.http('evaluateAIFairnessLeaves', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'leaves/ai-evaluate',
  handler: evaluateAIFairnessLeaves,
})

// Employees & Organization Directory
app.http('getTeamMembers', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'employees/team',
  handler: getTeamMembers,
})

app.http('getEmployees', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'employees',
  handler: getEmployees,
})

app.http('getEmployeeById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'employees/{id}',
  handler: getEmployeeById,
})

app.http('updateEmployee', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'employees/{id}',
  handler: updateEmployee,
})

app.http('createEmployee', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'employees',
  handler: createEmployee,
})

app.http('bulkImportEmployees', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'employees/import',
  handler: bulkImportEmployees,
})

// Departments & Workspaces
app.http('getDepartments', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'departments',
  handler: getDepartments,
})

app.http('createDepartment', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'departments',
  handler: createDepartment,
})

// Payroll & Payslips (Blob Storage integration)
app.http('getPayslips', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'payroll/payslips',
  handler: getPayslips,
})

app.http('getPayslipById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'payroll/payslips/{id}',
  handler: getPayslipById,
})

app.http('getPayslipDownloadUrl', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'payroll/payslips/{id}/download-url',
  handler: getPayslipDownloadUrl,
})

// Policies
app.http('getPolicies', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'policies',
  handler: getPolicies,
})

app.http('getPolicyById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'policies/{id}',
  handler: getPolicyById,
})

app.http('createPolicy', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'policies',
  handler: createPolicy,
})

app.http('getPolicyDownloadUrl', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'policies/{id}/download-url',
  handler: getPolicyDownloadUrl,
})

// HR Document Requests & Manager 2FA Signing
app.http('createDocumentRequest', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'documents/request',
  handler: createDocumentRequest,
})

app.http('getDocumentRequests', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'documents',
  handler: getDocumentRequests,
})

app.http('verify2faAndSignDocument', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'documents/{id}/verify-2fa-sign',
  handler: verify2faAndSignDocument,
})

app.http('sendDocumentSoftcopy', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'documents/{id}/send-softcopy',
  handler: sendDocumentSoftcopy,
})

// Organization HR Admin Endpoints
app.http('getAdminDashboardStats', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'admin/stats',
  handler: getAdminDashboardStats,
})

app.http('getAdminAuditLogs', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'admin/audit-logs',
  handler: getAdminAuditLogs,
})

app.http('getAdminIntegrations', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'admin/integrations',
  handler: getAdminIntegrations,
})

app.http('getAdminAIUsage', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'admin/ai-usage',
  handler: getAdminAIUsage,
})

// Kinetic Platform Admin Endpoints
app.http('getPlatformOrganizations', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'platform/organizations',
  handler: getOrganizations,
})

app.http('createPlatformOrganization', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'platform/organizations',
  handler: createOrganization,
})

app.http('getPlatformMetrics', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'platform/metrics',
  handler: getPlatformMetrics,
})

app.http('getPlatformSubscriptions', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'platform/subscriptions',
  handler: getSubscriptionPlans,
})

// Branches Endpoints
app.http('getBranches', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'branches',
  handler: getBranches,
})

app.http('createBranch', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'branches',
  handler: createBranch,
})

app.http('updateBranch', {
  methods: ['PUT', 'PATCH'],
  authLevel: 'anonymous',
  route: 'branches/{id}',
  handler: updateBranch,
})

app.http('deleteBranch', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'branches/{id}',
  handler: deleteBranch,
})

app.http('getAzureFleetDiagnostic', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'admin/azure-fleet-diagnostic',
  handler: getAzureFleetDiagnostic,
})

app.http('getDRStatus', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'admin/dr-status',
  handler: getDRStatusHandler,
})

app.http('simulateDRFailover', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'admin/dr-simulate-failover',
  handler: simulateDRFailoverHandler,
})

app.http('getAttendanceRecords', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'attendance',
  handler: getAttendanceRecords,
})

app.http('recordAttendanceClock', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'attendance/clock',
  handler: recordAttendanceClock,
})

app.http('getNotifications', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'notifications',
  handler: getNotifications,
})

app.http('markNotificationRead', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'notifications/{id}/read',
  handler: markNotificationRead,
})

// Azure OpenAI Endpoints
import { handleAIChat, getAIHealth } from './functions/ai'

app.http('handleAIChat', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'ai/chat',
  handler: handleAIChat,
})

app.http('getAIHealth', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'ai/health',
  handler: getAIHealth,
})




