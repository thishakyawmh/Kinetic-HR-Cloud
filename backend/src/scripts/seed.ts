import { CosmosClient } from '@azure/cosmos'
import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob'
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
if (!fs.existsSync(settingsPath)) {
  console.error('❌ local.settings.json not found at:', settingsPath)
  process.exit(1)
}

const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')).Values

const cosmosClient = new CosmosClient({
  endpoint: settings.COSMOS_DB_ENDPOINT,
  key: settings.COSMOS_DB_KEY,
})

const blobServiceClient = BlobServiceClient.fromConnectionString(
  settings.BLOB_STORAGE_CONNECTION_STRING
)

const DB_NAME = settings.COSMOS_DB_DATABASE || 'KineticHR'

const CONTAINERS = [
  { id: 'organizations', partitionKey: '/tenantId' },
  { id: 'users', partitionKey: '/tenantId' },
  { id: 'leaves', partitionKey: '/tenantId' },
  { id: 'leave_balances', partitionKey: '/tenantId' },
  { id: 'payslips', partitionKey: '/tenantId' },
  { id: 'policies', partitionKey: '/tenantId' },
  { id: 'audit_logs', partitionKey: '/tenantId' },
]

function createMinimalPdfBuffer(title: string, subtitle: string, lines: string[]): Buffer {
  const content = lines.map((l, idx) => `0 -20 Td (${l.replace(/[()]/g, '')}) Tj`).join('\n')
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

const ORGANIZATIONS = [
  {
    id: 'tenant-kinetic',
    tenantId: 'tenant-kinetic',
    name: 'Kinetic Technologies',
    code: 'KINETIC',
    domain: 'kinetictech.io',
    plan: 'Enterprise',
    status: 'Active',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tenant-nova',
    tenantId: 'tenant-nova',
    name: 'Nova Systems',
    code: 'NOVA',
    domain: 'novasystems.com',
    plan: 'Enterprise',
    status: 'Active',
    createdAt: '2024-01-01T00:00:00Z',
  },
]

const USERS = [
  // Kinetic Technologies
  {
    id: 'user-Alice',
    tenantId: 'tenant-kinetic',
    name: 'Alice Johnson',
    email: 'Alice.johnson@kinetictech.io',
    role: 'employee',
    department: 'Engineering',
    jobTitle: 'Senior Frontend Engineer',
    employeeNumber: 'KT-8842',
    managerId: 'user-david',
    managerName: 'David Wilson',
    hireDate: '2023-04-15',
    phone: '+1 (555) 234-5678',
    location: 'Seattle, WA (Hybrid)',
  },
  {
    id: 'user-david',
    tenantId: 'tenant-kinetic',
    name: 'David Wilson',
    email: 'david.wilson@kinetictech.io',
    role: 'manager',
    department: 'Engineering',
    jobTitle: 'Engineering Director',
    employeeNumber: 'KT-1044',
    hireDate: '2021-08-01',
    phone: '+1 (555) 443-8901',
    location: 'Seattle, WA (Office)',
  },
  {
    id: 'user-sarah',
    tenantId: 'tenant-kinetic',
    name: 'Sarah Miller',
    email: 'sarah.miller@kinetictech.io',
    role: 'admin',
    department: 'Human Resources',
    jobTitle: 'VP of People & Operations',
    employeeNumber: 'KT-0012',
    hireDate: '2020-01-10',
    phone: '+1 (555) 789-0123',
    location: 'San Francisco, CA (HQ)',
  },
  {
    id: 'user-marcus',
    tenantId: 'tenant-kinetic',
    name: 'Marcus Chen',
    email: 'marcus.chen@kinetictech.io',
    role: 'employee',
    department: 'Engineering',
    jobTitle: 'DevOps & Cloud Engineer',
    employeeNumber: 'KT-3301',
    managerId: 'user-david',
    managerName: 'David Wilson',
    hireDate: '2022-03-11',
    phone: '+1 (555) 321-4567',
    location: 'Seattle, WA',
  },
  {
    id: 'user-priya',
    tenantId: 'tenant-kinetic',
    name: 'Priya Patel',
    email: 'priya.patel@kinetictech.io',
    role: 'employee',
    department: 'Engineering',
    jobTitle: 'Backend Lead',
    employeeNumber: 'KT-5510',
    managerId: 'user-david',
    managerName: 'David Wilson',
    hireDate: '2022-09-01',
    phone: '+1 (555) 654-9870',
    location: 'Austin, TX (Remote)',
  },
  {
    id: 'user-platform-admin',
    tenantId: 'tenant-kinetic',
    name: 'Alex Thorne',
    email: 'alex.thorne@kineticcloud.azure.com',
    role: 'platform_admin',
    department: 'Cloud Platform Operations',
    jobTitle: 'Principal Cloud Platform Director',
    employeeNumber: 'KC-0001',
    hireDate: '2020-01-01',
    location: 'Microsoft Azure East US',
  },
  // Nova Systems (Tenant Isolated)
  {
    id: 'user-brandon-nova',
    tenantId: 'tenant-nova',
    name: 'Brandon Lee',
    email: 'brandon.lee@novasystems.com',
    role: 'employee',
    department: 'Operations',
    jobTitle: 'Systems Architect',
    employeeNumber: 'NV-108',
    hireDate: '2024-02-01',
    phone: '+1 (555) 881-2299',
    location: 'Chicago, IL',
  },
  {
    id: 'user-claire-nova',
    tenantId: 'tenant-nova',
    name: 'Claire Underwood',
    email: 'claire.underwood@novasystems.com',
    role: 'manager',
    department: 'Operations',
    jobTitle: 'Operations Director',
    employeeNumber: 'NV-024',
    hireDate: '2021-05-15',
    phone: '+1 (555) 992-3344',
    location: 'Chicago, IL',
  },
]

const LEAVE_BALANCES = [
  // Alice Johnson
  {
    id: 'bal-alice-annual',
    tenantId: 'tenant-kinetic',
    userId: 'user-Alice',
    leaveTypeName: 'Annual Leave',
    code: 'annual',
    totalAllowance: 20,
    used: 8,
    remaining: 12,
  },
  {
    id: 'bal-alice-sick',
    tenantId: 'tenant-kinetic',
    userId: 'user-Alice',
    leaveTypeName: 'Sick Leave',
    code: 'sick',
    totalAllowance: 10,
    used: 3,
    remaining: 7,
  },
  {
    id: 'bal-alice-casual',
    tenantId: 'tenant-kinetic',
    userId: 'user-Alice',
    leaveTypeName: 'Casual Leave',
    code: 'casual',
    totalAllowance: 5,
    used: 1,
    remaining: 4,
  },
  // Marcus Chen
  {
    id: 'bal-marcus-annual',
    tenantId: 'tenant-kinetic',
    userId: 'user-marcus',
    leaveTypeName: 'Annual Leave',
    code: 'annual',
    totalAllowance: 20,
    used: 4,
    remaining: 16,
  },
  // Priya Patel
  {
    id: 'bal-priya-annual',
    tenantId: 'tenant-kinetic',
    userId: 'user-priya',
    leaveTypeName: 'Annual Leave',
    code: 'annual',
    totalAllowance: 20,
    used: 6,
    remaining: 14,
  },
  // Nova: Brandon Lee
  {
    id: 'bal-brandon-annual',
    tenantId: 'tenant-nova',
    userId: 'user-brandon-nova',
    leaveTypeName: 'Annual Leave',
    code: 'annual',
    totalAllowance: 22,
    used: 5,
    remaining: 17,
  },
]

const LEAVE_REQUESTS = [
  {
    id: 'req-1029',
    tenantId: 'tenant-kinetic',
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
    createdAt: '2026-10-05T08:30:00Z',
    updatedAt: '2026-10-05T08:30:00Z',
    timeline: [
      {
        id: 'tl-1',
        action: 'submitted',
        actorName: 'Alice Johnson',
        timestamp: '2026-10-05T08:30:00Z',
        comment: 'Emergency leave requested for tomorrow',
      },
    ],
  },
  {
    id: 'req-1028',
    tenantId: 'tenant-kinetic',
    employeeId: 'user-Alice',
    employeeName: 'Alice Johnson',
    department: 'Engineering',
    leaveTypeId: 'lt-annual',
    leaveTypeName: 'Annual Leave',
    leaveTypeCode: 'annual',
    startDate: '2026-09-18',
    endDate: '2026-09-19',
    requestedDays: 2,
    reason: 'Family trip planned ahead of time.',
    status: 'approved',
    createdAt: '2026-09-10T10:00:00Z',
    updatedAt: '2026-09-11T14:20:00Z',
    reviewedBy: 'David Wilson',
    reviewedAt: '2026-09-11T14:20:00Z',
    reviewerComment: 'Approved. Sprint deliverables covered by Priya.',
    timeline: [
      {
        id: 'tl-2',
        action: 'submitted',
        actorName: 'Alice Johnson',
        timestamp: '2026-09-10T10:00:00Z',
        comment: 'Annual leave submitted',
      },
      {
        id: 'tl-3',
        action: 'approved',
        actorName: 'David Wilson',
        timestamp: '2026-09-11T14:20:00Z',
        comment: 'Approved. Sprint deliverables covered by Priya.',
      },
    ],
  },
  {
    id: 'req-1025',
    tenantId: 'tenant-kinetic',
    employeeId: 'user-marcus',
    employeeName: 'Marcus Chen',
    department: 'Engineering',
    leaveTypeId: 'lt-annual',
    leaveTypeName: 'Annual Leave',
    leaveTypeCode: 'annual',
    startDate: '2026-10-12',
    endDate: '2026-10-14',
    requestedDays: 3,
    reason: 'Personal time off.',
    status: 'pending',
    createdAt: '2026-10-04T09:00:00Z',
    updatedAt: '2026-10-04T09:00:00Z',
    timeline: [
      {
        id: 'tl-4',
        action: 'submitted',
        actorName: 'Marcus Chen',
        timestamp: '2026-10-04T09:00:00Z',
        comment: 'Annual leave request submitted',
      },
    ],
  },
]

const PAYSLIPS = [
  {
    id: 'pay-2026-10',
    tenantId: 'tenant-kinetic',
    employeeId: 'user-Alice',
    periodMonth: 'October',
    periodYear: 2026,
    payDate: '2026-10-31',
    basicSalary: 3000,
    allowances: 350,
    overtime: 0,
    grossSalary: 3350,
    tax: 340,
    deductions: 110,
    netSalary: 2900,
    currency: 'USD',
    status: 'Published',
    notes: 'Q4 standard disbursement cycle.',
    salaryDiffExplanation: 'Net take-home is $120 lower than September 2026 ($2,900 vs $3,020) due to federal tax bracket withholding tier adjustment and wellness enrollment.',
    breakdown: [
      { name: 'Base Salary', amount: 3000, category: 'earning', description: 'Monthly fixed contract base' },
      { name: 'Remote Work & Internet Allowance', amount: 200, category: 'earning', description: 'Monthly broadband stipend' },
      { name: 'Commuter / Tech Subsidy', amount: 150, category: 'earning', description: 'Hardware & learning stipend' },
      { name: 'Federal Income Withholding', amount: 240, category: 'deduction', description: 'Withheld according to Q4 IRS tables' },
      { name: 'State Income Tax', amount: 100, category: 'deduction', description: 'WA state statutory deductions' },
      { name: 'Medical & Dental Plan Tier 2', amount: 80, category: 'deduction', description: 'Standard health plan contribution' },
      { name: 'Wellness Program Contribution', amount: 30, category: 'deduction', description: 'Annual enrolled wellness subsidy' },
    ],
  },
  {
    id: 'pay-2026-09',
    tenantId: 'tenant-kinetic',
    employeeId: 'user-Alice',
    periodMonth: 'September',
    periodYear: 2026,
    payDate: '2026-09-30',
    basicSalary: 3000,
    allowances: 350,
    overtime: 0,
    grossSalary: 3350,
    tax: 250,
    deductions: 80,
    netSalary: 3020,
    currency: 'USD',
    status: 'Published',
    notes: 'Standard monthly salary payout.',
    salaryDiffExplanation: 'Net take-home was standard base payout of $3,020.',
    breakdown: [
      { name: 'Base Salary', amount: 3000, category: 'earning', description: 'Monthly fixed contract base' },
      { name: 'Remote Work & Internet Allowance', amount: 200, category: 'earning', description: 'Monthly broadband stipend' },
      { name: 'Commuter / Tech Subsidy', amount: 150, category: 'earning', description: 'Hardware & learning stipend' },
      { name: 'Federal Income Withholding', amount: 180, category: 'deduction', description: 'Standard tier deduction' },
      { name: 'State Income Tax', amount: 70, category: 'deduction', description: 'WA state statutory deductions' },
      { name: 'Medical & Dental Plan Tier 2', amount: 80, category: 'deduction', description: 'Standard health plan contribution' },
    ],
  },
  {
    id: 'pay-2026-08',
    tenantId: 'tenant-kinetic',
    employeeId: 'user-Alice',
    periodMonth: 'August',
    periodYear: 2026,
    payDate: '2026-08-31',
    basicSalary: 3000,
    allowances: 350,
    overtime: 0,
    grossSalary: 3350,
    tax: 250,
    deductions: 80,
    netSalary: 3020,
    currency: 'USD',
    status: 'Published',
    notes: 'Standard monthly salary payout.',
    salaryDiffExplanation: 'Standard base payout of $3,020.',
    breakdown: [
      { name: 'Base Salary', amount: 3000, category: 'earning', description: 'Monthly fixed contract base' },
      { name: 'Remote Work & Internet Allowance', amount: 200, category: 'earning', description: 'Monthly broadband stipend' },
      { name: 'Commuter / Tech Subsidy', amount: 150, category: 'earning', description: 'Hardware & learning stipend' },
      { name: 'Federal Income Withholding', amount: 180, category: 'deduction', description: 'Standard tier deduction' },
      { name: 'State Income Tax', amount: 70, category: 'deduction', description: 'WA state statutory deductions' },
      { name: 'Medical & Dental Plan Tier 2', amount: 80, category: 'deduction', description: 'Standard health plan contribution' },
    ],
  },
]

const POLICIES = [
  {
    id: 'pol-1',
    tenantId: 'tenant-kinetic',
    title: 'Global Remote Work & Hybrid Policy',
    category: 'Remote Work',
    version: '2.1',
    fileSize: '1.4 MB',
    summary: 'Guidelines for asynchronous collaboration, home office expense stipends, and core hours.',
    keyTerms: ['Core Working Hours', 'Equipment Allowance', 'Travel Reimbursement'],
    uploadedAt: '2026-01-15T00:00:00Z',
    contentExcerpt: 'All full-time employees are eligible for hybrid remote working arrangements. Core collaboration hours are 10:00 AM to 3:00 PM Pacific Time. Kinetic provides a $1,000 initial home office setup stipend and $75 monthly broadband subsidy.',
  },
  {
    id: 'pol-2',
    tenantId: 'tenant-kinetic',
    title: 'Comprehensive Paid Time Off & Emergency Leave',
    category: 'Leave & Absence',
    version: '3.0',
    fileSize: '850 KB',
    summary: 'Standard operating procedures for requesting scheduled time off and emergency coverage.',
    keyTerms: ['Annual Leave', 'Sick Leave', 'Medical Certification', 'Emergency Leave'],
    uploadedAt: '2026-02-01T00:00:00Z',
    contentExcerpt: 'Employees accrue 20 days of Annual Leave annually. Up to 5 days can carry over into the next fiscal year. Emergency leave is granted up to 3 days per incident for immediate family emergencies without prior 2-week notice.',
  },
  {
    id: 'pol-3',
    tenantId: 'tenant-kinetic',
    title: 'Employee Code of Conduct & Anti-Harassment',
    category: 'Conduct & Ethics',
    version: '2.0',
    fileSize: '1.1 MB',
    summary: 'Standards of ethical behavior, mutual respect, data privacy, and whistleblower protection.',
    keyTerms: ['Non-Discrimination', 'Confidentiality', 'Whistleblower Protection'],
    uploadedAt: '2026-02-15T00:00:00Z',
    contentExcerpt: 'Kinetic Technologies is committed to maintaining a safe, inclusive, and professional workspace free from all forms of harassment and discrimination. All complaints are investigated by HR within 48 hours.',
  },
  {
    id: 'pol-4',
    tenantId: 'tenant-kinetic',
    title: 'Performance Review Cycles & Promotion Framework',
    category: 'Performance',
    version: '1.5',
    fileSize: '920 KB',
    summary: 'Bi-annual review cadence, engineering leveling matrix, and compensation adjustments.',
    keyTerms: ['Career Matrix', '360 Feedback', 'Merit Increases'],
    uploadedAt: '2026-03-01T00:00:00Z',
    contentExcerpt: 'Performance reviews occur twice per year in June and December. Promotions are calibrated based on demonstrated competence against the Engineering Leveling Framework.',
  },
  {
    id: 'pol-5',
    tenantId: 'tenant-kinetic',
    title: 'Mental Health, Wellness & Medical Coverage',
    category: 'Benefits',
    version: '2.2',
    fileSize: '1.3 MB',
    summary: 'Health insurance tiers, Employee Assistance Program (EAP), and gym & wellness stipends.',
    keyTerms: ['EAP Support', 'Dental & Vision', 'Gym Reimbursement'],
    uploadedAt: '2026-03-10T00:00:00Z',
    contentExcerpt: 'Comprehensive medical, dental, and vision coverage is provided starting day 1. EAP provides 10 free confidential mental health sessions per year for all employees and their dependents.',
  },
]

const AUDIT_LOGS = [
  {
    id: 'log-101',
    tenantId: 'tenant-kinetic',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    actorName: 'David Wilson',
    actorEmail: 'david.wilson@kinetictech.io',
    action: 'Leave Approved',
    category: 'Leave Management',
    target: 'Alice Johnson (KT-8842)',
    ipAddress: '198.51.100.44',
    riskLevel: 'low',
    details: 'Approved 2 days Annual Leave for 2026-09-18 to 2026-09-19',
  },
  {
    id: 'log-102',
    tenantId: 'tenant-kinetic',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    actorName: 'Sarah Miller',
    actorEmail: 'sarah.miller@kinetictech.io',
    action: 'Payroll Published',
    category: 'Payroll',
    target: 'Q4 October Payroll Cycle',
    ipAddress: '198.51.100.12',
    riskLevel: 'medium',
    details: 'Published monthly payslips for 8 active employees across Engineering and Operations',
  },
  {
    id: 'log-103',
    tenantId: 'tenant-kinetic',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    actorName: 'Alice Johnson',
    actorEmail: 'Alice.johnson@kinetictech.io',
    action: 'Emergency Leave Submitted',
    category: 'Leave Management',
    target: 'Self',
    ipAddress: '198.51.100.89',
    riskLevel: 'low',
    details: 'Submitted emergency leave request for 2026-10-06 (1 day)',
  },
]

async function seed() {
  console.log(`\n======================================================`)
  console.log(`🔌 CONNECTING TO AZURE COSMOS DB & STORAGE`)
  console.log(`Endpoint: ${settings.COSMOS_DB_ENDPOINT}`)
  console.log(`======================================================`)

  // 1. Create or ensure Database
  const { database } = await cosmosClient.databases.createIfNotExists({ id: DB_NAME })
  console.log(`✔ Database verified: ${DB_NAME}`)

  // 2. Create Containers with partition key /tenantId
  for (const c of CONTAINERS) {
    await database.containers.createIfNotExists({
      id: c.id,
      partitionKey: { paths: [c.partitionKey] },
    })
    console.log(`   ✔ Container: ${c.id} (partition: ${c.partitionKey})`)
  }

  // 3. Ensure Blob Storage container
  const containerName = settings.BLOB_CONTAINER_TENANTS || 'tenants'
  const containerClient = blobServiceClient.getContainerClient(containerName)
  await containerClient.createIfNotExists()
  console.log(`✔ Azure Blob container verified: ${containerName}`)

  // 4. Seed Organizations
  const orgContainer = database.container('organizations')
  for (const org of ORGANIZATIONS) {
    await orgContainer.items.upsert(org)
  }
  console.log(`✔ Seeded ${ORGANIZATIONS.length} Organizations`)

  // 5. Seed Users
  const userContainer = database.container('users')
  for (const user of USERS) {
    await userContainer.items.upsert(user)
  }
  console.log(`✔ Seeded ${USERS.length} Users / Employees`)

  // 6. Seed Leave Balances
  const balContainer = database.container('leave_balances')
  for (const bal of LEAVE_BALANCES) {
    await balContainer.items.upsert(bal)
  }
  console.log(`✔ Seeded ${LEAVE_BALANCES.length} Leave Balances`)

  // 7. Seed Leave Requests
  const leaveContainer = database.container('leaves')
  for (const req of LEAVE_REQUESTS) {
    await leaveContainer.items.upsert(req)
  }
  console.log(`✔ Seeded ${LEAVE_REQUESTS.length} Leave Requests`)

  // 8. Seed Payslips
  const payContainer = database.container('payslips')
  for (const pay of PAYSLIPS) {
    await payContainer.items.upsert(pay)
  }
  console.log(`✔ Seeded ${PAYSLIPS.length} Payslips into Cosmos DB`)

  // 9. Seed Policies
  const polContainer = database.container('policies')
  for (const pol of POLICIES) {
    await polContainer.items.upsert(pol)
  }
  console.log(`✔ Seeded ${POLICIES.length} Policies into Cosmos DB`)

  // 10. Seed Audit Logs
  const auditContainer = database.container('audit_logs')
  for (const log of AUDIT_LOGS) {
    await auditContainer.items.upsert(log)
  }
  console.log(`✔ Seeded ${AUDIT_LOGS.length} Audit Logs into Cosmos DB`)

  // 11. Upload Actual Payslip & Policy PDFs to Azure Blob Storage
  console.log(`\n📄 Uploading sample PDF files to Azure Blob Storage...`)
  for (const pay of PAYSLIPS) {
    const blobPath = `${pay.tenantId}/payslips/${pay.id}.pdf`
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath)
    const pdfBuf = createMinimalPdfBuffer(
      `Kinetic HR Cloud - Official Payslip`,
      `Period: ${pay.periodMonth} ${pay.periodYear} | Employee: Alice Johnson (KT-8842)`,
      [
        `Pay Date: ${pay.payDate}`,
        `Gross Earnings: $${pay.grossSalary}.00`,
        `Basic Salary: $${pay.basicSalary}.00`,
        `Allowances: $${pay.allowances}.00`,
        `Total Taxes & Deductions: -$${pay.tax + pay.deductions}.00`,
        `NET TAKE-HOME PAY: $${pay.netSalary}.00 ${pay.currency}`,
        `Status: ${pay.status}`,
        `Kinetic Technologies Inc. - Confidential Payroll Document`,
      ]
    )
    await blockBlobClient.uploadData(pdfBuf, {
      blobHTTPHeaders: { blobContentType: 'application/pdf' },
    })
    console.log(`   ✔ Uploaded Blob: ${blobPath}`)
  }

  for (const pol of POLICIES) {
    const blobPath = `${pol.tenantId}/policies/${pol.id}.pdf`
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath)
    const pdfBuf = createMinimalPdfBuffer(
      `Kinetic Technologies - Corporate Policy Document`,
      `${pol.title} (v${pol.version})`,
      [
        `Category: ${pol.category}`,
        `Effective Date: ${pol.uploadedAt.split('T')[0]}`,
        `Summary: ${pol.summary}`,
        `Key Guidelines: ${pol.keyTerms.join(', ')}`,
        `Excerpt: ${pol.contentExcerpt}`,
        `Approved by Kinetic People & Operations Compliance Team`,
      ]
    )
    await blockBlobClient.uploadData(pdfBuf, {
      blobHTTPHeaders: { blobContentType: 'application/pdf' },
    })
    console.log(`   ✔ Uploaded Blob: ${blobPath}`)
  }

  console.log(`\n======================================================`)
  console.log(`🎉 ALL LIVE AZURE RESOURCES CONFIGURED & SEEDED 100%!`)
  console.log(`======================================================\n`)
}

seed().catch(err => {
  console.error('\n❌ Seed failed with error:', err.message || err)
  process.exit(1)
})
