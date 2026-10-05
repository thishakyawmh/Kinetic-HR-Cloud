import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { queryTenantItems, getTenantContainer } from '../config/cosmos'
import { authenticateRequest } from '../middleware/auth'

/**
 * GET /api/policies
 */
export async function getPolicies(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const category = request.query.get('category')

  try {
    let query = 'SELECT * FROM c WHERE c.tenantId = @tenantId'
    const params: Array<{ name: string; value: any }> = [{ name: '@tenantId', value: tenantId }]

    if (category && category !== 'all') {
      query += ' AND LOWER(c.category) = @category'
      params.push({ name: '@category', value: category.toLowerCase() })
    }

    const policies = await queryTenantItems<any>('policies', tenantId, query, params)
    return { status: 200, jsonBody: policies }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * POST /api/policies
 */
export async function createPolicy(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request, 'admin')
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId

  try {
    const body = (await request.json()) as any
    const policyId = `pol-${Date.now()}`

    const newPolicy = {
      id: policyId,
      tenantId,
      title: body.title,
      category: body.category || 'General',
      version: body.version || '1.0',
      fileSize: body.fileSize || '1.2 MB',
      summary: body.summary,
      keyTerms: body.keyTerms || [],
      contentExcerpt: body.contentExcerpt,
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const container = getTenantContainer('policies')
    const { resource } = await container.items.create(newPolicy)
    return { status: 201, jsonBody: resource }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * GET /api/policies/{id}
 */
export async function getPolicyById(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const policyId = request.params.id

  try {
    const policies = await queryTenantItems<any>(
      'policies',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.id = @id',
      [
        { name: '@tenantId', value: tenantId },
        { name: '@id', value: policyId },
      ]
    )

    if (policies.length === 0) {
      return { status: 404, jsonBody: { error: 'Policy not found' } }
    }

    return { status: 200, jsonBody: policies[0] }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * GET /api/policies/{id}/download-url
 * Generates an Azure Blob Storage SAS token for downloading policy documents
 */
export async function getPolicyDownloadUrl(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const policyId = request.params.id

  try {
    const fileName = `${policyId}.pdf`
    const { generateTenantBlobSasUrl } = await import('../config/blob')
    const downloadUrl = await generateTenantBlobSasUrl(tenantId, 'policies', fileName, 'r', 30)

    return {
      status: 200,
      jsonBody: { downloadUrl, expiresInMinutes: 30 },
    }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

