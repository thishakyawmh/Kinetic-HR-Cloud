import { generateProductionSeedData, GeneratedSeedData } from '../scripts/seedDataGenerator'

let cachedSeedData: GeneratedSeedData | null = null

export function getSeedData(): GeneratedSeedData {
  if (!cachedSeedData) {
    cachedSeedData = generateProductionSeedData()
  }
  return cachedSeedData
}

export function buildSeedCollections(): Record<string, any[]> {
  const data = getSeedData()
  return {
    organizations: data.ORGANIZATIONS,
    departments: data.DEPARTMENTS,
    users: data.USERS,
    leave_balances: data.LEAVE_BALANCES,
    leaves: [],
    leave_plans: [],
    attendance: data.ATTENDANCE_RECORDS,
    payslips: data.PAYSLIPS,
    policies: data.POLICIES,
    document_requests: data.DOCUMENT_REQUESTS,
    notifications: data.NOTIFICATIONS,
    audit_logs: data.AUDIT_LOGS,
    branches: data.BRANCHES,
  }
}
