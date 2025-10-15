// src/api/group.ts

import apiClient from './client';

// ============= Types matching backend API =============

export type GroupRole = 'ADMIN' | 'MEMBER';

export interface GroupMember {
  userId: string;
  role: GroupRole;
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: GroupMember[];
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  inviterId: string;
  token: string;
  inviteeEmail: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

// ============= Request/Response Types =============

export interface CreateGroupRequest {
  name: string;
  description?: string;
  avatarUrl?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string | null;
  avatarUrl?: string | null;
}

export interface AddMemberRequest {
  userId: string;
  role?: GroupRole;
}

export interface UpdateMemberRoleRequest {
  role: GroupRole;
}

export interface CreateInvitationRequest {
  email?: string;
  expiresInHours?: number;
}

export interface JoinGroupRequest {
  token: string;
}

export interface GetGroupsResponse {
  data: Group[];
}

/**
 * Create a new group
 * POST /api/groups
 */
export const createGroupAPI = async (
  data: CreateGroupRequest
): Promise<Group> => {
  const response = await apiClient.post<Group>('/groups', data);
  return response.data;
};

/**
 * Get all groups for current user
 * GET /api/groups/me
 */
export const getMyGroupsAPI = async (): Promise<GetGroupsResponse> => {
  const response = await apiClient.get<GetGroupsResponse>('/groups/me');
  return response.data;
};

/**
 * Get group by ID
 * GET /api/groups/:groupId
 */
export const getGroupAPI = async (groupId: string): Promise<Group> => {
  const response = await apiClient.get<Group>(`/groups/${groupId}`);
  return response.data;
};

/**
 * Update group info
 * PATCH /api/groups/:groupId
 */
export const updateGroupAPI = async (
  groupId: string,
  data: UpdateGroupRequest
): Promise<Group> => {
  const response = await apiClient.patch<Group>(`/groups/${groupId}`, data);
  return response.data;
};

/**
 * Delete group
 * DELETE /api/groups/:groupId
 */
export const deleteGroupAPI = async (groupId: string): Promise<void> => {
  await apiClient.delete(`/groups/${groupId}`);
};

/**
 * Add member to group
 * POST /api/groups/:groupId/members
 */
export const addGroupMemberAPI = async (
  groupId: string,
  data: AddMemberRequest
): Promise<Group> => {
  const response = await apiClient.post<Group>(`/groups/${groupId}/members`, data);
  return response.data;
};

/**
 * Update member role
 * PATCH /api/groups/:groupId/members/:userId
 */
export const updateMemberRoleAPI = async (
  groupId: string,
  userId: string,
  data: UpdateMemberRoleRequest
): Promise<Group> => {
  const response = await apiClient.patch<Group>(
    `/groups/${groupId}/members/${userId}`,
    data
  );
  return response.data;
};

/**
 * Remove member from group
 * DELETE /api/groups/:groupId/members/:userId
 */
export const removeGroupMemberAPI = async (
  groupId: string,
  userId: string
): Promise<Group> => {
  const response = await apiClient.delete<Group>(
    `/groups/${groupId}/members/${userId}`
  );
  return response.data;
};

/**
 * Create invitation
 * POST /api/groups/:groupId/invite
 */
export const createInvitationAPI = async (
  groupId: string,
  data: CreateInvitationRequest
): Promise<GroupInvitation> => {
  const response = await apiClient.post<GroupInvitation>(
    `/groups/${groupId}/invite`,
    data
  );
  return response.data;
};

/**
 * Join group with invitation token
 * POST /api/groups/:groupId/join
 */
export const joinGroupAPI = async (
  groupId: string,
  data: JoinGroupRequest
): Promise<Group> => {
  const response = await apiClient.post<Group>(`/groups/${groupId}/join`, data);
  return response.data;
};

// ============= Helper Functions =============

/**
 * Check if user is admin in group
 */
export const isGroupAdmin = (group: Group, userId: string): boolean => {
  const member = group.members.find(m => m.userId === userId);
  return member?.role === 'ADMIN';
};

/**
 * Get user's role in group
 */
export const getUserRole = (group: Group, userId: string): GroupRole | null => {
  const member = group.members.find(m => m.userId === userId);
  return member?.role || null;
};

/**
 * Check if user is member of group
 */
export const isGroupMember = (group: Group, userId: string): boolean => {
  return group.members.some(m => m.userId === userId);
};
