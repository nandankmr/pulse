// src/hooks/useAuth.ts

import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import {
  loginAPI,
  registerAPI,
  verifyEmailAPI,
  logoutAPI,
  resendVerificationAPI,
  forgotPasswordAPI,
  resetPasswordAPI,
  changePasswordAPI,
  LoginRequest,
  RegisterRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  LogoutRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
} from '../api/auth';
import { setAuth, logout as logoutAction, updateUser } from '../store/authSlice';
import { saveAuthTokens, saveUserData, clearAllData } from '../utils/storage';
import { socketManager } from '../utils/socketManager';

/**
 * Hook for user login
 */
export const useLogin = () => {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (data: LoginRequest) => loginAPI(data),
    onSuccess: async (response) => {
      const { user, tokens } = response;

      // Save to Redux store
      dispatch(
        setAuth({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          deviceId: tokens.deviceId,
        })
      );

      // Save to AsyncStorage
      await saveAuthTokens(
        tokens.accessToken,
        tokens.refreshToken,
        tokens.deviceId
      );
      await saveUserData(user);
    },
  });
};

/**
 * Hook for user registration
 * Note: Does NOT set auth state - user must verify email first
 */
export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterRequest) => registerAPI(data),
    onSuccess: async () => {
      // Registration successful, but don't authenticate yet
      // User needs to verify email first
      // Navigation to EmailVerification screen is handled in RegisterScreen
      console.log('Registration successful, awaiting email verification');
    },
  });
};

/**
 * Hook for email verification
 */
export const useVerifyEmail = () => {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (data: VerifyEmailRequest) => verifyEmailAPI(data),
    onSuccess: async (response) => {
      const { user } = response;

      // Update user in Redux store
      dispatch(updateUser(user));

      // Update user in AsyncStorage
      await saveUserData(user);
    },
  });
};

/**
 * Hook for resending email verification OTP
 */
export const useResendVerification = () => {
  return useMutation({
    mutationFn: (data: ResendVerificationRequest) => resendVerificationAPI(data),
  });
};

/**
 * Hook for user logout
 */
export const useLogout = () => {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (data: LogoutRequest) => logoutAPI(data),
    onSuccess: async () => {
      // Disconnect socket connection before clearing auth state
      socketManager.disconnect();

      // Clear Redux store
      dispatch(logoutAction());

      // Clear AsyncStorage
      await clearAllData();
    },
  });
};

/**
 * Hook for forgot password (request OTP)
 */
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => forgotPasswordAPI(data),
  });
};

/**
 * Hook for reset password (with OTP)
 */
export const useResetPassword = () => {
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => resetPasswordAPI(data),
  });
};

/**
 * Hook for change password (authenticated user)
 */
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => changePasswordAPI(data),
  });
};
