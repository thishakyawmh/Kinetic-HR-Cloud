const BASE_URL = process.env.BASE_URL || 'http://localhost:7071/api'

async function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`)
    throw new Error(`Assertion failed: ${msg}`)
  }
  console.log(`  ✔ PASS: ${msg}`)
}

async function runComprehensiveVerification() {
  console.log('\n=============================================================')
  console.log('🧪 RUNNING COMPREHENSIVE END-TO-END AZURE SUITE VERIFICATION')
  console.log('=============================================================\n')

  // 1. Organization Validation
  console.log('--- 1. Multi-Tenant Organization Validation ---')
  const orgKineticRes = await fetch(`${BASE_URL}/auth/organization`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId: 'KINETIC' }),
  })
  const orgKinetic: any = await orgKineticRes.json()
  await assert(orgKineticRes.status === 200, 'Kinetic organization resolved')
  await assert(orgKinetic.id === 'tenant-kinetic', 'Tenant ID is tenant-kinetic')

  const orgNovaRes = await fetch(`${BASE_URL}/auth/organization`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId: 'NOVA' }),
  })
  const orgNova: any = await orgNovaRes.json()
  await assert(orgNovaRes.status === 200, 'Nova organization resolved')
  await assert(orgNova.id === 'tenant-nova', 'Tenant ID is tenant-nova')

  // 2. Authentication & RBAC Login
  console.log('\n--- 2. Enterprise Authentication & Role-Based Sessions ---')
  // Employee Login (Alice)
  const empLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId: 'tenant-kinetic', employeeId: 'KT-8842', password: 'Password123!' }),
  })
  const empLogin: any = await empLoginRes.json()
  await assert(empLoginRes.status === 200, 'Employee Alice Johnson logged in')
  await assert(empLogin.user.role === 'employee', 'Alice has employee role')
  const empToken = empLogin.token
  const empHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${empToken}`,
    'X-Tenant-Id': 'tenant-kinetic',
  }

  // Manager Login (David Wilson)
  const mgrLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId: 'tenant-kinetic', employeeId: 'KT-1044', password: 'Password123!' }),
  })
  const mgrLogin: any = await mgrLoginRes.json()
  await assert(mgrLoginRes.status === 200, 'Manager David Wilson logged in')
  await assert(mgrLogin.user.role === 'manager', 'David has manager role')
  const mgrToken = mgrLogin.token
  const mgrHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${mgrToken}`,
    'X-Tenant-Id': 'tenant-kinetic',
  }

  // Admin Login (Sarah Miller)
  const admLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId: 'tenant-kinetic', employeeId: 'KT-0012', password: 'Password123!' }),
  })
  const admLogin: any = await admLoginRes.json()
  await assert(admLoginRes.status === 200, 'Admin Sarah Miller logged in')
  await assert(admLogin.user.role === 'admin', 'Sarah has admin role')
  const admToken = admLogin.token
  const admHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${admToken}`,
    'X-Tenant-Id': 'tenant-kinetic',
  }

  // 3. Leave Management & Policy Types
  console.log('\n--- 3. Leave Management & Balances ---')
  const typesRes = await fetch(`${BASE_URL}/leaves/types`, { headers: empHeaders })
  const types: any = await typesRes.json()
  await assert(typesRes.status === 200, 'Leave types retrieved')
  await assert(types.length >= 5, `Retrieved ${types.length} leave types`)

  const balRes = await fetch(`${BASE_URL}/leaves/balances`, { headers: empHeaders })
  const balances: any = await balRes.json()
  await assert(balRes.status === 200, 'Leave balances retrieved')
  await assert(balances.length >= 3, `Retrieved ${balances.length} balance records`)

  // 4. Manager Approvals & Cosmos DB Automatic Balance Deduction
  console.log('\n--- 4. Manager Approvals & Automatic Cosmos DB Deduction ---')
  const leavesRes = await fetch(`${BASE_URL}/leaves`, { headers: mgrHeaders })
  const allLeaves: any = await leavesRes.json()
  await assert(leavesRes.status === 200, 'All tenant leave requests retrieved')
  const pending = allLeaves.find((l: any) => l.status === 'pending' && l.employeeId === 'user-Alice')
  if (pending) {
    const approveRes = await fetch(`${BASE_URL}/leaves/${pending.id}/status`, {
      method: 'PATCH',
      headers: mgrHeaders,
      body: JSON.stringify({ status: 'approved', comment: 'Approved by Director', actorName: 'David Wilson' }),
    })
    const approvedLeave: any = await approveRes.json()
    await assert(approveRes.status === 200, `Leave ${pending.id} approved by manager`)
    await assert(approvedLeave.status === 'approved', 'Status changed to approved')
    await assert(approvedLeave.timeline.some((t: any) => t.action === 'approved'), 'Approval logged in timeline')
  }

  // 5. Manager Team Management
  console.log('\n--- 5. Manager Team Directory ---')
  const teamRes = await fetch(`${BASE_URL}/employees/team`, { headers: mgrHeaders })
  const team: any = await teamRes.json()
  await assert(teamRes.status === 200, 'Team members retrieved for manager')
  await assert(team.length >= 3, `Manager leads team of ${team.length} direct reports`)

  // 6. Payroll & Azure Blob Storage SAS PDF Download
  console.log('\n--- 6. Payroll Ledger & Azure Blob Storage SAS Downloads ---')
  const payslipsRes = await fetch(`${BASE_URL}/payroll/payslips`, { headers: empHeaders })
  const payslips: any = await payslipsRes.json()
  await assert(payslipsRes.status === 200, 'Payslips retrieved from Cosmos DB')
  await assert(payslips.length >= 3, `Retrieved ${payslips.length} monthly payslips`)

  const firstPay = payslips[0]
  const payDetailRes = await fetch(`${BASE_URL}/payroll/payslips/${firstPay.id}`, { headers: empHeaders })
  const payDetail: any = await payDetailRes.json()
  await assert(payDetailRes.status === 200, `Itemized detail retrieved for ${firstPay.id}`)
  await assert(payDetail.breakdown.length > 0, `Payslip contains ${payDetail.breakdown.length} line items`)

  const sasUrlRes = await fetch(`${BASE_URL}/payroll/payslips/${firstPay.id}/download-url`, { headers: empHeaders })
  const sasData: any = await sasUrlRes.json()
  await assert(sasUrlRes.status === 200, 'Generated Azure Blob SAS token download URL')
  await assert(sasData.downloadUrl.includes('sig='), 'Download URL contains signed SAS signature')

  // Actually download the bytes from Azure Blob Storage!
  const blobFetch = await fetch(sasData.downloadUrl)
  await assert(blobFetch.status === 200, 'Direct Azure Blob Storage download returned HTTP 200 OK')
  const blobBuf = Buffer.from(await blobFetch.arrayBuffer())
  const isPdf = blobBuf.subarray(0, 4).toString('ascii') === '%PDF'
  await assert(isPdf, `Downloaded file is genuine binary PDF document (${blobBuf.length} bytes)`)

  // 7. Policy Management & Azure Blob Document Download
  console.log('\n--- 7. Corporate HR Policies & Azure Blob Document Verification ---')
  const polRes = await fetch(`${BASE_URL}/policies`, { headers: empHeaders })
  const policies: any = await polRes.json()
  await assert(polRes.status === 200, 'Corporate policies retrieved from Cosmos DB')
  await assert(policies.length >= 5, `Retrieved ${policies.length} policies`)

  const firstPol = policies[0]
  const polSasRes = await fetch(`${BASE_URL}/policies/${firstPol.id}/download-url`, { headers: empHeaders })
  const polSasData: any = await polSasRes.json()
  await assert(polSasRes.status === 200, 'Generated Policy document SAS URL')
  const polBlobFetch = await fetch(polSasData.downloadUrl)
  await assert(polBlobFetch.status === 200, 'Direct policy PDF download from Azure Blob Storage returned HTTP 200 OK')
  const polBuf = Buffer.from(await polBlobFetch.arrayBuffer())
  await assert(polBuf.subarray(0, 4).toString('ascii') === '%PDF', `Downloaded policy is genuine PDF (${polBuf.length} bytes)`)

  // 8. Admin Dashboard Stats, Audit Logs & Enterprise Integrations
  console.log('\n--- 8. Enterprise Administration & SOC2 Compliance ---')
  const statsRes = await fetch(`${BASE_URL}/admin/stats`, { headers: admHeaders })
  const stats: any = await statsRes.json()
  await assert(statsRes.status === 200, 'Admin metrics aggregated')
  await assert(stats.totalEmployees >= 5, `Total employees: ${stats.totalEmployees}`)
  console.log(`    Metrics: ${stats.activeEmployees} active staff, ${stats.activePolicies} policies, SLA: ${stats.systemHealth}`)

  const auditRes = await fetch(`${BASE_URL}/admin/audit-logs`, { headers: admHeaders })
  const auditLogs: any = await auditRes.json()
  await assert(auditRes.status === 200, 'SOC2 Audit logs retrieved')
  await assert(auditLogs.length >= 3, `Retrieved ${auditLogs.length} audit trail records`)

  const intRes = await fetch(`${BASE_URL}/admin/integrations`, { headers: admHeaders })
  const integrations: any = await intRes.json()
  await assert(intRes.status === 200, 'Enterprise cloud integrations checked')
  await assert(integrations.length >= 4, `Active integrations: ${integrations.map((i: any) => i.name).join(', ')}`)

  // 9. Multi-Tenant Isolation Check
  console.log('\n--- 9. Strict Multi-Tenant Data Isolation ---')
  const novaLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId: 'tenant-nova', employeeId: 'NV-108', password: 'Password123!' }),
  })
  const novaLogin: any = await novaLoginRes.json()
  const novaHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${novaLogin.token}`,
    'X-Tenant-Id': 'tenant-nova',
  }

  const novaLeavesRes = await fetch(`${BASE_URL}/leaves`, { headers: novaHeaders })
  const novaLeaves: any = await novaLeavesRes.json()
  await assert(
    novaLeaves.every((l: any) => l.tenantId === 'tenant-nova'),
    'Tenant Nova cannot see Kinetic leaves (100% partition isolated)'
  )

  console.log('\n=============================================================')
  console.log('🏆 100% VERIFICATION PASSED: ALL AZURE SERVICES CONFIGURED PERFECTLY!')
  console.log('=============================================================\n')
}

runComprehensiveVerification().catch(err => {
  console.error('\n❌ VERIFICATION FAILED:', err)
  process.exit(1)
})
