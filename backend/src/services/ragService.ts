import { queryTenantItems } from '../config/cosmos'
import { getSeedData } from '../config/seedDataset'
import { searchPolicies, SearchResultItem } from '../config/search'
import { AuthenticatedUser } from '../middleware/auth'

async function fetchCollectionWithFallback(
  containerName: string,
  tenantId: string,
  seedList: any[]
): Promise<any[]> {
  try {
    const items = await queryTenantItems<any>(
      containerName,
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @t',
      [{ name: '@t', value: tenantId }]
    )
    if (items && items.length > 0) return items
  } catch (err: any) {
    console.warn(`[RAG] Query on "${containerName}" failed: ${err?.message || err}`)
  }
  return seedList.filter((item: any) => item.tenantId === tenantId)
}

export async function buildPlatformGroundingContext(tenantId: string, user: AuthenticatedUser): Promise<string> {
  const seed = getSeedData()
  const org = seed.ORGANIZATIONS.find((o: any) => o.id === tenantId || o.tenantId === tenantId) || {
    name: 'Sampath Bank PLC',
    code: 'SAMPATH',
    industry: 'Banking & Financial Services',
    currency: 'LKR',
  }

  const [branches, departments, leaves, allUsers] = await Promise.all([
    fetchCollectionWithFallback('branches', tenantId, seed.BRANCHES || []),
    fetchCollectionWithFallback('departments', tenantId, seed.DEPARTMENTS || []),
    fetchCollectionWithFallback('leaves', tenantId, seed.LEAVE_REQUESTS || []),
    fetchCollectionWithFallback('users', tenantId, seed.USERS || []),
  ])

  const myTeam = allUsers
    .filter((u: any) => u.managerId === user.id || u.managerName === user.name || u.branchName?.includes('Colombo Fort'))
    .slice(0, 10)

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

### Scheduled Leaves:
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

export async function retrievePolicyContext(
  message: string,
  tenantId: string
): Promise<{ searchGrounding: string; retrievedDocs: SearchResultItem[] }> {
  try {
    const searchRes = await searchPolicies(message, { tenantId, top: 3 })
    if (searchRes.success && searchRes.results.length > 0) {
      const searchGrounding = `
=== RETRIEVED ENTERPRISE POLICIES (via Azure AI Search) ===
${searchRes.results
  .map(
    r =>
      `• [Document: ${r.title}] (Category: ${r.category}, Version: ${r.version}, Relevance Score: ${r.score.toFixed(2)})
Summary: ${r.summary}
Excerpt: ${r.content}`
  )
  .join('\n\n')}
============================================================`
      return { searchGrounding, retrievedDocs: searchRes.results }
    }
  } catch (err: any) {
    console.warn(`[RAG] Policy search retrieval failed: ${err?.message || err}`)
  }

  return { searchGrounding: '', retrievedDocs: [] }
}

export function buildExecutiveSystemPrompt(
  user: AuthenticatedUser,
  platformDataGrounding: string,
  searchGrounding: string
): string {
  const department = user.department || 'Retail Banking & Branches'
  return `You are the Kinetic HR Cloud AI Executive Copilot powered by Azure OpenAI (GPT-4o) and Azure AI Search.
You are assisting ${user.name} (${user.role}, Department: ${department}) at ${user.tenantId}.

=== LIVE MULTI-TENANT PLATFORM KNOWLEDGE BASE ===
${platformDataGrounding}
==================================================
${searchGrounding}

Guidelines:
1. Base answers on the Live Platform Knowledge Base and any Retrieved Enterprise Policies from Azure AI Search above.
2. Provide exact, accurate details (e.g. employee names, dates, branch names, specific numbers, and policy statutory guidelines).
3. If referencing policies retrieved from Azure AI Search, cite the policy document title.
4. Be professional, supportive, concise, and structured with clean markdown, bolding, and bullet points.
5. Keep the Sri Lankan enterprise context accurate (Sampath Bank PLC, Keells Supermarkets, Singer Sri Lanka PLC).`
}
