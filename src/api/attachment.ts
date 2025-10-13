// src/api/attachment.ts

import apiClient from './client';

export interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
  attachmentType: 'image' | 'video' | 'audio' | 'file';
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  fields?: Record<string, string>;
}

/**
 * Get presigned URL for file upload
 */
export const getPresignedUploadUrlAPI = async (
  data: PresignedUrlRequest
): Promise<PresignedUrlResponse> => {
  const response = await apiClient.post<PresignedUrlResponse>(
    '/attachments/upload-url',
    data
  );
  return response.data;
};

/**
 * Confirm attachment upload
 */
export const confirmAttachmentUploadAPI = async (
  fileUrl: string,
  attachmentType: string
): Promise<void> => {
  await apiClient.post('/attachments/confirm', {
    fileUrl,
    attachmentType,
  });
};

/**
 * Delete attachment
 */
export const deleteAttachmentAPI = async (attachmentId: string): Promise<void> => {
  await apiClient.delete(`/attachments/${attachmentId}`);
};
