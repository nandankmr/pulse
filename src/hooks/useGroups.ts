// src/hooks/useGroups.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyGroupsAPI,
  getGroupAPI,
  createGroupAPI,
  updateGroupAPI,
  deleteGroupAPI,
  addGroupMemberAPI,
  updateMemberRoleAPI,
  removeGroupMemberAPI,
  createInvitationAPI,
  joinGroupAPI,
  CreateGroupRequest,
  UpdateGroupRequest,
  AddMemberRequest,
  UpdateMemberRoleRequest,
  CreateInvitationRequest,
  JoinGroupRequest,
} from '../api/group';

/**
 * Query keys for group-related queries
 */
export const groupKeys = {
  all: ['groups'] as const,
  lists: () => [...groupKeys.all, 'list'] as const,
  list: () => [...groupKeys.lists()] as const,
  details: () => [...groupKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupKeys.details(), id] as const,
};

/**
 * Hook to fetch all groups for current user
 */
export const useMyGroups = () => {
  return useQuery({
    queryKey: groupKeys.list(),
    queryFn: getMyGroupsAPI,
  });
};

/**
 * Hook to fetch a specific group by ID
 */
export const useGroup = (groupId: string) => {
  return useQuery({
    queryKey: groupKeys.detail(groupId),
    queryFn: () => getGroupAPI(groupId),
    enabled: !!groupId,
  });
};

/**
 * Hook to create a new group
 */
export const useCreateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGroupRequest) => createGroupAPI(data),
    onSuccess: (newGroup) => {
      // Add the new group to the list
      queryClient.setQueryData(groupKeys.list(), (old: any) => {
        if (!old) return { data: [newGroup] };
        return {
          data: [newGroup, ...old.data],
        };
      });

      // Cache the new group details
      queryClient.setQueryData(groupKeys.detail(newGroup.id), newGroup);

      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

/**
 * Hook to update group details
 */
export const useUpdateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: UpdateGroupRequest }) =>
      updateGroupAPI(groupId, data),
    onSuccess: (updatedGroup, { groupId }) => {
      // Update the group in the list
      queryClient.setQueryData(groupKeys.list(), (old: any) => {
        if (!old) return old;
        return {
          data: old.data.map((group: any) =>
            group.id === groupId ? updatedGroup : group
          ),
        };
      });

      // Update the specific group detail
      queryClient.setQueryData(groupKeys.detail(groupId), updatedGroup);
    },
  });
};

/**
 * Hook to delete a group
 */
export const useDeleteGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => deleteGroupAPI(groupId),
    onSuccess: (_, groupId) => {
      // Remove the group from the list
      queryClient.setQueryData(groupKeys.list(), (old: any) => {
        if (!old) return old;
        return {
          data: old.data.filter((group: any) => group.id !== groupId),
        };
      });

      // Remove the group detail from cache
      queryClient.removeQueries({ queryKey: groupKeys.detail(groupId) });

      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

/**
 * Hook to add a member to a group
 */
export const useAddGroupMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: AddMemberRequest }) =>
      addGroupMemberAPI(groupId, data),
    onSuccess: (updatedGroup, { groupId }) => {
      // Update the group in the list
      queryClient.setQueryData(groupKeys.list(), (old: any) => {
        if (!old) return old;
        return {
          data: old.data.map((group: any) =>
            group.id === groupId ? updatedGroup : group
          ),
        };
      });

      // Update the specific group detail
      queryClient.setQueryData(groupKeys.detail(groupId), updatedGroup);
    },
  });
};

/**
 * Hook to update a member's role
 */
export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      userId,
      data,
    }: {
      groupId: string;
      userId: string;
      data: UpdateMemberRoleRequest;
    }) => updateMemberRoleAPI(groupId, userId, data),
    onSuccess: (updatedGroup, { groupId }) => {
      // Update the group in the list
      queryClient.setQueryData(groupKeys.list(), (old: any) => {
        if (!old) return old;
        return {
          data: old.data.map((group: any) =>
            group.id === groupId ? updatedGroup : group
          ),
        };
      });

      // Update the specific group detail
      queryClient.setQueryData(groupKeys.detail(groupId), updatedGroup);
    },
  });
};

/**
 * Hook to remove a member from a group
 */
export const useRemoveGroupMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      removeGroupMemberAPI(groupId, userId),
    onSuccess: (updatedGroup, { groupId }) => {
      // Update the group in the list
      queryClient.setQueryData(groupKeys.list(), (old: any) => {
        if (!old) return old;
        return {
          data: old.data.map((group: any) =>
            group.id === groupId ? updatedGroup : group
          ),
        };
      });

      // Update the specific group detail
      queryClient.setQueryData(groupKeys.detail(groupId), updatedGroup);
    },
  });
};

/**
 * Hook to create an invitation
 */
export const useCreateInvitation = () => {
  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: CreateInvitationRequest }) =>
      createInvitationAPI(groupId, data),
  });
};

/**
 * Hook to join a group with invitation token
 */
export const useJoinGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: JoinGroupRequest }) =>
      joinGroupAPI(groupId, data),
    onSuccess: (joinedGroup) => {
      // Add the joined group to the list
      queryClient.setQueryData(groupKeys.list(), (old: any) => {
        if (!old) return { data: [joinedGroup] };
        
        // Check if group already exists in list
        const exists = old.data.some((g: any) => g.id === joinedGroup.id);
        if (exists) {
          return {
            data: old.data.map((g: any) =>
              g.id === joinedGroup.id ? joinedGroup : g
            ),
          };
        }
        
        return {
          data: [joinedGroup, ...old.data],
        };
      });

      // Cache the joined group details
      queryClient.setQueryData(groupKeys.detail(joinedGroup.id), joinedGroup);

      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};
