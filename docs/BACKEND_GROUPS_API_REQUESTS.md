# Backend Groups API - Missing Endpoints & Recommendations

## Overview

The Groups API integration is complete for all 10 documented endpoints. However, to provide a complete group management experience, we need the following additional endpoints and enhancements.

---

## 🔴 HIGH PRIORITY

### 1. Get Group Members with User Details

**Current Issue:** The `GET /api/groups/:groupId` endpoint returns members array with only:
```json
{
  "userId": "string",
  "role": "ADMIN|MEMBER",
  "joinedAt": "string"
}
```

**Missing:** User details (name, email, avatar, isOnline status)

**Suggested Solution A:** Expand members in existing endpoint
```json
{
  "members": [
    {
      "userId": "string",
      "role": "ADMIN|MEMBER",
      "joinedAt": "string",
      "user": {
        "id": "string",
        "name": "string",
        "email": "string",
        "avatarUrl": "string",
        "isOnline": boolean
      }
    }
  ]
}
```

**Suggested Solution B:** Add separate endpoint
```
GET /api/groups/:groupId/members
```

**Response:**
```json
{
  "members": [
    {
      "userId": "string",
      "name": "string",
      "email": "string",
      "avatarUrl": "string",
      "role": "ADMIN|MEMBER",
      "joinedAt": "string",
      "isOnline": boolean
    }
  ]
}
```

**Use Case:** Display member names and avatars in group settings screen

**Recommendation:** Solution A (expand in existing endpoint) is preferred for fewer API calls

---

### 2. Search Users (For Adding Members)

**Endpoint:** `GET /api/users/search`

**Description:** Search for users to add to groups.

**Query Parameters:**
- `q` (string, required): Search query (min 2 characters)
- `limit` (number, optional): Max results (default: 20)
- `excludeGroupId` (string, optional): Exclude users already in this group

**Response:**
```json
{
  "users": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "avatarUrl": "string",
      "isOnline": boolean
    }
  ]
}
```

**Example:**
```
GET /api/users/search?q=john&limit=10&excludeGroupId=group-123
```

**Error Responses:**
- `400 Bad Request` - Query too short (< 2 characters)
- `401 Unauthorized` - Invalid access token

**Notes:**
- Should search by name and email
- Exclude current user from results
- Consider rate limiting (e.g., max 10 requests per minute)
- Respect user privacy settings if implemented

**Use Case:** When admin wants to add members to group, they need to search for users

---

### 3. Bulk Add Members

**Current Issue:** Can only add one member at a time via `POST /api/groups/:groupId/members`

**Endpoint:** `POST /api/groups/:groupId/members/bulk`

**Description:** Add multiple members to group in one request.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "members": [
    {
      "userId": "string",
      "role": "ADMIN|MEMBER"  // Optional, default: MEMBER
    }
  ]
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string|null",
  "avatarUrl": "string|null",
  "createdBy": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "members": [...]  // Updated members array
}
```

**Error Responses:**
- `400 Bad Request` - Invalid data or empty members array
- `401 Unauthorized` - Only admins can add members
- `404 Not Found` - Group not found
- `409 Conflict` - One or more users already members (return which ones)

**Notes:**
- Should validate all userIds before adding any
- Should be atomic (all succeed or all fail) OR return partial success with errors
- Should handle duplicate userIds in request
- Should skip users already in group (don't error)

**Use Case:** When creating a group or adding multiple members at once

---

## 🟡 MEDIUM PRIORITY

### 4. Transfer Group Ownership

**Endpoint:** `POST /api/groups/:groupId/transfer-ownership`

**Description:** Transfer group ownership to another admin.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "newOwnerId": "string"  // Must be an existing admin
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string|null",
  "avatarUrl": "string|null",
  "createdBy": "string",  // Updated to newOwnerId
  "createdAt": "string",
  "updatedAt": "string",
  "members": [...]
}
```

**Error Responses:**
- `400 Bad Request` - New owner must be an admin
- `401 Unauthorized` - Only current owner can transfer
- `404 Not Found` - Group or user not found

