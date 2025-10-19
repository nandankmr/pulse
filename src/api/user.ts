// src/api/user.ts

import apiClient from './client';
import { User } from '../store/authSlice';

export interface UpdateProfileRequest {
  name?: string;
  password?: string;
}

export interface UpdateProfileResponse {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get current user profile
 */
export const getUserProfileAPI = async (): Promise<User> => {
  const response = await apiClient.get<User>('/users/me');
  return response.data;
};

/**
 * Update user profile
 */
export const updateProfileAPI = async (
  data: UpdateProfileRequest
): Promise<UpdateProfileResponse> => {
  const response = await apiClient.put<UpdateProfileResponse>(
    '/users/me',
    data
  );
  return response.data;
};

/**
 * Upload avatar reference
 */
export const uploadAvatarAPI = async (payload: { filename: string }): Promise<UpdateProfileResponse> => {
  console.log('Uploading avatar:', payload);
  
  const response = await apiClient.post<UpdateProfileResponse>(
    '/users/me/avatar',
    payload
  );
  return response.data;
};

/**
 * User search result interface
 */
export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SearchUsersResponse {
  data: UserSearchResult[];
}

export interface SearchUsersParams {
  q: string;
  limit?: number;
}

/**
 * Search users by name or email
 */
export const searchUsersAPI = async (
  params: SearchUsersParams
): Promise<SearchUsersResponse> => {
  const response = await apiClient.get<SearchUsersResponse>('/users/search', {
    params,
  });
  return response.data;
};
