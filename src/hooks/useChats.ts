// src/hooks/useChats.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getChatsAPI,
  getChatByIdAPI,
  createChatAPI,
  markChatAsReadAPI,
  deleteChatAPI,
  leaveGroupAPI,
  addGroupMembersAPI,
  removeGroupMemberAPI,
  CreateChatRequest,
} from '../api/chat';

/**
 * Query keys for chat-related queries
 */
export const chatKeys = {
  all: ['chats'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
  list: () => [...chatKeys.lists()] as const,
  details: () => [...chatKeys.all, 'detail'] as const,
  detail: (id: string) => [...chatKeys.details(), id] as const,
};

/**
 * Hook to fetch all chats
 */
export const useChats = () => {
  return useQuery({
    queryKey: chatKeys.list(),
    queryFn: getChatsAPI,
  });
};

/**
 * Hook to fetch a specific chat by ID
 */
export const useChat = (chatId: string) => {
  return useQuery({
    queryKey: chatKeys.detail(chatId),
    queryFn: () => getChatByIdAPI(chatId),
    enabled: !!chatId,
  });
};

/**
 * Hook to create a new chat (DM or group)
 */
export const useCreateChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChatRequest) => createChatAPI(data),
    onSuccess: (response) => {
      // Add the new chat to the list
      queryClient.setQueryData(chatKeys.list(), (old: any) => {
        if (!old) return { chats: [response.chat] };
        return {
          chats: [response.chat, ...old.chats],
        };
      });

      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });
};

/**
 * Hook to mark a chat as read
 */
export const useMarkChatAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: string) => markChatAsReadAPI(chatId),
    onSuccess: (_, chatId) => {
      // Update the chat in the list to set unreadCount to 0
      queryClient.setQueryData(chatKeys.list(), (old: any) => {
        if (!old) return old;
        return {
          chats: old.chats.map((chat: any) =>
            chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
          ),
        };
      });

      // Update the specific chat detail if it's cached
      queryClient.setQueryData(chatKeys.detail(chatId), (old: any) => {
        if (!old) return old;
        return { ...old, unreadCount: 0 };
      });
    },
  });
};

/**
 * Hook to delete a chat
 */
export const useDeleteChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: string) => deleteChatAPI(chatId),
    onSuccess: (_, chatId) => {
      // Remove the chat from the list
      queryClient.setQueryData(chatKeys.list(), (old: any) => {
        if (!old) return old;
        return {
          chats: old.chats.filter((chat: any) => chat.id !== chatId),
        };
      });

      // Remove the chat detail from cache
      queryClient.removeQueries({ queryKey: chatKeys.detail(chatId) });

      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });
};

/**
 * Hook to leave a group chat
 */
export const useLeaveGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: string) => leaveGroupAPI(chatId),
    onSuccess: (_, chatId) => {
      // Remove the group from the list
      queryClient.setQueryData(chatKeys.list(), (old: any) => {
        if (!old) return old;
        return {
          chats: old.chats.filter((chat: any) => chat.id !== chatId),
        };
      });

      // Remove the chat detail from cache
      queryClient.removeQueries({ queryKey: chatKeys.detail(chatId) });

      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });
};

/**
 * Hook to add members to a group
 */
export const useAddGroupMembers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, memberIds }: { chatId: string; memberIds: string[] }) =>
      addGroupMembersAPI(chatId, memberIds),
    onSuccess: (_, { chatId }) => {
      // Invalidate the chat detail to refetch with new members
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(chatId) });
    },
  });
};

/**
 * Hook to remove a member from a group
 */
export const useRemoveGroupMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, memberId }: { chatId: string; memberId: string }) =>
      removeGroupMemberAPI(chatId, memberId),
    onSuccess: (_, { chatId }) => {
      // Invalidate the chat detail to refetch with updated members
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(chatId) });
    },
  });
};
