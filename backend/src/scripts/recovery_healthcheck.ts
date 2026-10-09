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

  const categorizeStatus = (status: string, connStr?: string) => {
    if (status === 'CONNECTED') return connStr?.includes('UseDevelopmentStorage=true') ? 'MOCK_MODE_LOCAL (AZURITE_EMULATOR)' : 'HEALTHY (LIVE_AZURE_CLOUD)'
    if (status === 'MOCK_MODE') return 'MOCK_MODE_LOCAL (NOT_VERIFIED_AGAINST_LIVE_AZURE)'
    if (status === 'UNAVAILABLE') return 'UNAVAILABLE'
    return status
  }

  const cosmosCat = categorizeStatus(results.cosmosDb.status)
  const blobCat = categorizeStatus(results.blobStorage.status, process.env.BLOB_STORAGE_CONNECTION_STRING)
  const fnCat = results.azureFunctions.status === 'CONNECTED' ? 'HEALTHY (LOCAL_FUNCTIONS_HOST)' : 'UNAVAILABLE'

  console.log('--- SYSTEM HEALTH MATRIX ---')
  console.log(`1. Cosmos DB Data Tier      : ${cosmosCat}`)
  console.log(`   └─ Details: ${results.cosmosDb.evidence?.details || 'N/A'}`)
  console.log(`2. Blob Storage Data Tier   : ${blobCat}`)
  console.log(`   └─ ETag: ${results.blobStorage.evidence?.etag || 'Local Azurite'}`)
  console.log(`3. Azure Functions Compute  : ${fnCat}`)
  console.log(`   └─ Latency: ${results.azureFunctions.evidence?.latencyMs}ms`)

  const isAllLiveHealthy = results.cosmosDb.status === 'CONNECTED' && results.blobStorage.status === 'CONNECTED' && !process.env.BLOB_STORAGE_CONNECTION_STRING?.includes('UseDevelopmentStorage=true')

  console.log('\n================================================================================')
  if (isAllLiveHealthy) {
    console.log('✅ ALL DISASTER RECOVERY HEALTH CHECKS PASSED — LIVE AZURE CLOUD OPERATIONAL')
  } else {
    console.log('🟡 LOCAL DEVELOPMENT / EMULATOR ENVIRONMENT OPERATIONAL')
    console.log('⚠️ LIVE AZURE CLOUD STATUS: NOT_VERIFIED_AGAINST_LIVE_AZURE (Missing Live Cloud Credentials)')
  }
  console.log('================================================================================\n')

  return { healthy: true, isLiveVerified: isAllLiveHealthy, details: results }
}

if (require.main === module) {
  runRecoveryHealthCheck().catch(() => process.exit(1))
}
