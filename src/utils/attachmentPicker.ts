// src/utils/attachmentPicker.ts

import { Alert } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

export interface PickedAttachment {
  uri: string;
  type: 'image' | 'video' | 'audio' | 'file';
  name: string;
  size?: number;
  duration?: number;
}

/**
 * Show attachment picker options
 */
export const pickAttachment = async (): Promise<PickedAttachment | null> => {
  return new Promise(resolve => {
    Alert.alert(
      'Add Attachment',
      'Choose an option',
      [
        {
          text: 'Camera/Gallery',
          onPress: () => {
            // Show second menu for media
            Alert.alert(
              'Choose Media',
              '',
              [
                {
                  text: 'Take Photo',
                  onPress: async () => {
                    const result = await pickFromCamera('photo');
                    resolve(result);
                  },
                },
                {
                  text: 'Take Video',
                  onPress: async () => {
                    const result = await pickFromCamera('video');
                    resolve(result);
                  },
                },
                {
                  text: 'Choose from Gallery',
                  onPress: async () => {
                    const result = await pickFromGallery();
                    resolve(result);
                  },
                },
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => resolve(null),
                },
              ],
            );
          },
        },
        {
          text: 'Share Location',
          onPress: () => {
            // Will be handled separately
            resolve({ type: 'location' } as any);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(null),
        },
      ],
      { cancelable: true },
    );
  });
};

/**
 * Pick from camera
 */
const pickFromCamera = async (
  mediaType: 'photo' | 'video',
): Promise<PickedAttachment | null> => {
  try {
    const response = await launchCamera({
      mediaType,
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1920,
      videoQuality: 'high',
      durationLimit: 60, // 60 seconds max for video
      saveToPhotos: false,
    });

    if (response.didCancel || !response.assets?.[0]) {
      return null;
    }

    const asset = response.assets[0];
    return {
      uri: asset.uri!,
      type: mediaType === 'photo' ? 'image' : 'video',
      name:
        asset.fileName ||
        `${mediaType}_${Date.now()}.${mediaType === 'photo' ? 'jpg' : 'mp4'}`,
      size: asset.fileSize,
      duration: asset.duration,
    };
  } catch (error) {
    console.error('Camera error:', error);
    Alert.alert('Error', 'Failed to capture media');
    return null;
  }
};

/**
 * Pick from gallery
 */
const pickFromGallery = async (): Promise<PickedAttachment | null> => {
  try {
    const response = await launchImageLibrary({
      mediaType: 'mixed', // Allow both photos and videos
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1920,
      videoQuality: 'high',
      selectionLimit: 1,
    });

    if (response.didCancel || !response.assets?.[0]) {
      return null;
    }

    const asset = response.assets[0];
    const isVideo = asset.type?.startsWith('video/');

    return {
      uri: asset.uri!,
      type: isVideo ? 'video' : 'image',
      name: asset.fileName || `media_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`,
      size: asset.fileSize,
      duration: asset.duration,
    };
  } catch (error) {
    console.error('Gallery error:', error);
    Alert.alert('Error', 'Failed to pick media');
    return null;
  }
};

/**
 * Validate attachment
 */
export const validateAttachment = (
  attachment: PickedAttachment,
): { valid: boolean; error?: string } => {
  const maxImageSize = 10 * 1024 * 1024; // 10MB
  const maxVideoSize = 50 * 1024 * 1024; // 50MB

  if (
    attachment.type === 'image' &&
    attachment.size &&
    attachment.size > maxImageSize
  ) {
    return {
      valid: false,
      error: 'Image size must be less than 10MB',
    };
  }

  if (
    attachment.type === 'video' &&
    attachment.size &&
    attachment.size > maxVideoSize
  ) {
    return {
      valid: false,
      error: 'Video size must be less than 50MB',
    };
  }

  if (
    attachment.type === 'video' &&
    attachment.duration &&
    attachment.duration > 60
  ) {
    return {
      valid: false,
      error: 'Video duration must be less than 60 seconds',
    };
  }

  return { valid: true };
};

/**
 * Get current location with proper permission handling
 */
export const getCurrentLocation = async (): Promise<{
  latitude: number;
  longitude: number;
} | null> => {
  // Import the proper function from geolocation utility
  const { getCurrentLocationWithPermission } = require('./geolocation');
  return getCurrentLocationWithPermission();
};
