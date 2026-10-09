export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

class ApiClient {
  private get baseUrl(): string {
    const envUrl = import.meta.env.VITE_API_BASE_URL
    if (envUrl && !envUrl.includes('localhost')) {
      return envUrl.replace(/\/$/, '')
    }

    // Auto-detect production / Azure Static Web Apps hosting
    if (
      typeof window !== 'undefined' &&
      !window.location.hostname.includes('localhost') &&
      !window.location.hostname.includes('127.0.0.1')
    ) {
      return 'https://kinetichr-api-d0cwatbqbaafg9hh.southindia-01.azurewebsites.net/api'
    }

    return (envUrl || 'http://localhost:7071/api').replace(/\/$/, '')
  }

  private getAuthHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }

    try {
      const rawSession =
        sessionStorage.getItem('kinetic_auth_session') || localStorage.getItem('kinetic_auth_session')
      if (rawSession) {
        const session = JSON.parse(rawSession)
        if (session.token) {
          headers['Authorization'] = `Bearer ${session.token}`
        }
        if (session.tenant?.id) {
          headers['X-Tenant-Id'] = session.tenant.id
        }
      }
    } catch (e) {
      console.warn('Failed to parse auth session for API headers', e)
    }

    return headers
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers: customHeaders, ...restOptions } = options

    let url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString
      }
    }

    const headers = {
      ...this.getAuthHeaders(),
      ...(customHeaders as Record<string, string>),
    }

    try {
      const response = await fetch(url, {
        ...restOptions,
        headers,
      })

      if (response.status === 401) {
        if (import.meta.env.VITE_USE_MOCK_SERVICES !== 'false') {
          throw new ApiError(401, 'Backend API returned 401 in mock mode; falling back to local storage.')
        }
        // Token expired or invalid
        sessionStorage.removeItem('kinetic_auth_session')
        sessionStorage.setItem('kinetic_logged_out', 'true')
        localStorage.removeItem('kinetic_auth_session')
        localStorage.setItem('kinetic_logged_out', 'true')
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login'
        }
        throw new ApiError(401, 'Session expired. Please log in again.')
      }

      if (!response.ok) {
        let errorMsg = `API request failed with status ${response.status}`
        let errorDetails: any = null
        try {
          const errorJson = await response.json()
          errorMsg = errorJson.message || errorJson.error || errorMsg
          errorDetails = errorJson
        } catch {
          // not json
        }
        throw new ApiError(response.status, errorMsg, errorDetails)
      }

      // Check if 204 No Content
      if (response.status === 204) {
        return null as unknown as T
      }

      return (await response.json()) as T
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(500, error instanceof Error ? error.message : 'Network error')
    }
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  public post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    })
  }

  public put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    })
  }

  public patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    })
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()
