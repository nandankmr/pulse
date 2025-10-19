import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import apiClient from '../api/client';
import { store } from '../store';

export async function requestMessagingPermission(): Promise<boolean> {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  return enabled;
}

export async function getFcmToken(): Promise<string | null> {
  try {
    const hasPermission = await requestMessagingPermission();
    if (!hasPermission) {
      return null;
    }

    await messaging().registerDeviceForRemoteMessages();

    const token = await messaging().getToken();
    return token;
  } catch (error) {
    console.error('Failed to get FCM token', error);
    return null;
  }
}

export async function registerPushToken(): Promise<void> {
  const token = await getFcmToken();
  if (!token) {
    return;
  }

  const state = store.getState();
  const userId = state.auth.user?.id;
  if (!userId) {
    return;
  }

  const payload: Record<string, unknown> = {
    token,
    platform: Platform.OS,
  };

  const deviceId = state.auth.deviceId;
  if (deviceId) {
    payload.deviceId = deviceId;
  }

  try {
    await apiClient.post('/push/register', payload);
  } catch (error) {
    console.error('Failed to register push token', error);
  }
}

export async function unregisterPushToken(): Promise<void> {
  try {
    const token = await messaging().getToken();
    if (!token) {
      return;
    }
    await apiClient.post('/push/unregister', { token });
  } catch (error) {
    console.error('Failed to unregister push token', error);
  }
}

export function setupTokenRefreshListener(): () => void {
  const unsubscribe = messaging().onTokenRefresh(async (token: string) => {
    try {
      const payload: Record<string, unknown> = {
        token,
        platform: Platform.OS,
      };

      const state = store.getState();
      const deviceId = state.auth.deviceId;
      if (deviceId) {
        payload.deviceId = deviceId;
      }

      await apiClient.post('/push/register', payload);
    } catch (error) {
      console.error('Failed to refresh push token', error);
    }
  });

  return unsubscribe;
}
