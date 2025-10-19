// src/utils/attachmentUpload.ts

import { Attachment } from '../types/message';
import { PickedAttachment } from './attachmentPicker';
import config from '../config';
import { store } from '../store';

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

export interface UploadFileResult {
  absoluteUrl: string;
  relativePath: string;
  filename: string;
}

/**
 * Upload file directly to backend
 */
export const uploadFileToBackend = async (
  fileUri: string,
  fileName: string,
  fileType: string,
  _onProgress?: (progress: UploadProgress) => void
): Promise<UploadFileResult> => {
  console.log('📤 Starting file upload:', { fileUri, fileName, fileType });
  
  // Get auth token
  const state = store.getState();
  const token = state.auth.accessToken;
  
  if (!token) {
    throw new Error('No authentication token');
  }
  
  // Create FormData for React Native
  const formData = new FormData();
  
  // For React Native, we need to format the file properly
  formData.append('file', {
    uri: fileUri,
    type: fileType,
    name: fileName,
  } as any);
  
  const uploadUrl = `${config.API_URL}/attachments/upload`;
  console.log('📦 Uploading to:', uploadUrl);

  try {
    // Use fetch instead of axios for better React Native compatibility
    // IMPORTANT: Don't set Content-Type header - let fetch set it with boundary
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - FormData will set it automatically with boundary
      },
      body: formData,
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Upload failed:', errorData);
      throw new Error(errorData.error || errorData.message || 'Failed to upload file');
    }

    const data = await response.json();
    console.log('✅ Upload successful:', data);

    const relativePath: string = data.url;
    const baseUrl = config.API_URL.replace('/api', '');
    const absoluteUrl = `${baseUrl}${relativePath}`;
    console.log('🔗 Full file URL:', absoluteUrl);

    let filename = typeof data.filename === 'string' && data.filename.trim() ? data.filename.trim() : undefined;
    if (!filename) {
      const segments = relativePath.split('/');
      filename = segments.pop() || relativePath;
    }
    
    return {
      absoluteUrl,
      relativePath,
      filename,
    };
  } catch (error: any) {
    console.error('❌ File upload error:', {
      message: error.message,
      stack: error.stack,
    });
    throw new Error(error.message || 'Failed to upload file');
  }
};

/**
 * Upload attachment and return Attachment object
 */
export const uploadAttachment = async (
  pickedAttachment: PickedAttachment,
  onProgress?: (progress: UploadProgress) => void
): Promise<Attachment> => {
  // Upload file to backend
  const { absoluteUrl } = await uploadFileToBackend(
    pickedAttachment.uri,
    pickedAttachment.name,
    getMimeType(pickedAttachment.type),
    onProgress
  );

  // Create attachment object
  const attachment: Attachment = {
    id: `att_${Date.now()}`,
    type: pickedAttachment.type,
    url: absoluteUrl,
    name: pickedAttachment.name,
    size: pickedAttachment.size,
    duration: pickedAttachment.duration,
  };

  // Generate thumbnail for videos
  if (pickedAttachment.type === 'video') {
    attachment.thumbnail = `${absoluteUrl}_thumb.jpg`;
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
