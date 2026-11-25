import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { authenticateRequest } from '../middleware/auth'
import { searchPolicies, seedPolicyDocuments, checkAzureSearchHealth, getSearchConfig } from '../config/search'

/**
 * GET /api/search/policies?q=query&tenantId=...
 * Performs full-text / semantic search on Azure AI Search
 */
export async function handleSearchPolicies(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const q = request.query.get('q') || request.query.get('search') || '*'
  const requestedTenantId = request.query.get('tenantId')
  if (requestedTenantId && requestedTenantId !== auth.user!.tenantId && auth.user!.role !== 'platform_admin') {
    return {
      status: 403,
      jsonBody: { error: 'Cross-tenant policy search prohibited.', results: [] },
    }
  }
  const tenantId = requestedTenantId || auth.user!.tenantId
  const topStr = request.query.get('top') || '5'
  const top = Math.min(Math.max(parseInt(topStr, 10) || 5, 1), 50)

  try {
    const searchRes = await searchPolicies(q, { tenantId, top })
    return {
      status: 200,
      jsonBody: searchRes,
    }
  } catch (err: any) {
    return {
      status: 500,
      jsonBody: { error: err.message, results: [] },
    }
  }
}

/**
 * POST /api/search/seed
 * Populates Azure AI Search with enterprise policies
 */
export async function handleSeedSearch(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request, 'admin')
  if (auth.errorResponse) return auth.errorResponse

  try {
    const result = await seedPolicyDocuments()
    return {
      status: result.success ? 200 : 500,
      jsonBody: result,
    }
  } catch (err: any) {
    return {
      status: 500,
      jsonBody: { error: err.message, success: false },
    }
  }
}

/**
 * GET /api/search/health
 * Returns live Azure AI Search connectivity diagnostics
 */
export async function handleSearchHealth(
  _request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const config = getSearchConfig()
  const health = await checkAzureSearchHealth()

  return {
    status: health.connected ? 200 : 503,
    jsonBody: {
      ...health,
      configured: config.isConfigured,
      indexName: config.indexName,
    },
  }
}
