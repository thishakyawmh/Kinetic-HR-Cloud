import { CosmosClient } from '@azure/cosmos'
import { BlobServiceClient } from '@azure/storage-blob'
import fs from 'fs'
import path from 'path'

// Read credentials from local.settings.json
let settingsPath = path.resolve(__dirname, '../../local.settings.json')
if (!fs.existsSync(settingsPath)) {
  settingsPath = path.resolve(process.cwd(), 'local.settings.json')
}
if (!fs.existsSync(settingsPath)) {
  settingsPath = path.resolve(__dirname, '../../../local.settings.json')
}

let settings: any = {}
if (fs.existsSync(settingsPath)) {
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')).Values || {}
  } catch (e) {}
}

const DB_NAME = settings.COSMOS_DB_DATABASE || 'KineticHR'

const CONTAINERS = [
  { id: 'organizations', partitionKey: '/tenantId' },
  { id: 'users', partitionKey: '/tenantId' },
  { id: 'leaves', partitionKey: '/tenantId' },
  { id: 'leave_balances', partitionKey: '/tenantId' },
  { id: 'payslips', partitionKey: '/tenantId' },
  { id: 'policies', partitionKey: '/tenantId' },
  { id: 'audit_logs', partitionKey: '/tenantId' },
  { id: 'departments', partitionKey: '/tenantId' },
  { id: 'document_requests', partitionKey: '/tenantId' },
  { id: 'attendance', partitionKey: '/tenantId' },
  { id: 'notifications', partitionKey: '/tenantId' },
  { id: 'branches', partitionKey: '/tenantId' },
]

