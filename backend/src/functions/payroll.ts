import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { queryTenantItems, getTenantContainer } from '../config/cosmos'
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

/**
 * POST /api/payroll/calculate-biometric
 * Automatically calculates monthly salary and generates payslips based on fingerprint attendance logs
 */
export async function calculateBiometricPayroll(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId

  try {
    const body = (await request.json()) as {
      periodMonth: string
      periodYear: number
      payDate?: string
    }

    const periodMonth = body.periodMonth || 'October'
    const periodYear = body.periodYear || 2026
    const payDate = body.payDate || `${periodYear}-10-31`
    const payPeriod = `${periodMonth} ${periodYear}`

    // 1. Get all users in tenant
    const users = await queryTenantItems<any>(
      'users',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @tenantId',
      [{ name: '@tenantId', value: tenantId }]
    )

    // 2. Get attendance records for this month
    const attendanceLogs = await queryTenantItems<any>(
      'attendance',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @tenantId',
      [{ name: '@tenantId', value: tenantId }]
    )

    const generatedPayslips: any[] = []
    const payslipContainer = getTenantContainer('payslips')

    for (const u of users) {
      const userAtt = attendanceLogs.filter(a => a.userId === u.id || a.userName === u.name)
      const daysPresent = userAtt.filter(a => a.status === 'Present' || a.status === 'Remote').length || 22
      const totalOvertimeHours = userAtt.reduce((sum, a) => sum + Number(a.overtimeHours || 0), 0)

      const basicSalary = Number(u.baseSalary || 3500)
      const hourlyRate = (basicSalary / 160)
      const overtimePay = parseFloat((totalOvertimeHours * hourlyRate * 1.5).toFixed(2))

      const grossSalary = basicSalary + overtimePay
      const epfEmployee = parseFloat((grossSalary * 0.08).toFixed(2))
      const epfEmployer = parseFloat((grossSalary * 0.12).toFixed(2))
      const etfEmployer = parseFloat((grossSalary * 0.03).toFixed(2))
      const apitTax = parseFloat((grossSalary > 3000 ? grossSalary * 0.15 : 0).toFixed(2))

      const totalDeductions = epfEmployee + apitTax
      const netSalary = parseFloat((grossSalary - totalDeductions).toFixed(2))

      const payslipId = `pay-${u.id}-${periodMonth.toLowerCase()}-${periodYear}`
      const payslip = {
        id: payslipId,
        tenantId,
        employeeId: u.id,
        employeeName: u.name,
        periodMonth,
        periodYear,
        payPeriod,
        payDate,
        basicSalary,
        overtimePay,
        overtimeHours: totalOvertimeHours,
        daysPresent,
        grossSalary,
        grossPay: grossSalary,
        epfEmployee,
        epfEmployer,
        etfEmployer,
        statutoryTaxes: apitTax,
        tax: apitTax,
        deductions: totalDeductions,
        netSalary,
        netPay: netSalary,
        currency: 'USD',
        status: 'Published',
        calculatedBy: 'Kinetic Biometric Payroll Engine',
        calculatedAt: new Date().toISOString(),
        notes: `Automated salary calculation based on ${daysPresent} present days and ${totalOvertimeHours} overtime hours from fingerprint logs.`,
      }

      await payslipContainer.items.upsert(payslip)
      generatedPayslips.push(payslip)
    }

    return {
      status: 200,
      jsonBody: {
        message: `Automated biometric payroll calculation completed for ${payPeriod}`,
        processedEmployeesCount: generatedPayslips.length,
        payslips: generatedPayslips,
      },
    }
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
    const items = await queryTenantItems<any>(
      'payment_settings',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @tenantId',
      [{ name: '@tenantId', value: tenantId }]
    )

    if (items.length > 0) {
      return { status: 200, jsonBody: items[0] }
    }

    const defaultSettings = {
      id: `pay-sett-${tenantId}`,
      tenantId,
      updatedAt: new Date().toISOString(),
      updatedBy: 'System Baseline',
      otEnabled: true,
      otBasis: '1.5x',
      otCustomMultiplier: 1.5,
      otMaxHours: 40,
      otEligibleGroups: ['All Employees', 'Engineering', 'Operations'],
      otRequireApproval: true,
      otEffectiveFrom: '2026-01-01',

      targetCoverageEnabled: true,
      targetCoverageBase: 'net',
      targetCoverageMethod: 'progressive',
      targetTiers: [
        { id: 'tier-1', rangeLabel: 'First 20 target units', lowerThreshold: 0, upperThreshold: 20, unit: 'units', ratePercent: 0.50 },
        { id: 'tier-2', rangeLabel: 'Next 20 units', lowerThreshold: 20, upperThreshold: 40, unit: 'units', ratePercent: 0.75 },
        { id: 'tier-3', rangeLabel: 'Above 40 units', lowerThreshold: 40, upperThreshold: 9999, unit: 'units', ratePercent: 1.00 },
      ],

      bonusEnabled: false,
      bonusMethod: 'kpi',
      bonusPercentage: 10,
      bonusFixedAmount: 500,
      bonusMinThreshold: 70,
      bonusMaxPayout: 2500,

      epfEmployeeEnabled: true,
      epfEmployeeRate: 8,
      epfEmployeeBase: 'legal',

      epfEmployerEnabled: true,
      epfEmployerRate: 12,
      etfEmployerRate: 3,
      epfEmployerBase: 'legal',
    }

    return { status: 200, jsonBody: defaultSettings }
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
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const body = (await request.json()) as any

  try {
    const container = await getTenantContainer('payment_settings', tenantId)
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

