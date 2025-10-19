// src/utils/geolocation.ts

import { Alert, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

/**
 * Check if location permission is already granted
 */
const checkLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted;
    } catch (err) {
      console.warn('Location permission check error:', err);
      return false;
    }
  }
  return true;
};

/**
 * Request location permission (Android only)
 */
const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      // First check if already granted
      const alreadyGranted = await checkLocationPermission();
      if (alreadyGranted) {
        return true;
      }

      // Request permission
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Agastya needs access to your location to share it in messages.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      console.log('Location permission result:', granted);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Location permission error:', err);
      return false;
    }
  }
  // iOS permissions are handled in Info.plist
  return true;
};

/**
 * Get current location with permission handling
 */
export const getCurrentLocationWithPermission = async (): Promise<{
  latitude: number;
  longitude: number;
} | null> => {
  // Request permission first
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    Alert.alert('Permission Denied', 'Location permission is required to share your location.');
    return null;
  }

  return new Promise((resolve) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Location error:', error);
        console.error('Location error code:', error.code);
        console.error('Location error message:', error.message);
        
        // Full error details for debugging
        const errorDetails = `Code: ${error.code}\nMessage: ${error.message || 'No message'}\nType: ${
          error.code === 1 ? 'PERMISSION_DENIED' :
          error.code === 2 ? 'POSITION_UNAVAILABLE' :
          error.code === 3 ? 'TIMEOUT' : 'UNKNOWN'
        }`;
        
        let errorTitle = 'Location Error';
        let errorMessage = 'Failed to get current location';
        let instructions = '';
        
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = 'Location permission denied.';
            instructions = 'Please go to Settings → Apps → Agastya → Permissions and enable Location.';
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = 'Location unavailable.';
            instructions = 'Please ensure:\n• GPS is enabled\n• You are not in airplane mode\n• Location services are turned on';
            break;
          case 3: // TIMEOUT
            errorTitle = 'Location Timeout';
            errorMessage = 'Could not get your location in time.';
            instructions = 'Please ensure:\n• GPS is enabled\n• You have a clear view of the sky\n• Location accuracy is set to High\n\nTry again in a moment.';
            break;
        }
        
        Alert.alert(
          errorTitle,
          errorMessage + (instructions ? '\n\n' + instructions : '') + '\n\n--- Debug Info ---\n' + errorDetails,
          [{ text: 'OK' }]
        );
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000, // 30 seconds for physical devices
        maximumAge: 10000,
        distanceFilter: 0, // Get location immediately
      }
    );
  });
};

/**
 * Watch location changes (for live location sharing)
 */
export const watchLocation = (
  onLocationChange: (latitude: number, longitude: number) => void,
  onError?: (error: any) => void
): number => {
  return Geolocation.watchPosition(
    (position) => {
      onLocationChange(position.coords.latitude, position.coords.longitude);
    },
    (error) => {
      console.error('Watch location error:', error);
      if (onError) onError(error);
    },
    {
      enableHighAccuracy: true,
      distanceFilter: 10, // Update every 10 meters
      interval: 5000, // Update every 5 seconds
    }
  );
};

/**
 * Stop watching location
 */
export const clearLocationWatch = (watchId: number): void => {
  Geolocation.clearWatch(watchId);
};