**Notes:**
- Only the group creator (createdBy) can transfer ownership
- New owner must already be an admin in the group
- Should notify new owner via notification/email

**Use Case:** When group creator wants to step down or leave

---

### 5. Get Group Statistics

**Endpoint:** `GET /api/groups/:groupId/stats`

**Description:** Get statistics about a group.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "memberCount": 15,
  "adminCount": 3,
  "messageCount": 1234,
  "mediaCount": 56,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "lastActivityAt": "2025-10-13T10:00:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Not a member of the group
- `404 Not Found` - Group not found

**Use Case:** Display group statistics in info screen

---

### 6. List Group Invitations

**Endpoint:** `GET /api/groups/:groupId/invitations`

**Description:** List all active invitations for a group.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `status` (string, optional): Filter by status ('active', 'expired', 'accepted')

**Response:**
```json
{
  "invitations": [
    {
      "id": "string",
      "groupId": "string",
      "inviterId": "string",
      "token": "string",
      "inviteeEmail": "string|null",
      "expiresAt": "string",
      "acceptedAt": "string|null",
      "createdAt": "string"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Only admins can view invitations
- `404 Not Found` - Group not found

**Use Case:** View and manage active invitations

---

### 7. Revoke Invitation

**Endpoint:** `DELETE /api/groups/:groupId/invitations/:invitationId`

**Description:** Revoke an active invitation.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "message": "Invitation revoked successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Only admins can revoke invitations
- `404 Not Found` - Invitation not found

**Use Case:** Cancel an invitation before it's used

---

## 🟢 LOW PRIORITY (Nice to Have)

### 8. Get Group Activity Log

**Endpoint:** `GET /api/groups/:groupId/activity`

**Description:** Get activity log for a group (member joins, leaves, role changes, etc.).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `limit` (number, optional): Max results (default: 50)
- `offset` (number, optional): Pagination offset

**Response:**
```json
{
  "activities": [
    {
      "id": "string",
      "groupId": "string",
      "userId": "string",
      "action": "MEMBER_JOINED|MEMBER_LEFT|MEMBER_ADDED|MEMBER_REMOVED|ROLE_CHANGED|GROUP_UPDATED|GROUP_CREATED",
      "metadata": {
        "targetUserId": "string",
        "oldRole": "MEMBER",
        "newRole": "ADMIN"
      },
      "createdAt": "string"
    }
  ],
  "total": 123,
  "hasMore": true
}
```

**Use Case:** Show group activity feed

---

### 9. Batch Update Member Roles

**Endpoint:** `PATCH /api/groups/:groupId/members/batch`

**Description:** Update roles for multiple members at once.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "updates": [
    {
      "userId": "string",
      "role": "ADMIN|MEMBER"
    }
  ]
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string|null",
  "avatarUrl": "string|null",
  "createdBy": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "members": [...]  // Updated members array
}
```

**Use Case:** Promote/demote multiple members at once

---

### 10. Get User's Group Memberships

**Endpoint:** `GET /api/users/:userId/groups`

**Description:** Get all groups a specific user is a member of (public profile view).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "groups": [
    {
      "id": "string",
      "name": "string",
      "avatarUrl": "string|null",
      "memberCount": 15,
      "role": "ADMIN|MEMBER"
    }
  ]
}
```

**Notes:**
- Should only show public groups or groups the requester is also a member of
- Respect privacy settings

**Use Case:** View groups on user profile

---

## 🔄 Modifications to Existing Endpoints

### Update GET /api/groups/me Response

**Current Response:**
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string|null",
      "avatarUrl": "string|null",
      "createdBy": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "members": [...]
    }
  ]
}
```

