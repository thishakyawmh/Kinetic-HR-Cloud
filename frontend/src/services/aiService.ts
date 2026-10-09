import { AIMessage } from '@/types'
import { appDataStore } from './storage'
import { apiClient } from './apiClient'

export interface AIServiceStreamCallback {
  onToolStep?: (toolName: string, label: string) => void
  onComplete?: (message: AIMessage) => void
}

export const aiService = {
  async sendMessage(
    userMessage: string,
    context: {
      userId: string
      tenantId: string
      userName: string
      routeContext?: string
      payslipId?: string
    },
    callback?: AIServiceStreamCallback
  ): Promise<AIMessage> {
    const q = userMessage.toLowerCase()

    // 0A-0. Specialized Priority Arbitration Scenario (On-Call Coverage Conflict)
    if (
      q.includes('arbitration') ||
      (q.includes('kasun') && (q.includes('leave') || q.includes('cover') || q.includes('duty') || q.includes('applying'))) ||
      (q.includes('cover') && q.includes('oct 11'))
    ) {
      callback?.onToolStep?.('leave_balance_validator', 'Auditing Dinuka Perera annual leave quota balance...')
      await new Promise(r => setTimeout(r, 600))

      callback?.onToolStep?.('priority_matrix_engine', 'Evaluating leave frequency algorithm: 1st leave application of 2026...')
      await new Promise(r => setTimeout(r, 600))

      callback?.onToolStep?.('duty_reassignment_dispatcher', 'Triggering automated dispatch & notifying Kasun Perera for on-call duty...')
      await new Promise(r => setTimeout(r, 500))

      appDataStore.incrementAIMetrics(3, 1)

      const response: AIMessage = {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: `### 🤖 Kinetic AI Priority Arbitration Report

**Employee:** **Dinuka Perera** • **Role:** Senior Credit Officer / Branch Management Lead  
**Target Date:** **October 11, 2026** • **Arbitration Status:** **APPROVED**

---

#### 1. 📊 Leave Balance & Quota Audit
• **Quota Status:** **Proper & Fully Verified**.
• **Remaining Annual Balance:** **20 Days** (0 days used so far in 2026).
• **Quota Entitlement:** Full 20-day annual paid time off allocation is active with zero prior deductions.

#### 2. ⚖️ Kinetic AI Prioritization Analysis
• **Frequency Matrix Evaluation:** This is your **first leave application of the entire year (2026)**.
• **Priority Algorithm Decision:** Under Kinetic HR Policy §4.3 (*First-Time Annual Leave Priority Clause*), employees requesting their first annual leave of the calendar year receive **top-tier priority (Priority Score: 98/100)** over static standby coverage assignments.
• **Arbitration Verdict:** **YOUR LEAVE HAS BEEN APPROVED.** 1 day deducted from your annual balance (19 Annual Leave days remaining).

#### 3. 📞 Automated On-Call Duty Re-assignment Action
• **Duty Action Triggered:** **Kasun Perera** called and assigned to **On-Call Duty** coverage on October 11, 2026.
• **Notification Status:** Direct SMS & In-App Call Dispatch sent to Kasun Perera (\`kasun.perera@boc.lk\`). Duty handoff audit log registered in Azure Cosmos DB.

---

### ✅ Summary of Execution:
- **Leave Request:** **Approved** (Oct 11, 2026)
- **Updated Quota:** 19 Annual Leave Days Remaining
- **On-Call Duty Action:** **Kasun Perera** notified and assigned to handle on-call coverage`,
        sources: [
          {
            title: 'Kinetic HR Arbitration Policy §4.3',
            policyId: 'pol-priority-arb',
            snippet: 'First-time annual leave requests take automatic priority over pre-assigned backup duties.',
          },
          {
            title: 'Automated On-Call Handoff Matrix',
            policyId: 'pol-oncall-dispatch',
            snippet: 'When assigned backup takes prioritized leave, primary employee is recalled for on-call duty.',
          },
        ],
        toolExecutions: [
          { name: 'leave_balance_validator', label: 'Balance Verified: 20 Annual Days Available (0 Used in 2026)', status: 'completed' },
          { name: 'priority_matrix_engine', label: 'Priority Score: 98/100 (First Annual Leave of 2026)', status: 'completed' },
          { name: 'duty_reassignment_dispatcher', label: 'Action: Kasun Perera Called & Assigned to On-Call Duty', status: 'completed' },
        ],
      }

      callback?.onComplete?.(response)
      return response
    }

    // 0. Live Azure OpenAI Inference via Backend API
    try {
      callback?.onToolStep?.('azure_openai_inference', 'Querying live Azure OpenAI GPT-4o model...')
      const apiRes = await apiClient.post<{
        reply: string
        model?: string
        searchRetrievedCount?: number
        retrievedPolicies?: Array<{ id: string; title: string; score: number }>
      }>('/ai/chat', {
        message: userMessage,
        context,
      })
      if (apiRes?.reply) {
        appDataStore.incrementAIMetrics(1, 1)
        const toolExecutions: any[] = [
          { name: 'azure_openai', label: `Inference via Azure OpenAI (${apiRes.model || 'gpt-4o'})`, status: 'completed' },
        ]
        if (apiRes.searchRetrievedCount && apiRes.searchRetrievedCount > 0) {
          toolExecutions.push({
            name: 'azure_ai_search',
            label: `RAG Knowledge: ${apiRes.searchRetrievedCount} policy document(s) retrieved via Azure AI Search (kinetichr-search)`,
            status: 'completed',
          })
        }

        const liveResponse: AIMessage = {
          id: `ai-msg-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: apiRes.reply,
          toolExecutions,
        }
        callback?.onComplete?.(liveResponse)
        return liveResponse
      }
    } catch (e) {
      console.warn('Live Azure OpenAI fallback to local scenario engine:', e)
    }

    // 0A. Manager Supervisory Scenario: Team Coverage & Capacity Risk Assessment
    if (
      q.includes('coverage') ||
      q.includes('bottleneck') ||
      q.includes('capacity') ||
      q.includes('staffing') ||
      q.includes('next week') ||
      q.includes('oct 7') ||
      q.includes('overlapping') ||
      q.includes('clash')
    ) {
      callback?.onToolStep?.('team_schedule_matrix', 'Querying staff schedule matrix & daily workplace attendance...')
      await new Promise(r => setTimeout(r, 450))

      callback?.onToolStep?.('threshold_evaluation', 'Evaluating 70% minimum departmental staff presence SLA...')
      await new Promise(r => setTimeout(r, 450))

      callback?.onToolStep?.('risk_analyzer', 'Analyzing critical daily shift & duty coverage impact...')
      await new Promise(r => setTimeout(r, 400))

      appDataStore.incrementAIMetrics(3, 1)

      const response: AIMessage = {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: `### ⚠️ Workplace Staff Presence & Coverage Assessment for Engineering

I have analyzed the **Engineering Department (12 members)** daily presence for next week (Oct 5 – Oct 11, 2026):

• **Critical Capacity Dip (Oct 7 – Oct 8):**
  - **Marcus Vance (Backend)** and **Elena Rostova (Frontend)** have scheduled leaves overlapping on Wednesday and Thursday.
  - **Priya Patel (DevOps)** is scheduled for remote standby training.
  - Department active on-duty presence will drop to **75% (9 of 12 present)**, approaching your **70% departmental safety threshold**.

• **Workplace Operations & Coverage Impact:**
  - Adequate on-duty staff presence is required for daily operational continuity. With coverage constrained on Oct 7-8, daily shift handovers and critical approvals may bottleneck unless essential duties are reallocated prior to Oct 6.

• **Supervisory Recommendation:**
  - Suggest shifting Marcus's urgent daily duties to Alice Johnson or David Wilson.
  - No additional non-emergency leave should be approved for Wednesday, Oct 7 or Thursday, Oct 8.`,
        sources: [
          {
            title: 'Departmental Staffing SLA (Engineering Sec 3.1)',
            policyId: 'pol-staffing',
            snippet: 'Engineering teams must maintain 70% active staff presence during scheduled work weeks.',
          },
          {
            title: 'Workplace Attendance & Coverage Policy Q4 2026',
            policyId: 'pol-schedule',
            snippet: 'Minimum 2 backend and 2 frontend engineers must be present on duty each day.',
          },
        ],
        toolExecutions: [
          { name: 'team_schedule_matrix', label: 'Aggregated 12 Employee Calendars for Week 41', status: 'completed' },
          { name: 'threshold_evaluation', label: 'Presence Level: 75% (Threshold: 70%)', status: 'completed' },
          { name: 'risk_analyzer', label: 'Bottleneck Identified: Workplace Staffing Shortage', status: 'completed' },
        ],
        recommendation: {
          text: 'Capacity is tight at 75% on Oct 7-8. Recommend freezing discretionary leave for those two dates.',
          approvalRequired: false,
        },
      }

      callback?.onComplete?.(response)
      return response
    }

    // 0A-2. Manager Investigation Scenario
    if (q.includes('investigate')) {
      callback?.onToolStep?.('request_retrieval', 'Locating leave request record & employee profile...')
      await new Promise(r => setTimeout(r, 400))

      callback?.onToolStep?.('policy_crossref', 'Cross-referencing leave policies and category entitlements...')
      await new Promise(r => setTimeout(r, 400))

      callback?.onToolStep?.('staffing_analysis', 'Calculating department staffing impact & team overlap...')
      await new Promise(r => setTimeout(r, 450))

      appDataStore.incrementAIMetrics(3, 1)

      const pendingList = appDataStore.getLeaveRequests(context.tenantId).filter(r => r.status === 'pending')
      let targetReq = pendingList.find(
        r => q.toLowerCase().includes(r.id.toLowerCase()) || q.toLowerCase().includes(r.employeeName.toLowerCase())
      )
      if (!targetReq) {
        targetReq = pendingList[0] || {
          id: 'req-1029',
          tenantId: context.tenantId,
          employeeId: 'user-Alice',
          employeeName: 'Alice Johnson',
          department: 'Engineering',
          leaveTypeId: 'lt-emergency',
          leaveTypeName: 'Emergency Leave',
          leaveTypeCode: 'emergency',
          startDate: '2026-10-06',
          endDate: '2026-10-06',
          requestedDays: 1,
          reason: 'Family emergency requiring urgent assistance.',
          status: 'pending',
          submittedAt: '2026-10-02T08:30:00Z',
          isEmergency: true,
          aiAnalysis: {
            applicablePolicy: 'Emergency Leave Policy (Sec 4.2 - Dependent Illness)',
            employeeRemainingDays: 2,
            scheduledAbsencesCount: 2,
            teamCoverageWarning: '2 other team members scheduled for leave on Oct 7-8. Engineering Friday standup at 75% coverage.',
            recommendationText: 'Emergency leave complies with company policy.',
            requiresHumanApproval: true,
          },
        }
      }

      const isEmergency = targetReq.isEmergency || targetReq.leaveTypeCode === 'emergency'
      const policyName =
        targetReq.aiAnalysis?.applicablePolicy ||
        (isEmergency
          ? 'Emergency Leave Policy (Sec 4.2 - Dependent Illness)'
          : 'Corporate Annual Paid Time Off Policy (Sec 2.1)')
      const remainingDays = targetReq.aiAnalysis?.employeeRemainingDays ?? 2

      const response: AIMessage = {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: `### 🔍 Investigation Report: Leave Request #${targetReq.id}
**Employee:** **${targetReq.employeeName}** • **Department:** ${targetReq.department} • **Status:** Pending Supervisory Review

---

#### 1. Request Details & Stated Reason
• **Leave Category:** ${targetReq.leaveTypeName} ${isEmergency ? '(Emergency Priority)' : '(Discretionary PTO)'}
• **Requested Dates:** ${targetReq.startDate} ${targetReq.startDate !== targetReq.endDate ? `to ${targetReq.endDate}` : ''} (${targetReq.requestedDays} business day${targetReq.requestedDays > 1 ? 's' : ''})
• **Employee's Stated Reason:** "${targetReq.reason}"

#### 2. Policy & Entitlement Verification
• **Applicable Policy:** ${policyName}
• **Quota Balance:** ${remainingDays} days available in quota balance. Request is **100% policy compliant**.
• **Notice Guidelines:** ${isEmergency ? 'Emergency exemption applies; same-day notification requirements met.' : 'Standard advance notice window verified.'}

#### 3. Department Staffing & Capacity Impact
• **Concurrent Absences:** 2 other engineering personnel scheduled for leave during this window (Marcus Vance, Priya Patel).
• **Team Coverage:** Active workplace presence projects at **75% (9 of 12 present)**, maintaining above the **70% core threshold**.

#### 4. Supervisory Assessment
**Verdict:** **Low-to-Moderate operational risk**. Request meets authentic eligibility criteria.

---

### 💡 Suggested Decision Options:
• **Option 1: Approve Full Request** — Grant full ${targetReq.requestedDays} day(s) leave, deduct from quota, and notify ${targetReq.employeeName}.
• **Option 2: Approve with Workload Reassignment** — Grant leave and auto-reassign critical daily duties to standby staff member.
• **Option 3: Request Clarification / Alternative Schedule** — Solicit additional information or propose alternate dates.
• **Option 4: Reject Due to Staffing Threshold** — Decline request citing current department presence constraints.`,
        sources: [
          {
            title: policyName,
            snippet: 'Guidelines on leave entitlement, quota allocation, and team coverage standards.',
          },
        ],
        suggestedOptions: [
          {
            id: 'opt-1',
            label: 'Option 1: Approve Full Request',
            actionValue: 'approve',
            description: `Grant full ${targetReq.requestedDays} day(s) leave, deduct from quota, and notify ${targetReq.employeeName}.`,
          },
          {
            id: 'opt-2',
            label: 'Option 2: Approve with Workload Reassignment',
            actionValue: 'approve_reassign',
            description: 'Grant leave and automatically reassign critical daily duties to standby staff member.',
          },
          {
            id: 'opt-3',
            label: 'Option 3: Request Clarification',
            actionValue: 'clarify',
            description: 'Send prompt to employee requesting additional documentation or alternative schedule.',
          },
          {
            id: 'opt-4',
            label: 'Option 4: Reject Due to Staffing Threshold',
            actionValue: 'reject',
            description: 'Decline request citing current department presence and coverage limits.',
          },
        ],
      }

      callback?.onComplete?.(response)
      return response
    }

    // 0B. Manager Supervisory Scenario: Pending Approvals & Sign-Off Queue
    if (
      q.includes('approval') ||
      q.includes('pending') ||
      q.includes('sign-off') ||
      q.includes('marcus') ||
      q.includes('review approvals')
    ) {
      callback?.onToolStep?.('approval_queue', 'Scanning pending supervisory approval queue...')
      await new Promise(r => setTimeout(r, 450))

      callback?.onToolStep?.('policy_validation', 'Validating request against Emergency Leave Policy v1.8...')
      await new Promise(r => setTimeout(r, 400))

      appDataStore.incrementAIMetrics(2, 1)

      const pendingList = appDataStore.getLeaveRequests(context.tenantId).filter(r => r.status === 'pending')
      const targetReq = pendingList[0]

      const response: AIMessage = {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: `You currently have **${pendingList.length || 1} pending approval request** requiring your supervisory decision:

• **Marcus Vance — Emergency Leave**
  - **Date:** Tomorrow (Oct 3, 2026) • 1 Day
  - **Reason:** Family emergency / dependent illness
  - **Policy Compliance:** Valid under **Emergency Leave Policy (Sec 4.2)**. Marcus has 2 emergency days remaining.
  - **Staffing Impact:** Friday coverage remains at **83% (10 of 12 active)**, safely above the 70% threshold.

**AI Supervisory Recommendation:** **Approve**. All policy criteria are met and team coverage is sufficient.`,
        sources: [
          {
            title: 'Emergency Leave Policy (Sec 4.2)',
            policyId: 'pol-emergency',
            snippet: 'Immediate supervisory approval recommended for urgent family or dependent care needs.',
          },
        ],
        toolExecutions: [
          { name: 'approval_queue', label: 'Retrieved 1 Pending Leave Request for Engineering', status: 'completed' },
          { name: 'policy_validation', label: 'Verified Policy Compliance: Full Eligibility Confirmed', status: 'completed' },
        ],
        recommendation: {
          text: 'Request complies with corporate emergency guidelines. Direct sign-off recommended.',
          approvalRequired: true,
          approvalRole: 'David Wilson (Engineering Lead)',
        },
        actionCard: targetReq ? {
          type: 'approval_review',
          title: `Approve Leave: ${targetReq.employeeName}`,
          description: `${targetReq.leaveTypeName} (${targetReq.requestedDays} day) • ${targetReq.startDate}`,
          data: {
            requestId: targetReq.id,
            employeeName: targetReq.employeeName,
            leaveTypeName: targetReq.leaveTypeName,
            requestedDays: targetReq.requestedDays,
            startDate: targetReq.startDate,
            endDate: targetReq.endDate,
            reason: targetReq.reason,
          },
          actionLabel: 'Approve Request',
          status: 'ready',
        } : undefined,
      }

      callback?.onComplete?.(response)
      return response
    }

    // 0C. Manager Supervisory Scenario: Team Availability & Live Attendance
    if (q.includes('team') || q.includes('who is off') || q.includes('availability') || q.includes('attendance') || q.includes('reports')) {
      callback?.onToolStep?.('team_roster', 'Retrieving Engineering team members and real-time status...')
      await new Promise(r => setTimeout(r, 400))
      appDataStore.incrementAIMetrics(1, 0)

      const response: AIMessage = {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: `### 👥 Engineering Team Availability Overview Today

• **Active In-Office (5):** David Wilson (Lead), Elena Rostova, Samira Khan, Alex Rivera, Kevin Zhang
• **Active Remote (5):** Alice Johnson, Chen Wei, Liam O'Connor, Maya Lin, Sarah Jenkins
• **On Leave (2):**
  - **Marcus Vance:** Emergency Leave (Returning Monday)
  - **Priya Patel:** Half-day medical appointment (Returning 2:00 PM)

**Upcoming Leaves This Month:**
- Oct 7 – Oct 8: Alice Johnson (Annual Leave, 2 days)
- Oct 14: Chen Wei (Casual Leave, 1 day)
- Oct 26: Corporate Recess / Thanksgiving`,
        sources: [
          {
            title: 'Live Attendance & Team Roster',
            snippet: 'Real-time synchronization with badge access and remote activity log.',
          },
        ],
        toolExecutions: [
          { name: 'team_roster', label: '12 Active Team Records Checked', status: 'completed' },
        ],
      }
      callback?.onComplete?.(response)
      return response
    }

    // 0D. Manager Guidelines: Overtime & Standby Compensation
    if (q.includes('overtime') || q.includes('standby') || q.includes('on-call') || q.includes('compensation')) {
      callback?.onToolStep?.('rag_search', 'Retrieving Engineering Standby & Overtime Policy (Sec 5.4)...')
      await new Promise(r => setTimeout(r, 400))
      appDataStore.incrementAIMetrics(1, 1)

      const response: AIMessage = {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: `### 📋 Manager Guidelines: Overtime & Weekend Standby Authorization

Under **Kinetic HR Compensation & Standby Guidelines (v2.1)**:

• **Manager Discretion:** Leads may authorize up to **10 hours of overtime per engineer per pay period** without HR Director sign-off.
• **Standby Rate:** Weekend on-call standby pays a flat **$150/weekend stipend** plus **1.5x hourly rate** for active triage time over 30 minutes.
• **Compensatory Off (Comp-Time):** If an engineer works >4 hours on a public holiday, they are entitled to 1 compensatory rest day within 30 days.
• **Submission Window:** Timesheet adjustments must be approved in Kinetic HR by the 25th of the active billing cycle.`,
        sources: [
          {
            title: 'Overtime & Standby Compensation Guidelines (Sec 5.4)',
            policyId: 'pol-overtime',
            snippet: 'Manager pre-approval required for overtime exceeding 10 hours per pay period.',
          },
        ],
        toolExecutions: [
          { name: 'azure_ai_search', label: 'Retrieved 2 policy articles from HR Policy Index', status: 'completed' },
        ],
      }
      callback?.onComplete?.(response)
      return response
    }

    // 1. Check for Emergency Leave scenario (Primary MVP Scenario - Step 3 & 4)
    if (
      q.includes('sick') ||
      q.includes('child') ||
      q.includes('emergency') ||
      q.includes('tomorrow off') ||
      q.includes('urgent')
    ) {
      // Step A: Tool execution 1
      callback?.onToolStep?.('policy_retrieval', 'Reviewing company policy: Emergency & Dependent Care...')
      await new Promise(r => setTimeout(r, 450))

      // Step B: Tool execution 2
      callback?.onToolStep?.('balance_check', 'Checking your available leave balance...')
      await new Promise(r => setTimeout(r, 450))

      // Step C: Tool execution 3
      callback?.onToolStep?.('team_schedule', 'Checking team availability & staffing threshold...')
      await new Promise(r => setTimeout(r, 500))

      appDataStore.incrementAIMetrics(3, 1)

      const response: AIMessage = {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: `I understand this is an urgent situation. Based on Kinetic Technologies' **Emergency & Dependent Care Leave Policy (Section 4.2)**, you are entitled to up to 3 days of paid Emergency Leave for immediate family or dependent illness.

You currently have **2 days of Emergency Leave remaining** for this calendar year.

Because Marcus Chen and Priya Patel have scheduled leaves later this week, your department's staffing threshold was analyzed. Your request can proceed, but **direct manager authorization is required** before your absence is finalized on the team calendar.`,
        sources: [
          {
            title: 'Emergency & Dependent Care Leave Policy (Sec 4.2)',
            policyId: 'pol-emergency',
            snippet: 'Employees may utilize Emergency Leave for unexpected dependent illness with manager sign-off.',
          },
        ],
        toolExecutions: [
          { name: 'rag_policy_search', label: 'Company Policy Retrieved: Emergency Leave v1.8', status: 'completed' },
          { name: 'hr_balance_query', label: 'Verified Balance: 2 Days Emergency Available', status: 'completed' },
          { name: 'staffing_conflict_check', label: 'Team Coverage Check: 2 Overlapping Scheduled Absences Found', status: 'completed' },
        ],
        recommendation: {
          text: 'Emergency leave appears applicable under your company policy. Manager approval is required.',
          approvalRequired: true,
          approvalRole: 'David Wilson (Engineering Director)',
        },
        actionCard: {
          type: 'leave_submission',
          title: 'Prepare Emergency Leave Request',
          description: 'Submit 1 day Emergency Leave for tomorrow (October 3, 2026) to David Wilson.',
          data: {
            leaveTypeId: 'lt-emergency',
            leaveTypeName: 'Emergency Leave',
            leaveTypeCode: 'emergency',
            startDate: '2026-10-03',
            endDate: '2026-10-03',
            requestedDays: 1,
            reason: userMessage,
            isEmergency: true,
          },
          actionLabel: 'Submit for Manager Approval',
          status: 'ready',
        },
      }

      callback?.onComplete?.(response)
      return response
    }

    // 2. Payslip Explanation scenario (Primary MVP Scenario - Step 10)
    if (
      q.includes('payslip') ||
      q.includes('salary') ||
      q.includes('lower') ||
      q.includes('take-home') ||
      q.includes('october') ||
      q.includes('deduction')
    ) {
      callback?.onToolStep?.('payroll_lookup', 'Accessing secure payroll records for October & September 2026...')
      await new Promise(r => setTimeout(r, 500))

      callback?.onToolStep?.('tax_analysis', 'Analyzing statutory tax withholdings & benefits delta...')
      await new Promise(r => setTimeout(r, 450))

      appDataStore.incrementAIMetrics(2, 0)

      const response: AIMessage = {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: `Here is the authorized breakdown explaining why your **October 2026 take-home salary ($2,900.00)** is **$120.00 lower** than September ($3,020.00):

1. **Federal Tax Withholding Adjustment (+$90.00):**
   Federal tax withholding increased from $180.00 in September to $240.00 in October, along with state tax adjustments, due to the standard Q4 IRS cumulative withholding tier adjustment.
2. **Annual Wellness Plan Contribution (+$30.00):**
   The annual enrollment cycle for the supplementary employee wellness plan began this month, adding a pre-tax deduction of $30.00.

Your gross salary remained identical at **$3,350.00**. No unpaid leave or punitive deductions were assessed.`,
        sources: [
          {
            title: 'Payroll & Compensation Guidelines (Sec 2.3)',
            policyId: 'pol-payroll',
            snippet: 'Q4 statutory withholding reconciliations take effect on the October disbursement cycle.',
          },
          {
            title: 'Benefits Policy — Wellness Plan Enrollment',
            policyId: 'pol-benefits',
            snippet: 'Wellness program contributions commence in Q4 cycle.',
          },
        ],
        toolExecutions: [
          { name: 'payroll_adp_service', label: 'Fetched October 2026 Paystub (#pay-2026-10)', status: 'completed' },
          { name: 'tax_delta_comparator', label: 'Compared September vs October Deductions ($120 delta identified)', status: 'completed' },
        ],
        recommendation: {
          text: 'This variation is standard under Q4 tax tier adjustments and benefit enrollments. If you wish to update your W-4 exemptions, you can do so in the HR Settings portal.',
          approvalRequired: false,
        },
      }

      callback?.onComplete?.(response)
      return response
    }

    // 3. Leave Balance query
    if (q.includes('how much leave') || q.includes('balance') || q.includes('days remaining') || q.includes('vacation')) {
      callback?.onToolStep?.('balance_check', 'Retrieving live leave quotas from HR database...')
      await new Promise(r => setTimeout(r, 400))
      appDataStore.incrementAIMetrics(1, 0)

      const balances = appDataStore.getLeaveBalances(context.userId)
      const formatted = balances.map(b => `• **${b.leaveTypeName}**: ${b.remaining} days remaining (${b.used} used of ${b.totalAllowance})`).join('\n')

      const response: AIMessage = {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: `Here are your current leave balances for the 2026 calendar year:\n\n${formatted}\n\nYou also have an approved upcoming **Annual Leave** scheduled for **October 7 – October 8, 2026 (2 days)**.`,
        sources: [
          {
            title: 'Standard Leave Policy (v2.4)',
            policyId: 'pol-leave',
            snippet: 'Full-time employees receive 20 days annual leave, 10 days sick leave, 5 days casual leave, and 3 days emergency leave.',
          },
        ],
        toolExecutions: [
          { name: 'hrms_balance_query', label: 'Live Leave Ledger Retrieved', status: 'completed' },
        ],
      }
      callback?.onComplete?.(response)
      return response
    }

    // 4. Work from home policy query
    if (q.includes('work from home') || q.includes('wfh') || q.includes('remote') || q.includes('hybrid')) {
      callback?.onToolStep?.('rag_search', 'Searching enterprise knowledge base: Work From Home & Hybrid Policy...')
      await new Promise(r => setTimeout(r, 400))
      appDataStore.incrementAIMetrics(1, 1)

      const response: AIMessage = {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: `Under Kinetic Technologies' **Work From Home & Hybrid Workplace Policy (v3.1)**:

• **Eligible Roles:** Engineering and product teams are eligible for up to **3 remote days per week**.
• **Core Collaboration Hours:** 10:00 AM – 4:00 PM local time for sync meetings and standby.
• **Equipment & Internet:** The company provides a **$200/month broadband & remote stipend** (reflected on your monthly payslip).
• **Security:** All connections to production or internal infrastructure must use the corporate Microsoft Entra Global Secure Access VPN.`,
        sources: [
          {
            title: 'Work From Home & Hybrid Workplace Policy (v3.1)',
            policyId: 'pol-wfh',
            snippet: 'Hybrid guidelines allow up to 3 remote days per week with core hours 10:00 AM to 4:00 PM.',
          },
        ],
        toolExecutions: [
          { name: 'azure_ai_search', label: 'Retrieved 3 policy passages from Azure AI Search', status: 'completed' },
        ],
      }
      callback?.onComplete?.(response)
      return response
    }

    // Live Azure OpenAI GPT-4o Inference via Backend
    try {
      callback?.onToolStep?.('azure_openai_inference', 'Querying live Azure OpenAI GPT-4o model...')
      const apiRes = await apiClient.post<{ reply: string; model?: string }>('/ai/chat', {
        message: userMessage,
        context,
      })
      if (apiRes?.reply) {
        appDataStore.incrementAIMetrics(1, 1)
        const liveResponse: AIMessage = {
          id: `ai-msg-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: apiRes.reply,
          toolExecutions: [
            { name: 'azure_openai', label: `Inference via Azure OpenAI (${apiRes.model || 'GPT-4o'})`, status: 'completed' },
          ],
        }
        callback?.onComplete?.(liveResponse)
        return liveResponse
      }
    } catch (e) {
      console.warn('Live Azure OpenAI fallback to local knowledge base:', e)
    }

    // Fallback conversational response
    callback?.onToolStep?.('rag_search', 'Consulting Kinetic Enterprise Knowledge Base...')
    await new Promise(r => setTimeout(r, 400))
    appDataStore.incrementAIMetrics(1, 1)

    const response: AIMessage = {
      id: `ai-msg-${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: `I am your **Kinetic HR AI Agent**. I can assist you with understanding company policies, reviewing your leave allowances, submitting emergency or standard leave requests, and explaining your payslips.

Would you like to check your available balances, inquire about emergency leave procedures, or review a specific HR policy?`,
      sources: [
        {
          title: 'Kinetic Employee Handbook 2026',
          snippet: 'Company policies and self-service procedures for Kinetic Technologies.',
        },
      ],
      toolExecutions: [
        { name: 'general_intent_classifier', label: 'Intent classified as General HR Inquiry', status: 'completed' },
      ],
    }
    callback?.onComplete?.(response)
    return response
  },

  getInitialMessages(userName: string): AIMessage[] {
    return [
      {
        id: 'welcome-1',
        sender: 'assistant',
        timestamp: '09:00 AM',
        content: `Hello ${userName}. How can I help with your HR needs today?`,
      },
    ]
  },
}
