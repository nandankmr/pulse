// src/api/client.ts

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import config from '../config';
import { store } from '../store';
import { setTokens, logout } from '../store/authSlice';
import { saveAuthTokens, clearAllData } from '../utils/storage';
import { ApiError } from '../types/api';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: config.API_URL,
  timeout: config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple simultaneous refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor to add auth token and log requests
apiClient.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 🔵 TEMPORARY: Log all network requests
    // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    // console.log('📤 API REQUEST:', config.method?.toUpperCase(), config.url, config.baseURL);
    // console.log('Headers:', JSON.stringify(config.headers, null, 2));
    // if (config.data) {
    //   console.log('Body:', JSON.stringify(config.data, null, 2));
    // }
    // if (config.params) {
    //   console.log('Params:', JSON.stringify(config.params, null, 2));
    // }
    // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return config;
  },
  (error) => {
    console.error('❌ REQUEST ERROR:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // 🔵 TEMPORARY: Log all network responses
    // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    // console.log('📥 API RESPONSE:', response.status, response.config.method?.toUpperCase(), response.config.url);
    // console.log('Data:', JSON.stringify(response.data, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response) {
      const { status, data } = error.response;

      // Handle 401 Unauthorized - attempt token refresh
      if (status === 401 && originalRequest && !originalRequest._retry) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return apiClient(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const state = store.getState();
        const { refreshToken, deviceId } = state.auth;

        if (!refreshToken || !deviceId) {
          // No refresh token available, logout
          store.dispatch(logout());
          await clearAllData();
          processQueue(new Error('No refresh token available'), null);
          isRefreshing = false;
          return Promise.reject(error);
        }

        try {
          // Call refresh endpoint
          const response = await axios.post(
            `${config.API_URL}/auth/refresh`,
            {
              refreshToken,
              deviceId,
            }
          );

          const { tokens } = response.data;

          // Update tokens in store and storage
          store.dispatch(
            setTokens({
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              deviceId: tokens.deviceId,
            })
          );

          await saveAuthTokens(
            tokens.accessToken,
            tokens.refreshToken,
            tokens.deviceId
          );

          // Update authorization header
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;

          // Process queued requests
          processQueue(null, tokens.accessToken);
          isRefreshing = false;

          // Retry original request
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          processQueue(refreshError, null);
          isRefreshing = false;
          store.dispatch(logout());
          await clearAllData();
          return Promise.reject(refreshError);
        }
      }

      // 🔵 TEMPORARY: Log error responses
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ API ERROR RESPONSE:', status, originalRequest?.method?.toUpperCase(), originalRequest?.url);
      console.error('Error Data:', JSON.stringify(data, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Pass through backend error structure directly
      // Backend sends: { message, statusCode, errorCode, data? }
      // Sometimes it might send { error } instead of { message }
      const errorData = data as any;
      const apiError: ApiError = {
        message: errorData?.message || errorData?.error || 'An error occurred',
        statusCode: errorData?.statusCode || status,
        errorCode: errorData?.errorCode || 'UNKNOWN_ERROR',
        ...(errorData?.data && { data: errorData.data }), // Include validation data if present
      };
      
      console.log('🔴 Constructed ApiError:', apiError);
      return Promise.reject(apiError);
    } else if (error.request) {
      // Request made but no response
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ NETWORK ERROR: No response received');
      console.error('Request:', error.request);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const networkError: ApiError = {
        message: 'Network error - please check your connection',
        statusCode: 0,
        errorCode: 'NETWORK_ERROR',
      };
      return Promise.reject(networkError);
    } else {
      // Something else happened
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ UNEXPECTED ERROR:', error.message);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const unexpectedError: ApiError = {
        message: error.message || 'An unexpected error occurred',
        statusCode: 0,
        errorCode: 'UNEXPECTED_ERROR',
      };
      return Promise.reject(unexpectedError);
    }
  }
);

export default apiClient;
