import { app } from '@azure/functions'
import { validateOrganization, loginEmployee } from './functions/auth'
import {
  getLeaveBalances,
  getLeaveRequests,
  createLeaveRequest,
  updateLeaveStatus,
  evaluateAIFairnessLeaves,
} from './functions/leaves'
import { getEmployees, getEmployeeById } from './functions/employees'
import { getPayslips, getPayslipDownloadUrl } from './functions/payroll'
import { getPolicies, createPolicy } from './functions/policies'
import {
  createDocumentRequest,
  getDocumentRequests,
  verify2faAndSignDocument,
  sendDocumentSoftcopy,
} from './functions/documents'

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

app.http('evaluateAIFairnessLeaves', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'leaves/ai-evaluate',
  handler: evaluateAIFairnessLeaves,
})

// Employees & Organization Directory
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

// Payroll & Payslips (Blob Storage integration)
app.http('getPayslips', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'payroll/payslips',
  handler: getPayslips,
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

app.http('createPolicy', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'policies',
  handler: createPolicy,
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
