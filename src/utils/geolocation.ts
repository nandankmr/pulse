// src/utils/geolocation.ts

import { Alert, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

type GeoCoords = {
  latitude: number;
  longitude: number;
};

type GeoPosition = {
  coords: GeoCoords;
};

type GeoError = {
  code?: number;
  message?: string;
};

type GeoOptions = {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  distanceFilter?: number;
};

/**
 * Check if location permission is already granted
 */
const configureIOSLocation = () => {
  if (Platform.OS !== 'ios') {
    return;
  }
  if (typeof Geolocation.setRNConfiguration === 'function') {
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
    });
  }

  const requestAuth = Geolocation.requestAuthorization as unknown as (() => void) | undefined;
  if (typeof requestAuth === 'function') {
    requestAuth();
  }
};

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
  configureIOSLocation();
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
  configureIOSLocation();
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

  const getPosition = (options: GeoOptions) =>
    new Promise<GeoPosition>((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => resolve(position as GeoPosition),
        (error) => reject(error as GeoError),
        options
      );
    });

  const baseOptions = {
    enableHighAccuracy: true,
    timeout: Platform.OS === 'ios' ? 20000 : 30000,
    maximumAge: 10000,
    distanceFilter: 0,
  } as const;

  try {
    const position = await getPosition(baseOptions);
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch (error: any) {
    console.error('Location error:', error);
    console.error('Location error code:', error?.code);
    console.error('Location error message:', error?.message);

    if (Platform.OS === 'ios' && error?.code === 3) {
      try {
        const fallbackPosition = await getPosition({
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 60000,
          distanceFilter: 0,
        });

        return {
          latitude: fallbackPosition.coords.latitude,
          longitude: fallbackPosition.coords.longitude,
        };
      } catch (fallbackError: any) {
        console.error('Fallback location error:', fallbackError);
        showLocationErrorAlert(fallbackError);
        return null;
      }
    }

    showLocationErrorAlert(error as GeoError);
    return null;
  }
};

const showLocationErrorAlert = (error: GeoError) => {
  const code = error?.code;
  const message = error?.message ?? 'No message';

  const errorDetails = `Code: ${code ?? 'N/A'}\nMessage: ${message}\nType: ${
    code === 1 ? 'PERMISSION_DENIED' :
    code === 2 ? 'POSITION_UNAVAILABLE' :
    code === 3 ? 'TIMEOUT' : 'UNKNOWN'
  }`;

  let errorTitle = 'Location Error';
  let errorMessage = 'Failed to get current location';
  let instructions = '';

  switch (code) {
    case 1:
      errorMessage = 'Location permission denied.';
      instructions = Platform.OS === 'ios'
        ? 'Please go to Settings → Agastya → Location and enable access.'
        : 'Please go to Settings → Apps → Agastya → Permissions and enable Location.';
      break;
    case 2:
      errorMessage = 'Location unavailable.';
      instructions = 'Please ensure:\n• Location services are enabled\n• You are not in airplane mode';
      break;
    case 3:
      errorTitle = 'Location Timeout';
      errorMessage = 'Could not get your location in time.';
      instructions = 'Please ensure you have a clear view of the sky and try again.';
      break;
  }

  Alert.alert(
    errorTitle,
    errorMessage + (instructions ? '\n\n' + instructions : '') + '\n\n--- Debug Info ---\n' + errorDetails,
    [{ text: 'OK' }]
  );
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