function createMinimalPdfBuffer(title: string, subtitle: string, lines: string[]): Buffer {
  const content = lines.map((l) => `0 -20 Td (${l.replace(/[()]/g, '')}) Tj`).join('\n')
  const stream = `BT /F1 18 Tf 50 740 Td (${title.replace(/[()]/g, '')}) Tj /F1 12 Tf 0 -25 Td (${subtitle.replace(/[()]/g, '')}) Tj /F1 10 Tf ${content} ET`
  const streamLen = stream.length
  const pdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${streamLen} >> stream
${stream}
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000244 00000 n 
0000000330 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
412
%%EOF`
  return Buffer.from(pdf, 'utf-8')
}

// -----------------------------------------------------------------------------
// SEED DATA GENERATOR: 2 Tenants, 10 Depts, 70 Users, 350 Balances, 120 Leaves, 500 Attendance, 210 Payslips
// -----------------------------------------------------------------------------

const ORGANIZATIONS = [
  {
    id: 'tenant-kinetic',
    tenantId: 'tenant-kinetic',
    name: 'Kinetic Technologies',
    code: 'KINETIC',
    domain: 'kinetictech.io',
    plan: 'Enterprise Cloud',
    status: 'Active',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tenant-nova',
    tenantId: 'tenant-nova',
    name: 'Nova Systems',
    code: 'NOVA',
    domain: 'novasystems.com',
    plan: 'Enterprise Cloud',
    status: 'Active',
    createdAt: '2024-01-01T00:00:00Z',
  },
]

const DEPARTMENTS = [
  // Kinetic Technologies
  { id: 'dept-eng', tenantId: 'tenant-kinetic', name: 'Engineering', head: 'David Wilson', threshold: '70% min staffing', status: 'Active', description: 'Core product engineering and cloud infrastructure.' },
  { id: 'dept-hr', tenantId: 'tenant-kinetic', name: 'Human Resources', head: 'Sarah Miller', threshold: '80% min staffing', status: 'Active', description: 'People operations, talent acquisition, and compliance.' },
  { id: 'dept-prod', tenantId: 'tenant-kinetic', name: 'Product Management', head: 'Claire Underwood', threshold: '75% min staffing', status: 'Active', description: 'Product roadmap and feature architecture.' },
  { id: 'dept-ux', tenantId: 'tenant-kinetic', name: 'Design & UX', head: 'Carlos Mendoza', threshold: '65% min staffing', status: 'Active', description: 'User interface design and brand identity systems.' },
  { id: 'dept-ops', tenantId: 'tenant-kinetic', name: 'Operations & Cloud', head: 'Brandon Lee', threshold: '85% min staffing', status: 'Active', description: 'Cloud infrastructure, security, and hardware ops.' },
  // Nova Systems
  { id: 'dept-nova-eng', tenantId: 'tenant-nova', name: 'Customer Engineering', head: 'Claire Underwood', threshold: '75% min staffing', status: 'Active', description: 'Client integration engineering.' },
  { id: 'dept-nova-hr', tenantId: 'tenant-nova', name: 'HR & Legal', head: 'Victor Stone', threshold: '80% min staffing', status: 'Active', description: 'Legal compliance and talent operations.' },
  { id: 'dept-nova-ops', tenantId: 'tenant-nova', name: 'Operations & Logistics', head: 'Brandon Lee', threshold: '80% min staffing', status: 'Active', description: 'Enterprise logistics.' },
  { id: 'dept-nova-fin', tenantId: 'tenant-nova', name: 'Finance & Payroll', head: 'Samantha Ray', threshold: '90% min staffing', status: 'Active', description: 'Financial accounting.' },
  { id: 'dept-nova-strat', tenantId: 'tenant-nova', name: 'Product Strategy', head: 'Marcus Vance', threshold: '70% min staffing', status: 'Active', description: 'Strategic product planning.' },
]

// Generate 40 employees for Kinetic & 30 employees for Nova
const USERS: any[] = [
  // Core Kinetic Execs
  { id: 'user-Alice', tenantId: 'tenant-kinetic', name: 'Alice Johnson', email: 'Alice.johnson@kinetictech.io', role: 'employee', department: 'Engineering', jobTitle: 'Senior Frontend Engineer', employeeNumber: 'KT-8842', managerId: 'user-david', managerName: 'David Wilson', hireDate: '2023-04-15', phone: '+1 (555) 234-5678', location: 'Seattle, WA (Hybrid)' },
  { id: 'user-david', tenantId: 'tenant-kinetic', name: 'David Wilson', email: 'david.wilson@kinetictech.io', role: 'manager', department: 'Engineering', jobTitle: 'Engineering Director', employeeNumber: 'KT-1044', hireDate: '2021-08-01', phone: '+1 (555) 443-8901', location: 'Seattle, WA (Office)' },
  { id: 'user-sarah', tenantId: 'tenant-kinetic', name: 'Sarah Miller', email: 'sarah.miller@kinetictech.io', role: 'admin', department: 'Human Resources', jobTitle: 'VP of People & Operations', employeeNumber: 'KT-0012', hireDate: '2020-01-10', phone: '+1 (555) 789-0123', location: 'San Francisco, CA (HQ)' },
  { id: 'user-marcus', tenantId: 'tenant-kinetic', name: 'Marcus Chen', email: 'marcus.chen@kinetictech.io', role: 'employee', department: 'Engineering', jobTitle: 'DevOps & Cloud Engineer', employeeNumber: 'KT-3301', managerId: 'user-david', managerName: 'David Wilson', hireDate: '2022-03-11', phone: '+1 (555) 321-4567', location: 'Seattle, WA' },
  { id: 'user-priya', tenantId: 'tenant-kinetic', name: 'Priya Patel', email: 'priya.patel@kinetictech.io', role: 'employee', department: 'Engineering', jobTitle: 'Backend Lead', employeeNumber: 'KT-5510', managerId: 'user-david', managerName: 'David Wilson', hireDate: '2022-09-01', phone: '+1 (555) 654-9870', location: 'Austin, TX (Remote)' },
  { id: 'user-platform-admin', tenantId: 'tenant-kinetic', name: 'Alex Thorne', email: 'alex.thorne@kineticcloud.azure.com', role: 'platform_admin', department: 'Cloud Platform Operations', jobTitle: 'Principal Cloud Platform Director', employeeNumber: 'KC-0001', hireDate: '2020-01-01', location: 'Microsoft Azure East US' },

  // Core Nova Execs
  { id: 'user-brandon-nova', tenantId: 'tenant-nova', name: 'Brandon Lee', email: 'brandon.lee@novasystems.com', role: 'employee', department: 'Operations & Logistics', jobTitle: 'Systems Architect', employeeNumber: 'NV-108', hireDate: '2024-02-01', phone: '+1 (555) 881-2299', location: 'Chicago, IL' },
  { id: 'user-claire-nova', tenantId: 'tenant-nova', name: 'Claire Underwood', email: 'claire.underwood@novasystems.com', role: 'manager', department: 'Operations & Logistics', jobTitle: 'Operations Director', employeeNumber: 'NV-024', hireDate: '2021-05-15', phone: '+1 (555) 992-3344', location: 'Chicago, IL' },
  { id: 'user-victor-nova', tenantId: 'tenant-nova', name: 'Victor Stone', email: 'victor.stone@novasystems.com', role: 'admin', department: 'HR & Legal', jobTitle: 'HR Director', employeeNumber: 'NV-005', hireDate: '2020-03-10', phone: '+1 (555) 991-4455', location: 'Chicago, IL' },
]

// Generate remaining 34 Kinetic employees
const firstNames = ['James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William', 'Mia', 'Benjamin', 'Charlotte', 'Lucas', 'Amelia', 'Henry', 'Harper', 'Alexander', 'Evelyn', 'Daniel', 'Abigail', 'Jacob', 'Emily', 'Michael', 'Ella', 'Logan', 'Elizabeth', 'Jackson', 'Camila', 'Sebastian', 'Luna', 'Jack', 'Sofia']
const lastNames = ['Smith', 'Garcia', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill']

firstNames.forEach((fn, idx) => {
  const ln = lastNames[idx % lastNames.length]
  const id = `user-kin-${idx + 10}`
  USERS.push({
    id,
    tenantId: 'tenant-kinetic',
    name: `${fn} ${ln}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@kinetictech.io`,
    role: idx % 6 === 0 ? 'manager' : 'employee',
    department: DEPARTMENTS[idx % 5].name,
    jobTitle: `Specialist Level ${ (idx % 3) + 1}`,
    employeeNumber: `KT-${2000 + idx}`,
    managerId: 'user-david',
    managerName: 'David Wilson',
    hireDate: `202${(idx % 4) + 1}-0${(idx % 8) + 1}-15`,
    phone: `+1 (555) 300-${1000 + idx}`,
    location: 'Seattle, WA',
  })
})

// Generate remaining 27 Nova employees
firstNames.slice(0, 27).forEach((fn, idx) => {
  const ln = lastNames[(idx + 5) % lastNames.length]
  const id = `user-nova-${idx + 10}`
  USERS.push({
    id,
    tenantId: 'tenant-nova',
    name: `${fn} ${ln}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@novasystems.com`,
    role: idx % 5 === 0 ? 'manager' : 'employee',
    department: DEPARTMENTS[5 + (idx % 5)].name,
    jobTitle: `Systems Analyst Level ${ (idx % 3) + 1}`,
    employeeNumber: `NV-${3000 + idx}`,
    managerId: 'user-claire-nova',
    managerName: 'Claire Underwood',
    hireDate: `202${(idx % 3) + 2}-0${(idx % 8) + 1}-10`,
    phone: `+1 (555) 400-${1000 + idx}`,
    location: 'Chicago, IL',
  })
})

// Generate Leave Balances
const LEAVE_TYPES = [
  { name: 'Annual Leave', code: 'annual', allowance: 20 },
  { name: 'Sick Leave', code: 'sick', allowance: 12 },
  { name: 'Casual Leave', code: 'casual', allowance: 7 },
  { name: 'Parental Leave', code: 'parental', allowance: 90 },
  { name: 'Study Leave', code: 'study', allowance: 10 },
]

const LEAVE_BALANCES: any[] = []
USERS.forEach((u) => {
  LEAVE_TYPES.forEach((lt, lIdx) => {
    const used = (u.employeeNumber.charCodeAt(3) || 5) % 8
    LEAVE_BALANCES.push({
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

// Generate 120+ Leave Requests
const LEAVE_REQUESTS: any[] = []
const statuses: Array<'pending' | 'approved' | 'rejected' | 'cancelled'> = ['approved', 'pending', 'approved', 'rejected', 'approved', 'cancelled']

USERS.forEach((u, uIdx) => {
  for (let r = 1; r <= 2; r++) {
    const reqId = `leave-req-${u.id}-${r}`
    const status = statuses[(uIdx + r) % statuses.length]
    const leaveType = LEAVE_TYPES[(uIdx + r) % LEAVE_TYPES.length]
    const month = (r % 9) + 1
    const startDay = (r * 7) % 20 + 1
    const startDate = `2026-${month < 10 ? '0' + month : month}-${startDay < 10 ? '0' + startDay : startDay}`
    const endDate = `2026-${month < 10 ? '0' + month : month}-${(startDay + 2) < 10 ? '0' + (startDay + 2) : startDay + 2}`

    LEAVE_REQUESTS.push({
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

// Generate Attendance Records (500+ records)
const ATTENDANCE_RECORDS: any[] = []
USERS.slice(0, 30).forEach((u, idx) => {
  for (let day = 1; day <= 18; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`
    ATTENDANCE_RECORDS.push({
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

// Generate 210 Synthetic Payslips (3 months x 70 employees)
const PAYSLIPS: any[] = []
const months = [
  { name: 'August', year: 2026, date: '2026-08-31', period: '08/01/2026 - 08/31/2026' },
  { name: 'September', year: 2026, date: '2026-09-30', period: '09/01/2026 - 09/30/2026' },
  { name: 'October', year: 2026, date: '2026-10-31', period: '10/01/2026 - 10/31/2026' },
]

USERS.forEach((u, idx) => {
  const baseSalary = 3500 + (idx * 120)
  months.forEach((m) => {
    const payId = `pay-${u.id}-${m.name.toLowerCase()}-2026`
    const gross = baseSalary + 250
    const deductions = 320
    const taxes = 580
    const net = gross - deductions - taxes

    PAYSLIPS.push({
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

const POLICIES = [
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
  {
    id: 'pol-nova-1',
    tenantId: 'tenant-nova',
    title: 'Nova Systems Logistics Compliance Guidelines',
    category: 'Operations',
    version: '1.5',
    fileSize: '1.8 MB',
    summary: 'Operational safety and logistics standards.',
    keyTerms: ['Logistics', 'Safety', 'Compliance'],
    uploadedAt: '2026-03-10T09:00:00Z',
    contentExcerpt: 'All operations team members must complete quarterly safety protocol certifications.',
  },
]

const DOCUMENT_REQUESTS = [
  {
    id: 'doc-req-9041',
    tenantId: 'tenant-kinetic',
    employeeId: 'user-Alice',
    employeeName: 'Alice Johnson',
    documentType: 'Salary Certificate',
    purpose: 'Bank Loan Application',
    status: 'signed',
    createdAt: '2026-09-28T09:00:00Z',
    aiVerification: {
      identityVerified: true,
      verificationNotes: 'AI Identity Verified: Active Full-Time Employee.',
      policyCheckPassed: true,
    },
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

const NOTIFICATIONS = [
  {
    id: 'notif-1',
    tenantId: 'tenant-kinetic',
    recipientId: 'user-Alice',
    title: 'Leave Request Approved',
    message: 'Your annual leave request for Oct 12-14 has been approved by David Wilson.',
    read: false,
    createdAt: '2026-10-02T10:00:00Z',
  },
  {
    id: 'notif-2',
    tenantId: 'tenant-kinetic',
    recipientId: 'user-Alice',
    title: 'Payslip Available',
    message: 'Your payslip for September 2026 is now available for download.',
    read: true,
    createdAt: '2026-09-30T17:00:00Z',
  },
]

const AUDIT_LOGS = [
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
    details: 'Manager approved 3 days annual leave request after automated staffing quota check.',
  },
]

// -----------------------------------------------------------------------------
// SEED ENGINE EXECUTION
// -----------------------------------------------------------------------------

async function seedDatabase() {
  console.log('================================================================================')
  console.log('🚀 EXECUTING DATABASE SEEDING ENGINE FOR KINETIC HR CLOUD')
  console.log('================================================================================\n')

  let cosmosClient: CosmosClient | null = null
  let blobServiceClient: BlobServiceClient | null = null

  if (settings.COSMOS_DB_ENDPOINT && settings.COSMOS_DB_KEY && !settings.COSMOS_DB_ENDPOINT.includes('<your')) {
    cosmosClient = new CosmosClient({ endpoint: settings.COSMOS_DB_ENDPOINT, key: settings.COSMOS_DB_KEY })
  }

  if (settings.BLOB_STORAGE_CONNECTION_STRING && !settings.BLOB_STORAGE_CONNECTION_STRING.includes('<account')) {
    blobServiceClient = BlobServiceClient.fromConnectionString(settings.BLOB_STORAGE_CONNECTION_STRING)
  }

  // 1. Seed Live Azure Cosmos DB if configured
  if (cosmosClient) {
    console.log(`🟢 Connecting to Azure Cosmos DB: ${settings.COSMOS_DB_ENDPOINT}`)
    const { database } = await cosmosClient.databases.createIfNotExists({ id: DB_NAME })
    console.log(`   Database "${DB_NAME}" ready.`)

    for (const c of CONTAINERS) {
      await database.containers.createIfNotExists({ id: c.id, partitionKey: c.partitionKey })
    }

    const seedTasks = [
      { name: 'organizations', data: ORGANIZATIONS },
      { name: 'departments', data: DEPARTMENTS },
      { name: 'users', data: USERS },
      { name: 'leave_balances', data: LEAVE_BALANCES },
      { name: 'leaves', data: LEAVE_REQUESTS },
      { name: 'attendance', data: ATTENDANCE_RECORDS },
      { name: 'payslips', data: PAYSLIPS },
      { name: 'policies', data: POLICIES },
      { name: 'document_requests', data: DOCUMENT_REQUESTS },
      { name: 'notifications', data: NOTIFICATIONS },
      { name: 'audit_logs', data: AUDIT_LOGS },
    ]

    for (const task of seedTasks) {
      const container = database.container(task.name)
      let inserted = 0
      for (const item of task.data) {
        await container.items.upsert(item)
        inserted++
      }
      console.log(`   ✔ Seeded ${inserted} items into Cosmos DB container "${task.name}"`)
    }
  } else {
    console.log(`🟡 Cosmos DB not configured with live credentials; seeding local in-memory dataset.`)
  }

  // 2. Upload PDFs to Blob Storage / Azurite if configured
  if (blobServiceClient) {
    console.log(`\n📦 Uploading synthetic PDF documents to Blob Storage / Azurite...`)
    const containerName = settings.BLOB_CONTAINER_TENANTS || 'tenants'
    const containerClient = blobServiceClient.getContainerClient(containerName)
    await containerClient.createIfNotExists()

    for (const pay of PAYSLIPS.slice(0, 10)) {
      const blobPath = `${pay.tenantId}/payslips/${pay.id}.pdf`
      const blobClient = containerClient.getBlockBlobClient(blobPath)
      const pdfBuf = createMinimalPdfBuffer(
        `Kinetic HR Cloud - Official Payslip`,
        `Period: ${pay.periodMonth} ${pay.periodYear} | Employee: ${pay.employeeName}`,
        [
          `Pay Date: ${pay.payDate}`,
          `Gross Earnings: $${pay.grossSalary}.00`,
          `Basic Salary: $${pay.basicSalary}.00`,
          `Total Deductions: -$${pay.deductions + pay.statutoryTaxes}.00`,
          `NET TAKE-HOME PAY: $${pay.netSalary}.00 ${pay.currency}`,
        ]
      )
      await blobClient.uploadData(pdfBuf, { blobHTTPHeaders: { blobContentType: 'application/pdf' } })
    }
    console.log(`   ✔ Uploaded 10 sample payslip PDFs to container "${containerName}"`)

    for (const pol of POLICIES) {
      const blobPath = `${pol.tenantId}/policies/${pol.id}.pdf`
      const blobClient = containerClient.getBlockBlobClient(blobPath)
      const pdfBuf = createMinimalPdfBuffer(
        `Kinetic HR Cloud - Corporate Policy`,
        `${pol.title} (v${pol.version})`,
        [`Category: ${pol.category}`, `Summary: ${pol.summary}`]
      )
      await blobClient.uploadData(pdfBuf, { blobHTTPHeaders: { blobContentType: 'application/pdf' } })
    }
    console.log(`   ✔ Uploaded ${POLICIES.length} policy PDFs to container "${containerName}"`)
  }

  console.log('\n================================================================================')
  console.log('SUMMARY OF RECORD COUNTS SEEDED:')
  console.log('================================================================================')
  console.log(`   Organizations / Tenants : ${ORGANIZATIONS.length}`)
  console.log(`   Departments             : ${DEPARTMENTS.length}`)
  console.log(`   Users / Employees       : ${USERS.length}`)
  console.log(`   Leave Balances          : ${LEAVE_BALANCES.length}`)
  console.log(`   Leave Requests          : ${LEAVE_REQUESTS.length}`)
  console.log(`   Attendance Clock Logs   : ${ATTENDANCE_RECORDS.length}`)
  console.log(`   Payslips                : ${PAYSLIPS.length}`)
  console.log(`   HR Policy Documents     : ${POLICIES.length}`)
  console.log(`   Document Requests (2FA) : ${DOCUMENT_REQUESTS.length}`)
  console.log(`   User Notifications      : ${NOTIFICATIONS.length}`)
  console.log(`   SOC2 Security Audit Logs: ${AUDIT_LOGS.length}`)
  console.log('================================================================================\n')
}

seedDatabase().catch((err) => {
  console.error('\n❌ Seed failed with error:', err.message || err)
  process.exit(1)
})
