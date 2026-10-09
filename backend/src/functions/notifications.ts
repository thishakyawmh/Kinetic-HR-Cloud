import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { queryTenantItems, updateTenantItem } from '../config/cosmos'
import { authenticateRequest } from '../middleware/auth'

/**
 * GET /api/notifications
 * Fetches user notifications
 */
export async function getNotifications(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request, 'employee')
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const userId = auth.user!.id

  try {
    const notifications = await queryTenantItems<any>(
      'notifications',
      tenantId,
      'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.recipientId = @userId ORDER BY c.createdAt DESC',
      [
        { name: '@tenantId', value: tenantId },
        { name: '@userId', value: userId },
      ]
    )
    return { status: 200, jsonBody: notifications }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}

/**
 * PATCH /api/notifications/{id}/read
 * Marks a notification as read
 */
export async function markNotificationRead(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request, 'employee')
  if (auth.errorResponse) return auth.errorResponse

  const tenantId = auth.user!.tenantId
  const notifId = request.params.id

  if (!notifId) {
    return { status: 400, jsonBody: { error: 'Notification ID is required.' } }
  }

  try {
    const updated = await updateTenantItem<any>('notifications', notifId, tenantId, (item: any) => {
      item.read = true
      item.readAt = new Date().toISOString()
      return item
    })
    return { status: 200, jsonBody: updated }
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } }
  }
}
