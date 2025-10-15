# Backend Chats API - Missing Endpoints Request

## Overview

The Chats API integration is complete for all 8 documented endpoints. However, to provide a complete chat experience, we need the following additional endpoints.

---

## 🔴 HIGH PRIORITY

### 1. Search Users (For Creating DMs)

**Endpoint:** `GET /api/users/search`

**Description:** Search for users to start a direct message conversation.

**Query Parameters:**
- `q` (string, required): Search query (min 2 characters)
- `limit` (number, optional): Max results (default: 20)

**Response:**
```json
{
  "users": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "avatar": "string",
      "isOnline": true
    }
  ]
}
```

**Example:**
```
GET /api/users/search?q=john&limit=10
```

**Error Responses:**
- `400 Bad Request` - Query too short (< 2 characters)
- `401 Unauthorized` - Invalid access token

**Notes:**
- Should search by name and email
- Exclude current user from results
- Should respect user privacy settings (if implemented)
- Consider rate limiting (e.g., max 10 requests per minute)

**Use Case:** When user taps "New Chat" button, they need to search for users to message.

---

### 2. Get Group Members

**Endpoint:** `GET /api/chats/:chatId/members`

**Description:** Retrieve list of all members in a group chat.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "members": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "avatar": "string",
      "role": "ADMIN" | "MEMBER",
      "joinedAt": "2025-10-13T10:00:00.000Z",
      "isOnline": true
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Not a member of the group
- `404 Not Found` - Group not found

**Notes:**
- Should include member role (ADMIN/MEMBER)
- Should include join date
- Should include online status
- Sort by: Admins first, then by join date

**Use Case:** Display group members in group settings/info screen.

---

### 3. Update Group Details

**Endpoint:** `PATCH /api/chats/:chatId`

**Description:** Update group name, description, or avatar.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "name": "string",          // Optional: New group name
  "description": "string",   // Optional: New description
  "avatar": "string"         // Optional: New avatar URL
}
```

**Response:**
```json
{
  "chat": {
    "id": "string",
    "name": "string",
    "avatar": "string",
    "description": "string",
    "lastMessage": "string",
    "timestamp": "string",
    "unreadCount": 0,
    "isGroup": true
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid data or group name too long
- `401 Unauthorized` - Only admins can update group details
- `404 Not Found` - Group not found

**Notes:**
- Only group admins should be able to update
- Group name should have max length (e.g., 100 characters)
- Should validate avatar URL if provided
- Should broadcast update to all group members via Socket.IO

**Use Case:** Edit group name/description/avatar in group settings.

---

## 🟡 MEDIUM PRIORITY

### 4. Promote/Demote Group Member

**Endpoint:** `PATCH /api/chats/:chatId/members/:memberId`

**Description:** Change a member's role (promote to admin or demote to member).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "role": "ADMIN" | "MEMBER"
}
```

**Response:**
```json
{
  "message": "Member role updated successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid role or cannot demote last admin
- `401 Unauthorized` - Only admins can change roles
- `404 Not Found` - Group or member not found

**Notes:**
- Only admins can promote/demote members
- Cannot demote the last admin (must have at least one admin)
- Should broadcast role change to all group members
- Consider logging role changes for audit trail

**Use Case:** Manage group admins in group settings.

---

### 5. Mute/Unmute Chat Notifications

**Endpoint:** `POST /api/chats/:chatId/mute`

**Description:** Mute or unmute notifications for a specific chat.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "duration": "1h" | "8h" | "24h" | "1w" | "forever" | null  // null to unmute
}
```

**Response:**
```json
{
  "mutedUntil": "2025-10-14T10:00:00.000Z" | null  // null if unmuted
}
```

**Error Responses:**
- `400 Bad Request` - Invalid duration
- `404 Not Found` - Chat not found

**Notes:**
- `null` duration means unmute
- Should store mute preference per user (not global)
- Should return `mutedUntil` timestamp for timed mutes
- `forever` means no expiration

**Use Case:** Mute noisy group chats or DMs temporarily.

---

### 6. Pin/Unpin Chat

**Endpoint:** `POST /api/chats/:chatId/pin`

**Description:** Pin or unpin a chat to keep it at the top of the list.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "pinned": true | false
}
```

**Response:**
```json
{
  "message": "Chat pinned successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Maximum pinned chats reached (e.g., limit to 3)
- `404 Not Found` - Chat not found

**Notes:**
- Should be per-user preference (not global)
- Consider limiting number of pinned chats (e.g., max 3)
- Pinned chats should appear at top of chat list
- Should include `isPinned` field in GET /api/chats response

**Use Case:** Keep important chats easily accessible.

---

### 7. Archive/Unarchive Chat

**Endpoint:** `POST /api/chats/:chatId/archive`

**Description:** Archive or unarchive a chat to hide it from main list.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "archived": true | false
}
```

**Response:**
```json
{
  "message": "Chat archived successfully"
}
```

**Error Responses:**
- `404 Not Found` - Chat not found

**Notes:**
- Should be per-user preference (not global)
- Archived chats should not appear in main list
- New messages in archived chats should unarchive them automatically
- Should include `isArchived` field in GET /api/chats response
- Consider separate endpoint: GET /api/chats/archived

**Use Case:** Declutter chat list without deleting conversations.

---

## 🟢 LOW PRIORITY (Nice to Have)

### 8. Get Chat Statistics

**Endpoint:** `GET /api/chats/:chatId/stats`

**Description:** Get statistics about a chat (for group info screen).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "memberCount": 15,
  "messageCount": 1234,
  "mediaCount": 56,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "createdBy": {
    "id": "string",
    "name": "string"
  }
}
```

**Use Case:** Display group statistics in info screen.

---

### 9. Transfer Group Ownership

**Endpoint:** `POST /api/chats/:chatId/transfer-ownership`

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
  "message": "Ownership transferred successfully"
}
```

