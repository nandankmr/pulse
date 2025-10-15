// src/api/auth.ts

import apiClient from './client';
import { User } from '../store/authSlice';
import { getDeviceInfo } from '../utils/deviceInfo';

// Request types
export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
  platform?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
  platform?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
  deviceId?: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface LogoutRequest {
  refreshToken: string;
  deviceId: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Response types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  deviceId: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface VerifyEmailResponse {
  user: User;
}

/**
 * Login user with email and password
 */
export const loginAPI = async (data: LoginRequest): Promise<AuthResponse> => {
  const deviceInfo = await getDeviceInfo();
  const requestData = {
    ...data,
    deviceId: data.deviceId || deviceInfo.deviceId,
    deviceName: data.deviceName || deviceInfo.deviceName,
    platform: data.platform || deviceInfo.platform,
  };
  
  const response = await apiClient.post<AuthResponse>('/auth/login', requestData);
  return response.data;
};

/**
 * Register new user
 */
export const registerAPI = async (data: RegisterRequest): Promise<AuthResponse> => {
  const deviceInfo = await getDeviceInfo();
  const requestData = {
    ...data,
    deviceId: data.deviceId || deviceInfo.deviceId,
    deviceName: data.deviceName || deviceInfo.deviceName,
    platform: data.platform || deviceInfo.platform,
  };
  
  const response = await apiClient.post<AuthResponse>('/auth/register', requestData);
  return response.data;
};

/**
 * Refresh access token using refresh token
 */
export const refreshTokenAPI = async (
  data: RefreshTokenRequest
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/refresh', data);
  return response.data;
};

/**
 * Verify email with OTP code
 */
export const verifyEmailAPI = async (
  data: VerifyEmailRequest
): Promise<VerifyEmailResponse> => {
  const response = await apiClient.post<VerifyEmailResponse>('/auth/verify-email', data);
  return response.data;
};

/**
 * Resend email verification OTP
 */
export const resendVerificationAPI = async (
  data: ResendVerificationRequest
): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(
    '/auth/resend-verification',
    data
  );
  return response.data;
};

/**
 * Logout user and revoke refresh token on server
 */
export const logoutAPI = async (data: LogoutRequest): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/auth/logout', data);
  return response.data;
};

/**
 * Request password reset OTP
 */
export const forgotPasswordAPI = async (
  data: ForgotPasswordRequest
): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(
    '/auth/forgot-password',
    data
  );
  return response.data;
};

/**
 * Reset password using OTP
 */
export const resetPasswordAPI = async (
  data: ResetPasswordRequest
): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(
    '/auth/reset-password',
    data
  );
  return response.data;
};

/**
 * Change password for authenticated user
 */
export const changePasswordAPI = async (
  data: ChangePasswordRequest
): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(
    '/auth/change-password',
    data
  );
  return response.data;
};
