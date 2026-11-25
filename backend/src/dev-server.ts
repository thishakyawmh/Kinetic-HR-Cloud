import http from 'http'
import { loadLocalSettings } from './config/env'
import { validateOrganization, loginEmployee, loginPlatformAdmin } from './functions/auth'
import {
  getLeaveBalances,
  getLeaveRequests,
  createLeaveRequest,
  updateLeaveStatus,
  deleteLeaveRequest,
  getLeaveTypes,
  evaluateAIFairnessLeaves,
  getLeavePlans,
  createLeavePlan,
  deleteLeavePlan,
  triggerAutoCasualLeave,
  processPendingLeaves,
} from './functions/leaves'
import {
  getEmployees,
  getEmployeeById,
  getTeamMembers,
  updateEmployee,
  createEmployee,
  bulkImportEmployees,
} from './functions/employees'
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
  getPayslips,
  getPayslipById,
  getPayslipDownloadUrl,
  calculateBiometricPayroll,
  getPaymentSettings,
  updatePaymentSettings,
} from './functions/payroll'
import {
  getAttendanceRecords,
  recordAttendanceClock,
  syncFingerprintLogs,
} from './functions/attendance'
import {
  getPolicies,
  getPolicyById,
  createPolicy,
  getPolicyDownloadUrl,
} from './functions/policies'
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
  createDocumentRequest,
  getDocumentRequests,
  verify2faAndSignDocument,
  sendDocumentSoftcopy,
  handleDocIntelHealth,
} from './functions/documents'
import {
  getNotifications,
  markNotificationRead,
} from './functions/notifications'
import { handleAIChat, getAIHealth } from './functions/ai'
import { handleSearchPolicies, handleSeedSearch, handleSearchHealth } from './functions/search'
import { ensurePolicyIndex, seedPolicyDocuments } from './config/search'
import { checkServiceBusHealth } from './config/serviceBus'
import { checkAcsHealth } from './config/acs'
import { verifyAzureFrontDoor, verifyMicrosoftEntraId } from './config/azureDiagnostics'

import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { isCosmosConfigured, getCosmosDatabase } from './config/cosmos'

loadLocalSettings({ fallbackToExample: true })

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 7071

interface RouteDefinition {
  method: string
  pattern: RegExp
  paramNames: string[]
  handler: (req: HttpRequest, context: InvocationContext) => Promise<HttpResponseInit>
}

const routes: RouteDefinition[] = []

function addRoute(
  method: string,
  pathPattern: string,
  handler: (req: HttpRequest, context: InvocationContext) => Promise<HttpResponseInit>
) {
  const paramNames: string[] = []
  const regexStr = pathPattern.replace(/\{(\w+)\}/g, (_, name) => {
    paramNames.push(name)
    return '([^/]+)'
  })
  routes.push({
    method: method.toUpperCase(),
    pattern: new RegExp(`^${regexStr}$`),
    paramNames,
    handler,
  })
}

// Register endpoints matching Azure Functions routes
// Auth
addRoute('POST', '/api/auth/organization', validateOrganization)
addRoute('POST', '/api/auth/login', loginEmployee)
addRoute('POST', '/api/auth/platform-login', loginPlatformAdmin)

// Leaves
addRoute('GET', '/api/leaves/balances', getLeaveBalances)
addRoute('GET', '/api/leaves/types', getLeaveTypes)
addRoute('GET', '/api/leaves', getLeaveRequests)
addRoute('POST', '/api/leaves', createLeaveRequest)
addRoute('PATCH', '/api/leaves/{id}/status', updateLeaveStatus)
addRoute('DELETE', '/api/leaves/{id}', deleteLeaveRequest)
addRoute('POST', '/api/leaves/ai-evaluate', evaluateAIFairnessLeaves)
addRoute('GET', '/api/leaves/plans', getLeavePlans)
addRoute('POST', '/api/leaves/plans', createLeavePlan)
addRoute('DELETE', '/api/leaves/plans/{id}', deleteLeavePlan)
addRoute('POST', '/api/leaves/auto-casual-leave', triggerAutoCasualLeave)
addRoute('POST', '/api/leaves/process-pending', processPendingLeaves)

// Employees
addRoute('POST', '/api/employees/import', bulkImportEmployees)
addRoute('GET', '/api/employees/team', getTeamMembers)
addRoute('GET', '/api/employees', getEmployees)
addRoute('GET', '/api/employees/{id}', getEmployeeById)
addRoute('PATCH', '/api/employees/{id}', updateEmployee)
addRoute('POST', '/api/employees', createEmployee)

// Departments
addRoute('GET', '/api/departments', getDepartments)
addRoute('POST', '/api/departments', createDepartment)

// Branches
addRoute('GET', '/api/branches', getBranches)
addRoute('POST', '/api/branches', createBranch)
addRoute('PUT', '/api/branches/{id}', updateBranch)
addRoute('PATCH', '/api/branches/{id}', updateBranch)
addRoute('DELETE', '/api/branches/{id}', deleteBranch)

