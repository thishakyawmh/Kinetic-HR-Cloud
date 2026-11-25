import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { authenticateRequest } from '../middleware/auth'
import { callAzureOpenAIChat, checkAzureOpenAIHealth, getOpenAIConfig } from '../config/openai'
import {
  buildPlatformGroundingContext,
  retrievePolicyContext,
  buildExecutiveSystemPrompt,
} from '../services/ragService'

const MAX_MESSAGE_LENGTH = 4000

function parseEndpointHost(endpoint: string): string | null {
  if (!endpoint) return null
  try {
    return new URL(endpoint.replace('/openai/v1', '')).hostname
  } catch {
    return null
  }
}

/**
 * POST /api/ai/chat
 * Live natural language chat completions powered by Azure OpenAI GPT-4o
 */
export async function handleAIChat(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request)
  if (auth.errorResponse) return auth.errorResponse

  try {
    const body = (await request.json().catch(() => null)) as any
    if (!body || typeof body !== 'object') {
      return { status: 400, jsonBody: { error: 'Invalid JSON request body.' } }
    }

    const rawMessage = body.message ?? body.prompt
    const message = typeof rawMessage === 'string' ? rawMessage.trim() : ''
    if (!message) {
      return { status: 400, jsonBody: { error: 'Message content is required.' } }
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return { status: 400, jsonBody: { error: `Message exceeds ${MAX_MESSAGE_LENGTH} character limit.` } }
    }

    const history = Array.isArray(body.history) ? body.history : []
    const tenantId = auth.user!.tenantId

    const [platformDataGrounding, { searchGrounding, retrievedDocs }] = await Promise.all([
      buildPlatformGroundingContext(tenantId, auth.user!),
      retrievePolicyContext(message, tenantId),
    ])

    const systemPrompt = buildExecutiveSystemPrompt(auth.user!, platformDataGrounding, searchGrounding)

    const openAiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.slice(-6).map((h: any) => ({
        role: (h?.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: String(h?.content || '').slice(0, MAX_MESSAGE_LENGTH),
      })),
      { role: 'user' as const, content: message },
    ]

    const result = await callAzureOpenAIChat(openAiMessages, {
      maxTokens: 800,
      temperature: 0.5,
    })

    return {
      status: 200,
      jsonBody: {
        reply: result.content,
        model: result.model,
        usage: result.usage,
        searchRetrievedCount: retrievedDocs.length,
        retrievedPolicies: retrievedDocs.map(d => ({ id: d.id, title: d.title, score: d.score })),
        timestamp: new Date().toISOString(),
      },
    }
  } catch (err: any) {
    return {
      status: 500,
      jsonBody: {
        error: err.message,
        fallbackMessage: 'Kinetic AI encountered an error processing with live model.',
      },
    }
  }
}

/**
 * GET /api/ai/health
 * Returns live Azure OpenAI service connection diagnostic
 */
export async function getAIHealth(
  _request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const config = getOpenAIConfig()
  const health = await checkAzureOpenAIHealth()

  return {
    status: health.connected ? 200 : 503,
    jsonBody: {
      ...health,
      endpointConfigured: config.isConfigured,
      endpointHost: parseEndpointHost(config.endpoint),
      deployment: config.deployment,
    },
  }
}
