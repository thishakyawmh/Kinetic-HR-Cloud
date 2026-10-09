/**
 * Azure AI Search Client (Cognitive Search & RAG Knowledge Base)
 * Handles enterprise HR policy indexing, semantic/full-text search, and cross-tenant knowledge retrieval.
 */

import { generateProductionSeedData } from '../scripts/seedDataGenerator'

export interface AzureSearchConfig {
  endpoint: string
  key: string
  indexName: string
  isConfigured: boolean
}

export interface PolicySearchDocument {
  id: string
  tenantId: string
  title: string
  category: string
  version: string
  summary: string
  content: string
  keyTerms: string[]
  fileSize?: string
  uploadedAt: string
}

export interface SearchResultItem {
  id: string
  tenantId: string
  title: string
  category: string
  version: string
  summary: string
  content: string
  keyTerms: string[]
  uploadedAt: string
  score: number
}

export function getSearchConfig(): AzureSearchConfig {
  let endpoint = (process.env.AZURE_SEARCH_ENDPOINT || '').trim().replace(/\/$/, '')
  let key = (process.env.AZURE_SEARCH_KEY || '').trim()
  let indexName = (process.env.AZURE_SEARCH_INDEX || 'kinetic-hr-policies').trim()

  if (!endpoint || !key) {
    try {
      const fs = require('fs')
      const path = require('path')
      const candidates = [
        path.resolve(process.cwd(), 'local.settings.json'),
        path.resolve(__dirname, '../../local.settings.json'),
        path.resolve(__dirname, '../../../local.settings.json'),
      ]
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'))
          endpoint = endpoint || (parsed.Values?.AZURE_SEARCH_ENDPOINT || '').trim().replace(/\/$/, '')
          key = key || (parsed.Values?.AZURE_SEARCH_KEY || '').trim()
          indexName = indexName || (parsed.Values?.AZURE_SEARCH_INDEX || 'kinetic-hr-policies').trim()
          if (endpoint && key) break
        }
      }
    } catch (_) {}
  }

  return {
    endpoint,
    key,
    indexName,
    isConfigured: !!(endpoint && key),
  }
}

/**
 * Ensures the 'kinetic-hr-policies' index exists in Azure AI Search.
 * If not present, creates the schema automatically.
 */
export async function ensurePolicyIndex(): Promise<{ success: boolean; created: boolean; error?: string }> {
  const { endpoint, key, indexName, isConfigured } = getSearchConfig()
  if (!isConfigured) {
    return { success: false, created: false, error: 'Azure AI Search credentials not configured.' }
  }

  const indexUrl = `${endpoint}/indexes/${indexName}?api-version=2023-11-01`

  try {
    // Check if index already exists
    const checkRes = await fetch(indexUrl, {
      method: 'GET',
      headers: { 'api-key': key },
    })

    if (checkRes.ok) {
      return { success: true, created: false }
    }

    if (checkRes.status === 404) {
      // Create index definition
      const schema = {
        name: indexName,
        fields: [
          { name: 'id', type: 'Edm.String', key: true, searchable: false, filterable: true },
          { name: 'tenantId', type: 'Edm.String', searchable: false, filterable: true, facetable: true },
          { name: 'title', type: 'Edm.String', searchable: true, filterable: true, sortable: true },
          { name: 'category', type: 'Edm.String', searchable: true, filterable: true, facetable: true },
          { name: 'version', type: 'Edm.String', searchable: false },
          { name: 'summary', type: 'Edm.String', searchable: true },
          { name: 'content', type: 'Edm.String', searchable: true },
          { name: 'keyTerms', type: 'Collection(Edm.String)', searchable: true, filterable: true },
          { name: 'fileSize', type: 'Edm.String', searchable: false },
          { name: 'uploadedAt', type: 'Edm.DateTimeOffset', filterable: true, sortable: true },
        ],
        corsOptions: {
          allowedOrigins: ['*'],
        },
      }

      const createRes = await fetch(`${endpoint}/indexes?api-version=2023-11-01`, {
        method: 'POST',
        headers: {
          'api-key': key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schema),
      })

      if (!createRes.ok) {
        const errText = await createRes.text()
        return { success: false, created: false, error: `Failed to create index: ${errText}` }
      }

      return { success: true, created: true }
    }

    const errText = await checkRes.text()
    return { success: false, created: false, error: `Error checking index: ${errText}` }
  } catch (err: any) {
    return { success: false, created: false, error: err.message }
  }
}

/**
 * Uploads/indexes policy documents from seed/platform data to Azure AI Search.
 */