// Payroll
addRoute('GET', '/api/payroll/payslips', getPayslips)
addRoute('GET', '/api/payroll/payslips/{id}/download-url', getPayslipDownloadUrl)
addRoute('GET', '/api/payroll/payslips/{id}', getPayslipById)
addRoute('POST', '/api/payroll/calculate-biometric', calculateBiometricPayroll)
addRoute('GET', '/api/payroll/settings', getPaymentSettings)
addRoute('POST', '/api/payroll/settings', updatePaymentSettings)

// Attendance & Biometrics
addRoute('GET', '/api/attendance', getAttendanceRecords)
addRoute('POST', '/api/attendance/clock', recordAttendanceClock)
addRoute('POST', '/api/attendance/fingerprint-sync', syncFingerprintLogs)

// Policies
addRoute('GET', '/api/policies', getPolicies)
addRoute('GET', '/api/policies/{id}/download-url', getPolicyDownloadUrl)
addRoute('GET', '/api/policies/{id}', getPolicyById)
addRoute('POST', '/api/policies', createPolicy)

// Admin
addRoute('GET', '/api/admin/stats', getAdminDashboardStats)
addRoute('GET', '/api/admin/audit-logs', getAdminAuditLogs)
addRoute('GET', '/api/admin/integrations', getAdminIntegrations)
addRoute('GET', '/api/admin/ai-usage', getAdminAIUsage)
addRoute('GET', '/api/admin/azure-fleet-diagnostic', getAzureFleetDiagnostic)
addRoute('GET', '/api/admin/dr-status', getDRStatusHandler)
addRoute('POST', '/api/admin/dr-simulate-failover', simulateDRFailoverHandler)


// Platform Admin
addRoute('GET', '/api/platform/organizations', getOrganizations)
addRoute('POST', '/api/platform/organizations', createOrganization)
addRoute('GET', '/api/platform/metrics', getPlatformMetrics)
addRoute('GET', '/api/platform/subscriptions', getSubscriptionPlans)

// HR Documents
addRoute('POST', '/api/documents/request', createDocumentRequest)
addRoute('GET', '/api/documents', getDocumentRequests)
addRoute('POST', '/api/documents/{id}/verify-2fa-sign', verify2faAndSignDocument)
addRoute('POST', '/api/documents/{id}/send-softcopy', sendDocumentSoftcopy)

// Notifications
addRoute('GET', '/api/notifications', getNotifications)
addRoute('PATCH', '/api/notifications/{id}/read', markNotificationRead)

// Azure OpenAI
addRoute('POST', '/api/ai/chat', handleAIChat)
addRoute('GET', '/api/ai/health', getAIHealth)

// Azure AI Search
addRoute('GET', '/api/search/policies', handleSearchPolicies)
addRoute('POST', '/api/search/seed', handleSeedSearch)
addRoute('GET', '/api/search/health', handleSearchHealth)

// Azure AI Document Intelligence
addRoute('GET', '/api/documents/intelligence/health', handleDocIntelHealth)

// Azure Service Bus
addRoute('GET', '/api/servicebus/health', async () => ({
  status: 200,
  jsonBody: await checkServiceBusHealth(),
}))

// Azure Communication Services
addRoute('GET', '/api/acs/health', async () => ({
  status: 200,
  jsonBody: await checkAcsHealth(),
}))

// Azure Front Door (Global Anycast Edge & WAF)
addRoute('GET', '/api/frontdoor/health', async () => ({
  status: 200,
  jsonBody: await verifyAzureFrontDoor(),
}))

// Microsoft Entra ID (Azure AD SSO, RBAC & OIDC)
addRoute('GET', '/api/auth/entra/health', async () => ({
  status: 200,
  jsonBody: await verifyMicrosoftEntraId(),
}))

addRoute('GET', '/api/auth/entra/config', async () => {
  const tenantId = process.env.AZURE_TENANT_ID || '00000000-0000-0000-0000-000000000000'
  const clientId = process.env.AZURE_CLIENT_ID || '00000000-0000-0000-0000-000000000000'
  return {
    status: 200,
    jsonBody: {
      tenantId,
      clientId,
      authority: process.env.AZURE_ENTRA_AUTHORITY || `https://login.microsoftonline.com/${tenantId}`,
      redirectUri: process.env.AZURE_ENTRA_REDIRECT_URI || 'http://localhost:5173/auth/callback',
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      ssoEnabled: true,
      protocol: 'OpenID Connect v2.0 / SAML 2.0',
      compliance: 'Conditional Access & MFA Enforced',
    },
  }
})

