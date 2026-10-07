import { AIMessage } from '@/types'
import { appDataStore } from './storage'

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
      callback?.onToolStep?.('team_schedule_matrix', 'Querying Engineering schedule matrix & sprint roadmap...')
      await new Promise(r => setTimeout(r, 450))

      callback?.onToolStep?.('threshold_evaluation', 'Evaluating 70% minimum departmental coverage SLA...')
      await new Promise(r => setTimeout(r, 450))

      callback?.onToolStep?.('risk_analyzer', 'Analyzing critical on-call & standup staffing impact...')
      await new Promise(r => setTimeout(r, 400))

      appDataStore.incrementAIMetrics(3, 1)

      const response: AIMessage = {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: `### ⚠️ Team Coverage & Staffing Risk Assessment for Engineering

I have analyzed the **Engineering Department (12 members)** schedule for next week (Oct 5 – Oct 11, 2026):

• **Critical Capacity Dip (Oct 7 – Oct 8):**
  - **Marcus Vance (Backend)** and **Elena Rostova (Frontend)** have scheduled leaves overlapping on Wednesday and Thursday.
  - **Priya Patel (DevOps)** is scheduled for remote standby training.
  - Department active capacity will drop to **75% (9 of 12 available)**, approaching your **70% departmental safety threshold**.

• **Sprint Delivery Impact:**
  - The Sprint 42 release milestone is scheduled for Oct 9. With backend coverage constrained on Oct 7-8, code reviews and PR merges may bottleneck unless PRs are submitted prior to Oct 6.

• **Supervisory Recommendation:**
  - Suggest shifting Marcus's secondary sprint tickets to Alice Johnson or David Wilson.
  - No additional non-emergency leave should be approved for Wednesday, Oct 7 or Thursday, Oct 8.`,
        sources: [
          {
            title: 'Departmental Staffing SLA (Engineering Sec 3.1)',
            policyId: 'pol-staffing',
            snippet: 'Engineering teams must maintain 70% active coverage during active sprint cycle windows.',
          },
          {
            title: 'On-Call & Sprint Rotation Matrix Q4 2026',
            policyId: 'pol-schedule',
            snippet: 'Minimum 2 backend and 2 frontend engineers must be available on deploy eve.',
          },
        ],
        toolExecutions: [
          { name: 'team_schedule_matrix', label: 'Aggregated 12 Employee Calendars for Week 41', status: 'completed' },
          { name: 'threshold_evaluation', label: 'Coverage Level: 75% (Threshold: 70%)', status: 'completed' },
          { name: 'risk_analyzer', label: 'Bottleneck Identified: Sprint 42 Backend Approvals', status: 'completed' },
        ],
        recommendation: {
          text: 'Capacity is tight at 75% on Oct 7-8. Recommend freezing discretionary leave for those two dates.',
          approvalRequired: false,
        },
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
            snippet: 'Manager pre-approval required for overtime exceeding 10 hours per sprint.',
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

    // Default conversational response
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
