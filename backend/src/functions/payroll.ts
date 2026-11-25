import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { queryTenantItems, getTenantContainer } from '../config/cosmos'
import { generateTenantBlobSasUrl } from '../config/blob'
import { authenticateRequest } from '../middleware/auth'
import { getTenantPaymentSettings, runBiometricPayrollCalculation } from '../services/payrollService'

/**
 * GET /api/payroll/payslips
 */
export async function getPayslips(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const requestedEmpId = request.query.get('employeeId')
  if (auth.user!.role === 'employee' && requestedEmpId && requestedEmpId !== auth.user!.id) {
    return { status: 403, jsonBody: { error: 'Forbidden: employees can only view their own payslips' } }
  }
  const employeeId = auth.user!.role === 'employee' ? auth.user!.id : requestedEmpId || undefined

  try {
    let query = 'SELECT * FROM c WHERE c.tenantId = @tenantId'
    const params: Array<{ name: string; value: any }> = [{ name: '@tenantId', value: tenantId }]

    if (employeeId) {
      query += ' AND c.employeeId = @employeeId'
      params.push({ name: '@employeeId', value: employeeId })
    }

    query += ' ORDER BY c.payDate DESC'

    const payslips = await queryTenantItems<any>('payslips', tenantId, query, params)
    return { status: 200, jsonBody: payslips }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * GET /api/payroll/payslips/{id}
 */
export async function getPayslipById(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const payslipId = request.params.id

  try {
    const payslips = await queryTenantItems<any>(
      'payslips',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.id = @id',
      [
        { name: '@tenantId', value: tenantId },
        { name: '@id', value: payslipId },
      ]
    )

    if (payslips.length === 0) {
      return { status: 404, jsonBody: { error: 'Payslip not found' } }
    }

    if (auth.user!.role === 'employee' && payslips[0].employeeId !== auth.user!.id) {
      return { status: 403, jsonBody: { error: 'Forbidden: cannot access another employee payslip' } }
    }

    return { status: 200, jsonBody: payslips[0] }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * GET /api/payroll/payslips/{id}/download-url
 * Generates an Azure Blob Storage SAS token for secure direct download
 */
export async function getPayslipDownloadUrl(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const payslipId = request.params.id

  try {
    const payslips = await queryTenantItems<any>(
      'payslips',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.id = @id',
      [
        { name: '@tenantId', value: tenantId },
        { name: '@id', value: payslipId },
      ]
    )

    if (payslips.length === 0) {
      return { status: 404, jsonBody: { error: 'Payslip not found' } }
    }

    if (auth.user!.role === 'employee' && payslips[0].employeeId !== auth.user!.id) {
      return { status: 403, jsonBody: { error: 'Forbidden: cannot download another employee payslip' } }
    }

    // Generate 15-minute expiring read SAS URL directly to the blob
    const fileName = `${payslipId}.pdf`
    const downloadUrl = await generateTenantBlobSasUrl(tenantId, 'payslips', fileName, 'r', 15)

    return {
      status: 200,
      jsonBody: { downloadUrl, expiresInMinutes: 15 },
    }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * POST /api/payroll/calculate-biometric
 * Automatically calculates monthly salary and generates payslips based on fingerprint attendance logs
 */
export async function calculateBiometricPayroll(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request, 'admin')
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId

  try {
    const body = (await request.json().catch(() => ({}))) as {
      periodMonth?: string
      periodYear?: number
      payDate?: string
    }

    const periodMonth = body.periodMonth || 'October'
    const periodYear = Number(body.periodYear || 2026)
    const payDate = body.payDate || `${periodYear}-10-31`

    const result = await runBiometricPayrollCalculation(tenantId, periodMonth, periodYear, payDate)
    return { status: 200, jsonBody: result }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * GET /api/payroll/settings
 */
export async function getPaymentSettings(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId

  try {
    const settings = await getTenantPaymentSettings(tenantId)
    return { status: 200, jsonBody: settings }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * POST /api/payroll/settings
 */
export async function updatePaymentSettings(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request, 'admin')
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId

  try {
    const body = (await request.json()) as any
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return { status: 400, jsonBody: { error: 'Invalid payment settings payload.' } }
    }

    const container = getTenantContainer('payment_settings')
    const settingsObj = {
      ...body,
      id: body.id || `pay-sett-${tenantId}`,
      tenantId,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.user!.name || auth.user!.email,
    }

    await container.items.upsert(settingsObj)
    return { status: 200, jsonBody: settingsObj }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