addRoute('POST', '/api/auth/entra/sso', async (req) => {
  if (process.env.NODE_ENV === 'production' || (process.env.AZURE_MODE || '').toLowerCase() === 'live') {
    return { status: 403, jsonBody: { error: 'Mock Entra SSO is disabled in production/live mode.' } }
  }
  const body = (await req.json().catch(() => ({}))) as any
  const targetEmail = body?.email || 'admin@sampath.lk'
  const tenantId = process.env.AZURE_TENANT_ID || '00000000-0000-0000-0000-000000000000'
  return {
    status: 200,
    jsonBody: {
      success: true,
      provider: 'Microsoft Entra ID',
      tenantId,
      claims: {
        upn: targetEmail,
        roles: ['HRAdmin', 'BranchManager'],
        iss: process.env.AZURE_ENTRA_ISSUER || `https://login.microsoftonline.com/${tenantId}/v2.0`,
        authMethod: 'MFA_FIDO2_Passkey',
      },
      token: `entra-jwt-bearer-${Date.now()}`,
    },
  }
})



const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-Id, Accept')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const rawUrl = req.url || '/'
  const parsedUrl = new URL(rawUrl, `http://localhost:${PORT}`)
  const pathname = parsedUrl.pathname.replace(/\/$/, '')

  // Read request body
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const bodyText = Buffer.concat(chunks).toString('utf-8')

  // Find matching route
  for (const route of routes) {
    if (route.method === req.method) {
      const match = pathname.match(route.pattern)
      if (match) {
        const params: Record<string, string> = {}
        route.paramNames.forEach((name, idx) => {
          params[name] = match[idx + 1]
        })

        // Build Mock Azure HttpRequest
        const headers = new Headers()
        for (const [k, v] of Object.entries(req.headers)) {
          if (Array.isArray(v)) {
            v.forEach(val => headers.append(k, val))
          } else if (v !== undefined) {
            headers.set(k, v)
          }
        }

        const mockReq: Partial<HttpRequest> = {
          method: req.method,
          url: rawUrl,
          headers,
          query: parsedUrl.searchParams,
          params,
          json: async () => {
            if (!bodyText || !bodyText.trim()) return {}
            try {
              return JSON.parse(bodyText)
            } catch {
              const clean = bodyText.replace(/\\"/g, '"').replace(/^"|"$/g, '')
              return JSON.parse(clean)
            }
          },
          text: async () => bodyText,
        }

        const mockContext: Partial<InvocationContext> = {
          log: console.log,
          error: console.error,
          warn: console.warn,
          info: console.info,
        }

        console.log(`${req.method} ${pathname}`)
        try {
          const result = await route.handler(mockReq as HttpRequest, mockContext as InvocationContext)
          const statusCode = result.status || 200
          const resHeaders = (result.headers as Record<string, string>) || {}

          for (const [hk, hv] of Object.entries(resHeaders)) {
            res.setHeader(hk, hv)
          }

          if (result.jsonBody !== undefined) {
            res.setHeader('Content-Type', 'application/json')
            res.writeHead(statusCode)
            res.end(JSON.stringify(result.jsonBody))
          } else if (result.body !== undefined) {
            res.writeHead(statusCode)
            res.end(result.body)
          } else {
            res.writeHead(statusCode)
            res.end()
          }
        } catch (err: any) {
          console.error('Handler error:', err)
          res.setHeader('Content-Type', 'application/json')
          res.writeHead(500)
          res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }))
        }
        return
      }
    }
  }

  // Route Not Found
  res.setHeader('Content-Type', 'application/json')
  res.writeHead(404)
  res.end(JSON.stringify({ error: `Cannot ${req.method} ${pathname}` }))
})

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Set PORT=<port> to use another port.`)
    process.exit(1)
  } else {
    console.error('Server error:', err)
  }
})

process.on('uncaughtException', (err: any) => {
  console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (reason: any) => {
  console.error('Unhandled Rejection:', reason)
})

server.listen(PORT, async () => {
  let cosmosStatus = 'mock'
  if (isCosmosConfigured()) {
    const db = getCosmosDatabase()
    try {
      const startMs = Date.now()
      await db?.read()
      cosmosStatus = `connected (${Date.now() - startMs}ms)`
    } catch (err: any) {
      cosmosStatus = `fallback (${err.message})`
    }
  }

  const aiEnabled = Boolean(process.env.AZURE_OPENAI_KEY && process.env.AZURE_OPENAI_ENDPOINT)
  const searchEnabled = Boolean(process.env.AZURE_SEARCH_KEY && process.env.AZURE_SEARCH_ENDPOINT)

  if (searchEnabled) {
    ensurePolicyIndex()
      .then(() => seedPolicyDocuments())
      .catch(err => console.warn('[Search] Initial index seed failed:', err?.message || err))
  }

  console.log(
    `[KineticHR] Listening on http://localhost:${PORT} (cosmos=${cosmosStatus}, openai=${aiEnabled ? 'live' : 'mock'}, search=${searchEnabled ? 'live' : 'mock'})`
  )
})
