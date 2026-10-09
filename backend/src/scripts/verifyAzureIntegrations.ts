import { runFullAzureFleetDiagnostic } from '../config/azureDiagnostics'
import { BlobServiceClient } from '@azure/storage-blob'
import fs from 'fs'
import path from 'path'

// Load environment variables from local.settings.json
try {
  let settingsPath = path.resolve(process.cwd(), 'local.settings.json')
  if (!fs.existsSync(settingsPath)) {
    settingsPath = path.resolve(__dirname, '../../../local.settings.json')
  }
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

async function runEndToEndVerification() {

  console.log('================================================================================')
  console.log('🚀 EXECUTING REAL AZURE CLOUD & INFRASTRUCTURE PERSISTENCE VERIFICATION')
  console.log('================================================================================\n')

  // 1. Run Master 10-Service Fleet Diagnostic
  console.log('📡 1. Executing Live 10-Service Fleet Diagnostic Probes...')
  const report = await runFullAzureFleetDiagnostic()
  console.log(`   Timestamp          : ${report.timestamp}`)
  console.log(`   Global Azure Mode  : ${report.globalAzureMode}`)
  console.log(`   Total Services     : ${report.totalServicesCount}`)
  console.log(`   Verified Connected : ${report.connectedCount}`)
  console.log(`   Mock Mode          : ${report.mockCount}`)
  console.log(`   Error / Issues     : ${report.errorCount}\n`)

  console.log('--------------------------------------------------------------------------------')
  console.log('SERVICE VERIFICATION MATRIX:')
  console.log('--------------------------------------------------------------------------------')
  for (const svc of report.services) {
    const statusIcon = svc.status === 'CONNECTED' ? '🟢' : svc.status === 'MOCK_MODE' ? '🟡' : '❌'
    console.log(`${statusIcon} [${svc.serviceId.toUpperCase()}] ${svc.serviceName}`)
    console.log(`   Configured : ${svc.configured} | Mode: ${svc.azureMode} | Status: ${svc.status}`)
    if (svc.evidence?.requestId) console.log(`   Request ID : ${svc.evidence.requestId}`)
    if (svc.evidence?.etag) console.log(`   ETag       : ${svc.evidence.etag}`)
    if (svc.evidence?.latencyMs !== undefined) console.log(`   Latency    : ${svc.evidence.latencyMs}ms`)
    if (svc.evidence?.details) console.log(`   Evidence   : ${svc.evidence.details}`)
    if (svc.remediation) console.log(`   Remediation: ${svc.remediation}`)
    console.log('--------------------------------------------------------------------------------')
  }

  // 2. Real Azure Blob Storage Write & Read-Back Direct Test
  console.log('\n📦 2. Testing Direct Azure Blob Storage Real Persistence...')
  const connStr = process.env.BLOB_STORAGE_CONNECTION_STRING || 'UseDevelopmentStorage=true'
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connStr)
    const containerName = process.env.BLOB_CONTAINER_TENANTS || 'tenants'
    const containerClient = blobServiceClient.getContainerClient(containerName)
    await containerClient.createIfNotExists()

    const testFileName = `tenant-test-doc-${Date.now()}.pdf`
    const blobClient = containerClient.getBlockBlobClient(testFileName)
    const samplePayload = 'PDF_DOCUMENT_PAYLOAD_TEST_DATA_KINETIC_HR'

    const uploadRes = await blobClient.upload(samplePayload, Buffer.byteLength(samplePayload))
    console.log(`   ✅ Real Blob Upload Succeeded! ETag: ${uploadRes.etag}, RequestId: ${uploadRes.requestId}`)

    const downloadRes = await blobClient.download()
    console.log(`   ✅ Real Blob Read-Back Succeeded! Content-Length: ${downloadRes.contentLength}`)

    await blobClient.delete()
    console.log(`   ✅ Test Blob Cleaned Up Successfully!\n`)
  } catch (err: any) {
    console.error(`   ❌ Real Blob Storage Test Failed: ${err.message}\n`)
  }

  console.log('================================================================================')
  console.log('VERIFICATION COMPLETE')
  console.log('================================================================================\n')
}

runEndToEndVerification().catch(err => {
  console.error('Fatal Verification Error:', err)
  process.exit(1)
})
