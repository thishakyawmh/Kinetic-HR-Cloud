import { verifyCosmosDb, verifyBlobStorage, verifyAzureFunctions } from '../config/azureDiagnostics'
import fs from 'fs'
import path from 'path'

// Load local.settings.json
try {
  const settingsPath = path.resolve(__dirname, '../../local.settings.json')
  if (fs.existsSync(settingsPath)) {
    const raw = fs.readFileSync(settingsPath, 'utf-8')
    const parsed = JSON.parse(raw)
    if (parsed.Values) {
      for (const [k, v] of Object.entries(parsed.Values)) {
        process.env[k] = String(v)
      }
    }
  }
} catch (e) {}

async function runDrAudit() {
  console.log('================================================================================')
  console.log('🔍 RUNNING KINETIC HR CLOUD DISASTER RECOVERY & ARCHITECTURE AUDIT')
  console.log('================================================================================\n')

  const isLiveMode = process.env.AZURE_MODE === 'live'
  console.log(`📌 AZURE_MODE setting: ${process.env.AZURE_MODE || 'not set (default mock)'}`)
  console.log(`📌 COSMOS_DB_ENDPOINT: ${process.env.COSMOS_DB_ENDPOINT ? 'Configured' : 'Not Provided'}`)
  console.log(`📌 BLOB_STORAGE_CONNECTION_STRING: ${process.env.BLOB_STORAGE_CONNECTION_STRING || 'Not Provided'}\n`)

  console.log('--- 1. COSMOS DB DATA TIER AUDIT ---')
  const cosmosDiag = await verifyCosmosDb(isLiveMode)
  console.log(`Status        : ${cosmosDiag.status}`)
  console.log(`Configured    : ${cosmosDiag.configured}`)
  console.log(`Authenticated : ${cosmosDiag.authenticated}`)
  console.log(`Details       : ${cosmosDiag.evidence?.details || 'N/A'}`)
  if (cosmosDiag.remediation) console.log(`Remediation   : ${cosmosDiag.remediation}`)
  console.log('')

  console.log('--- 2. BLOB STORAGE DATA TIER AUDIT ---')
  const blobDiag = await verifyBlobStorage(isLiveMode)
  console.log(`Status        : ${blobDiag.status}`)
  console.log(`Configured    : ${blobDiag.configured}`)
  console.log(`Authenticated : ${blobDiag.authenticated}`)
  console.log(`Request ID    : ${blobDiag.evidence?.requestId || 'N/A'}`)
  console.log(`ETag          : ${blobDiag.evidence?.etag || 'N/A'}`)
  console.log(`Details       : ${blobDiag.evidence?.details || 'N/A'}`)
  console.log('')

  console.log('--- 3. AZURE FUNCTIONS COMPUTE AUDIT ---')
  const fnDiag = await verifyAzureFunctions()
  console.log(`Status        : ${fnDiag.status}`)
  console.log(`Endpoint      : ${fnDiag.evidence?.endpoint || 'N/A'}`)
  console.log(`Latency       : ${fnDiag.evidence?.latencyMs}ms`)
  console.log(`Details       : ${fnDiag.evidence?.details || 'N/A'}`)
  console.log('')

  console.log('--- 4. BICEP INFRASTRUCTURE & BACKUP POLICY AUDIT ---')
  const bicepPath = path.resolve(__dirname, '../../../infra/main.bicep')
  if (fs.existsSync(bicepPath)) {
    const bicepContent = fs.readFileSync(bicepPath, 'utf-8')
    const hasContinuousCosmosBackup = bicepContent.includes("type: 'Continuous'") || bicepContent.includes('backupPolicy')
    const hasBlobSoftDelete = bicepContent.includes('deleteRetentionPolicy')
    const hasBlobVersioning = bicepContent.includes('isVersioningEnabled')

    console.log(`Bicep Template Found             : Yes (${bicepPath})`)
    console.log(`Cosmos DB Backup Policy in Bicep  : ${hasContinuousCosmosBackup ? 'Explicitly Defined' : 'Implicit Default (Periodic 4hr/8hr)'}`)
    console.log(`Blob Soft Delete in Bicep         : ${hasBlobSoftDelete ? 'Enabled' : 'Missing (Default Disabled)'}`)
    console.log(`Blob Versioning in Bicep          : ${hasBlobVersioning ? 'Enabled' : 'Missing (Default Disabled)'}`)
  } else {
    console.log('Bicep Template Found             : No')
  }

  console.log('\n================================================================================')
  console.log('✅ DISASTER RECOVERY AUDIT COMPLETED')
  console.log('================================================================================')
}

runDrAudit().catch(err => {
  console.error('DR Audit Failed:', err)
  process.exit(1)
})
