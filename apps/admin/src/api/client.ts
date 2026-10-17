/**
 * Admin API HTTP Client
 * Handles authentication tokens, headers, error wrapping, and JSON serialization
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code = 'API_ERROR', status = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...customConfig } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const token = localStorage.getItem('shashka_admin_token');

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      // Unauthorized: clear token and optionally notify auth store
      localStorage.removeItem('shashka_admin_token');
      localStorage.removeItem('shashka_admin_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login';
      }
      throw new ApiError('Sessiya muddati tugadi. Iltimos qaytadan kiring.', 'UNAUTHORIZED', 401);
    }

    if (!response.ok) {
      let errorMessage = `Server xatosi: ${response.status} ${response.statusText}`;
      let errorCode = 'HTTP_ERROR';
      let errorDetails: unknown = undefined;

      try {
        const errorJson = await response.json();
        if (errorJson.error) {
          errorMessage = errorJson.error.message || errorMessage;
          errorCode = errorJson.error.code || errorCode;
          errorDetails = errorJson.error.details;
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        // Not a JSON response
      }

      throw new ApiError(errorMessage, errorCode, response.status, errorDetails);
    }

    // Parse JSON
    if (response.status === 204) {
      return {} as T;
    }

    const json = await response.json();
    // Support { success: true, data: T } pattern
    if (json && typeof json === 'object' && 'data' in json && 'success' in json) {
      return json.data as T;
    }
    return json as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Tarmoq xatosi roʻy berdi';
    throw new ApiError(message, 'NETWORK_ERROR', 0);
  }
}

export const apiClient = {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>) =>
    request<T>(endpoint, { method: 'GET', params }),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    }),
};
