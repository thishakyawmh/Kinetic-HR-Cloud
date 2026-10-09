import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { queryTenantItems, createTenantItem, getTenantContainer } from '../config/cosmos'
import { authenticateRequest } from '../middleware/auth'

/**
 * GET /api/attendance
 * Retrieves attendance clock logs for the authenticated tenant/user
 */
export async function getAttendanceRecords(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request, 'employee')
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const userId = request.query.get('userId') || auth.user!.id
  const filterDate = request.query.get('date')

  try {
    let query = 'SELECT * FROM c WHERE c.tenantId = @tenantId'
    const params: Array<{ name: string; value: any }> = [{ name: '@tenantId', value: tenantId }]

    if (userId && auth.user!.role !== 'admin') {
      query += ' AND c.userId = @userId'
      params.push({ name: '@userId', value: userId })
    }

    if (filterDate) {
      query += ' AND c.date = @date'
      params.push({ name: '@date', value: filterDate })
    }

    query += ' ORDER BY c.clockIn DESC'

    const records = await queryTenantItems<any>('attendance', tenantId, query, params)
    return { status: 200, jsonBody: records }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * POST /api/attendance/clock
 * Records a clock-in or clock-out event
 */
export async function recordAttendanceClock(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request, 'employee')
  if (auth.errorResponse) return auth.errorResponse

  try {
    const body = (await request.json()) as any
    const tenantId = auth.user!.tenantId
    const userId = auth.user!.id
    const userName = auth.user!.name
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    const existingToday = await queryTenantItems<any>(
      'attendance',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.userId = @userId AND c.date = @date',
      [
        { name: '@tenantId', value: tenantId },
        { name: '@userId', value: userId },
        { name: '@date', value: todayStr },
      ]
    )

    if (body.action === 'clockIn') {
      const record = {
        id: `att-${userId}-${todayStr}`,
        tenantId,
        userId,
        userName,
        date: todayStr,
        clockIn: now.toISOString(),
        clockOut: null,
        totalHours: 0,
        status: body.workMode === 'remote' ? 'Remote' : 'Present',
        workMode: body.workMode || 'Office',
        location: body.location || 'Headquarters',
      }
      const created = await createTenantItem<any>('attendance', record)
      return { status: 201, jsonBody: created }
    } else if (body.action === 'clockOut') {
      if (existingToday.length === 0) {
        return { status: 400, jsonBody: { error: 'No clock-in record found for today.' } }
      }
      const record = existingToday[0]
      const clockInTime = new Date(record.clockIn).getTime()
      const totalHours = parseFloat(((now.getTime() - clockInTime) / (1000 * 60 * 60)).toFixed(2))

      record.clockOut = now.toISOString()
      record.totalHours = totalHours
      const updated = await createTenantItem<any>('attendance', record)
      return { status: 200, jsonBody: updated }
    }

    return { status: 400, jsonBody: { error: 'Invalid attendance action specified.' } }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * POST /api/attendance/fingerprint-sync
 * Ingests biometric fingerprint scanner logs automatically
 */
export async function syncFingerprintLogs(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  try {
    const body = (await request.json()) as {
      tenantId?: string
      deviceId?: string
      logs: Array<{
        employeeId: string
        employeeName?: string
        timestamp: string
        scanType: 'IN' | 'OUT'
        verificationType?: 'FINGERPRINT' | 'BIOMETRIC_FACE' | 'RFID'
      }>
    }

    const tenantId = auth.user!.tenantId
    const deviceId = body.deviceId || 'FP-BIOMETRIC-GATE-1'
    const processedRecords: any[] = []

    for (const log of body.logs || []) {
      const scanDate = new Date(log.timestamp)
      const dateStr = scanDate.toISOString().split('T')[0]
      const attId = `att-${log.employeeId}-${dateStr}`

      const existing = await queryTenantItems<any>(
        'attendance',
        tenantId,
        'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.userId = @userId AND c.date = @date',
        [
          { name: '@tenantId', value: tenantId },
          { name: '@userId', value: log.employeeId },
          { name: '@date', value: dateStr },
        ]
      )

      let record = existing.length > 0 ? existing[0] : {
        id: attId,
        tenantId,
        userId: log.employeeId,
        userName: log.employeeName || log.employeeId,
        date: dateStr,
        clockIn: null,
        clockOut: null,
        totalHours: 0,
        overtimeHours: 0,
        status: 'Present',
        workMode: 'Office',
        verificationMethod: log.verificationType || 'FINGERPRINT',
        deviceId,
      }

      if (log.scanType === 'IN') {
        record.clockIn = log.timestamp
      } else if (log.scanType === 'OUT') {
        record.clockOut = log.timestamp
      }

      if (record.clockIn && record.clockOut) {
        const inMs = new Date(record.clockIn).getTime()
        const outMs = new Date(record.clockOut).getTime()
        const diffHours = Math.max(0, (outMs - inMs) / (1000 * 60 * 60))
        record.totalHours = parseFloat(diffHours.toFixed(2))
        record.overtimeHours = parseFloat(Math.max(0, diffHours - 8.0).toFixed(2))
      }

      const container = getTenantContainer('attendance')
      await container.items.upsert(record)
      processedRecords.push(record)
    }

    return {
      status: 200,
      jsonBody: {
        message: `Biometric fingerprint logs synchronized successfully (${processedRecords.length} records processed)`,
        deviceId,
        records: processedRecords,
      },
    }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}
