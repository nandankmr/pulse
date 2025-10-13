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
