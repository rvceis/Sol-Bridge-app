/**
 * Solar Energy Sharing Platform - API Client
 * Axios-based HTTP client with interceptors for auth and error handling
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getItem, setItem, deleteItem } from '../utils/storage';
import { API_BASE_URL, API_TIMEOUT, STORAGE_KEYS, HTTP_STATUS } from './config';
import { ApiError, ApiResponse } from '../types';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

// Process failed request queue
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getItem(STORAGE_KEYS.ACCESS_TOKEN);
      console.log('[Client] Request to:', config.url);
      console.log('[Client] Auth token available:', !!token);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[Client] Added Authorization header');
      }
    } catch (error) {
      console.warn('Error reading token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Return successful response data directly
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const url = originalRequest.url || '';

    console.log('[Client] Response error:', error.response?.status, 'URL:', url);

    // Don't retry auth endpoints (login, register, etc)
    const isAuthEndpoint = url.includes('/auth/login') || 
                           url.includes('/auth/register') ||
                           url.includes('/auth/refresh-token');

    console.log('[Client] Is auth endpoint:', isAuthEndpoint);
    console.log('[Client] Status:', error.response?.status, 'Retry:', originalRequest._retry);

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && 
        !originalRequest._retry && 
        !isAuthEndpoint) {
      console.log('[Client] Starting token refresh...');
      if (isRefreshing) {
        // Wait for token refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            },
            reject: (err: Error) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getItem(STORAGE_KEYS.REFRESH_TOKEN);
        console.log('[Client] Token refresh attempt, refreshToken available:', !!refreshToken);

        if (!refreshToken) {
          console.error('[Client] CRITICAL: No refresh token available!');
          throw new Error('No refresh token available');
        }

        console.log('[Client] Calling refresh token endpoint...');
        // Call refresh token endpoint
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        console.log('[Client] Token refresh successful');

        // Store new tokens
        await setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        await setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
        console.log('[Client] New tokens stored');

        // Process queued requests
        processQueue(null, accessToken);

        // Retry original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('[Client] Token refresh failed:', refreshError);
        // Refresh failed - logout user
        processQueue(refreshError as Error, null);
        await deleteItem(STORAGE_KEYS.ACCESS_TOKEN);
        await deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
        await deleteItem(STORAGE_KEYS.USER_DATA);

        // Emit logout event (to be handled by auth store)
        // This will be connected to the store later

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Format error response
    const formattedError: ApiError = {
      success: false,
      statusCode: error.response?.status || 500,
      error: error.response?.data?.error || 'NetworkError',
      message: error.response?.data?.message || getErrorMessage(error),
      details: error.response?.data?.details,
      timestamp: new Date().toISOString(),
    };

    return Promise.reject(formattedError);
  }
);

// Get user-friendly error message
function getErrorMessage(error: AxiosError): string {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. Please check your connection.';
    }
    return 'Network error. Please check your internet connection.';
  }

  switch (error.response.status) {
    case HTTP_STATUS.BAD_REQUEST:
      return 'Invalid request. Please check your input.';
    case HTTP_STATUS.UNAUTHORIZED:
      return 'Session expired. Please login again.';
    case HTTP_STATUS.FORBIDDEN:
      return 'Access denied.';
    case HTTP_STATUS.NOT_FOUND:
      return 'Resource not found.';
    case HTTP_STATUS.CONFLICT:
      return 'Resource already exists.';
    case HTTP_STATUS.RATE_LIMITED:
      return 'Too many requests. Please wait a moment.';
    case HTTP_STATUS.SERVER_ERROR:
    default:
      return 'Something went wrong. Please try again.';
  }
}

// Helper function to make typed requests
export async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  data?: object,
  config?: object
): Promise<ApiResponse<T>> {
  const response = await apiClient.request<ApiResponse<T>>({
    method,
    url,
    data,
    ...config,
  });
  return response.data;
}

// Convenience methods
export const api = {
  get: <T>(url: string, config?: object) => request<T>('GET', url, undefined, config),
  post: <T>(url: string, data?: object, config?: object) => request<T>('POST', url, data, config),
  put: <T>(url: string, data?: object, config?: object) => request<T>('PUT', url, data, config),
  patch: <T>(url: string, data?: object, config?: object) => request<T>('PATCH', url, data, config),
  delete: <T>(url: string, config?: object) => request<T>('DELETE', url, undefined, config),
};

export default apiClient;
