// src/api/chat.ts

import apiClient from './client';

export interface ChatResponse {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isGroup: boolean;
  isOnline?: boolean;
  otherUserId?: string; // For DM conversations, the ID of the other user
}

export interface GetChatsResponse {
  chats: ChatResponse[];
}

export interface CreateChatRequest {
  recipientId?: string; // For DM
  groupName?: string; // For group
  memberIds?: string[]; // For group
}

export interface CreateChatResponse {
  chat: ChatResponse;
}

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  verified: boolean;
}

export interface SearchUsersResponse {
  data: UserSearchResult[];
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
  isOnline: boolean;
}

export interface GetGroupMembersResponse {
  members: GroupMember[];
}

export interface UpdateGroupDetailsRequest {
  name?: string;
  description?: string;
  avatar?: string;
}

export interface UpdateGroupDetailsResponse {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
}

export interface UpdateMemberRoleRequest {
  role: 'ADMIN' | 'MEMBER';
}

/**
 * Get all chats for the current user
 */
export const getChatsAPI = async (): Promise<GetChatsResponse> => {
  const response = await apiClient.get<GetChatsResponse>('/chats');
  return response.data;
};

/**
 * Get a specific chat by ID
 */
export const getChatByIdAPI = async (chatId: string): Promise<ChatResponse> => {
  const response = await apiClient.get<ChatResponse>(`/chats/${chatId}`);
  return response.data;
};

/**
 * Create a new chat (DM or group)
 */
export const createChatAPI = async (
  data: CreateChatRequest
): Promise<CreateChatResponse> => {
  const response = await apiClient.post<CreateChatResponse>('/chats', data);
  return response.data;
};

/**
 * Mark chat as read
 */
export const markChatAsReadAPI = async (chatId: string): Promise<void> => {
  await apiClient.post(`/chats/${chatId}/read`);
};

/**
 * Delete a chat
 */
export const deleteChatAPI = async (chatId: string): Promise<void> => {
  await apiClient.delete(`/chats/${chatId}`);
};

/**
 * Leave a group chat
 */
export const leaveGroupAPI = async (chatId: string): Promise<void> => {
  await apiClient.post(`/chats/${chatId}/leave`);
};

/**
 * Add members to a group chat
 */
export const addGroupMembersAPI = async (
  chatId: string,
  memberIds: string[]
): Promise<void> => {
  await apiClient.post(`/chats/${chatId}/members`, { memberIds });
};

/**
 * Remove member from a group chat
 */
export const removeGroupMemberAPI = async (
  chatId: string,
  memberId: string
): Promise<void> => {
  await apiClient.delete(`/chats/${chatId}/members/${memberId}`);
};

// Note: searchUsersAPI is now in user.ts to avoid duplication

/**
 * Get group members with full details
 */
export const getGroupMembersAPI = async (
  chatId: string
): Promise<GetGroupMembersResponse> => {
  const response = await apiClient.get<GetGroupMembersResponse>(
    `/chats/${chatId}/members`
  );
  return response.data;
};

/**
 * Update group details (name, description, avatar)
 */
export const updateGroupDetailsAPI = async (
  chatId: string,
  data: UpdateGroupDetailsRequest
): Promise<UpdateGroupDetailsResponse> => {
  const response = await apiClient.patch<UpdateGroupDetailsResponse>(
    `/chats/${chatId}`,
    data
  );
  return response.data;
};

/**
 * Promote or demote group member
 */
export const updateMemberRoleAPI = async (
  chatId: string,
  memberId: string,
  data: UpdateMemberRoleRequest
): Promise<{ message: string }> => {
  const response = await apiClient.patch<{ message: string }>(
    `/chats/${chatId}/members/${memberId}`,
    data
  );
  return response.data;
};
