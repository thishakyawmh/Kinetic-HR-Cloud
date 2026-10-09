import { AIMessage } from '@/types'

export interface AIChatSession {
  id: string
  userId: string
  tenantId: string
  title: string
  snippet: string
  messages: AIMessage[]
  createdAt: string
  updatedAt: string
}

const CHAT_STORAGE_PREFIX = 'kinetic_ai_chat_sessions_v1'
export const MAX_CHAT_SESSIONS = 5

/**
 * Default seeded chat history from platform data for instant enterprise demonstration
 */
function getInitialSeedSessions(userId: string, tenantId: string): AIChatSession[] {
  return [
    {
      id: 'chat-seed-1',
      userId,
      tenantId,
      title: 'Approved leave scheduled for next week',
      snippet: 'Kapila Jayalath (Medical Leave: Oct 15-16) and team schedule roster...',
      createdAt: '2026-10-09T08:30:00Z',
      updatedAt: '2026-10-09T08:31:45Z',
      messages: [
        {
          id: 'seed-1-u1',
          sender: 'user',
          content: 'Who in my branch has approved leave scheduled for next week?',
          timestamp: '08:30 AM',
        },
        {
          id: 'seed-1-a1',
          sender: 'assistant',
          content: `### Approved Leave in Your Team (Next Week):
For the week of **October 14–20, 2026**, the following leave has been approved for your team in the **Retail Banking & Branches Department** at **Colombo Fort Head Office**:

• **Kapila Jayalath** (Medical Leave):
  - **Dates**: October 15–16, 2026 (2 days)
  - **Reason**: Routine medical examination and doctor consultation at Asiri Hospital Galle
  - **MC Status**: Verified medical certificate attached to file

• **Dhammika Perera** (Medical Leave):
  - **Dates**: October 09, 2026 (1 day)
  - **Reason**: Outpatient consultation and prescription rest

There are no other approved leaves clashing for your teller counter or customer services.`,
          timestamp: '08:31 AM',
          toolExecutions: [
            { name: 'azure_openai', label: 'Inference via Azure OpenAI (gpt-4o-2024-11-20)', status: 'completed' },
          ],
        },
      ],
    },
    {
      id: 'chat-seed-2',
      userId,
      tenantId,
      title: 'Sampath Bank branch network & staffing',
      snippet: 'All 5 branches operating under Sampath Bank PLC with regional managers...',
      createdAt: '2026-10-08T14:15:00Z',
      updatedAt: '2026-10-08T14:16:20Z',
      messages: [
        {
          id: 'seed-2-u1',
          sender: 'user',
          content: 'List all the branches operating under Sampath Bank PLC along with their branch managers and cities.',
          timestamp: '02:15 PM',
        },
        {
          id: 'seed-2-a1',
          sender: 'assistant',
          content: `### Branches Operating Under Sampath Bank PLC:
Sampath Bank operates **5 active strategic branches** across Sri Lanka:

1. **Colombo Fort Head Office Branch (SB-CMB)**
   • **Type**: Headquarters
   • **Manager**: Dinesh Weerasinghe (Senior Branch Manager)
   • **City**: Colombo 02
   • **Staff Count**: 15 active staff

2. **Kandy Super Branch (SB-KDY)**
   • **Type**: Regional Branch
   • **Manager**: Chamari Bandara
   • **City**: Kandy
   • **Staff Count**: 15 active staff

3. **Galle Fort Branch (SB-GLE)**
   • **Type**: Regional Branch
   • **Manager**: Nuwan Jayasuriya
   • **City**: Galle
   • **Staff Count**: 15 active staff

4. **Kurunegala Metro Branch (SB-KRN)**
   • **Type**: Regional Branch
   • **Manager**: Thilini Silva
   • **City**: Kurunegala
   • **Staff Count**: 15 active staff

5. **Jaffna City Branch (SB-JFN)**
   • **Type**: Regional Branch
   • **Manager**: Sanjeewa Fernando
   • **City**: Jaffna
   • **Staff Count**: 15 active staff`,
          timestamp: '02:16 PM',
          toolExecutions: [
            { name: 'azure_openai', label: 'Inference via Azure OpenAI (gpt-4o-2024-11-20)', status: 'completed' },
          ],
        },
      ],
    },
    {
      id: 'chat-seed-3',
      userId,
      tenantId,
      title: 'Retail Banking staffing capacity threshold',
      snippet: '80% minimum staffing threshold and shift continuity analysis...',
      createdAt: '2026-10-08T11:00:00Z',
      updatedAt: '2026-10-08T11:02:10Z',
      messages: [
        {
          id: 'seed-3-u1',
          sender: 'user',
          content: 'What is our minimum staffing threshold for the Retail Banking department?',
          timestamp: '11:00 AM',
        },
        {
          id: 'seed-3-a1',
          sender: 'assistant',
          content: `### Department Staffing Capacity Threshold:
• **Department:** Retail Banking & Branches
• **Department Head:** Dinesh Weerasinghe
• **Minimum Staffing Threshold:** **80% min staffing**

### Department Capacity Overview:
- **Core Banking IT Systems:** 90% min staffing (Head: Thilini Silva)
- **Corporate Credit & Risk:** 85% min staffing (Head: Nuwan Jayasuriya)
- **Retail Banking & Branches:** 80% min staffing (Head: Dinesh Weerasinghe)
- **Treasury & Investment:** 75% min staffing (Head: Chamari Bandara)
- **People Operations & HR:** 75% min staffing (Head: Kasun Perera)

At Colombo Fort Head Office, with 15 branch members, a minimum of **12 staff members** must be on duty to maintain compliant branch counter operations.`,
          timestamp: '11:02 AM',
          toolExecutions: [
            { name: 'azure_openai', label: 'Inference via Azure OpenAI (gpt-4o-2024-11-20)', status: 'completed' },
          ],
        },
      ],
    },
    {
      id: 'chat-seed-4',
      userId,
      tenantId,
      title: 'Sri Lankan statutory leave entitlements',
      snippet: 'Shop and Office Employees Act No. 19 of 1954 allowances & EPF/ETF...',
      createdAt: '2026-10-07T16:20:00Z',
      updatedAt: '2026-10-07T16:22:15Z',
      messages: [
        {
          id: 'seed-4-u1',
          sender: 'user',
          content: 'What are our statutory leave entitlements under the Shop and Office Employees Act?',
          timestamp: '04:20 PM',
        },
        {
          id: 'seed-4-a1',
          sender: 'assistant',
          content: `### Statutory Leave Framework (Shop and Office Employees Act No. 19 of 1954):
Under Sri Lankan statutory labor legislation, employees are entitled to:

1. **Annual Leave:** 14 working days per calendar year with full remuneration.
2. **Casual Leave:** 7 days per calendar year for personal obligations.
3. **Medical / Sick Leave:** 14 days per calendar year (Medical certificate mandated for absences > 2 consecutive days).
4. **Maternity Leave:** 84 working days for the first two confinements (42 working days for subsequent confinements).

### Statutory Provident & Trust Funds:
• **Employee EPF:** 8% deducted from basic salary.
• **Employer EPF:** 12% contribution.
• **Employer ETF:** 3% contribution remitted monthly to Central Bank of Sri Lanka (CBSL).`,
          timestamp: '04:22 PM',
          toolExecutions: [
            { name: 'azure_openai', label: 'Inference via Azure OpenAI (gpt-4o-2024-11-20)', status: 'completed' },
          ],
        },
      ],
    },
    {
      id: 'chat-seed-5',
      userId,
      tenantId,
      title: 'Pending leave request from Nalaka Perera',
      snippet: 'Annual Leave request for Oct 14-16 awaiting supervisory review...',
      createdAt: '2026-10-07T09:40:00Z',
      updatedAt: '2026-10-07T09:42:00Z',
      messages: [
        {
          id: 'seed-5-u1',
          sender: 'user',
          content: 'Are there any pending leave requests awaiting my review?',
          timestamp: '09:40 AM',
        },
        {
          id: 'seed-5-a1',
          sender: 'assistant',
          content: `### Pending Leave Requests Awaiting Your Approval:
You currently have **1 pending leave request** in your supervisory queue:

• **Employee:** Nalaka Perera (SB-1007, Senior Personal Banking Officer)
• **Leave Type:** Annual Leave
• **Requested Dates:** October 14, 2026 – October 16, 2026 (3 days)
• **Stated Reason:** "Family pilgrimage to Kataragama and ancestral home visit"
• **Impact Analysis:** Branch coverage remains at 82% (compliant with 80% threshold).

You can investigate or authorize this request directly from the **Manager Assistant** or **Document Approvals** tab.`,
          timestamp: '09:42 AM',
          toolExecutions: [
            { name: 'azure_openai', label: 'Inference via Azure OpenAI (gpt-4o-2024-11-20)', status: 'completed' },
          ],
        },
      ],
    },
  ]
}

