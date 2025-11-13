/**
 * API Client for making authenticated requests to the backend
 * Automatically includes the API key from localStorage in all requests
 */

const API_KEY_STORAGE_KEY = 'api_key';

/**
 * Get the stored API key from localStorage
 */
export function getApiKey(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }
    return localStorage.getItem(API_KEY_STORAGE_KEY);
}

/**
 * Store the API key in localStorage
 */
export function setApiKey(apiKey: string): void {
    if (typeof window === 'undefined') {
        return;
    }
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
}

/**
 * Remove the API key from localStorage
 */
export function clearApiKey(): void {
    if (typeof window === 'undefined') {
        return;
    }
    localStorage.removeItem(API_KEY_STORAGE_KEY);
}

interface ApiClientOptions extends RequestInit {
    headers?: HeadersInit;
}

/**
 * Enhanced fetch function that automatically includes the API key
 */
export async function apiClient(
    url: string,
    options: ApiClientOptions = {}
): Promise<Response> {
    const apiKey = getApiKey();

    // Prepare headers
    const headers = new Headers(options.headers);

    // Add API key to headers if available
    if (apiKey) {
        headers.set('Authorization', `Bearer ${apiKey}`);
        // Alternative header formats (uncomment the one your backend uses):
        // headers.set('X-API-Key', apiKey);
        // headers.set('api-key', apiKey);
    }

    // Add default content-type if not specified
    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    // Make the request
    const response = await fetch(url, {
        ...options,
        headers,
    });

    // Handle unauthorized responses (401) by clearing the API key
    if (response.status === 401) {
        clearApiKey();
        // You can also trigger a redirect to login here if needed
        // window.location.href = '/login';
    }

    return response;
}

/**
 * Convenience method for GET requests
 */
export async function get<T = any>(url: string, options?: ApiClientOptions): Promise<T> {
    const response = await apiClient(url, {
        ...options,
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error(`GET request failed: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Convenience method for POST requests
 */
export async function post<T = any>(
    url: string,
    data?: any,
    options?: ApiClientOptions
): Promise<T> {
    const response = await apiClient(url, {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
        throw new Error(`POST request failed: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Convenience method for PUT requests
 */
export async function put<T = any>(
    url: string,
    data?: any,
    options?: ApiClientOptions
): Promise<T> {
    const response = await apiClient(url, {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
        throw new Error(`PUT request failed: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Convenience method for PATCH requests
 */
export async function patch<T = any>(
    url: string,
    data?: any,
    options?: ApiClientOptions
): Promise<T> {
    const response = await apiClient(url, {
        ...options,
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
        throw new Error(`PATCH request failed: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Convenience method for DELETE requests
 */
export async function del<T = any>(url: string, options?: ApiClientOptions): Promise<T> {
    const response = await apiClient(url, {
        ...options,
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error(`DELETE request failed: ${response.statusText}`);
    }

    return response.json();
}

// Export as default object for easier imports
export default {
    get,
    post,
    put,
    patch,
    delete: del,
    apiClient,
    getApiKey,
    setApiKey,
    clearApiKey,
};
