// src/api/user.ts

import apiClient from './client';
import { User } from '../store/authSlice';

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  avatar?: string;
}

export interface UpdateProfileResponse {
  user: User;
}

export interface UploadAvatarResponse {
  url: string;
  presignedUrl?: string;
}

/**
 * Get current user profile
 */
export const getUserProfileAPI = async (): Promise<User> => {
  const response = await apiClient.get<User>('/users/profile');
  return response.data;
};

/**
 * Update user profile
 */
export const updateProfileAPI = async (
  data: UpdateProfileRequest
): Promise<UpdateProfileResponse> => {
  const response = await apiClient.put<UpdateProfileResponse>(
    '/users/profile',
    data
  );
  return response.data;
};

/**
 * Request presigned URL for avatar upload
 */
export const getAvatarUploadUrlAPI = async (
  fileName: string,
  fileType: string
): Promise<UploadAvatarResponse> => {
  const response = await apiClient.post<UploadAvatarResponse>(
    '/users/avatar/upload-url',
    {
      fileName,
      fileType,
    }
  );
  return response.data;
};

/**
 * Upload avatar to presigned URL
 */
export const uploadAvatarToS3 = async (
  presignedUrl: string,
  file: Blob | File,
  fileType: string
): Promise<void> => {
  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': fileType,
    },
  });
};

/**
 * Confirm avatar upload and update profile
 */
export const confirmAvatarUploadAPI = async (
  avatarUrl: string
): Promise<UpdateProfileResponse> => {
  const response = await apiClient.post<UpdateProfileResponse>(
    '/users/avatar/confirm',
    {
      avatarUrl,
    }
  );
  return response.data;
};
