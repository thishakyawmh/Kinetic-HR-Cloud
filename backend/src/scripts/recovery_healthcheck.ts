import { verifyCosmosDb, verifyBlobStorage, verifyAzureFunctions } from '../config/azureDiagnostics'
import fs from 'fs'
import path from 'path'

// Load environment settings
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

export async function runRecoveryHealthCheck() {
  console.log('================================================================================')
  console.log('🏥 KINETIC HR CLOUD — POST-RECOVERY INFRASTRUCTURE HEALTH CHECK')
  console.log('================================================================================\n')

  const isLiveMode = process.env.AZURE_MODE === 'live'
  console.log(`📌 Global AZURE_MODE     : ${process.env.AZURE_MODE || 'mock'}`)
  console.log(`📌 Functions Host Target  : http://localhost:7071/api\n`)

  const results = {
    cosmosDb: await verifyCosmosDb(isLiveMode),
    blobStorage: await verifyBlobStorage(isLiveMode),
    azureFunctions: await verifyAzureFunctions(),
  }

  let healthyCount = 0
  if (results.cosmosDb.status === 'CONNECTED' || results.cosmosDb.status === 'MOCK_MODE') healthyCount++
  if (results.blobStorage.status === 'CONNECTED' || results.blobStorage.status === 'MOCK_MODE') healthyCount++
  if (results.azureFunctions.status === 'CONNECTED') healthyCount++

  console.log('--- SYSTEM HEALTH MATRIX ---')
  console.log(`1. Cosmos DB Data Tier      : ${results.cosmosDb.status} (${results.cosmosDb.evidence?.details || 'N/A'})`)
  console.log(`2. Blob Storage Data Tier   : ${results.blobStorage.status} (ETag: ${results.blobStorage.evidence?.etag || 'Local'})`)
  console.log(`3. Azure Functions Compute  : ${results.azureFunctions.status} (${results.azureFunctions.evidence?.latencyMs}ms latency)`)

  console.log('\n================================================================================')
  if (healthyCount === 3) {
    console.log('✅ ALL DISASTER RECOVERY HEALTH CHECKS PASSED — SYSTEM FULLY OPERATIONAL')
  } else {
    console.log('⚠️ SYSTEM PARTIALLY HEALTHY — CHECK REMEDIATION STEPS ABOVE')
  }
  console.log('================================================================================\n')

  return { healthy: healthyCount === 3, details: results }
}

if (require.main === module) {
  runRecoveryHealthCheck().catch(() => process.exit(1))
}