**Suggested Additions:**
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string|null",
      "avatarUrl": "string|null",
      "createdBy": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "members": [...],
      
      // NEW FIELDS
      "memberCount": 15,           // Total member count
      "unreadCount": 5,            // Unread messages in group chat
      "lastActivityAt": "string",  // Last message/activity timestamp
      "myRole": "ADMIN|MEMBER",    // Current user's role
      "isMuted": false,            // Is group muted by user
      "isPinned": false            // Is group pinned by user
    }
  ]
}
```

**Benefits:**
- Reduces number of API calls
- Provides context for UI (show unread badge, mute icon, etc.)
- Shows user's role without searching members array

---

## 📊 Additional Considerations

### Pagination
Consider adding pagination to:
- `GET /api/groups/me` - For users in many groups
  ```
  GET /api/groups/me?page=1&limit=20
  ```
- `GET /api/groups/:groupId/members` - For large groups (if implemented)
  ```
  GET /api/groups/:groupId/members?page=1&limit=50
  ```

### Filtering & Sorting
Consider adding filters to `GET /api/groups/me`:
```
GET /api/groups/me?role=ADMIN        // Only groups where user is admin
GET /api/groups/me?sort=recent       // Sort by last activity
GET /api/groups/me?sort=name         // Sort alphabetically
GET /api/groups/me?sort=members      // Sort by member count
```

### Rate Limiting
Please implement rate limiting on:
- `/api/users/search` - 10 requests per minute per user
- `/api/groups/:groupId/invite` - 10 invitations per hour per group
- `/api/groups` (create) - 5 groups per hour per user
- `/api/groups/:groupId/members` (add) - 20 requests per hour per group

### Validation
- Group name: min 1 character, max 100 characters
- Group description: max 500 characters
- Invitation expiration: max 14 days (336 hours)
- Maximum members per group: Consider adding a limit (e.g., 500)

---

## 🔔 Socket.IO Events

Please ensure the following Socket.IO events are emitted:

### Group Events
- `group:created` - New group created
- `group:updated` - Group details updated
- `group:deleted` - Group deleted

### Member Events
- `group:member:added` - Member added to group
- `group:member:removed` - Member removed from group
- `group:member:role_changed` - Member role changed
- `group:member:joined` - Member joined via invitation
- `group:member:left` - Member left group

### Invitation Events
- `group:invitation:created` - New invitation created
- `group:invitation:revoked` - Invitation revoked
- `group:invitation:accepted` - Invitation accepted

**Event Payload Example:**
```json
{
  "groupId": "string",
  "userId": "string",
  "action": "member_added",
  "data": {
    "member": {
      "userId": "string",
      "role": "MEMBER",
      "joinedAt": "string"
    }
  },
  "timestamp": "string"
}
```

---

## 🎯 Implementation Priority

### Phase 1 (Immediate - Week 1)
1. Get Group Members with User Details (expand existing endpoint)
2. Search Users
3. Bulk Add Members

### Phase 2 (Next Sprint - Week 2-3)
4. Transfer Ownership
5. Group Statistics
6. List/Revoke Invitations

### Phase 3 (Future - Week 4+)
7. Activity Log
8. Batch Update Roles
9. User's Group Memberships
10. Enhanced GET /api/groups/me response

---

## 📝 Questions for Backend Team

1. **Group Limits:**
   - Is there a limit on number of groups per user?
   - Is there a limit on number of members per group?
   - Is there a limit on number of admins per group?

2. **Invitation Behavior:**
   - Can the same user be invited multiple times?
   - What happens to invitations when group is deleted?
   - Can invitations be reused after being accepted?

3. **Member Removal:**
   - What happens when the last admin leaves?
   - Can the group creator be removed?
   - What happens to group when all members leave?

4. **Role Changes:**
   - Can there be groups with no admins?
   - Can the group creator's role be changed?
   - Is there a minimum number of admins required?

5. **Integration with Chats:**
   - Does creating a group via Groups API also create a chat?
   - Does creating a group chat via Chats API also create a group?
   - How are the two systems synchronized?

6. **Data Retention:**
   - When a group is deleted, are messages retained?
   - When a member is removed, are their messages retained?
   - Are group invitations cleaned up automatically?

---

## 📧 Contact

For questions or clarifications, please reach out to the frontend team.

Thank you! 🙏
