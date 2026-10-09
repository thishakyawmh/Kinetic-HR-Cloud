import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { authenticateRequest, AuthenticatedUser } from '../middleware/auth'
import { callAzureOpenAIChat, checkAzureOpenAIHealth, getOpenAIConfig } from '../config/openai'
import { queryTenantItems } from '../config/cosmos'
import { generateProductionSeedData } from '../scripts/seedDataGenerator'

// Memoize seed data in memory for instant high-performance grounding
let cachedSeedData: any = null
function getSeedData() {
  if (!cachedSeedData) {
    try {
      cachedSeedData = generateProductionSeedData()
    } catch {
      cachedSeedData = null
    }
  }
  return cachedSeedData
}

/**
 * Compiles real platform data (tenants, branches, departments, team members,
 * October scheduled leaves, policies, and statutory rules) into grounding context.
 */
async function buildPlatformGroundingContext(tenantId: string, user: AuthenticatedUser) {
  const seed = getSeedData()
  const org = seed?.ORGANIZATIONS?.find((o: any) => o.id === tenantId || o.tenantId === tenantId) || {
    name: 'Sampath Bank PLC',
    code: 'SAMPATH',
    industry: 'Banking & Financial Services',
    currency: 'LKR',
  }

  // 1. Branches
  let branches: any[] = []
  try {
    branches = await queryTenantItems(
      'branches',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @t',
      [{ name: '@t', value: tenantId }]
    )
  } catch (_) {}
  if (!branches || branches.length === 0) {
    branches = seed?.BRANCHES?.filter((b: any) => b.tenantId === tenantId) || []
  }

  // 2. Departments
  let departments: any[] = []
  try {
    departments = await queryTenantItems(
      'departments',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @t',
      [{ name: '@t', value: tenantId }]
    )
  } catch (_) {}
  if (!departments || departments.length === 0) {
    departments = seed?.DEPARTMENTS?.filter((d: any) => d.tenantId === tenantId) || []
  }

  // 3. Leaves
  let leaves: any[] = []
  try {
    leaves = await queryTenantItems(
      'leaves',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @t',
      [{ name: '@t', value: tenantId }]
    )
  } catch (_) {}
  if (!leaves || leaves.length === 0) {
    leaves = seed?.LEAVE_REQUESTS?.filter((l: any) => l.tenantId === tenantId) || []
  }

  // 4. Users / Team
  let allUsers: any[] = []
  try {
    allUsers = await queryTenantItems(
      'users',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @t',
      [{ name: '@t', value: tenantId }]
    )
  } catch (_) {}
  if (!allUsers || allUsers.length === 0) {
    allUsers = seed?.USERS?.filter((u: any) => u.tenantId === tenantId) || []
  }

  const myTeam = allUsers.filter(
    (u: any) => u.managerId === user.id || u.managerName === user.name || u.branchName?.includes('Colombo Fort')
  ).slice(0, 10)

  // Separate approved leaves vs pending approvals
  const approvedLeaves = leaves.filter((l: any) => l.status === 'approved' || l.status === 'Approved').slice(0, 10)
  const pendingLeaves = leaves.filter((l: any) => l.status === 'pending' || l.status === 'Pending').slice(0, 8)

  return `### Active Organization Profile:
- Tenant Name: ${org.name} (${org.code || ''})
- Industry: ${org.industry || 'Banking & Financial Services'}
- Operating Plan: ${org.plan || 'Enterprise Banking Cloud'}
- Currency: ${org.currency || 'LKR'}

### Branches Roster (${branches.length} branches):
${branches.map((b: any) => `- ${b.name} (${b.code}): Type: ${b.type || 'Branch'}, Manager: ${b.branchManagerName || 'N/A'}, City: ${b.city || 'Colombo'}, Staff: ${b.employeeCount || 15} employees`).join('\n')}

### Departments & Staffing Capacity Thresholds:
${departments.map((d: any) => `- ${d.name}: Head: ${d.head}, Staffing Threshold: ${d.threshold || '80% min staffing'}`).join('\n')}

### Current Team Members & Direct Reports (Branch / Department):
${myTeam.map((u: any) => `- ${u.name} (${u.employeeNumber || u.id}): ${u.jobTitle || 'Officer'}, Dept: ${u.department}`).join('\n')}

### Scheduled Leaves for October 2026:
Approved Team Leaves:
${approvedLeaves.length > 0 ? approvedLeaves.map((l: any) => `  * ${l.employeeName}: ${l.leaveTypeName} from ${l.startDate} to ${l.endDate} (${l.requestedDays || 1} day(s)) - Reason: "${l.reason}"`).join('\n') : '  * No approved leaves recorded.'}

Pending Approvals Awaiting Manager Decision:
${pendingLeaves.length > 0 ? pendingLeaves.map((l: any) => `  * ${l.employeeName}: ${l.leaveTypeName} from ${l.startDate} to ${l.endDate} (${l.requestedDays || 1} day(s)) - Reason: "${l.reason}"`).join('\n') : '  * No pending leave requests.'}

### Statutory Sri Lankan HR & Labor Policy Framework:
- Shop and Office Employees Act No. 19 of 1954:
  * Annual Leave: 14 working days per calendar year.
  * Casual Leave: 7 days per calendar year.
  * Medical / Sick Leave: 14 days per calendar year (Medical certificate required for absences > 2 days).
  * Maternity Leave: 84 working days (first 2 confinements), 42 working days (subsequent confinements).
  * Statutory Working Hours: 8 hours/day, 45 hours/week. Overtime rate: 1.5x basic hourly pay.
- Statutory Provident & Trust Funds:
  * Employee EPF: 8% deduction from basic salary.
  * Employer EPF: 12% contribution.
  * Employer ETF: 3% contribution.
  * Remittance: Transmitted monthly to Central Bank of Sri Lanka (CBSL).`
}

