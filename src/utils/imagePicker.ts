// src/utils/imagePicker.ts

import { Alert, PermissionsAndroid, Platform } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  Asset,
} from 'react-native-image-picker';

export interface ImagePickerResult {
  uri: string;
  type: string;
  name: string;
  size?: number;
}

/**
 * Pick image from gallery or camera
 */
export const pickImage = async (): Promise<ImagePickerResult | null> => {
  return new Promise((resolve) => {
    Alert.alert(
      'Select Avatar',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const result = await openCamera();
            resolve(result);
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            const result = await openGallery();
            resolve(result);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(null),
        },
      ],
      { cancelable: true }
    );
  });
};

/**
 * Open camera to take photo
 */
const openCamera = async (): Promise<ImagePickerResult | null> => {
  try {
    const hasPermission = await ensureCameraPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take a photo. Please enable it in settings.'
      );
      return null;
    }

    const response: ImagePickerResponse = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      includeBase64: false,
      saveToPhotos: false,
    });

    return processImageResponse(response);
  } catch (error) {
    console.error('Camera error:', error);
    return null;
  }
};

const ensureCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  const permission = PermissionsAndroid.PERMISSIONS.CAMERA;
  const hasPermission = await PermissionsAndroid.check(permission);
  if (hasPermission) {
    return true;
  }

  const status = await PermissionsAndroid.request(permission, {
    title: 'Camera Permission',
    message: 'Agastya needs access to your camera to take photos.',
    buttonPositive: 'Allow',
    buttonNegative: 'Deny',
  });

  return status === PermissionsAndroid.RESULTS.GRANTED;
};

/**
 * Open gallery to select photo
 */
const openGallery = async (): Promise<ImagePickerResult | null> => {
  try {
    const response: ImagePickerResponse = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      includeBase64: false,
      selectionLimit: 1,
    });

    return processImageResponse(response);
  } catch (error) {
    console.error('Gallery error:', error);
    return null;
  }
};

/**
 * Process image picker response
 */
const processImageResponse = (
  response: ImagePickerResponse
): ImagePickerResult | null => {
  if (response.didCancel) {
    console.log('User cancelled image picker');
    return null;
  }

  if (response.errorCode) {
    console.error('ImagePicker Error:', response.errorMessage);
    Alert.alert('Error', response.errorMessage || 'Failed to pick image');
    return null;
  }

  const asset: Asset | undefined = response.assets?.[0];

  if (!asset || !asset.uri) {
    console.error('No image selected');
    return null;
  }

  return {
    uri: asset.uri,
    type: asset.type || 'image/jpeg',
    name: asset.fileName || `avatar_${Date.now()}.jpg`,
    size: asset.fileSize,
  };
};

/**
 * Validate image file
 */
export const validateImage = (
  image: ImagePickerResult
): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (image.size && image.size > maxSize) {
    return {
      valid: false,
      error: 'Image size must be less than 5MB',
    };
  }

  if (!allowedTypes.includes(image.type)) {
    return {
      valid: false,
      error: 'Only JPEG, PNG, and WebP images are allowed',
    };
  }

  return { valid: true };
};

/**
 * Get file extension from mime type
 */
export const getFileExtension = (mimeType: string): string => {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

  return extensions[mimeType] || 'jpg';
};
