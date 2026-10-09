import { CosmosClient, Container, Database } from '@azure/cosmos'

let client: CosmosClient | null = null
let database: Database | null = null

export function isCosmosConfigured(): boolean {
  const endpoint = process.env.COSMOS_DB_ENDPOINT
  const key = process.env.COSMOS_DB_KEY
  return !!endpoint && !!key && !endpoint.includes('<your-account>') && !key.includes('<your-cosmos')
}

export function getCosmosDatabase(): Database | null {
  if (database) return database
  if (!isCosmosConfigured()) return null

  const endpoint = process.env.COSMOS_DB_ENDPOINT!
  const key = process.env.COSMOS_DB_KEY!
  const dbName = process.env.COSMOS_DB_DATABASE || 'KineticHR'

  client = new CosmosClient({
    endpoint,
    key,
    connectionPolicy: {
      requestTimeout: 4000,
    },
  })
  database = client.database(dbName)
  return database
}


// Generates full substantial seed dataset for local memory database
function generateSeedDataset() {
  const { generateProductionSeedData } = require('../scripts/seedDataGenerator')
  const data = generateProductionSeedData()
  return {
    organizations: data.ORGANIZATIONS,
    departments: data.DEPARTMENTS,
    users: data.USERS,
    leave_balances: data.LEAVE_BALANCES,
    leaves: data.LEAVE_REQUESTS,
    attendance: data.ATTENDANCE_RECORDS,
    payslips: data.PAYSLIPS,
    policies: data.POLICIES,
    document_requests: data.DOCUMENT_REQUESTS,
    notifications: data.NOTIFICATIONS,
    audit_logs: data.AUDIT_LOGS,
    branches: data.BRANCHES,
  }
}
function _oldGenerateSeedDataset() {
  const organizations = [
    { id: 'tenant-kinetic', tenantId: 'tenant-kinetic', name: 'Kinetic Technologies', code: 'KINETIC', status: 'Active' },
    { id: 'tenant-nova', tenantId: 'tenant-nova', name: 'Nova Systems', code: 'NOVA', status: 'Active' },
  ]

  const departments = [
    { id: 'dept-eng', tenantId: 'tenant-kinetic', name: 'Engineering', head: 'David Wilson', threshold: '70% min staffing', status: 'Active', description: 'Core product engineering.' },
    { id: 'dept-hr', tenantId: 'tenant-kinetic', name: 'Human Resources', head: 'Sarah Miller', threshold: '80% min staffing', status: 'Active', description: 'People operations and compliance.' },
    { id: 'dept-prod', tenantId: 'tenant-kinetic', name: 'Product Management', head: 'Claire Underwood', threshold: '75% min staffing', status: 'Active', description: 'Product roadmap.' },
    { id: 'dept-ux', tenantId: 'tenant-kinetic', name: 'Design & UX', head: 'Carlos Mendoza', threshold: '65% min staffing', status: 'Active', description: 'User interface design.' },
    { id: 'dept-ops', tenantId: 'tenant-kinetic', name: 'Operations & Cloud', head: 'Brandon Lee', threshold: '85% min staffing', status: 'Active', description: 'Cloud security and ops.' },
    { id: 'dept-nova-eng', tenantId: 'tenant-nova', name: 'Customer Engineering', head: 'Claire Underwood', threshold: '75% min staffing', status: 'Active', description: 'Client integrations.' },
    { id: 'dept-nova-hr', tenantId: 'tenant-nova', name: 'HR & Legal', head: 'Victor Stone', threshold: '80% min staffing', status: 'Active', description: 'Legal compliance.' },
    { id: 'dept-nova-ops', tenantId: 'tenant-nova', name: 'Operations & Logistics', head: 'Brandon Lee', threshold: '80% min staffing', status: 'Active', description: 'Logistics.' },
    { id: 'dept-nova-fin', tenantId: 'tenant-nova', name: 'Finance & Payroll', head: 'Samantha Ray', threshold: '90% min staffing', status: 'Active', description: 'Financial accounting.' },
    { id: 'dept-nova-strat', tenantId: 'tenant-nova', name: 'Product Strategy', head: 'Marcus Vance', threshold: '70% min staffing', status: 'Active', description: 'Strategic planning.' },
  ]

  const users: any[] = [
    { id: 'user-Alice', tenantId: 'tenant-kinetic', name: 'Alice Johnson', email: 'Alice.johnson@kinetictech.io', role: 'employee', department: 'Engineering', jobTitle: 'Senior Frontend Engineer', employeeNumber: 'KT-8842', managerId: 'user-david', managerName: 'David Wilson', hireDate: '2023-04-15', phone: '+1 (555) 234-5678', location: 'Seattle, WA (Hybrid)' },
    { id: 'user-david', tenantId: 'tenant-kinetic', name: 'David Wilson', email: 'david.wilson@kinetictech.io', role: 'manager', department: 'Engineering', jobTitle: 'Engineering Director', employeeNumber: 'M-1044', hireDate: '2021-08-01', phone: '+1 (555) 443-8901', location: 'Seattle, WA (Office)' },
    { id: 'user-sarah', tenantId: 'tenant-kinetic', name: 'Sarah Miller', email: 'sarah.miller@kinetictech.io', role: 'admin', department: 'Human Resources', jobTitle: 'VP of People & Operations', employeeNumber: 'A-0012', hireDate: '2020-01-10', phone: '+1 (555) 789-0123', location: 'San Francisco, CA (HQ)' },
    { id: 'user-david-emp', tenantId: 'tenant-kinetic', name: 'David Wilson', email: 'david.emp@kinetictech.io', role: 'employee', department: 'Engineering', jobTitle: 'Engineering Director', employeeNumber: 'KT-1044', hireDate: '2021-08-01', phone: '+1 (555) 443-8901', location: 'Seattle, WA (Office)' },
    { id: 'user-sarah-emp', tenantId: 'tenant-kinetic', name: 'Sarah Miller', email: 'sarah.emp@kinetictech.io', role: 'employee', department: 'Human Resources', jobTitle: 'VP of People & Operations', employeeNumber: 'KT-0012', hireDate: '2020-01-10', phone: '+1 (555) 789-0123', location: 'San Francisco, CA (HQ)' },
    { id: 'user-marcus', tenantId: 'tenant-kinetic', name: 'Marcus Chen', email: 'marcus.chen@kinetictech.io', role: 'employee', department: 'Engineering', jobTitle: 'DevOps & Cloud Engineer', employeeNumber: 'KT-3301', managerId: 'user-david', managerName: 'David Wilson', hireDate: '2022-03-11', phone: '+1 (555) 321-4567', location: 'Seattle, WA' },
    { id: 'user-priya', tenantId: 'tenant-kinetic', name: 'Priya Patel', email: 'priya.patel@kinetictech.io', role: 'employee', department: 'Engineering', jobTitle: 'Backend Lead', employeeNumber: 'KT-5510', managerId: 'user-david', managerName: 'David Wilson', hireDate: '2022-09-01', phone: '+1 (555) 654-9870', location: 'Austin, TX (Remote)' },
    { id: 'user-platform-admin', tenantId: 'tenant-kinetic', name: 'Alex Thorne', email: 'alex.thorne@kineticcloud.azure.com', role: 'platform_admin', department: 'Cloud Platform Operations', jobTitle: 'Principal Cloud Platform Director', employeeNumber: 'KC-0001', hireDate: '2020-01-01', location: 'Microsoft Azure East US' },
    { id: 'user-brandon-nova', tenantId: 'tenant-nova', name: 'Brandon Lee', email: 'brandon.lee@novasystems.com', role: 'employee', department: 'Operations & Logistics', jobTitle: 'Systems Architect', employeeNumber: 'NV-108', hireDate: '2024-02-01', phone: '+1 (555) 881-2299', location: 'Chicago, IL' },
    { id: 'user-claire-nova', tenantId: 'tenant-nova', name: 'Claire Underwood', email: 'claire.underwood@novasystems.com', role: 'manager', department: 'Operations & Logistics', jobTitle: 'Operations Director', employeeNumber: 'M-024', hireDate: '2021-05-15', phone: '+1 (555) 992-3344', location: 'Chicago, IL' },
    { id: 'user-victor-nova', tenantId: 'tenant-nova', name: 'Victor Stone', email: 'victor.stone@novasystems.com', role: 'admin', department: 'HR & Legal', jobTitle: 'HR Director', employeeNumber: 'A-005', hireDate: '2020-03-10', phone: '+1 (555) 991-4455', location: 'Chicago, IL' },
    { id: 'user-claire-nova-emp', tenantId: 'tenant-nova', name: 'Claire Underwood', email: 'claire.emp@novasystems.com', role: 'employee', department: 'Operations & Logistics', jobTitle: 'Operations Director', employeeNumber: 'NV-024', hireDate: '2021-05-15', phone: '+1 (555) 992-3344', location: 'Chicago, IL' },
    { id: 'user-victor-nova-emp', tenantId: 'tenant-nova', name: 'Victor Stone', email: 'victor.emp@novasystems.com', role: 'employee', department: 'HR & Legal', jobTitle: 'HR Director', employeeNumber: 'NV-005', hireDate: '2020-03-10', phone: '+1 (555) 991-4455', location: 'Chicago, IL' },
  ]

  const firstNames = ['James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William', 'Mia', 'Benjamin', 'Charlotte', 'Lucas', 'Amelia', 'Henry', 'Harper', 'Alexander', 'Evelyn', 'Daniel', 'Abigail', 'Jacob', 'Emily', 'Michael', 'Ella', 'Logan', 'Elizabeth', 'Jackson', 'Camila', 'Sebastian', 'Luna', 'Jack', 'Sofia']
  const lastNames = ['Smith', 'Garcia', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill']

  firstNames.forEach((fn, idx) => {
    const ln = lastNames[idx % lastNames.length]
    const isMgr = idx % 6 === 0
    users.push({
      id: `user-kin-${idx + 10}`,
      tenantId: 'tenant-kinetic',
      name: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@kinetictech.io`,
      role: isMgr ? 'manager' : 'employee',
      department: departments[idx % 5].name,
      jobTitle: `Specialist Level ${ (idx % 3) + 1}`,
      employeeNumber: isMgr ? `M-${2000 + idx}` : `KT-${2000 + idx}`,
      managerId: 'user-david',
      managerName: 'David Wilson',
      hireDate: `202${(idx % 4) + 1}-0${(idx % 8) + 1}-15`,
      phone: `+1 (555) 300-${1000 + idx}`,
      location: 'Seattle, WA',
    })
  })

  firstNames.slice(0, 27).forEach((fn, idx) => {
    const ln = lastNames[(idx + 5) % lastNames.length]
    const isMgr = idx % 5 === 0
    users.push({
      id: `user-nova-${idx + 10}`,
      tenantId: 'tenant-nova',
      name: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@novasystems.com`,
      role: isMgr ? 'manager' : 'employee',
      department: departments[5 + (idx % 5)].name,
      jobTitle: `Systems Analyst Level ${ (idx % 3) + 1}`,
      employeeNumber: isMgr ? `M-${3000 + idx}` : `NV-${3000 + idx}`,
      managerId: 'user-claire-nova',
      managerName: 'Claire Underwood',
      hireDate: `202${(idx % 3) + 2}-0${(idx % 8) + 1}-10`,
      phone: `+1 (555) 400-${1000 + idx}`,
      location: 'Chicago, IL',
    })
  })

  const leaveTypes = [
    { name: 'Annual Leave', code: 'annual', allowance: 20 },
    { name: 'Sick Leave', code: 'sick', allowance: 12 },
    { name: 'Casual Leave', code: 'casual', allowance: 7 },
    { name: 'Parental Leave', code: 'parental', allowance: 90 },
    { name: 'Study Leave', code: 'study', allowance: 10 },
  ]

  const leave_balances: any[] = []
  users.forEach((u) => {
    leaveTypes.forEach((lt) => {
      const used = (u.employeeNumber.charCodeAt(3) || 5) % 8
      leave_balances.push({
        id: `bal-${u.id}-${lt.code}`,
        tenantId: u.tenantId,
        userId: u.id,
        leaveTypeName: lt.name,
        code: lt.code,
        totalAllowance: lt.allowance,
        used,
        remaining: lt.allowance - used,
      })
    })
  })

  const leaves: any[] = []
  const statuses: Array<'pending' | 'approved' | 'rejected' | 'cancelled'> = ['approved', 'pending', 'approved', 'rejected', 'approved', 'cancelled']

  users.forEach((u, uIdx) => {
    for (let r = 1; r <= 2; r++) {
      const reqId = `leave-req-${u.id}-${r}`
      const status = statuses[(uIdx + r) % statuses.length]
      const leaveType = leaveTypes[(uIdx + r) % leaveTypes.length]
      const month = (r % 9) + 1
      const startDay = (r * 7) % 20 + 1
      const startDate = `2026-${month < 10 ? '0' + month : month}-${startDay < 10 ? '0' + startDay : startDay}`
      const endDate = `2026-${month < 10 ? '0' + month : month}-${(startDay + 2) < 10 ? '0' + (startDay + 2) : startDay + 2}`

      leaves.push({
        id: reqId,
        tenantId: u.tenantId,
        employeeId: u.id,
        employeeName: u.name,
        department: u.department,
        leaveTypeName: leaveType.name,
        leaveTypeCode: leaveType.code,
        startDate,
        endDate,
        requestedDays: 3,
        reason: `Personal leave request #${r} for ${leaveType.name.toLowerCase()}`,
        status,
        createdAt: `2026-0${month}-01T08:00:00Z`,
        priorLeavesCount: (uIdx + r) % 6,
        approvalHistory: status !== 'pending' ? [
          {
            action: status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Cancelled',
            actorName: u.tenantId === 'tenant-kinetic' ? 'David Wilson' : 'Claire Underwood',
            timestamp: `2026-0${month}-02T10:00:00Z`,
            comments: status === 'approved' ? 'Approved based on team coverage schedule.' : 'Rejected due to project release overlap.'
          }
        ] : [],
      })
    }
  })

  const attendance: any[] = []
  users.slice(0, 30).forEach((u, idx) => {
    for (let day = 1; day <= 18; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`
      attendance.push({
        id: `att-${u.id}-2026-09-${dayStr}`,
        tenantId: u.tenantId,
        userId: u.id,
        userName: u.name,
        date: `2026-09-${dayStr}`,
        clockIn: `2026-09-${dayStr}T08:30:00Z`,
        clockOut: `2026-09-${dayStr}T17:15:00Z`,
        totalHours: 8.75,
        status: (idx + day) % 7 === 0 ? 'Remote' : 'Present',
        workMode: (idx + day) % 7 === 0 ? 'Remote' : 'Office',
        location: u.tenantId === 'tenant-kinetic' ? 'Seattle HQ' : 'Chicago Office',
      })
    }
  })

  const payslips: any[] = []
  const months = [
    { name: 'August', year: 2026, date: '2026-08-31', period: '08/01/2026 - 08/31/2026' },
    { name: 'September', year: 2026, date: '2026-09-30', period: '09/01/2026 - 09/30/2026' },
    { name: 'October', year: 2026, date: '2026-10-31', period: '10/01/2026 - 10/31/2026' },
  ]

  users.forEach((u, idx) => {
    const baseSalary = 3500 + (idx * 120)
    months.forEach((m) => {
      const payId = `pay-${u.id}-${m.name.toLowerCase()}-2026`
      const gross = baseSalary + 250
      const deductions = 320
      const taxes = 580
      const net = gross - deductions - taxes

      payslips.push({
        id: payId,
        tenantId: u.tenantId,
        employeeId: u.id,
        employeeName: u.name,
        periodMonth: m.name,
        periodYear: m.year,
        payPeriod: m.period,
        payDate: m.date,
        filingStatus: 'Single',
        basicSalary: baseSalary,
        overtimePay: 250,
        grossSalary: gross,
        grossPay: gross,
        ytdGrossPay: gross * 8,
        preTaxDeductions: deductions,
        statutoryTaxes: taxes,
        tax: taxes,
        deductions,
        netSalary: net,
        netPay: net,
        ytdNetPay: net * 8,
        currency: 'USD',
        status: 'Published',
        notes: `Standard monthly disbursement for ${m.name} ${m.year}.`,
      })
    })
  })

  const policies = [
    {
      id: 'pol-1',
      tenantId: 'tenant-kinetic',
      title: 'Global Remote Work Policy 2026',
      category: 'Remote Work',
      version: '2.1',
      fileSize: '1.4 MB',
      summary: 'Guidelines for asynchronous communication, core working hours, and expense stipends.',
      keyTerms: ['Core Hours', 'Home Office', 'Equipment Allowance'],
      uploadedAt: '2026-01-15T08:00:00Z',
      contentExcerpt: 'All full-time employees are eligible for up to 3 remote work days per week upon manager approval.',
    },
    {
      id: 'pol-2',
      tenantId: 'tenant-kinetic',
      title: 'Enterprise Paid Time Off & Leave Protocol',
      category: 'Leaves & Absences',
      version: '3.0',
      fileSize: '2.1 MB',
      summary: 'Official guidelines on annual leave accrual, emergency leave requests, and manager SLAs.',
      keyTerms: ['Annual Leave', 'Emergency Request', 'Manager Approval SLA'],
      uploadedAt: '2026-02-01T10:00:00Z',
      contentExcerpt: 'Leave requests submitted 7 days in advance guarantee automated staffing conflict checks.',
    },
  ]

  const document_requests = [
    {
      id: 'doc-req-9041',
      tenantId: 'tenant-kinetic',
      employeeId: 'user-Alice',
      employeeName: 'Alice Johnson',
      documentType: 'Salary Certificate',
      purpose: 'Bank Loan Application',
      status: 'signed',
      createdAt: '2026-09-28T09:00:00Z',
      aiVerification: { identityVerified: true, policyCheckPassed: true },
      managerSignatureDetails: {
        signedBy: 'David Wilson',
        signedById: 'user-david',
        signedAt: '2026-09-28T10:15:22Z',
        mobile2faVerified: true,
        phoneNumberMasked: '+1 (555) ***-8901',
        signatureHash: 'SIG-2FA-98F4-41A8-88A2',
      },
    },
  ]

  const notifications = [
    {
      id: 'notif-1',
      tenantId: 'tenant-kinetic',
      recipientId: 'user-Alice',
      title: 'Leave Request Approved',
      message: 'Your annual leave request for Oct 12-14 has been approved by David Wilson.',
      read: false,
      createdAt: '2026-10-02T10:00:00Z',
    },
  ]

  const audit_logs = [
    {
      id: 'aud-9901',
      tenantId: 'tenant-kinetic',
      tenantName: 'Kinetic Technologies',
      timestamp: '2026-10-02 11:05:14',
      userId: 'user-david',
      userName: 'David Wilson',
      userRole: 'manager',
      action: 'Leave Request Approved',
      resource: 'Leave #leave-req-user-Alice-1',
      result: 'Success',
      riskLevel: 'High',
      details: 'Manager approved 3 days annual leave request.',
    },
  ]

  const branches = [
    {
      id: 'br-colombo-hq',
      tenantId: 'tenant-kinetic',
      name: 'Colombo Head Office',
      code: 'CMB-HQ',
      type: 'Headquarters',
      address: 'Level 18, West Tower, World Trade Center, Echelon Square',
      city: 'Colombo',
      country: 'Sri Lanka',
      phone: '+94 11 234 5678',
      email: 'colombo.hq@kinetictech.io',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-david',
      branchManagerName: 'David Wilson',
      employeeCount: 24,
      isHeadquarters: true,
      status: 'Active',
      createdAt: '2026-01-15T08:00:00Z',
    },
  ]

  return {
    organizations,
    departments,
    users,
    leave_balances,
    leaves,
    attendance,
    payslips,
    policies,
    document_requests,
    notifications,
    audit_logs,
    branches,
  }
}

const LOCAL_MEMORY_DATA: Record<string, any[]> = generateSeedDataset()




/**
 * Creates a mock Cosmos DB container for local offline development
 */
function createMockContainer(name: string): Container {
  if (!LOCAL_MEMORY_DATA[name]) {
    LOCAL_MEMORY_DATA[name] = []
  }
  const store = LOCAL_MEMORY_DATA[name]

  return {
    items: {
      query: (querySpec: any) => ({
        fetchAll: async () => {
          let results = [...store]
          if (querySpec && querySpec.parameters) {
            // Filter by tenantId
            const tenantParam = querySpec.parameters.find((p: any) => p.name === '@tenantId')
            if (tenantParam) {
              const tVal = String(tenantParam.value).toLowerCase()
              results = results.filter((item: any) => item.tenantId && item.tenantId.toLowerCase() === tVal)
            }
            // Filter by empId (employeeNumber, email, or id)
            const empParam = querySpec.parameters.find((p: any) => p.name === '@empId')
            if (empParam) {
              const eVal = String(empParam.value).toLowerCase()
              results = results.filter((u: any) =>
                (u.employeeNumber && u.employeeNumber.toLowerCase() === eVal) ||
                (u.email && u.email.toLowerCase() === eVal) ||
                (u.id && u.id.toLowerCase() === eVal)
              )
            }
            // Filter by userId (check userId, managerId, employeeId, or id)
            const userParam = querySpec.parameters.find((p: any) => p.name === '@userId')
            if (userParam) {
              const uVal = String(userParam.value).toLowerCase()
              results = results.filter((item: any) =>
                (item.userId && item.userId.toLowerCase() === uVal) ||
                (item.managerId && item.managerId.toLowerCase() === uVal) ||
                (item.employeeId && item.employeeId.toLowerCase() === uVal) ||
                (item.id && item.id.toLowerCase() === uVal)
              )
            }
            // If searching for organization code/id
            const orgParam = querySpec.parameters.find((p: any) => p.name === '@orgId')
            if (orgParam) {
              const val = String(orgParam.value).toLowerCase()
              results = results.filter(
                (o: any) => (o.code && o.code.toLowerCase() === val) || (o.id && o.id.toLowerCase() === val)
              )
            }
          }
          return { resources: results }
        },
      }),
      create: async (item: any) => {
        store.push(item)
        return { resource: item }
      },
      upsert: async (item: any) => {
        const idx = store.findIndex((i: any) => i.id === item.id)
        if (idx >= 0) store[idx] = item
        else store.push(item)
        return { resource: item }
      },
    },
    item: (id: string, _partitionKey?: string) => ({
      read: async () => {
        const item = store.find((i: any) => i.id === id)
        return { resource: item ? { ...item } : null }
      },
      replace: async (newItem: any) => {
        const idx = store.findIndex((i: any) => i.id === id)
        if (idx >= 0) store[idx] = newItem
        else store.push(newItem)
        return { resource: newItem }
      },
      delete: async () => {
        const idx = store.findIndex((i: any) => i.id === id)
        if (idx >= 0) store.splice(idx, 1)
        return { resource: {} }
      },
    }),
  } as unknown as Container
}

export function getTenantContainer(containerName: string): Container {
  const db = getCosmosDatabase()
  const mockContainer = createMockContainer(containerName)

  if (!db || !isCosmosConfigured()) {
    return {
      items: {
        query: (querySpec: any) => ({
          fetchAll: async () => {
            console.log(`🟡 [MOCK DATA] Query on container "${containerName}" -> Served from In-Memory Mock Store`)
            return mockContainer.items.query(querySpec).fetchAll()
          },
        }),
        create: async (item: any) => {
          console.log(`🟡 [MOCK DATA] Created item "${item?.id || 'new'}" in container "${containerName}" (In-Memory Mock Store)`)
          return mockContainer.items.create(item)
        },
        upsert: async (item: any) => {
          console.log(`🟡 [MOCK DATA] Upserted item "${item?.id || 'new'}" in container "${containerName}" (In-Memory Mock Store)`)
          return mockContainer.items.upsert(item)
        },
      },
      item: (id: string, partitionKey?: string) => ({
        read: async () => {
          console.log(`🟡 [MOCK DATA] Read item "${id}" from container "${containerName}" (In-Memory Mock Store)`)
          return mockContainer.item(id, partitionKey).read()
        },
        replace: async (newItem: any) => {
          console.log(`🟡 [MOCK DATA] Replaced item "${id}" in container "${containerName}" (In-Memory Mock Store)`)
          return mockContainer.item(id, partitionKey).replace(newItem)
        },
        delete: async () => {
          console.log(`🟡 [MOCK DATA] Deleted item "${id}" from container "${containerName}" (In-Memory Mock Store)`)
          return mockContainer.item(id, partitionKey).delete()
        },
      }),
    } as unknown as Container
  }

  const realContainer = db.container(containerName)
  const isStrictLive = (process.env.AZURE_MODE || '').toLowerCase() === 'live'

  const withTimeout = async <T>(promise: Promise<T>, ms = 2500): Promise<T> => {
    let timeoutHandle: any
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error(`Cosmos DB operation timed out after ${ms}ms`)), ms)
    })
    try {
      return await Promise.race([promise, timeoutPromise])
    } finally {
      clearTimeout(timeoutHandle)
    }
  }

  // Double-Way Resilient Wrapper: Executes live Azure Cosmos DB, enforces strict error handling in live mode
  return {
    items: {
      query: (querySpec: any, options?: any) => ({
        fetchAll: async () => {
          try {
            const result = await withTimeout(realContainer.items.query(querySpec, options).fetchAll(), 3000)
            console.log(
              `🟢 [AZURE COSMOS DB] Query on container "${containerName}" -> Returned ${result.resources?.length ?? 0} item(s) from Live Azure Cloud`
            )
            return result
          } catch (err: any) {
            console.error(
              `❌ [AZURE COSMOS DB ERROR] Query failed on "${containerName}": ${err.message}`
            )
            if (isStrictLive) {
              throw new Error(`Azure Cosmos DB Live Query Failed: ${err.message}`)
            }
            console.warn(`🟡 [MOCK DATA FALLBACK] Falling back to In-Memory Mock Store`)
            const fallbackResult = await mockContainer.items.query(querySpec).fetchAll()
            return fallbackResult
          }
        },
      }),
      create: async (item: any, options?: any) => {
        try {
          const result = await withTimeout(realContainer.items.create(item, options), 3000)
          console.log(
            `🟢 [AZURE COSMOS DB] Inserted item "${item?.id || 'new'}" into container "${containerName}" (Live Azure Cloud)`
          )
          try { await mockContainer.items.create(item) } catch (_) {}
          return result
        } catch (err: any) {
          console.error(
            `❌ [AZURE COSMOS DB ERROR] Insert failed on "${containerName}": ${err.message}`
          )
          if (isStrictLive) {
            throw new Error(`Azure Cosmos DB Live Insert Failed: ${err.message}`)
          }
          console.warn(`🟡 [MOCK DATA FALLBACK] Saving to In-Memory Mock Store`)
          const fallbackResult = await mockContainer.items.create(item)
          return fallbackResult
        }
      },
      upsert: async (item: any, options?: any) => {
        try {
          const result = await withTimeout(realContainer.items.upsert(item, options), 3000)
          console.log(
            `🟢 [AZURE COSMOS DB] Upserted item "${item?.id || 'new'}" into container "${containerName}" (Live Azure Cloud)`
          )
          try { await mockContainer.items.upsert(item) } catch (_) {}
          return result
        } catch (err: any) {
          console.error(
            `❌ [AZURE COSMOS DB ERROR] Upsert failed on "${containerName}": ${err.message}`
          )
          if (isStrictLive) {
            throw new Error(`Azure Cosmos DB Live Upsert Failed: ${err.message}`)
          }
          console.warn(`🟡 [MOCK DATA FALLBACK] Saving to In-Memory Mock Store`)
          const fallbackResult = await mockContainer.items.upsert(item)
          return fallbackResult
        }
      },
    },
    item: (id: string, partitionKey?: string) => ({
      read: async () => {
        try {
          const result = await withTimeout(realContainer.item(id, partitionKey).read(), 2500)
          if (result.resource) {
            console.log(
              `🟢 [AZURE COSMOS DB] Read item "${id}" from container "${containerName}" (Live Azure Cloud)`
            )
            return result
          }
          if (isStrictLive) return result
          const mockResult = await mockContainer.item(id, partitionKey).read()
          if (mockResult.resource) {
            console.log(
              `🟡 [MOCK DATA FALLBACK] Item "${id}" not in live Cosmos DB; retrieved from In-Memory Mock Store`
            )
            return mockResult
          }
          return result
        } catch (err: any) {
          console.error(
            `❌ [AZURE COSMOS DB ERROR] Read "${id}" failed on "${containerName}": ${err.message}`
          )
          if (isStrictLive) {
            throw new Error(`Azure Cosmos DB Live Read Failed: ${err.message}`)
          }
          return mockContainer.item(id, partitionKey).read()
        }
      },
      replace: async (newItem: any, options?: any) => {
        try {
          const result = await withTimeout(realContainer.item(id, partitionKey).replace(newItem, options), 2500)
          console.log(
            `🟢 [AZURE COSMOS DB] Updated item "${id}" in container "${containerName}" (Live Azure Cloud)`
          )
          try { await mockContainer.item(id, partitionKey).replace(newItem) } catch (_) {}
          return result
        } catch (err: any) {
          console.error(
            `❌ [AZURE COSMOS DB ERROR] Update "${id}" failed on "${containerName}": ${err.message}`
          )
          if (isStrictLive) {
            throw new Error(`Azure Cosmos DB Live Replace Failed: ${err.message}`)
          }
          return mockContainer.item(id, partitionKey).replace(newItem)
        }
      },
      delete: async () => {
        try {
          const result = await withTimeout(realContainer.item(id, partitionKey).delete(), 2500)
          console.log(
            `🟢 [AZURE COSMOS DB] Deleted item "${id}" from container "${containerName}" (Live Azure Cloud)`
          )
          try { await mockContainer.item(id, partitionKey).delete() } catch (_) {}
          return result
        } catch (err: any) {
          console.error(
            `❌ [AZURE COSMOS DB ERROR] Delete "${id}" failed on "${containerName}": ${err.message}`
          )
          if (isStrictLive) {
            throw new Error(`Azure Cosmos DB Live Delete Failed: ${err.message}`)
          }
          return mockContainer.item(id, partitionKey).delete()
        }
      },
    }),
  } as unknown as Container


}

/**
 * Executes a tenant-isolated query in Cosmos DB, with terminal indicators and fallback to local memory if needed.
 */
export async function queryTenantItems<T>(
  containerName: string,
  tenantId: string,
  query: string,
  parameters: Array<{ name: string; value: any }> = []
): Promise<T[]> {
  const container = getTenantContainer(containerName)
  const hasTenantParam = parameters.some(p => p.name === '@tenantId')
  const finalParams = hasTenantParam ? parameters : [...parameters, { name: '@tenantId', value: tenantId }]
  const querySpec = { query, parameters: finalParams }

  const { resources } = await container.items.query<T>(querySpec, { partitionKey: tenantId } as any).fetchAll()
  return (resources || []) as T[]
}

/**
 * Inserts or upserts a tenant item
 */
export async function createTenantItem<T extends { id?: string; tenantId: string }>(
  containerName: string,
  item: T
): Promise<T> {
  const container = getTenantContainer(containerName)
  const { resource } = await container.items.upsert<T>(item, { partitionKey: item.tenantId } as any)
  return (resource || item) as T
}

/**
 * Reads and updates a tenant item with a mutator callback
 */
export async function updateTenantItem<T extends { id: string; tenantId: string }>(
  containerName: string,
  id: string,
  tenantId: string,
  updateFn: (item: T) => T
): Promise<T> {
  const container = getTenantContainer(containerName)
  const { resource } = await container.item(id, tenantId).read<T>()
  if (!resource) {
    throw new Error(`Item "${id}" not found in container "${containerName}" for tenant "${tenantId}".`)
  }
  const updatedItem = updateFn(resource)
  const { resource: replaced } = await container.item(id, tenantId).replace<T>(updatedItem)
  return (replaced || updatedItem) as T
}

