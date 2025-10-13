// src/api/group.ts

import apiClient from './client';

export interface CreateGroupRequest {
  name: string;
  description?: string;
  avatar?: string;
  isPrivate: boolean;
  memberIds: string[];
}

export interface CreateGroupResponse {
  group: Group;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  isPrivate: boolean;
  createdBy: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: 'admin' | 'member';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    isOnline: boolean;
  };
}

export interface GetGroupsResponse {
  groups: Group[];
}

export interface GetGroupMembersResponse {
  members: GroupMember[];
}

/**
 * Create a new group
 */
export const createGroupAPI = async (
  data: CreateGroupRequest
): Promise<CreateGroupResponse> => {
  const response = await apiClient.post<CreateGroupResponse>('/groups', data);
  return response.data;
};

/**
 * Get all groups for current user
 */
export const getGroupsAPI = async (): Promise<GetGroupsResponse> => {
  const response = await apiClient.get<GetGroupsResponse>('/groups');
  return response.data;
};

/**
 * Get group by ID
 */
export const getGroupByIdAPI = async (groupId: string): Promise<Group> => {
  const response = await apiClient.get<Group>(`/groups/${groupId}`);
  return response.data;
};

/**
 * Update group info
 */
export const updateGroupAPI = async (
  groupId: string,
  data: Partial<CreateGroupRequest>
): Promise<Group> => {
  const response = await apiClient.put<Group>(`/groups/${groupId}`, data);
  return response.data;
};

/**
 * Delete group
 */
export const deleteGroupAPI = async (groupId: string): Promise<void> => {
  await apiClient.delete(`/groups/${groupId}`);
};

/**
 * Get group members
 */
export const getGroupMembersAPI = async (
  groupId: string
): Promise<GetGroupMembersResponse> => {
  const response = await apiClient.get<GetGroupMembersResponse>(
    `/groups/${groupId}/members`
  );
  return response.data;
};

/**
 * Add members to group
 */
export const addGroupMembersAPI = async (
  groupId: string,
  userIds: string[]
): Promise<void> => {
  await apiClient.post(`/groups/${groupId}/members`, { userIds });
};

/**
 * Remove member from group
 */
export const removeMemberAPI = async (
  groupId: string,
  userId: string
): Promise<void> => {
  await apiClient.delete(`/groups/${groupId}/members/${userId}`);
};

/**
 * Update member role
 */
export const updateMemberRoleAPI = async (
  groupId: string,
  userId: string,
  role: 'admin' | 'member'
): Promise<void> => {
  await apiClient.put(`/groups/${groupId}/members/${userId}`, { role });
};

/**
 * Join a group (for public groups)
 */
export const joinGroupAPI = async (groupId: string): Promise<void> => {
  await apiClient.post(`/groups/${groupId}/join`);
};

/**
 * Leave a group
 */
export const leaveGroupAPI = async (groupId: string): Promise<void> => {
  await apiClient.post(`/groups/${groupId}/leave`);
};

/**
 * Invite users to group
 */
export const inviteToGroupAPI = async (
  groupId: string,
  userIds: string[]
): Promise<void> => {
  await apiClient.post(`/groups/${groupId}/invite`, { userIds });
};

/**
 * Search users (for adding to groups)
 */
export interface SearchUsersResponse {
  users: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    isOnline: boolean;
  }>;
}

export const searchUsersAPI = async (
  query: string
): Promise<SearchUsersResponse> => {
  const response = await apiClient.get<SearchUsersResponse>('/users/search', {
    params: { q: query },
  });
  return response.data;
};
