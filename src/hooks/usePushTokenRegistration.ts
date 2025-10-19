import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { registerPushToken, unregisterPushToken, setupTokenRefreshListener } from '../services/pushTokenService';
import type { RootState } from '../store';

export const usePushTokenRegistration = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const refreshUnsubscribeRef = useRef<(() => void) | null>(null);
  const previousAuthStateRef = useRef<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const cleanupListener = () => {
      if (refreshUnsubscribeRef.current) {
        refreshUnsubscribeRef.current();
        refreshUnsubscribeRef.current = null;
      }
    };

    const synchronizeToken = async () => {
      if (isAuthenticated) {
        await registerPushToken();
        if (!cancelled) {
          cleanupListener();
          refreshUnsubscribeRef.current = setupTokenRefreshListener();
        }
      } else if (previousAuthStateRef.current) {
        cleanupListener();
        await unregisterPushToken();
      }

      previousAuthStateRef.current = isAuthenticated;
    };

    synchronizeToken().catch((error) => {
      console.error('Failed to synchronize push token', error);
    });

    return () => {
      cancelled = true;
      cleanupListener();
    };
  }, [isAuthenticated]);
};
