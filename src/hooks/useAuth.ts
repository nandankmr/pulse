// src/hooks/useAuth.ts

import { useMutation } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
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
  AuthResponse,
  VerifyEmailResponse,
} from '../api/auth';
import config from '../config';
import {
  setAuth,
  logout as logoutAction,
  updateUser,
  setProvider,
  User,
} from '../store/authSlice';
import {
  saveAuthTokens,
  saveUserData,
  clearAllData,
  saveAuthProvider,
} from '../utils/storage';
import { socketManager } from '../utils/socketManager';
import { RootState } from '../store';
import {
  firebaseSignIn,
  firebaseRegister,
  firebaseLogout,
  firebaseSendEmailVerification,
  firebaseSendPasswordResetEmail,
  firebaseConfirmPasswordReset,
  firebaseChangePassword,
  firebaseReloadUser,
} from '../services/firebaseAuth';
import { ApiError } from '../types/api';

const isFirebaseAuthEnabled = config.USE_FIREBASE_AUTH;

const DEFAULT_LOGIN_ERROR_MESSAGE = 'Incorrect email or password. Please try again.';

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': DEFAULT_LOGIN_ERROR_MESSAGE,
  'auth/invalid-email': 'The email address appears to be invalid. Please check and try again.',
  'auth/user-not-found': 'No account was found for that email address.',
  'auth/wrong-password': DEFAULT_LOGIN_ERROR_MESSAGE,
  'auth/user-disabled': 'This account has been disabled. Please contact support for help.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
};

function formatLoginErrorMessage(code?: string | null, rawMessage?: string): string {
  if (code && LOGIN_ERROR_MESSAGES[code]) {
    return LOGIN_ERROR_MESSAGES[code];
  }

  if (rawMessage) {
    const extractedCode = rawMessage.match(/\[([^\]]+)\]/)?.[1];
    if (extractedCode && LOGIN_ERROR_MESSAGES[extractedCode]) {
      return LOGIN_ERROR_MESSAGES[extractedCode];
    }

    const cleaned = rawMessage.replace(/\[[^\]]*\]\s*/g, '').trim();
    if (cleaned) {
      return cleaned;
    }
  }

  return DEFAULT_LOGIN_ERROR_MESSAGE;
}

/**
 * Hook for user login
 */
export const useLogin = () => {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async (data: LoginRequest): Promise<AuthResponse> => {
      if (isFirebaseAuthEnabled) {
        if (!data.password) {
          throw new Error('Password is required to sign in.');
        }

        let response: AuthResponse;

        try {
          response = await firebaseSignIn(data.email, data.password);
        } catch (error) {
          const firebaseError = error as { code?: string; message?: string } | null;
          const message = formatLoginErrorMessage(firebaseError?.code ?? null, firebaseError?.message);
          throw new Error(message);
        }

        if (!response.user.verified) {
          await firebaseLogout();
          throw new Error('Email not verified. Please verify your email before logging in.');
        }

        return response;
      }

      try {
        return await loginAPI(data);
      } catch (error) {
        if (error && typeof error === 'object') {
          const apiError = error as ApiError & { code?: string };
          const message = formatLoginErrorMessage(apiError?.errorCode ?? apiError?.code ?? null, apiError?.message);
          const err = new Error(message) as Error & { cause?: unknown; original?: ApiError };
          err.cause = error;
          err.original = apiError;
          throw err;
        }

        throw error;
      }
    },
    onSuccess: async (response) => {
      const { user, tokens } = response;

      // Save to Redux store
      dispatch(
        setAuth({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          deviceId: tokens.deviceId,
          provider: isFirebaseAuthEnabled ? 'firebase' : 'legacy',
        })
      );

      // Save to AsyncStorage
      if (!isFirebaseAuthEnabled) {
        await saveAuthTokens(
          tokens.accessToken,
          tokens.refreshToken,
          tokens.deviceId
        );
      }
      await saveAuthProvider(isFirebaseAuthEnabled ? 'firebase' : 'legacy');
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
    mutationFn: async (data: RegisterRequest) => {
      if (isFirebaseAuthEnabled) {
        await firebaseRegister(data.name, data.email, data.password);
        return;
      }

      return registerAPI(data);
    },
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

  return useMutation<User | VerifyEmailResponse | null, Error, VerifyEmailRequest>({
    mutationFn: async (data: VerifyEmailRequest) => {
      if (isFirebaseAuthEnabled) {
        return firebaseReloadUser();
      }
      return verifyEmailAPI(data);
    },
    onSuccess: async (response) => {
      if (isFirebaseAuthEnabled) {
        if (response) {
          const firebaseUser = response as User;
          dispatch(updateUser(firebaseUser));
          await saveUserData(firebaseUser);
        }
        return;
      }

      const verifyResponse = response as VerifyEmailResponse;
      const { user } = verifyResponse;

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
    mutationFn: async (data: ResendVerificationRequest) => {
      if (isFirebaseAuthEnabled) {
        await firebaseSendEmailVerification();
        return { message: 'Verification email sent' };
      }

      return resendVerificationAPI(data);
    },
  });
};

/**
 * Hook for user logout
 */
export const useLogout = () => {
  const dispatch = useDispatch();
  const provider = useSelector((state: RootState) => state.auth.provider);

  return useMutation({
    mutationFn: async (data?: LogoutRequest) => {
      if (provider === 'firebase') {
        await firebaseLogout();
        return { message: 'Logged out' };
      }

      if (!data) {
        throw new Error('Logout payload is required for legacy authentication.');
      }

      return logoutAPI(data);
    },
    onSuccess: async () => {
      // Disconnect socket connection before clearing auth state
      socketManager.disconnect();

      // Clear Redux store
      dispatch(logoutAction());
      dispatch(setProvider(isFirebaseAuthEnabled ? 'firebase' : 'legacy'));

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
    mutationFn: async (data: ForgotPasswordRequest) => {
      if (isFirebaseAuthEnabled) {
        await firebaseSendPasswordResetEmail(data.email);
        return;
      }

      return forgotPasswordAPI(data);
    },
  });
};

/**
 * Hook for reset password (with OTP)
 */
export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (data: ResetPasswordRequest) => {
      if (isFirebaseAuthEnabled) {
        await firebaseConfirmPasswordReset(data.otp, data.newPassword);
        return;
      }

      return resetPasswordAPI(data);
    },
  });
};

/**
 * Hook for change password (authenticated user)
 */
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      if (isFirebaseAuthEnabled) {
        await firebaseChangePassword(data.currentPassword, data.newPassword);
        return;
      }

      return changePasswordAPI(data);
    },
  });
};
