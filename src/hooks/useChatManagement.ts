// src/hooks/useChatManagement.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  // searchUsersAPI,
  getGroupMembersAPI,
  updateGroupDetailsAPI,
  updateMemberRoleAPI,
  UpdateGroupDetailsRequest,
  UpdateMemberRoleRequest,
} from '../api/chat';
import { searchUsersAPI } from '../api/user';
import { chatKeys } from './useChats';
import { groupKeys } from './useGroups';

/**
 * Hook for searching users
 */
export const useSearchUsers = (query: string, limit?: number) => {
  return useQuery({
    queryKey: ['users', 'search', query, limit],
    queryFn: () => searchUsersAPI({ q: query, limit }),
    enabled: query.length >= 2, // Only search if query is at least 2 characters
    staleTime: 30000, // Cache for 30 seconds
  });
};

/**
 * Hook for getting group members
 */
export const useGroupMembers = (chatId: string) => {
  return useQuery({
    queryKey: ['chats', chatId, 'members'],
    queryFn: () => getGroupMembersAPI(chatId),
    enabled: !!chatId,
  });
};

/**
 * Hook for updating group details
 */
export const useUpdateGroupDetails = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chatId,
      data,
    }: {
      chatId: string;
      data: UpdateGroupDetailsRequest;
    }) => updateGroupDetailsAPI(chatId, data),
    onSuccess: (_, variables) => {
      // Refresh chat list/detail caches and group data after updates
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(variables.chatId) });
      queryClient.invalidateQueries({ queryKey: ['chats', variables.chatId, 'members'] });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables.chatId) });
    },
  });
};

/**
 * Hook for promoting/demoting group member
 */
export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chatId,
      memberId,
      data,
    }: {
      chatId: string;
      memberId: string;
      data: UpdateMemberRoleRequest;
    }) => updateMemberRoleAPI(chatId, memberId, data),
    onSuccess: (_, variables) => {
      // Invalidate group members list
      queryClient.invalidateQueries({
        queryKey: ['chats', variables.chatId, 'members'],
      });
    },
  });
};
