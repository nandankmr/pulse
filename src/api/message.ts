// src/api/message.ts

import apiClient from './client';
import { Message, Attachment } from '../types/message';

export interface GetMessagesResponse {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface SendMessageRequest {
  chatId: string;
  content?: string;
  mediaUrl?: string;
  type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'LOCATION';
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface SendMessageResponse {
  message: Message;
}

/**
 * Get messages for a chat with pagination
 */
export const getMessagesAPI = async (
  chatId: string,
  limit: number = 50,
  cursor?: string
): Promise<GetMessagesResponse> => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    ...(cursor && { cursor }),
  });

  const response = await apiClient.get<GetMessagesResponse>(
    `/chats/${chatId}/messages?${params}`
  );
  return response.data;
};

/**
 * Send a message
 */
export const sendMessageAPI = async (
  data: SendMessageRequest
): Promise<SendMessageResponse> => {
  // Extract chatId and send the rest as body
  const { chatId, ...body } = data;
  const response = await apiClient.post<SendMessageResponse>(
    `/chats/${chatId}/messages`,
    body
  );
  return response.data;
};

/**
 * Delete a message
 */
export const deleteMessageAPI = async (
  chatId: string,
  messageId: string,
  deleteForEveryone?: boolean
): Promise<void> => {
  await apiClient.delete(`/chats/${chatId}/messages/${messageId}`, {
    data: { deleteForEveryone },
  });
};

/**
 * Edit a message
 */
export const editMessageAPI = async (
  chatId: string,
  messageId: string,
  content: string
): Promise<Message> => {
  const response = await apiClient.put<Message>(
    `/chats/${chatId}/messages/${messageId}`,
    { content }
  );
  return response.data;
};

/**
 * Mark messages as read
 */
export const markMessagesAsReadAPI = async (
  chatId: string,
  messageIds: string[]
): Promise<void> => {
  await apiClient.post(`/chats/${chatId}/messages/read`, { messageIds });
};
