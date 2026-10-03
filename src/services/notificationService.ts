import { appDataStore } from './storage'
import { AppNotification } from '@/types'

export const notificationService = {
  async getNotifications(userId: string): Promise<AppNotification[]> {
    await new Promise(r => setTimeout(r, 60))
    return appDataStore.getNotifications(userId)
  },

  async markAsRead(id: string): Promise<void> {
    appDataStore.markNotificationRead(id)
  },
}
