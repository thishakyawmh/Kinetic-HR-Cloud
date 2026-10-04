import { CosmosClient, Container, Database } from '@azure/cosmos'

let client: CosmosClient | null = null
let database: Database | null = null

export function getCosmosDatabase(): Database {
  if (database) return database

  const endpoint = process.env.COSMOS_DB_ENDPOINT
  const key = process.env.COSMOS_DB_KEY
  const dbName = process.env.COSMOS_DB_DATABASE || 'KineticHR'

  if (!endpoint || !key) {
    throw new Error('Cosmos DB configuration missing: COSMOS_DB_ENDPOINT and COSMOS_DB_KEY must be set.')
  }

  client = new CosmosClient({ endpoint, key })
  database = client.database(dbName)
  return database
}

export function getTenantContainer(containerName: string): Container {
  const db = getCosmosDatabase()
  return db.container(containerName)
}

/**
 * Executes a tenant-isolated query in Cosmos DB.
 * Guarantees that query execution is scoped exclusively to the provided tenant partition.
 */
export async function queryTenantItems<T>(
  containerName: string,
  tenantId: string,
  query: string,
  parameters: Array<{ name: string; value: any }> = []
): Promise<T[]> {
  const container = getTenantContainer(containerName)

  // Guarantee tenantId parameter
  const hasTenantParam = parameters.some(p => p.name === '@tenantId')
  const finalParams = hasTenantParam ? parameters : [...parameters, { name: '@tenantId', value: tenantId }]

  const querySpec = {
    query,
    parameters: finalParams,
  }

  const { resources } = await container.items.query<T>(querySpec, { partitionKey: tenantId }).fetchAll()
  return resources
}
