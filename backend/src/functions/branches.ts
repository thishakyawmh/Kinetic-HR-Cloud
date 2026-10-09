import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { queryTenantItems, getTenantContainer } from '../config/cosmos'
import { authenticateRequest } from '../middleware/auth'

/**
 * GET /api/branches
 * Retrieves all branches for the authenticated tenant with dynamic headcount calculation
 */
export async function getBranches(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId

  try {
    const query = 'SELECT * FROM c WHERE c.tenantId = @tenantId'
    const params = [{ name: '@tenantId', value: tenantId }]
    const branches = await queryTenantItems<any>('branches', tenantId, query, params)

    // Calculate real headcount per branch from users
    const usersQuery = 'SELECT c.branchId, c.branchName, c.location FROM c WHERE c.tenantId = @tenantId'
    const users = await queryTenantItems<any>('users', tenantId, usersQuery, params)

    const headcountMap: Record<string, number> = {}
    users.forEach((u: any) => {
      if (u.branchId) {
        headcountMap[u.branchId] = (headcountMap[u.branchId] || 0) + 1
      } else if (u.branchName || u.location) {
        const key = u.branchName || u.location
        headcountMap[key] = (headcountMap[key] || 0) + 1
      }
    })

    const enriched = branches.map((b: any) => ({
      ...b,
      employeeCount: headcountMap[b.id] || headcountMap[b.name] || b.employeeCount || 0,
    }))

    return { status: 200, jsonBody: enriched }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * POST /api/branches
 * Provisions a new branch or office location for the tenant
 */
export async function createBranch(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request, 'admin')
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId

  try {
    const body = (await request.json()) as any
    if (!body.name || !body.name.trim()) {
      return { status: 400, jsonBody: { error: 'Branch name is required' } }
    }
    if (!body.city || !body.city.trim()) {
      return { status: 400, jsonBody: { error: 'Branch city is required' } }
    }

    const container = getTenantContainer('branches')

    // If marked as headquarters, update existing branches to remove HQ flag
    if (body.isHeadquarters) {
      const existing = await queryTenantItems<any>(
        'branches',
        tenantId,
        'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.isHeadquarters = true',
        [{ name: '@tenantId', value: tenantId }]
      )
      for (const b of existing) {
        await container.items.upsert({ ...b, isHeadquarters: false })
      }
    }

    const newBranch = {
      id: body.id || `br-${Date.now().toString(36)}`,
      tenantId,
      name: body.name.trim(),
      code: body.code ? body.code.trim().toUpperCase() : `BR-${Math.floor(100 + Math.random() * 900)}`,
      type: body.type || 'Regional Branch',
      address: body.address ? body.address.trim() : '',
      city: body.city.trim(),
      country: body.country ? body.country.trim() : 'Sri Lanka',
      phone: body.phone ? body.phone.trim() : '',
      email: body.email ? body.email.trim() : '',
      timezone: body.timezone || 'Asia/Colombo (UTC+5:30)',
      branchManagerId: body.branchManagerId || undefined,
      branchManagerName: body.branchManagerName || undefined,
      employeeCount: 0,
      isHeadquarters: !!body.isHeadquarters,
      status: body.status || 'Active',
      createdAt: new Date().toISOString(),
    }

    const { resource } = await container.items.create(newBranch)
    return { status: 201, jsonBody: resource }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * PUT /api/branches/{id}
 * Updates an existing branch
 */
export async function updateBranch(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request, 'admin')
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const branchId = request.params.id

  if (!branchId) {
    return { status: 400, jsonBody: { error: 'Branch ID is required' } }
  }

  try {
    const body = (await request.json()) as any
    const container = getTenantContainer('branches')

    const existingList = await queryTenantItems<any>(
      'branches',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.id = @id',
      [
        { name: '@tenantId', value: tenantId },
        { name: '@id', value: branchId },
      ]
    )

    if (existingList.length === 0) {
      return { status: 404, jsonBody: { error: 'Branch not found' } }
    }

    const existing = existingList[0]

    // If setting as headquarters, reset other branches
    if (body.isHeadquarters && !existing.isHeadquarters) {
      const allHqs = await queryTenantItems<any>(
        'branches',
        tenantId,
        'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.isHeadquarters = true',
        [{ name: '@tenantId', value: tenantId }]
      )
      for (const b of allHqs) {
        if (b.id !== branchId) {
          await container.items.upsert({ ...b, isHeadquarters: false })
        }
      }
    }

    const updated = {
      ...existing,
      ...body,
      id: existing.id,
      tenantId: existing.tenantId,
      updatedAt: new Date().toISOString(),
    }

    const { resource } = await container.items.upsert(updated)
    return { status: 200, jsonBody: resource }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * DELETE /api/branches/{id}
 * Deletes a branch
 */
export async function deleteBranch(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request, 'admin')
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const branchId = request.params.id

  if (!branchId) {
    return { status: 400, jsonBody: { error: 'Branch ID is required' } }
  }

  try {
    const container = getTenantContainer('branches')
    await container.item(branchId, tenantId).delete()
    return { status: 200, jsonBody: { success: true, message: 'Branch deleted' } }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}
