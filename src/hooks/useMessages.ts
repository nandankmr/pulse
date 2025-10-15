// src/hooks/useMessages.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMessagesAPI,
  sendMessageAPI,
  SendMessageRequest,
  GetMessagesResponse,
} from '../api/message';

/**
 * Hook to fetch messages for a chat
 */
export const useMessages = (chatId: string, limit: number = 50) => {
  return useQuery<GetMessagesResponse>({
    queryKey: ['messages', chatId],
    queryFn: () => getMessagesAPI(chatId, limit),
    enabled: !!chatId,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to send a message via REST API
 * Socket.IO will handle real-time delivery to other users
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendMessageRequest) => {
      // Real API call - Backend endpoint is ready!
      return sendMessageAPI(data);
    },
    onSuccess: (_, variables) => {
      // Invalidate messages query to refetch
      queryClient.invalidateQueries({ queryKey: ['messages', variables.chatId] });
      // Invalidate chats list to update last message
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};

/**
 * Hook to load more messages (pagination)
 */
export const useLoadMoreMessages = (chatId: string) => {
  return useMutation({
    mutationFn: async ({ cursor, limit = 50 }: { cursor?: string; limit?: number }) => {
      return getMessagesAPI(chatId, limit, cursor);
    },
  });
};
