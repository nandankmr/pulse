// src/utils/storage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AUTH_TOKEN: '@pulse/auth_token',
  USER_DATA: '@pulse/user_data',
};

/**
 * Save auth token to storage
 */
export const saveAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error('Error saving auth token:', error);
    throw error;
  }
};

/**
 * Get auth token from storage
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Remove auth token from storage
 */
export const removeAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error removing auth token:', error);
    throw error;
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
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
    ]);
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};
