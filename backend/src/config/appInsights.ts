/**
 * Azure Application Insights & Monitor Module
 * APM Real-Time Telemetry & Failover Tracing
 */

export function isAppInsightsConfigured(): boolean {
  return !!(
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ||
    process.env.APPINSIGHTS_INSTRUMENTATIONKEY
  )
}

/**
 * Tracks custom APM events and logs double-way resilience indicators
 */
export function trackTelemetryEvent(
  _eventName: string,
  _properties?: Record<string, string>,
  _metrics?: Record<string, number>
): void {
  // No-op stub until @azure/monitor-opentelemetry or applicationinsights SDK is wired.
}
