// src/api/auth.ts

import apiClient from './client';
import { User } from '../store/authSlice';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

/**
 * Login user with email and password
 */
export const loginAPI = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', data);
  return response.data;
};

/**
 * Register new user
 */
export const registerAPI = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/register', data);
  return response.data;
};

/**
 * Verify email with OTP code
 */
export const verifyEmailOtpAPI = async (
  data: VerifyOtpRequest
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/verify-otp', data);
  return response.data;
};

/**
 * Resend email verification OTP
 */
export const resendVerificationOtpAPI = async (
  data: ResendVerificationRequest
): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(
    '/auth/resend-otp',
    data
  );
  return response.data;
};

/**
 * Logout user (if backend requires notification)
 */
export const logoutAPI = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};
