// src/utils/attachmentUpload.ts

import { Attachment } from '../types/message';
import { PickedAttachment } from './attachmentPicker';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  fields?: Record<string, string>;
}

/**
 * Get presigned URL for upload
 */
export const getPresignedUploadUrl = async (
  fileName: string,
  fileType: string,
  attachmentType: 'image' | 'video' | 'audio' | 'file'
): Promise<PresignedUrlResponse> => {
  // TODO: Replace with actual API call
  // const response = await apiClient.post('/attachments/upload-url', {
  //   fileName,
  //   fileType,
  //   attachmentType,
  // });
  // return response.data;

  // Mock response
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
  
  return {
    uploadUrl: `https://mock-s3.amazonaws.com/upload/${fileName}`,
    fileUrl: `https://mock-cdn.com/attachments/${fileName}`,
  };
};

/**
 * Upload file to S3 or storage service
 */
export const uploadToStorage = async (
  presignedUrl: string,
  fileUri: string,
  fileType: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<void> => {
  // TODO: Implement actual file upload
  // For React Native, you might use:
  // - fetch with FormData
  // - react-native-fs
  // - expo-file-system

  // Mock upload with progress
  return new Promise<void>((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      
      if (onProgress) {
        onProgress({
          loaded: progress,
          total: 100,
          percentage: progress,
        });
      }

      if (progress >= 100) {
        clearInterval(interval);
        resolve();
      }
    }, 200);
  });
};

/**
 * Upload attachment and return Attachment object
 */
export const uploadAttachment = async (
  pickedAttachment: PickedAttachment,
  onProgress?: (progress: UploadProgress) => void
): Promise<Attachment> => {
  // Get presigned URL
  const { uploadUrl, fileUrl } = await getPresignedUploadUrl(
    pickedAttachment.name,
    getMimeType(pickedAttachment.type),
    pickedAttachment.type
  );

  // Upload file
  await uploadToStorage(
    uploadUrl,
    pickedAttachment.uri,
    getMimeType(pickedAttachment.type),
    onProgress
  );

  // Create attachment object
  const attachment: Attachment = {
    id: `att_${Date.now()}`,
    type: pickedAttachment.type,
    url: fileUrl,
    name: pickedAttachment.name,
    size: pickedAttachment.size,
    duration: pickedAttachment.duration,
  };

  // Generate thumbnail for videos
  if (pickedAttachment.type === 'video') {
    attachment.thumbnail = `${fileUrl}_thumb.jpg`;
  }

  return attachment;
};

/**
 * Get MIME type from attachment type
 */
const getMimeType = (type: string): string => {
  const mimeTypes: Record<string, string> = {
    image: 'image/jpeg',
    video: 'video/mp4',
    audio: 'audio/mpeg',
    file: 'application/octet-stream',
  };

  return mimeTypes[type] || 'application/octet-stream';
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '0 B';

  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

/**
 * Format duration for display
 */
export const formatDuration = (seconds?: number): string => {
  if (!seconds) return '0:00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
