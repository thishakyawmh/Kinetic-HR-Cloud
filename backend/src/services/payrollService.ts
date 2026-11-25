import { getTenantContainer, queryTenantItems } from '../config/cosmos'

export function buildDefaultPaymentSettings(tenantId: string) {
  return {
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
      { id: 'tier-1', rangeLabel: 'First 20 target units', lowerThreshold: 0, upperThreshold: 20, unit: 'units', ratePercent: 0.5 },
      { id: 'tier-2', rangeLabel: 'Next 20 units', lowerThreshold: 20, upperThreshold: 40, unit: 'units', ratePercent: 0.75 },
      { id: 'tier-3', rangeLabel: 'Above 40 units', lowerThreshold: 40, upperThreshold: 9999, unit: 'units', ratePercent: 1.0 },
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
}

export async function getTenantPaymentSettings(tenantId: string) {
  const items = await queryTenantItems<any>(
    'payment_settings',
    tenantId,
    'SELECT * FROM c WHERE c.tenantId = @tenantId',
    [{ name: '@tenantId', value: tenantId }]
  )
  return items.length > 0 ? items[0] : buildDefaultPaymentSettings(tenantId)
}

export async function runBiometricPayrollCalculation(
  tenantId: string,
  periodMonth: string,
  periodYear: number,
  payDate: string
) {
  const payPeriod = `${periodMonth} ${periodYear}`

  const [users, attendanceLogs, settings] = await Promise.all([
    queryTenantItems<any>('users', tenantId, 'SELECT * FROM c WHERE c.tenantId = @tenantId', [
      { name: '@tenantId', value: tenantId },
    ]),
    queryTenantItems<any>('attendance', tenantId, 'SELECT * FROM c WHERE c.tenantId = @tenantId', [
      { name: '@tenantId', value: tenantId },
    ]),
    getTenantPaymentSettings(tenantId),
  ])

  const otMultiplier = settings.otEnabled === false ? 0 : Number(settings.otCustomMultiplier || 1.5)
  const otMaxHours = Number(settings.otMaxHours || 40)
  const epfEmployeeRate = settings.epfEmployeeEnabled === false ? 0 : Number(settings.epfEmployeeRate ?? 8) / 100
  const epfEmployerRate = settings.epfEmployerEnabled === false ? 0 : Number(settings.epfEmployerRate ?? 12) / 100
  const etfEmployerRate = Number(settings.etfEmployerRate ?? 3) / 100

  const generatedPayslips: any[] = []
  const payslipContainer = getTenantContainer('payslips')

  for (const u of users) {
    const userAtt = attendanceLogs.filter(a => a.userId === u.id || a.userName === u.name)
    const daysPresent = userAtt.filter(a => a.status === 'Present' || a.status === 'Remote').length || 22
    const rawOvertimeHours = userAtt.reduce((sum, a) => sum + Number(a.overtimeHours || 0), 0)
    const totalOvertimeHours = Math.min(rawOvertimeHours, otMaxHours)

    const basicSalary = Number(u.baseSalary || 3500)
    const hourlyRate = basicSalary / 160
    const overtimePay = parseFloat((totalOvertimeHours * hourlyRate * otMultiplier).toFixed(2))

    const grossSalary = basicSalary + overtimePay
    const epfEmployee = parseFloat((grossSalary * epfEmployeeRate).toFixed(2))
    const epfEmployer = parseFloat((grossSalary * epfEmployerRate).toFixed(2))
    const etfEmployer = parseFloat((grossSalary * etfEmployerRate).toFixed(2))
    const apitTax = parseFloat((grossSalary > 3000 ? grossSalary * 0.15 : 0).toFixed(2))

    const totalDeductions = epfEmployee + apitTax
    const netSalary = parseFloat((grossSalary - totalDeductions).toFixed(2))

    const payslip = {
      id: `pay-${u.id}-${periodMonth.toLowerCase()}-${periodYear}`,
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
      currency: u.currency || 'USD',
      status: 'Published',
      calculatedBy: 'Kinetic Biometric Payroll Engine',
      calculatedAt: new Date().toISOString(),
      notes: `Automated salary calculation based on ${daysPresent} present days and ${totalOvertimeHours} overtime hours from fingerprint logs.`,
    }

    await payslipContainer.items.upsert(payslip)
    generatedPayslips.push(payslip)
  }

  return {
    message: `Automated biometric payroll calculation completed for ${payPeriod}`,
    processedEmployeesCount: generatedPayslips.length,
    payslips: generatedPayslips,
  }
}
