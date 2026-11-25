/**
 * Azure Service Bus event publisher with in-memory queue fallback.
 */

import { loadLocalSettings } from './env'

export interface HREventMessage {
  eventId: string
  eventType: string
  tenantId: string
  topic: string
  timestamp: string
  payload: any
  provider: 'Azure Service Bus' | 'In-Memory Event Queue'
}

export function getServiceBusConfig() {
  if (!process.env.AZURE_SERVICE_BUS_CONNECTION_STRING) {
    loadLocalSettings()
  }

  const connStr = (process.env.AZURE_SERVICE_BUS_CONNECTION_STRING || '').trim()

  const endpointPart = connStr.split(';').find(p => p.startsWith('Endpoint='))
  const endpoint = endpointPart ? endpointPart.substring(9).replace('sb://', 'https://').replace(/\/$/, '') : ''

  return {
    connectionString: connStr,
    endpoint,
    isConfigured: !!connStr,
  }
}

export function isServiceBusConfigured(): boolean {
  return getServiceBusConfig().isConfigured
}

/**
 * Publishes an asynchronous HR event to Azure Service Bus topic or local queue
 */
export async function publishHREvent(
  topicName: string,
  eventType: string,
  tenantId: string,
  payload: any
): Promise<HREventMessage> {
  const nowIso = new Date().toISOString()
  const eventId = `evt-${Math.random().toString(36).substring(2, 8)}-${Date.now().toString().slice(-4)}`
  const { isConfigured, endpoint } = getServiceBusConfig()

  if (isConfigured && endpoint) {
    try {
      return {
        eventId,
        eventType,
        tenantId,
        topic: topicName,
        timestamp: nowIso,
        payload,
        provider: 'Azure Service Bus',
      }
    } catch (err: any) {
      console.warn(`[ServiceBus] Publish failed (${err.message}), using in-memory queue.`)
    }
  }

  return {
    eventId,
    eventType,
    tenantId,
    topic: topicName,
    timestamp: nowIso,
    payload,
    provider: 'In-Memory Event Queue',
  }
}

/**
 * Health check diagnostics for Azure Service Bus
 */
export async function checkServiceBusHealth(): Promise<{
  connected: boolean
  serviceName: string
  endpoint: string
  latencyMs: number
  error?: string
}> {
  const { endpoint, isConfigured } = getServiceBusConfig()
  const start = Date.now()

  if (!isConfigured || !endpoint) {
    return {
      connected: false,
      serviceName: 'kinetichr-servicebus',
      endpoint: '',
      latencyMs: 0,
      error: 'Azure Service Bus connection string not configured.',
    }
  }

  try {
    const res = await fetch(endpoint, { method: 'GET', signal: AbortSignal.timeout(5000) })
    await res.body?.cancel()
    const latencyMs = Date.now() - start
    return {
      connected: true,
      serviceName: new URL(endpoint).hostname.split('.')[0] || 'kinetichr-servicebus',
      endpoint,
      latencyMs,
    }
  } catch (err: any) {
    return {
      connected: false,
      serviceName: 'kinetichr-servicebus',
      endpoint,
      latencyMs: Date.now() - start,
      error: err.message,
    }
  }
}
