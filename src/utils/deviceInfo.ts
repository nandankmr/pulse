// src/utils/deviceInfo.ts

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@pulse/device_id';

export interface DeviceInformation {
  deviceId: string;
  deviceName: string;
  platform: string;
}

/**
 * Generate a unique device ID
 */
const generateDeviceId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${Platform.OS}-${timestamp}-${random}`;
};

/**
 * Get or generate a unique device ID
 */
const getOrCreateDeviceId = async (): Promise<string> => {
  try {
    // Try to get existing device ID from storage
    const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    
    if (deviceId) {
      return deviceId;
    }
    
    // Generate a new unique device ID
    const newDeviceId = generateDeviceId();
    await AsyncStorage.setItem(DEVICE_ID_KEY, newDeviceId);
    return newDeviceId;
  } catch (error) {
    console.error('Error getting/creating device ID:', error);
    // Fallback to a random ID if storage fails
    return generateDeviceId();
  }
};

/**
 * Get device name based on platform
 */
const getDeviceName = (): string => {
  switch (Platform.OS) {
    case 'ios':
      return 'iOS Device';
    case 'android':
      return 'Android Device';
    case 'web':
      return 'Web Browser';
    default:
      return 'Unknown Device';
  }
};

/**
 * Get device information for authentication
 */
export const getDeviceInfo = async (): Promise<DeviceInformation> => {
  try {
    const deviceId = await getOrCreateDeviceId();
    const deviceName = getDeviceName();
    const platform = Platform.OS;

    return {
      deviceId,
      deviceName,
      platform,
    };
  } catch (error) {
    console.error('Error getting device info:', error);
    // Return fallback values
    return {
      deviceId: generateDeviceId(),
      deviceName: getDeviceName(),
      platform: Platform.OS,
    };
  }
};
