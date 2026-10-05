import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { queryTenantItems } from '../config/cosmos'
import { generateTenantBlobSasUrl } from '../config/blob'
import { authenticateRequest } from '../middleware/auth'

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
  const employeeId = request.query.get('employeeId') || (auth.user!.role === 'employee' ? auth.user!.id : undefined)

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

