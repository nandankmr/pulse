// src/utils/storage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthResponse } from '../api/auth';

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@pulse/access_token',
  REFRESH_TOKEN: '@pulse/refresh_token',
  DEVICE_ID: '@pulse/device_id',
  USER_DATA: '@pulse/user_data',
  AUTH_PROVIDER: '@pulse/auth_provider',
  FIREBASE_SESSION: '@pulse/firebase_session',
};

/**
 * Save access token to storage
 */
export const saveAccessToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  } catch (error) {
    console.error('Error saving access token:', error);
    throw error;
  }
};

/**
 * Get access token from storage
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

/**
 * Save refresh token to storage
 */
export const saveRefreshToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  } catch (error) {
    console.error('Error saving refresh token:', error);
    throw error;
  }
};

/**
 * Get refresh token from storage
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

/**
 * Save device ID to storage
 */
export const saveDeviceId = async (deviceId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  } catch (error) {
    console.error('Error saving device ID:', error);
    throw error;
  }
};

/**
 * Get device ID from storage
 */
export const getDeviceId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  } catch (error) {
    console.error('Error getting device ID:', error);
    return null;
  }
};

/**
 * Save all auth tokens at once
 */
export const saveAuthTokens = async (
  accessToken: string,
  refreshToken: string,
  deviceId: string
): Promise<void> => {
  try {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.ACCESS_TOKEN, accessToken],
      [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
      [STORAGE_KEYS.DEVICE_ID, deviceId],
    ]);
  } catch (error) {
    console.error('Error saving auth tokens:', error);
    throw error;
  }
};

/**
 * Get all auth tokens at once
 */
export const getAuthTokens = async (): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  deviceId: string | null;
}> => {
  try {
    const values = await AsyncStorage.multiGet([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.DEVICE_ID,
    ]);
    
    return {
      accessToken: values[0][1],
      refreshToken: values[1][1],
      deviceId: values[2][1],
    };
  } catch (error) {
    console.error('Error getting auth tokens:', error);
    return {
      accessToken: null,
      refreshToken: null,
      deviceId: null,
    };
  }
};

/**
 * Save user data to storage
 */
export const saveUserData = async (userData: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

/**
 * Get user data from storage
 */
export const getUserData = async (): Promise<any | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Remove user data from storage
 */
export const removeUserData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    console.error('Error removing user data:', error);
    throw error;
  }
};

/**
 * Clear all app data from storage
 */
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.DEVICE_ID,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.AUTH_PROVIDER,
      STORAGE_KEYS.FIREBASE_SESSION,
    ]);
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};

// Legacy support - keep old function names for backward compatibility
export const saveAuthToken = saveAccessToken;
export const getAuthToken = getAccessToken;
export const removeAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.DEVICE_ID,
      STORAGE_KEYS.AUTH_PROVIDER,
      STORAGE_KEYS.FIREBASE_SESSION,
    ]);
  } catch (error) {
    console.error('Error removing auth tokens:', error);
    throw error;
  }
};

export const saveAuthProvider = async (
  provider: 'legacy' | 'firebase'
): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_PROVIDER, provider);
  } catch (error) {
    console.error('Error saving auth provider:', error);
    throw error;
  }
};

export const getAuthProvider = async (): Promise<'legacy' | 'firebase' | null> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_PROVIDER);
    if (value === 'legacy' || value === 'firebase') {
      return value;
    }
    return null;
  } catch (error) {
    console.error('Error getting auth provider:', error);
    return null;
  }
};

export type FirebaseSession = AuthResponse;

export const saveFirebaseSession = async (session: FirebaseSession): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.FIREBASE_SESSION, JSON.stringify(session));
  } catch (error) {
    console.error('Error saving firebase session:', error);
  }
};

export const getStoredFirebaseSession = async (): Promise<FirebaseSession | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FIREBASE_SESSION);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting firebase session:', error);
    return null;
  }
};

export const removeFirebaseSession = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.FIREBASE_SESSION);
  } catch (error) {
    console.error('Error removing firebase session:', error);
  }
};
