import type { ApiResponse } from '@shashka/shared-types';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://shashka-backend.onrender.com/api'
    : '/api');

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', status: number = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

let authToken: string | null = null;

export function setApiAuthToken(token: string | null): void {
  authToken = token;
  if (token) {
    localStorage.setItem('shashka_auth_token', token);
  } else {
    localStorage.removeItem('shashka_auth_token');
  }
}

export function getApiAuthToken(): string | null {
  if (!authToken && typeof window !== 'undefined') {
    authToken = localStorage.getItem('shashka_auth_token');
  }
  return authToken;
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getApiAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!response.ok) {
      if (isJson) {
        const errorData = (await response.json()) as ApiResponse;
        throw new ApiError(
          errorData.error?.message || `So'rovda xatolik yuz berdi (${response.status})`,
          errorData.error?.code || 'HTTP_ERROR',
          response.status,
          errorData.error?.details,
        );
      } else {
        const text = await response.text();
        throw new ApiError(text || `Server xatosi (${response.status})`, 'HTTP_ERROR', response.status);
      }
    }

    if (response.status === 204) {
      return {} as T;
    }

    if (isJson) {
      const result = (await response.json()) as ApiResponse<T>;
      if (result.success === false) {
        throw new ApiError(
          result.error?.message || 'Noma\'lum xatolik',
          result.error?.code || 'API_ERROR',
          response.status,
          result.error?.details,
        );
      }
      return (result.data !== undefined ? result.data : result) as T;
    }

    return (await response.text()) as unknown as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Server bilan bog\'lanishda xatolik',
      'NETWORK_ERROR',
      0,
    );
  }
}
