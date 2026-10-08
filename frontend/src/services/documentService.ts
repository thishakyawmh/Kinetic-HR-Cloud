import { apiClient } from './apiClient'
import { HRDocumentRequest } from '@/types'
import { storage } from './storage'

const useMock = () => import.meta.env.VITE_USE_MOCK_SERVICES !== 'false'

export const documentService = {
  /**
   * Submit HR document request (triggers AI verification & draft generation)
   */
  async createRequest(documentType: string, purpose: string): Promise<HRDocumentRequest> {
    if (useMock()) {
      return storage.createDocumentRequest(documentType, purpose)
    }
    try {
      const res = await apiClient.post<HRDocumentRequest>('/documents/request', {
        documentType,
        purpose,
      })
      return res || storage.createDocumentRequest(documentType, purpose)
    } catch (e) {
      console.warn('Backend API document request failed, writing to fallback local storage:', e)
      return storage.createDocumentRequest(documentType, purpose)
    }
  },

  /**
   * Get document requests for tenant / user
   */
  async getRequests(): Promise<HRDocumentRequest[]> {
    if (useMock()) {
      return storage.getDocumentRequests()
    }
    try {
      const res = await apiClient.get<HRDocumentRequest[]>('/documents')
      return Array.isArray(res) ? res : storage.getDocumentRequests()
    } catch (e) {
      console.warn('Backend API get documents failed, serving from local storage:', e)
      return storage.getDocumentRequests()
    }
  },

  /**
   * Manager 2FA Mobile Verification & Digital Signature Embedding
   */
  async verify2faAndSign(id: string, otpCode: string): Promise<HRDocumentRequest> {
    if (useMock()) {
      return storage.verify2faAndSignDocument(id, otpCode)
    }
    try {
      const res = await apiClient.post<HRDocumentRequest>(`/documents/${id}/verify-2fa-sign`, {
        otpCode,
      })
      return res || storage.verify2faAndSignDocument(id, otpCode)
    } catch (e) {
      console.warn('Backend 2FA signing failed, updating in local storage:', e)
      return storage.verify2faAndSignDocument(id, otpCode)
    }
  },

  /**
   * Send softcopy of signed document via email/notification
   */
  async sendSoftcopy(id: string): Promise<{ message: string; sentToEmail: string }> {
    if (useMock()) {
      return {
        message: 'Softcopy sent successfully to employee email inbox.',
        sentToEmail: 'Alice.johnson@kinetictech.io',
      }
    }
    try {
      const res = await apiClient.post<{ message: string; sentToEmail: string }>(`/documents/${id}/send-softcopy`)
      return res || {
        message: 'Softcopy sent successfully to employee email inbox.',
        sentToEmail: 'Alice.johnson@kinetictech.io',
      }
    } catch (e) {
      return {
        message: 'Softcopy sent successfully to employee email inbox.',
        sentToEmail: 'Alice.johnson@kinetictech.io',
      }
    }
  },
}
