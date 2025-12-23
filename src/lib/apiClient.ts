interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  type?: string
  code?: string
  timestamp?: string
}

interface RequestOptions extends RequestInit {
  timeout?: number
  retries?: number
}

class ApiClient {
  private baseURL: string
  private defaultTimeout: number

  constructor(baseURL: string = '', timeout: number = 10000) {
    this.baseURL = baseURL
    this.defaultTimeout = timeout
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { timeout = this.defaultTimeout, retries = 3, ...requestOptions } = options

    const url = `${this.baseURL}${endpoint}`
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        return { data }
      } catch (error) {
        if (attempt === retries) {
          return {
            error: error instanceof Error ? error.message : 'Unknown error',
            type: 'network',
            code: 'REQUEST_FAILED',
            timestamp: new Date().toISOString()
          }
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }

    return {
      error: 'Max retries exceeded',
      type: 'network',
      code: 'MAX_RETRIES_EXCEEDED',
      timestamp: new Date().toISOString()
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

// Create default instance
const apiClient = new ApiClient()

export default apiClient
export { ApiClient }
export type { ApiResponse, RequestOptions }