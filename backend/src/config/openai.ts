/**
 * Azure OpenAI & Azure AI Foundry Unified Client
 * Supports both direct Azure OpenAI service endpoints and Azure AI Foundry project endpoints.
 */

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  temperature?: number
  maxTokens?: number
  responseFormatJson?: boolean
}

export interface ChatCompletionResult {
  content: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export function getOpenAIConfig() {
  const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || '').trim().replace(/\/$/, '')
  const key = (process.env.AZURE_OPENAI_KEY || process.env.OPENAI_API_KEY || '').trim()
  const deployment = (process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-1').trim()

  return {
    endpoint,
    key,
    deployment,
    isConfigured: !!(endpoint && key),
  }
}

/**
 * Resolves the chat completions URL depending on whether the endpoint is:
 * 1) Azure AI Foundry project (contains `/openai/v1` or `.services.ai.azure.com`)
 * 2) Standard Azure OpenAI (contains `.openai.azure.com`)
 */
export function getChatCompletionsUrl(): string {
  const { endpoint, deployment } = getOpenAIConfig()
  if (!endpoint) return ''

  if (endpoint.includes('/openai/v1')) {
    return `${endpoint}/chat/completions`
  }

  if (endpoint.includes('.services.ai.azure.com')) {
    const base = endpoint.replace(/\/responses$/, '').replace(/\/chat\/completions$/, '')
    return base.endsWith('/openai/v1') ? `${base}/chat/completions` : `${base}/openai/v1/chat/completions`
  }

  // Standard Azure OpenAI resource
  return `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-08-01-preview`
}

/**
 * Executes a chat completion against the configured live Azure OpenAI / AI Foundry deployment.
 */
export async function callAzureOpenAIChat(
  messages: OpenAIMessage[],
  options: ChatCompletionOptions = {}
): Promise<ChatCompletionResult> {
  const { key, deployment, isConfigured } = getOpenAIConfig()
  if (!isConfigured) {
    throw new Error('Azure OpenAI is not configured. Missing AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_KEY.')
  }

  const url = getChatCompletionsUrl()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'api-key': key,
    'Authorization': `Bearer ${key}`,
  }

  const payload: any = {
    model: deployment,
    messages,
    temperature: options.temperature !== undefined ? options.temperature : 0.7,
    max_tokens: options.maxTokens || 800,
  }

  if (options.responseFormatJson) {
    payload.response_format = { type: 'json_object' }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Azure OpenAI call failed with status ${res.status}: ${errorText}`)
  }

  const data = (await res.json()) as any
  const content = data.choices?.[0]?.message?.content || ''
  const usage = data.usage
    ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      }
    : undefined

  return {
    content,
    model: data.model || deployment,
    usage,
  }
}

/**
 * Health check ping to verify model connectivity and latency
 */
export async function checkAzureOpenAIHealth(): Promise<{
  connected: boolean
  model: string
  latencyMs: number
  error?: string
}> {
  const startTime = Date.now()
  try {
    const result = await callAzureOpenAIChat(
      [{ role: 'user', content: 'Respond with the word "OK"' }],
      { maxTokens: 5, temperature: 0 }
    )
    return {
      connected: true,
      model: result.model,
      latencyMs: Date.now() - startTime,
    }
  } catch (err: any) {
    return {
      connected: false,
      model: getOpenAIConfig().deployment,
      latencyMs: Date.now() - startTime,
      error: err.message,
    }
  }
}