export const chatHistoryService = {
  getStorageKey(tenantId: string, userId: string): string {
    return `${CHAT_STORAGE_PREFIX}_${tenantId || 'tenant'}_${userId || 'user'}`
  },

  /**
   * Retrieves all chat sessions for the user, guaranteed to be at most MAX_CHAT_SESSIONS (5)
   */
  getSessions(tenantId: string, userId: string): AIChatSession[] {
    const key = this.getStorageKey(tenantId, userId)
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AIChatSession[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, MAX_CHAT_SESSIONS)
        }
      } catch (e) {
        console.error('Failed to parse chat sessions:', e)
      }
    }

    // Initialize with 5 realistic platform chats if empty
    const initial = getInitialSeedSessions(userId, tenantId).slice(0, MAX_CHAT_SESSIONS)
    this.saveSessions(tenantId, userId, initial)
    return initial
  },

  /**
   * Saves or updates a session, enforcing the strict 5-chat maximum limit
   */
  saveSession(
    tenantId: string,
    userId: string,
    session: { id?: string; title?: string; messages: AIMessage[] }
  ): AIChatSession {
    const existing = this.getSessions(tenantId, userId)
    const now = new Date().toISOString()

    // Determine title from first user message if not supplied
    let title = session.title
    if (!title) {
      const firstUserMsg = session.messages.find(m => m.sender === 'user')
      if (firstUserMsg) {
        title = firstUserMsg.content.slice(0, 48) + (firstUserMsg.content.length > 48 ? '...' : '')
      } else {
        title = 'New HR Conversation'
      }
    }

    const firstAssistantMsg = session.messages.find(m => m.sender === 'assistant')
    const snippet = firstAssistantMsg
      ? firstAssistantMsg.content.replace(/[#*`_]/g, '').slice(0, 70) + '...'
      : 'Conversation with Kinetic AI...'

    const targetId = session.id || `chat-${Date.now()}`
    const updatedItem: AIChatSession = {
      id: targetId,
      userId,
      tenantId,
      title,
      snippet,
      messages: session.messages,
      createdAt: existing.find(s => s.id === targetId)?.createdAt || now,
      updatedAt: now,
    }

    // Prepend or replace item, ensuring newest active chat is at top
    const filtered = existing.filter(s => s.id !== targetId)
    const newSessions = [updatedItem, ...filtered].slice(0, MAX_CHAT_SESSIONS)

    this.saveSessions(tenantId, userId, newSessions)
    return updatedItem
  },

  /**
   * Deletes a specific chat session by ID
   */
  deleteSession(tenantId: string, userId: string, sessionId: string): AIChatSession[] {
    const existing = this.getSessions(tenantId, userId)
    const updated = existing.filter(s => s.id !== sessionId)
    this.saveSessions(tenantId, userId, updated)
    return updated
  },

  /**
   * Resets or clears chat history for the user
   */
  clearSessions(tenantId: string, userId: string): void {
    const key = this.getStorageKey(tenantId, userId)
    localStorage.removeItem(key)
  },

  saveSessions(tenantId: string, userId: string, sessions: AIChatSession[]): void {
    const key = this.getStorageKey(tenantId, userId)
    localStorage.setItem(key, JSON.stringify(sessions.slice(0, MAX_CHAT_SESSIONS)))
  },
}
