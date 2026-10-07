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
    return (import.meta.env.VITE_API_BASE_URL || 'http://localhost:7072/api').replace(/\/$/, '')
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
