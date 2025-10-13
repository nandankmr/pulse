// src/store/authMiddleware.ts

import { Middleware, AnyAction } from '@reduxjs/toolkit';
import { saveAuthToken, saveUserData, clearAllData } from '../utils/storage';

/**
 * Middleware to persist auth state to AsyncStorage
 */
export const authPersistenceMiddleware: Middleware =
  (store) => (next) => (action: AnyAction) => {
    const result = next(action);

    // Listen for auth actions and persist to storage
    if (action.type?.startsWith('auth/')) {
      const state = store.getState();
      const { auth } = state;

      if (action.type === 'auth/setAuth') {
        // Save token and user data when user logs in
        if (auth.token && auth.user) {
          saveAuthToken(auth.token).catch(console.error);
          saveUserData(auth.user).catch(console.error);
        }
      } else if (action.type === 'auth/updateUser') {
        // Update user data when profile is updated
        if (auth.user) {
          saveUserData(auth.user).catch(console.error);
        }
      } else if (action.type === 'auth/logout') {
        // Clear all data on logout
        clearAllData().catch(console.error);
      }
    }

    return result;
  };
