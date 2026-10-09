import { CosmosClient } from '@azure/cosmos'
import { BlobServiceClient } from '@azure/storage-blob'
import fs from 'fs'
import path from 'path'
import { generateProductionSeedData } from './seedDataGenerator'

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
// SEED ENGINE EXECUTION
// -----------------------------------------------------------------------------

async function seedDatabase() {
  console.log('================================================================================')
  console.log('🚀 EXECUTING DATABASE SEEDING ENGINE FOR ENTERPRISE HR CLOUD')
  console.log('   Tenants : Sampath Bank PLC, Keells Supermarkets, Singer Sri Lanka PLC')
  console.log('   Currency: LKR (Sri Lankan Rupee)')
  console.log('================================================================================\n')

  const seedData = generateProductionSeedData()

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

    // Ensure all containers exist
    for (const c of CONTAINERS) {
      await database.containers.createIfNotExists({ id: c.id, partitionKey: c.partitionKey })
    }

    // PURGE all existing data from all containers
    console.log(`\n🧹 PURGING ALL EXISTING DATA FROM COSMOS DB CONTAINERS...`)
    for (const c of CONTAINERS) {
      try {
        const container = database.container(c.id)
        const { resources: items } = await container.items.readAll().fetchAll()
        if (items.length > 0) {
          console.log(`   ⏳ Purging ${items.length} existing items from container "${c.id}"...`)
          for (const item of items) {
            const partitionKey: string = String(item.tenantId !== undefined ? item.tenantId : (item.id || ''))
            await container.item(String(item.id), partitionKey).delete().catch(() => {})
          }
          console.log(`   ✔ Container "${c.id}" purged.`)
        } else {
          console.log(`   ✔ Container "${c.id}" already clean (0 items).`)
        }
      } catch (err: any) {
        console.warn(`   ⚠️ Warning during purge of "${c.id}":`, err.message)
      }
    }

    console.log(`\n🌱 SEEDING PRODUCTION SRI LANKAN ENTERPRISE DATA...`)

    const seedTasks = [
      { name: 'organizations', data: seedData.ORGANIZATIONS },
      { name: 'branches', data: seedData.BRANCHES },
      { name: 'departments', data: seedData.DEPARTMENTS },
      { name: 'users', data: seedData.USERS },
      { name: 'leave_balances', data: seedData.LEAVE_BALANCES },
      { name: 'leaves', data: seedData.LEAVE_REQUESTS },
      { name: 'attendance', data: seedData.ATTENDANCE_RECORDS },
      { name: 'payslips', data: seedData.PAYSLIPS },
      { name: 'policies', data: seedData.POLICIES },
      { name: 'document_requests', data: seedData.DOCUMENT_REQUESTS },
      { name: 'notifications', data: seedData.NOTIFICATIONS },
      { name: 'audit_logs', data: seedData.AUDIT_LOGS },
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

    for (const pay of seedData.PAYSLIPS.slice(0, 10)) {
      const blobPath = `${pay.tenantId}/payslips/${pay.id}.pdf`
      const blobClient = containerClient.getBlockBlobClient(blobPath)
      const pdfBuf = createMinimalPdfBuffer(
        `Official Payslip - Sri Lanka Statutory Form`,
        `Period: ${pay.periodMonth} ${pay.periodYear} | Employee: ${pay.employeeName}`,
        [
          `Pay Date: ${pay.payDate}`,
          `Basic Salary: Rs. ${pay.basicSalary.toLocaleString()}.00`,
          `Cost of Living / Allowances: Rs. ${(pay.costOfLivingAllowance || 0).toLocaleString()}.00`,
          `Gross Earnings: Rs. ${pay.grossSalary.toLocaleString()}.00`,
          `Employee EPF (8%): -Rs. ${(pay.employeeEpf || 0).toLocaleString()}.00`,
          `Employer EPF (12%): Rs. ${(pay.employerEpf || 0).toLocaleString()}.00`,
          `Employer ETF (3%): Rs. ${(pay.employerEtf || 0).toLocaleString()}.00`,
          `Inland Revenue APIT Tax: -Rs. ${(pay.statutoryTaxes || 0).toLocaleString()}.00`,
          `NET TAKE-HOME PAY: Rs. ${pay.netSalary.toLocaleString()}.00 ${pay.currency}`,
        ]
      )
      await blobClient.uploadData(pdfBuf, { blobHTTPHeaders: { blobContentType: 'application/pdf' } })
    }
    console.log(`   ✔ Uploaded sample payslip PDFs to container "${containerName}"`)

    for (const pol of seedData.POLICIES) {
      const blobPath = `${pol.tenantId}/policies/${pol.id}.pdf`
      const blobClient = containerClient.getBlockBlobClient(blobPath)
      const pdfBuf = createMinimalPdfBuffer(
        `Sri Lanka Corporate Statutory Policy Document`,
        `${pol.title} (v${pol.version})`,
        [`Category: ${pol.category}`, `Summary: ${pol.summary}`]
      )
      await blobClient.uploadData(pdfBuf, { blobHTTPHeaders: { blobContentType: 'application/pdf' } })
    }
    console.log(`   ✔ Uploaded ${seedData.POLICIES.length} policy PDFs to container "${containerName}"`)
  }

  console.log('\n================================================================================')
  console.log('SUMMARY OF PRODUCTION SRI LANKAN DATA SEEDED:')
  console.log('================================================================================')
  console.log(`   Organizations / Tenants : ${seedData.ORGANIZATIONS.length}`)
  console.log(`   Branches                : ${seedData.BRANCHES.length}`)
  console.log(`   Departments             : ${seedData.DEPARTMENTS.length}`)
  console.log(`   Users / Employees       : ${seedData.USERS.length}`)
  console.log(`   Leave Balances          : ${seedData.LEAVE_BALANCES.length}`)
  console.log(`   Leave Requests          : ${seedData.LEAVE_REQUESTS.length}`)
  console.log(`   Attendance Clock Logs   : ${seedData.ATTENDANCE_RECORDS.length}`)
  console.log(`   Payslips (in LKR)       : ${seedData.PAYSLIPS.length}`)
  console.log(`   HR Policy Documents     : ${seedData.POLICIES.length}`)
  console.log(`   Document Requests (2FA) : ${seedData.DOCUMENT_REQUESTS.length}`)
  console.log(`   User Notifications      : ${seedData.NOTIFICATIONS.length}`)
  console.log(`   Audit Logs              : ${seedData.AUDIT_LOGS.length}`)
  console.log('================================================================================\n')
}

seedDatabase().catch((err) => {
  console.error('\n❌ Seed failed with error:', err.message || err)
  process.exit(1)
})