export async function seedPolicyDocuments(): Promise<{ success: boolean; indexedCount: number; error?: string }> {
  const { endpoint, key, indexName, isConfigured } = getSearchConfig()
  if (!isConfigured) {
    return { success: false, indexedCount: 0, error: 'Azure AI Search not configured.' }
  }

  // Ensure index exists first
  await ensurePolicyIndex()

  try {
    const seed = generateProductionSeedData()
    const policies = seed.POLICIES || []

    const documents: PolicySearchDocument[] = policies.map((p: any) => ({
      id: p.id,
      tenantId: p.tenantId,
      title: p.title,
      category: p.category,
      version: p.version || '1.0',
      summary: p.summary,
      content: `${p.summary} ${p.contentExcerpt || ''} Key regulations: ${(p.keyTerms || []).join(', ')}`,
      keyTerms: p.keyTerms || [],
      fileSize: p.fileSize || '1.0 MB',
      uploadedAt: p.uploadedAt || new Date().toISOString(),
    }))

    const batch = {
      value: documents.map(doc => ({
        '@search.action': 'mergeOrUpload',
        ...doc,
      })),
    }

    const uploadUrl = `${endpoint}/indexes/${indexName}/docs/index?api-version=2023-11-01`
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'api-key': key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch),
    })

    if (!res.ok) {
      const errText = await res.text()
      return { success: false, indexedCount: 0, error: `Indexing failed: ${errText}` }
    }

    const resJson = (await res.json()) as any
    const indexed = (resJson?.value || []).filter((r: any) => r.status === true).length

    return { success: true, indexedCount: indexed }
  } catch (err: any) {
    return { success: false, indexedCount: 0, error: err.message }
  }
}

/**
 * Performs full-text / semantic search on Azure AI Search.
 */
export async function searchPolicies(
  query: string,
  options?: { tenantId?: string; top?: number }
): Promise<{ success: boolean; results: SearchResultItem[]; totalCount?: number; error?: string }> {
  const { endpoint, key, indexName, isConfigured } = getSearchConfig()
  if (!isConfigured) {
    return { success: false, results: [], error: 'Azure AI Search not configured.' }
  }

  const searchUrl = `${endpoint}/indexes/${indexName}/docs/search?api-version=2023-11-01`
  const top = options?.top || 5

  const bodyPayload: any = {
    search: query && query.trim() !== '' ? query : '*',
    top,
    count: true,
  }

  if (options?.tenantId) {
    bodyPayload.filter = `tenantId eq '${options.tenantId}'`
  }

  try {
    const res = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'api-key': key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    })

    if (!res.ok) {
      const errText = await res.text()
      return { success: false, results: [], error: `Search query failed: ${errText}` }
    }

    const data = (await res.json()) as any
    const rawResults = data.value || []

    const results: SearchResultItem[] = rawResults.map((r: any) => ({
      id: r.id,
      tenantId: r.tenantId,
      title: r.title,
      category: r.category,
      version: r.version,
      summary: r.summary,
      content: r.content,
      keyTerms: r.keyTerms || [],
      uploadedAt: r.uploadedAt,
      score: r['@search.score'] || 1.0,
    }))

    return {
      success: true,
      results,
      totalCount: data['@odata.count'] || results.length,
    }
  } catch (err: any) {
    return { success: false, results: [], error: err.message }
  }
}

/**
 * Health check diagnostics for Azure AI Search
 */
export async function checkAzureSearchHealth(): Promise<{
  connected: boolean
  serviceName: string
  endpoint: string
  indexCount: number
  latencyMs: number
  error?: string
}> {
  const { endpoint, key, isConfigured } = getSearchConfig()
  const start = Date.now()

  if (!isConfigured) {
    return {
      connected: false,
      serviceName: 'kinetichr-search',
      endpoint: '',
      indexCount: 0,
      latencyMs: 0,
      error: 'Azure AI Search endpoint or key not configured.',
    }
  }

  try {
    const listIndexesUrl = `${endpoint}/indexes?api-version=2023-11-01`
    const res = await fetch(listIndexesUrl, {
      method: 'GET',
      headers: { 'api-key': key },
    })

    const latencyMs = Date.now() - start

    if (!res.ok) {
      return {
        connected: false,
        serviceName: 'kinetichr-search',
        endpoint,
        indexCount: 0,
        latencyMs,
        error: `HTTP ${res.status}: ${res.statusText}`,
      }
    }

    const data = (await res.json()) as any
    const indexes = data.value || []

    return {
      connected: true,
      serviceName: new URL(endpoint).hostname.split('.')[0] || 'kinetichr-search',
      endpoint,
      indexCount: indexes.length,
      latencyMs,
    }
  } catch (err: any) {
    return {
      connected: false,
      serviceName: 'kinetichr-search',
      endpoint,
      indexCount: 0,
      latencyMs: Date.now() - start,
      error: err.message,
    }
  }
}
