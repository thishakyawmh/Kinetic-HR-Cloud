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

  client = new CosmosClient({ endpoint, key })
  database = client.database(dbName)
  return database
}

// In-memory fallback dataset for instant local testing before Azure credentials are set
const LOCAL_MEMORY_DATA: Record<string, any[]> = {
  organizations: [
    { id: 'tenant-kinetic', tenantId: 'tenant-kinetic', name: 'Kinetic Technologies', code: 'KINETIC', status: 'Active' },
    { id: 'tenant-nova', tenantId: 'tenant-nova', name: 'Nova Systems', code: 'NOVA', status: 'Active' },
  ],
  users: [
    {
      id: 'user-Alice',
      tenantId: 'tenant-kinetic',
      name: 'Alice Johnson',
      email: 'Alice.johnson@kinetictech.io',
      role: 'employee',
      department: 'Engineering',
      jobTitle: 'Senior Frontend Engineer',
      employeeNumber: 'KT-8842',
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
    },
    {
      id: 'user-david-emp',
      tenantId: 'tenant-kinetic',
      name: 'David Wilson (Employee)',
      email: 'david.emp@kinetictech.io',
      role: 'employee',
      department: 'Engineering',
      jobTitle: 'Engineering Director',
      employeeNumber: 'KT-1044-EMP',
    },
    {
      id: 'user-sarah-emp',
      tenantId: 'tenant-kinetic',
      name: 'Sarah Miller (Employee)',
      email: 'sarah.emp@kinetictech.io',
      role: 'employee',
      department: 'Human Resources',
      jobTitle: 'VP of People & Operations',
      employeeNumber: 'KT-0012-EMP',
    },
    {
      id: 'user-brandon-nova',
      tenantId: 'tenant-nova',
      name: 'Brandon Lee',
      email: 'brandon.lee@novasystems.com',
      role: 'employee',
      department: 'Operations',
      jobTitle: 'Systems Architect',
      employeeNumber: 'NV-108',
    },
  ],
  leave_balances: [
    { id: 'bal-1', tenantId: 'tenant-kinetic', userId: 'user-Alice', leaveTypeName: 'Annual Leave', code: 'annual', remaining: 12, used: 8, totalAllowance: 20 },
    { id: 'bal-2', tenantId: 'tenant-kinetic', userId: 'user-Alice', leaveTypeName: 'Sick Leave', code: 'sick', remaining: 7, used: 3, totalAllowance: 10 },
  ],
  leaves: [
    {
      id: 'leave-demo-1',
      tenantId: 'tenant-kinetic',
      employeeId: 'user-Alice',
      employeeName: 'Alice Johnson',
      department: 'Engineering',
      leaveTypeName: 'Annual Leave',
      leaveTypeCode: 'annual',
      startDate: '2026-10-12',
      endDate: '2026-10-14',
      requestedDays: 3,
      reason: 'Family event',
      status: 'pending',
      createdAt: new Date().toISOString(),
      priorLeavesCount: 5,
    },
    // AI Autonomous Optimization Cluster: 8 Requests for Oct 25, 2026 (Max Quota: 5)
    {
      id: 'leave-clash-1',
      tenantId: 'tenant-kinetic',
      employeeId: 'emp-101',
      employeeName: 'Marcus Chen',
      department: 'Engineering',
      leaveTypeName: 'Annual Leave',
      leaveTypeCode: 'annual',
      startDate: '2026-10-25',
      endDate: '2026-10-25',
      requestedDays: 1,
      reason: 'General relaxation & personal weekend extension',
      status: 'pending',
      createdAt: '2026-10-01T08:00:00Z',
      submissionOrder: 1,
      priorLeavesCount: 14,
      isEmergency: false,
    },
    {
      id: 'leave-clash-2',
      tenantId: 'tenant-kinetic',
      employeeId: 'emp-102',
      employeeName: 'Priya Patel',
      department: 'Engineering',
      leaveTypeName: 'Annual Leave',
      leaveTypeCode: 'annual',
      startDate: '2026-10-25',
      endDate: '2026-10-25',
      requestedDays: 1,
      reason: 'Concert event out of city',
      status: 'pending',
      createdAt: '2026-10-01T08:15:00Z',
      submissionOrder: 2,
      priorLeavesCount: 11,
      isEmergency: false,
    },
    {
      id: 'leave-clash-3',
      tenantId: 'tenant-kinetic',
      employeeId: 'emp-103',
      employeeName: 'Jordan Hayes',
      department: 'Engineering',
      leaveTypeName: 'Casual Leave',
      leaveTypeCode: 'casual',
      startDate: '2026-10-25',
      endDate: '2026-10-25',
      requestedDays: 1,
      reason: 'Personal errands & vehicle service',
      status: 'pending',
      createdAt: '2026-10-01T08:30:00Z',
      submissionOrder: 3,
      priorLeavesCount: 8,
      isEmergency: false,
    },
    {
      id: 'leave-clash-4',
      tenantId: 'tenant-kinetic',
      employeeId: 'emp-104',
      employeeName: 'Elena Rostova',
      department: 'Engineering',
      leaveTypeName: 'Sick Leave',
      leaveTypeCode: 'sick',
      startDate: '2026-10-25',
      endDate: '2026-10-25',
      requestedDays: 1,
      reason: 'Scheduled dental procedure',
      status: 'pending',
      createdAt: '2026-10-01T09:00:00Z',
      submissionOrder: 4,
      priorLeavesCount: 6,
      isEmergency: false,
    },
    {
      id: 'leave-clash-5',
      tenantId: 'tenant-kinetic',
      employeeId: 'emp-105',
      employeeName: 'David Wilson',
      department: 'Engineering',
      leaveTypeName: 'Annual Leave',
      leaveTypeCode: 'annual',
      startDate: '2026-10-25',
      endDate: '2026-10-25',
      requestedDays: 1,
      reason: 'Family birthday gathering',
      status: 'pending',
      createdAt: '2026-10-01T09:30:00Z',
      submissionOrder: 5,
      priorLeavesCount: 9,
      isEmergency: false,
    },
    {
      id: 'leave-clash-6',
      tenantId: 'tenant-kinetic',
      employeeId: 'emp-106',
      employeeName: 'Kevin Vance',
      department: 'Engineering',
      leaveTypeName: 'Casual Leave',
      leaveTypeCode: 'casual',
      startDate: '2026-10-25',
      endDate: '2026-10-25',
      requestedDays: 1,
      reason: 'Home maintenance & repair technician visit',
      status: 'pending',
      createdAt: '2026-10-01T10:00:00Z',
      submissionOrder: 6,
      priorLeavesCount: 4,
      isEmergency: false,
    },
    {
      id: 'leave-clash-7',
      tenantId: 'tenant-kinetic',
      employeeId: 'emp-107',
      employeeName: 'Sophia Thorne',
      department: 'Engineering',
      leaveTypeName: 'Emergency Leave',
      leaveTypeCode: 'emergency',
      startDate: '2026-10-25',
      endDate: '2026-10-25',
      requestedDays: 1,
      reason: 'School emergency conference for child',
      status: 'pending',
      createdAt: '2026-10-01T10:30:00Z',
      submissionOrder: 7,
      priorLeavesCount: 2,
      isEmergency: true,
    },
    {
      id: 'leave-clash-8',
      tenantId: 'tenant-kinetic',
      employeeId: 'emp-108',
      employeeName: 'Liam O\'Connor',
      department: 'Engineering',
      leaveTypeName: 'Annual Leave',
      leaveTypeCode: 'annual',
      startDate: '2026-10-25',
      endDate: '2026-10-25',
      requestedDays: 1,
      reason: 'Urgent family medical evaluation. First leave request of the year.',
      status: 'pending',
      createdAt: '2026-10-01T11:00:00Z',
      submissionOrder: 8,
      priorLeavesCount: 0,
      isEmergency: true,
    },
  ],
  payslips: [
    {
      id: 'pay-2026-10',
      tenantId: 'tenant-kinetic',
      employeeId: 'user-Alice',
      periodMonth: 'October',
      periodYear: 2026,
      payPeriod: '10/01/2026 - 10/14/2026',
      payDate: '2026-10-16',
      filingStatus: 'Single',
      allowancesCount: 1,
      basicSalary: 3000,
      overtimeHours: 0,
      overtimeRate: 0,
      overtimePay: 0,
      grossSalary: 3000,
      grossPay: 3000,
      ytdGrossPay: 60450,
      preTaxMedical: 100,
      preTaxDental: 15,
      preTax401k: 150,
      totalPreTaxDeductions: 265,
      ytdPreTaxDeductions: 5300,
      taxFederal: 320,
      taxSocialSecurity: 186,
      taxMedicare: 43.5,
      taxState: 120,
      statutoryTaxes: 669.5,
      tax: 669.5,
      taxDeductions: 669.5,
      otherDeductions: 265,
      deductions: 265,
      totalDeductionsAndTaxes: 934.5,
      ytdTotalDeductionsAndTaxes: 18690,
      netSalary: 2065.5,
      netPay: 2065.5,
      ytdNetPay: 41760,
      currency: 'USD',
      status: 'Published',
      notes: 'Bi-weekly standard disbursement cycle.',
      salaryDiffExplanation: 'Net take-home pay is $2,065.50 after pre-tax deductions ($265.00) and statutory taxes ($669.50).',
      breakdown: [
        { name: 'Base Salary (80 hrs @ $37.50)', amount: 3000, category: 'earning', description: 'Bi-weekly regular pay' },
        { name: 'Medical Insurance', amount: 100, category: 'deduction', description: 'Pre-tax health coverage' },
        { name: 'Dental Insurance', amount: 15, category: 'deduction', description: 'Pre-tax dental coverage' },
        { name: '401(k) Retirement (5%)', amount: 150, category: 'deduction', description: 'Pre-tax retirement contribution' },
        { name: 'Federal Income Tax', amount: 320, category: 'deduction', description: 'Statutory federal withholding' },
        { name: 'Social Security (6.2%)', amount: 186, category: 'deduction', description: 'Statutory FICA' },
        { name: 'Medicare (1.45%)', amount: 43.5, category: 'deduction', description: 'Statutory FICA' },
        { name: 'State Income Tax (approx 4%)', amount: 120, category: 'deduction', description: 'Statutory state tax' },
      ],
    },
    {
      id: 'pay-2026-09',
      tenantId: 'tenant-kinetic',
      employeeId: 'user-Alice',
      periodMonth: 'September',
      periodYear: 2026,
      payPeriod: '09/16/2026 - 09/30/2026',
      payDate: '2026-09-30',
      filingStatus: 'Single',
      allowancesCount: 1,
      basicSalary: 3000,
      overtimeHours: 6,
      overtimeRate: 56.25,
      overtimePay: 337.5,
      grossSalary: 3337.5,
      grossPay: 3337.5,
      ytdGrossPay: 57450,
      preTaxMedical: 100,
      preTaxDental: 15,
      preTax401k: 150,
      totalPreTaxDeductions: 265,
      taxFederal: 350,
      taxSocialSecurity: 206.92,
      taxMedicare: 48.39,
      taxState: 133.5,
      statutoryTaxes: 738.81,
      tax: 738.81,
      taxDeductions: 738.81,
      otherDeductions: 265,
      deductions: 265,
      totalDeductionsAndTaxes: 1003.81,
      netSalary: 2333.69,
      netPay: 2333.69,
      ytdNetPay: 39694.5,
      currency: 'USD',
      status: 'Published',
      notes: 'Included 6 hours approved overtime.',
      breakdown: [
        { name: 'Base Salary (80 hrs @ $37.50)', amount: 3000, category: 'earning', description: 'Bi-weekly regular pay' },
        { name: 'Overtime Pay (6 hrs @ $56.25)', amount: 337.5, category: 'earning', description: 'Sprint release overtime' },
        { name: 'Pre-Tax Benefits Deductions', amount: 265, category: 'deduction', description: 'Health, dental, 401(k)' },
        { name: 'Statutory Taxes', amount: 738.81, category: 'deduction', description: 'Federal, FICA, State' },
      ],
    },
  ],
  departments: [
    { id: 'dept-eng', tenantId: 'tenant-kinetic', name: 'Engineering', head: 'David Wilson', threshold: '70% min staffing', status: 'Active', description: 'Core product engineering and cloud infrastructure division.' },
    { id: 'dept-hr', tenantId: 'tenant-kinetic', name: 'Human Resources', head: 'Sarah Miller', threshold: '80% min staffing', status: 'Active', description: 'People operations, talent acquisition, and compliance.' },
    { id: 'dept-prod', tenantId: 'tenant-kinetic', name: 'Product Management', head: 'Claire Underwood', threshold: '75% min staffing', status: 'Active', description: 'Product roadmap and feature architecture.' },
    { id: 'dept-[#23ace3]', tenantId: 'tenant-kinetic', name: 'Design & UX', head: 'Carlos Mendoza', threshold: '65% min staffing', status: 'Active', description: 'User interface design and brand identity systems.' },
    { id: 'dept-ops', tenantId: 'tenant-kinetic', name: 'Operations & Cloud', head: 'Brandon Lee', threshold: '85% min staffing', status: 'Active', description: 'Cloud infrastructure, security, and biometric hardware ops.' },
  ],
  policies: [
    {
      id: 'pol-1',
      tenantId: 'tenant-kinetic',
      title: 'Global Remote Work Policy 2026',
      category: 'Remote Work',
      version: '2.1',
      fileSize: '1.4 MB',
      summary: 'Guidelines for asynchronous communication, core working hours, and expense stipends.',
      keyTerms: ['Core Hours', 'Home Office', 'Equipment Allowance'],
    },
  ],
  audit_logs: [
    {
      id: 'aud-9901',
      tenantId: 'tenant-kinetic',
      tenantName: 'Kinetic Technologies',
      timestamp: '2026-10-02 11:05:14',
      userId: 'user-david',
      userName: 'David Wilson',
      userRole: 'manager',
      action: 'Leave Request Approved',
      resource: 'Leave #req-1029 (Alice Johnson - Emergency)',
      result: 'Success',
      riskLevel: 'High',
      details: 'Manager confirmed team coverage override and approved 1 day dependent care emergency leave.',
    },
    {
      id: 'aud-9900',
      tenantId: 'tenant-kinetic',
      tenantName: 'Kinetic Technologies',
      timestamp: '2026-10-02 10:42:30',
      userId: 'user-Alice',
      userName: 'Alice Johnson',
      userRole: 'employee',
      action: 'Emergency Leave Request Submitted',
      resource: 'Leave #req-1029',
      result: 'Pending Approval',
      riskLevel: 'Medium',
      details: 'Initiated via AI HR Assistant dialog with automated policy check and staffing conflict alert.',
    },
    {
      id: 'aud-9899',
      tenantId: 'tenant-kinetic',
      tenantName: 'Kinetic Technologies',
      timestamp: '2026-10-02 09:18:22',
      userId: 'user-Alice',
      userName: 'Alice Johnson',
      userRole: 'employee',
      action: 'AI Agent RAG Query: Payslip Differential',
      resource: 'Payroll Service (Oct vs Sep 2026)',
      result: 'Success',
      riskLevel: 'Low',
      details: 'AI Agent analyzed tax bracket variation and health benefit adjustment for authorized user.',
    },
    {
      id: 'aud-9898',
      tenantId: 'tenant-kinetic',
      tenantName: 'Kinetic Technologies',
      timestamp: '2026-10-01 16:30:00',
      userId: 'user-sarah',
      userName: 'Sarah Miller',
      userRole: 'admin',
      action: 'Policy Document Indexing',
      resource: 'Emergency Leave Policy v1.8',
      result: 'Success',
      riskLevel: 'Low',
      details: 'Re-indexed 14 chunks into Azure AI Search vector database for tenant-kinetic.',
    },
    {
      id: 'aud-9897',
      tenantId: 'tenant-kinetic',
      tenantName: 'Kinetic Technologies',
      timestamp: '2026-10-01 14:12:00',
      userId: 'system',
      userName: 'Kinetic AI Agent',
      userRole: 'admin',
      action: 'Autonomous Staffing Threshold Evaluation',
      resource: 'Engineering Dept Calendar (Oct 7-8)',
      result: 'Warning',
      riskLevel: 'Medium',
      details: 'Detected 2 overlapping absences for Engineering; triggered staffing alert flag.',
    },
  ],
  document_requests: [
    {
      id: 'doc-req-9041',
      tenantId: 'tenant-kinetic',
      employeeId: 'user-Alice',
      employeeName: 'Alice Johnson',
      employeeNumber: 'KT-8842',
      department: 'Engineering',
      jobTitle: 'Senior Frontend Engineer',
      managerId: 'user-david',
      managerName: 'David Wilson',
      documentType: 'Employment Verification Letter',
      purpose: 'For Chase Bank Home Mortgage Application',
      status: 'pending_manager_signature',
      requiresManagerSignature: true,
      submittedAt: '2026-10-07T14:20:00Z',
      referenceCode: 'DOC-2026-9041',
      aiVerification: {
        identityVerified: true,
        verificationNotes: 'AI Identity Verified: Active Senior Frontend Engineer in Engineering Dept (Hired April 15, 2023). Salary $78,000/yr.',
        policyCheckPassed: true,
        generatedContent: 'OFFICIAL EMPLOYMENT VERIFICATION LETTER\n\nDate: October 7, 2026\nTo Whom It May Concern:\n\nThis letter serves as official verification that Alice Johnson (Employee ID: KT-8842) is employed full-time with Alyxra Digital as a Senior Frontend Engineer since April 15, 2023.\n\nAlice Johnson is in good standing with a current annual gross salary of $78,000.00 disbursed bi-weekly.\n\nThis document is issued under corporate policy compliance reference #DOC-2026-9041.\n\nAlyxra Digital HR & Payroll Operations.',
        verifiedAt: '2026-10-07T14:20:05Z',
      },
    },
    {
      id: 'doc-req-9040',
      tenantId: 'tenant-kinetic',
      employeeId: 'user-Alice',
      employeeName: 'Alice Johnson',
      employeeNumber: 'KT-8842',
      department: 'Engineering',
      jobTitle: 'Senior Frontend Engineer',
      managerId: 'user-david',
      managerName: 'David Wilson',
      documentType: 'Salary Certificate',
      purpose: 'Car Loan Verification',
      status: 'approved_and_signed',
      requiresManagerSignature: true,
      submittedAt: '2026-09-28T09:10:00Z',
      issuedAt: '2026-09-28T10:15:22Z',
      referenceCode: 'DOC-2026-9040',
      aiVerification: {
        identityVerified: true,
        verificationNotes: 'AI Identity Verified: Active Full-Time Employee.',
        policyCheckPassed: true,
        generatedContent: 'OFFICIAL SALARY CERTIFICATE\n\nEmployee: Alice Johnson (KT-8842)\nDepartment: Engineering\nGross Monthly Earnings: $6,500.00\nNet Disbursed Take-Home: $4,131.00\n\nVerified by Kinetic AI Engine.',
        verifiedAt: '2026-09-28T09:10:04Z',
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
  ],
  branches: [
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
    {
      id: 'br-kandy-reg',
      tenantId: 'tenant-kinetic',
      name: 'Kandy Regional Branch',
      code: 'KDY-01',
      type: 'Regional Branch',
      address: 'No. 45, Dalada Veediya',
      city: 'Kandy',
      country: 'Sri Lanka',
      phone: '+94 81 223 4455',
      email: 'kandy.branch@kinetictech.io',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-carlos',
      branchManagerName: 'Carlos Mendoza',
      employeeCount: 12,
      isHeadquarters: false,
      status: 'Active',
      createdAt: '2026-03-10T09:30:00Z',
    },
    {
      id: 'br-galle-reg',
      tenantId: 'tenant-kinetic',
      name: 'Galle Tech Hub',
      code: 'GAL-02',
      type: 'Hub',
      address: 'No. 12, Fort Light Street',
      city: 'Galle',
      country: 'Sri Lanka',
      phone: '+94 91 222 3344',
      email: 'galle.hub@kinetictech.io',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-claire',
      branchManagerName: 'Claire Underwood',
      employeeCount: 8,
      isHeadquarters: false,
      status: 'Active',
      createdAt: '2026-05-20T10:15:00Z',
    },
  ],
}

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

  // Double-Way Resilient Wrapper: Tries live Azure Cosmos DB, logs clearly to terminal, falls back to Mock Data on failure
  return {
    items: {
      query: (querySpec: any, options?: any) => ({
        fetchAll: async () => {
          try {
            const result = await realContainer.items.query(querySpec, options).fetchAll()
            console.log(
              `🟢 [AZURE COSMOS DB] Query on container "${containerName}" -> Returned ${result.resources?.length ?? 0} item(s) from Live Azure Cloud`
            )
            return result
          } catch (err: any) {
            console.warn(
              `⚠️  [AZURE COSMOS DB ERROR] Query failed on "${containerName}": ${err.message}. Seamlessly falling back to In-Memory Mock Data!`
            )
            const fallbackResult = await mockContainer.items.query(querySpec).fetchAll()
            console.log(
              `🟡 [MOCK DATA FALLBACK] Query on container "${containerName}" -> Returned ${fallbackResult.resources?.length ?? 0} item(s) from In-Memory Mock Store`
            )
            return fallbackResult
          }
        },
      }),
      create: async (item: any, options?: any) => {
        try {
          const result = await realContainer.items.create(item, options)
          console.log(
            `🟢 [AZURE COSMOS DB] Inserted item "${item?.id || 'new'}" into container "${containerName}" (Live Azure Cloud)`
          )
          // Keep mock store in sync as secondary mirror
          try { await mockContainer.items.create(item) } catch (_) {}
          return result
        } catch (err: any) {
          console.warn(
            `⚠️  [AZURE COSMOS DB ERROR] Insert failed on "${containerName}": ${err.message}. Saving to In-Memory Mock Store!`
          )
          const fallbackResult = await mockContainer.items.create(item)
          console.log(
            `🟡 [MOCK DATA FALLBACK] Created item "${item?.id || 'new'}" in "${containerName}" (In-Memory Mock Store)`
          )
          return fallbackResult
        }
      },
      upsert: async (item: any, options?: any) => {
        try {
          const result = await realContainer.items.upsert(item, options)
          console.log(
            `🟢 [AZURE COSMOS DB] Upserted item "${item?.id || 'new'}" into container "${containerName}" (Live Azure Cloud)`
          )
          try { await mockContainer.items.upsert(item) } catch (_) {}
          return result
        } catch (err: any) {
          console.warn(
            `⚠️  [AZURE COSMOS DB ERROR] Upsert failed on "${containerName}": ${err.message}. Saving to In-Memory Mock Store!`
          )
          const fallbackResult = await mockContainer.items.upsert(item)
          return fallbackResult
        }
      },
    },
    item: (id: string, partitionKey?: string) => ({
      read: async () => {
        try {
          const result = await realContainer.item(id, partitionKey).read()
          if (result.resource) {
            console.log(
              `🟢 [AZURE COSMOS DB] Read item "${id}" from container "${containerName}" (Live Azure Cloud)`
            )
            return result
          }
          // Fallback check if item exists only in mock store
          const mockResult = await mockContainer.item(id, partitionKey).read()
          if (mockResult.resource) {
            console.log(
              `🟡 [MOCK DATA FALLBACK] Item "${id}" not in live Cosmos DB; retrieved from In-Memory Mock Store`
            )
            return mockResult
          }
          return result
        } catch (err: any) {
          console.warn(
            `⚠️  [AZURE COSMOS DB ERROR] Read "${id}" failed on "${containerName}": ${err.message}. Falling back to In-Memory Mock Store!`
          )
          return mockContainer.item(id, partitionKey).read()
        }
      },
      replace: async (newItem: any, options?: any) => {
        try {
          const result = await realContainer.item(id, partitionKey).replace(newItem, options)
          console.log(
            `🟢 [AZURE COSMOS DB] Updated item "${id}" in container "${containerName}" (Live Azure Cloud)`
          )
          try { await mockContainer.item(id, partitionKey).replace(newItem) } catch (_) {}
          return result
        } catch (err: any) {
          console.warn(
            `⚠️  [AZURE COSMOS DB ERROR] Update "${id}" failed on "${containerName}": ${err.message}. Updating In-Memory Mock Store!`
          )
          return mockContainer.item(id, partitionKey).replace(newItem)
        }
      },
      delete: async () => {
        try {
          const result = await realContainer.item(id, partitionKey).delete()
          console.log(
            `🟢 [AZURE COSMOS DB] Deleted item "${id}" from container "${containerName}" (Live Azure Cloud)`
          )
          try { await mockContainer.item(id, partitionKey).delete() } catch (_) {}
          return result
        } catch (err: any) {
          console.warn(
            `⚠️  [AZURE COSMOS DB ERROR] Delete "${id}" failed on "${containerName}": ${err.message}. Deleting from In-Memory Mock Store!`
          )
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
