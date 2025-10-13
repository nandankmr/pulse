// src/utils/geolocation.ts

import { Alert, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

/**
 * Request location permission (Android only)
 */
const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Pulse needs access to your location to share it in messages.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
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
        let errorMessage = 'Failed to get current location';
        
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = 'Location permission denied';
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = 'Location unavailable';
            break;
          case 3: // TIMEOUT
            errorMessage = 'Location request timed out';
            break;
        }
        
        Alert.alert('Error', errorMessage);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
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
