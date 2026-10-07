import http from 'http'
import fs from 'fs'
import path from 'path'
import { validateOrganization, loginEmployee } from './functions/auth'
import {
  getLeaveBalances,
  getLeaveRequests,
  createLeaveRequest,
  updateLeaveStatus,
  getLeaveTypes,
} from './functions/leaves'
import {
  getEmployees,
  getEmployeeById,
  getTeamMembers,
  updateEmployee,
  createEmployee,
} from './functions/employees'
import {
  getPayslips,
  getPayslipById,
  getPayslipDownloadUrl,
} from './functions/payroll'
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
} from './functions/admin'
import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'

// Load environment variables from local.settings.json or fallback to example
try {
  let settingsPath = path.resolve(__dirname, '../../local.settings.json')
  if (!fs.existsSync(settingsPath)) {
    settingsPath = path.resolve(process.cwd(), 'local.settings.json')
  }
  const examplePath = path.resolve(__dirname, '../../local.settings.json.example')
  const pathToLoad = fs.existsSync(settingsPath) ? settingsPath : examplePath
  if (fs.existsSync(pathToLoad)) {
    const raw = fs.readFileSync(pathToLoad, 'utf-8')
    const parsed = JSON.parse(raw)
    if (parsed.Values) {
      for (const [k, v] of Object.entries(parsed.Values)) {
        if (!process.env[k]) {
          process.env[k] = String(v)
        }
      }
    }
  }
} catch (e) {
  console.warn('Could not load local.settings.json', e)
}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 7072

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

// Leaves
addRoute('GET', '/api/leaves/balances', getLeaveBalances)
addRoute('GET', '/api/leaves/types', getLeaveTypes)
addRoute('GET', '/api/leaves', getLeaveRequests)
addRoute('POST', '/api/leaves', createLeaveRequest)
addRoute('PATCH', '/api/leaves/{id}/status', updateLeaveStatus)

// Employees
addRoute('GET', '/api/employees/team', getTeamMembers)
addRoute('GET', '/api/employees', getEmployees)
addRoute('GET', '/api/employees/{id}', getEmployeeById)
addRoute('PATCH', '/api/employees/{id}', updateEmployee)
addRoute('POST', '/api/employees', createEmployee)

// Payroll
addRoute('GET', '/api/payroll/payslips', getPayslips)
addRoute('GET', '/api/payroll/payslips/{id}/download-url', getPayslipDownloadUrl)
addRoute('GET', '/api/payroll/payslips/{id}', getPayslipById)

// Policies
addRoute('GET', '/api/policies', getPolicies)
addRoute('GET', '/api/policies/{id}/download-url', getPolicyDownloadUrl)
addRoute('GET', '/api/policies/{id}', getPolicyById)
addRoute('POST', '/api/policies', createPolicy)

// Admin
addRoute('GET', '/api/admin/stats', getAdminDashboardStats)
addRoute('GET', '/api/admin/audit-logs', getAdminAuditLogs)
addRoute('GET', '/api/admin/integrations', getAdminIntegrations)


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
          json: async () => (bodyText ? JSON.parse(bodyText) : null),
          text: async () => bodyText,
        }

        const mockContext: Partial<InvocationContext> = {
          log: console.log,
          error: console.error,
          warn: console.warn,
          info: console.info,
        }

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
    console.error(`\n❌ Port ${PORT} is already in use by another process.`)
    console.error(`👉 You can free the port or specify another port using: $env:PORT="7072"; npm run dev\n`)
    process.exit(1)
  } else {
    console.error('Server error:', err)
  }
})

server.listen(PORT, () => {
  console.log(`\n🚀 Kinetic HR Azure Backend running locally on http://localhost:${PORT}`)
  console.log(`📡 Ready for requests from frontend\n`)
})
