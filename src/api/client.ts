// src/api/client.ts

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import Config from 'react-native-config';
import { store } from '../store';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: Config.API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      if (status === 401) {
        // Unauthorized - clear auth state
        // You can dispatch logout action here if needed
        console.error('Unauthorized - token may be invalid');
      }

      // Return formatted error
      return Promise.reject({
        message: (data as any)?.message || 'An error occurred',
        status,
        data,
      });
    } else if (error.request) {
      // Request made but no response
      return Promise.reject({
        message: 'Network error - please check your connection',
      });
    } else {
      // Something else happened
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
      });
    }
  }
);

export default apiClient;
