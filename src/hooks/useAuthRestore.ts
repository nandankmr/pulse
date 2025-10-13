// src/hooks/useAuthRestore.ts

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setAuth, setLoading } from '../store/authSlice';
import { getAuthToken, getUserData } from '../utils/storage';

/**
 * Hook to restore auth state from AsyncStorage on app startup
 */
export const useAuthRestore = () => {
  const dispatch = useDispatch();
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const restoreAuth = async () => {
      try {
        dispatch(setLoading(true));

        const [token, user] = await Promise.all([
          getAuthToken(),
          getUserData(),
        ]);

        if (token && user) {
          dispatch(setAuth({ token, user }));
        }
      } catch (error) {
        console.error('Failed to restore auth state:', error);
      } finally {
        dispatch(setLoading(false));
        setIsRestoring(false);
      }
    };

    restoreAuth();
  }, [dispatch]);

  return { isRestoring };
};