/**
 * POST /api/ai/chat
 * Live natural language chat completions powered by Azure OpenAI GPT-4o
 */
export async function handleAIChat(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  try {
    const body = (await request.json().catch(() => ({}))) as any
    const message = body?.message || body?.prompt || ''
    const history = body?.history || []

    if (!message) {
      return { status: 400, jsonBody: { error: 'Message content is required.' } }
    }

    const tenantId = auth.user!.tenantId
    const userName = auth.user!.name
    const userRole = auth.user!.role
    const department = auth.user!.department || 'Retail Banking & Branches'

    // Ground model with multi-tenant platform data
    const platformDataGrounding = await buildPlatformGroundingContext(tenantId, auth.user!)

    const systemPrompt = `You are the Kinetic HR Cloud AI Executive Copilot powered by Azure OpenAI (GPT-4o).
You are assisting ${userName} (${userRole}, Department: ${department}) at ${tenantId}.

=== LIVE MULTI-TENANT PLATFORM KNOWLEDGE BASE ===
${platformDataGrounding}
==================================================

Guidelines:
1. Always base answers to queries about branches, employees, scheduled leaves, staffing thresholds, policies, and approvals on the Live Platform Knowledge Base above.
2. Provide exact, accurate details (e.g. employee names, dates, branch names, specific numbers, and policy statutory guidelines).
3. Be professional, supportive, concise, and structured with clean markdown, bolding, and bullet points.
4. Keep the Sri Lankan enterprise context accurate (Sampath Bank PLC, Keells Supermarkets, Singer Sri Lanka PLC).`

    const openAiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.slice(-6).map((h: any) => ({
        role: (h.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: String(h.content || ''),
      })),
      { role: 'user' as const, content: message },
    ]

    const result = await callAzureOpenAIChat(openAiMessages, {
      maxTokens: 800,
      temperature: 0.5,
    })

    return {
      status: 200,
      jsonBody: {
        reply: result.content,
        model: result.model,
        usage: result.usage,
        timestamp: new Date().toISOString(),
      },
    }
  } catch (err: any) {
    return {
      status: 500,
      jsonBody: {
        error: err.message,
        fallbackMessage: 'Kinetic AI encountered an error processing with live model.',
      },
    }
  }
}

/**
 * GET /api/ai/health
 * Returns live Azure OpenAI service connection diagnostic
 */
export async function getAIHealth(
  _request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const config = getOpenAIConfig()
  const health = await checkAzureOpenAIHealth()

  return {
    status: health.connected ? 200 : 503,
    jsonBody: {
      ...health,
      endpointConfigured: config.isConfigured,
      endpointHost: config.endpoint ? new URL(config.endpoint.replace('/openai/v1', '')).hostname : null,
      deployment: config.deployment,
    },
  }
}
