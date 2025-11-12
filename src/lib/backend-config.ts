/**
 * Backend API Configuration
 * 
 * Centralized configuration for connecting to the external FastAPI backend.
 * The backend runs as a separate service with its own deployment.
 */

export const BACKEND_CONFIG = {
  // Base URL for the FastAPI backend service
  baseUrl: process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080',
  
  // API version prefix
  apiVersion: '/api/v1',
  
  // Request timeout in milliseconds
  timeout: 30000,
  
  // Retry configuration
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
  },
} as const;

/**
 * Get the full API URL for a given endpoint
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = BACKEND_CONFIG.baseUrl.replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${BACKEND_CONFIG.apiVersion}${cleanEndpoint}`;
}

/**
 * Backend API client with error handling and retries
 */
export class BackendApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = BACKEND_CONFIG.baseUrl;
    this.timeout = BACKEND_CONFIG.timeout;
  }

  /**
   * Make a request to the backend API
   */
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = getApiUrl(endpoint);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new BackendApiError(
          error.detail || `Request failed with status ${response.status}`,
          response.status,
          error
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof BackendApiError) {
        throw error;
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new BackendApiError('Request timeout', 408);
      }
      
      throw new BackendApiError(
        'Network error or backend service unavailable',
        503,
        error
      );
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = params 
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    
    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any, params?: Record<string, string>): Promise<T> {
    const url = params 
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

/**
 * Custom error class for backend API errors
 */
export class BackendApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'BackendApiError';
  }
}

// Export a singleton instance
export const backendApi = new BackendApiClient();