**Error Responses:**
- `400 Bad Request` - New owner must be an admin
- `401 Unauthorized` - Only current owner can transfer
- `404 Not Found` - Group or user not found

**Notes:**
- Only the group creator/owner can transfer ownership
- New owner must already be an admin
- Should notify new owner

**Use Case:** When group creator wants to step down.

---

### 10. Bulk Operations

**Endpoint:** `POST /api/chats/bulk-actions`

**Description:** Perform bulk operations on multiple chats.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "action": "read" | "delete" | "archive" | "mute",
  "chatIds": ["string"],
  "options": {
    "duration": "1h"  // For mute action
  }
}
```

**Response:**
```json
{
  "success": 8,
  "failed": 2,
  "errors": [
    {
      "chatId": "string",
      "error": "Chat not found"
    }
  ]
}
```

**Use Case:** Mark all as read, delete multiple chats, etc.

---

## 🔄 Modifications to Existing Endpoints

### Update GET /api/chats Response

**Current Response:**
```json
{
  "chats": [
    {
      "id": "string",
      "name": "string",
      "avatar": "string",
      "lastMessage": "string",
      "timestamp": "string",
      "unreadCount": 0,
      "isGroup": false,
      "isOnline": true
    }
  ]
}
```

**Suggested Additions:**
```json
{
  "chats": [
    {
      "id": "string",
      "name": "string",
      "avatar": "string",
      "lastMessage": "string",
      "timestamp": "string",
      "unreadCount": 0,
      "isGroup": false,
      "isOnline": true,
      
      // NEW FIELDS
      "isPinned": false,           // Is chat pinned by user
      "isArchived": false,         // Is chat archived by user
      "isMuted": false,            // Is chat muted
      "mutedUntil": null,          // Mute expiration (ISO 8601 or null)
      "lastMessageSender": "John", // Name of last message sender
      "memberCount": 5,            // For groups: number of members
      "role": "ADMIN"              // For groups: user's role in group
    }
  ]
}
```

**Benefits:**
- Reduces number of API calls
- Enables better UI (show mute icon, pin icon, etc.)
- Provides context for last message

---

## 📊 Additional Considerations

### Rate Limiting
Please implement rate limiting on:
- `/api/users/search` - 10 requests per minute per user
- `/api/chats/:chatId/members` - 30 requests per minute per user
- Bulk operations - 5 requests per minute per user

### Pagination
Consider adding pagination to:
- `GET /api/chats` - For users with many chats
  ```
  GET /api/chats?page=1&limit=20
  ```
- `GET /api/chats/:chatId/members` - For large groups
  ```
  GET /api/chats/:chatId/members?page=1&limit=50
  ```

### Filtering
Consider adding filters to `GET /api/chats`:
```
GET /api/chats?filter=unread      // Only unread chats
GET /api/chats?filter=groups      // Only groups
GET /api/chats?filter=dms         // Only DMs
GET /api/chats?filter=archived    // Only archived chats
```

### Sorting
Consider adding sort options to `GET /api/chats`:
```
GET /api/chats?sort=recent        // Default: by last message
GET /api/chats?sort=unread        // Unread first
GET /api/chats?sort=name          // Alphabetical
```

---

## 🔔 Socket.IO Events

Please ensure the following Socket.IO events are emitted:

### Chat Events
- `chat:created` - New chat created
- `chat:updated` - Chat details updated (name, avatar, etc.)
- `chat:deleted` - Chat deleted

### Member Events
- `member:added` - Member added to group
- `member:removed` - Member removed from group
- `member:role_changed` - Member role changed
- `member:left` - Member left group

### Status Events
- `chat:muted` - Chat muted by user
- `chat:pinned` - Chat pinned by user
- `chat:archived` - Chat archived by user

---

## 🎯 Implementation Priority

### Phase 1 (Immediate - Week 1)
1. Search Users
2. Get Group Members
3. Update Group Details

### Phase 2 (Next Sprint - Week 2-3)
4. Promote/Demote Member
5. Mute/Unmute Chat
6. Pin/Unpin Chat

### Phase 3 (Future - Week 4+)
7. Archive/Unarchive Chat
8. Chat Statistics
9. Transfer Ownership
10. Bulk Operations

---

## 📝 Questions for Backend Team

1. **Group Permissions:**
   - Can members add other members, or only admins?
   - Can members remove themselves (leave), or only admins can remove?

2. **Chat Limits:**
   - Is there a limit on group size (max members)?
   - Is there a limit on number of chats per user?

3. **Data Retention:**
   - When a user deletes a chat, is it soft-deleted or hard-deleted?
   - Are messages retained after chat deletion?

4. **Privacy:**
   - Can users hide their online status?
   - Can users block other users from messaging them?

5. **Notifications:**
   - Are push notifications handled by backend?
   - Should we send notification preferences via API?

---

## 📧 Contact

For questions or clarifications, please reach out to the frontend team.

Thank you! 🙏
