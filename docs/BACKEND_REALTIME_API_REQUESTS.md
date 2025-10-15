# Backend Socket.IO Realtime API - Missing Features & Recommendations

## Overview

The Socket.IO Messages & Realtime API integration is complete for all documented events. However, to provide a complete real-time messaging experience, we need the following additional events and features.

---

## 🔴 HIGH PRIORITY

### 1. Message Editing (Real-time)

**Current Issue:** No Socket.IO event for real-time message editing

**Client to Server Event:** `message:edit`

**Payload:**
```typescript
{
  messageId: string;          // Message ID to edit
  content: string;            // New content
  conversationId?: string;    // For DM
  groupId?: string;           // For group
}
```

**Server to Client Event:** `message:edited`

**Payload:**
```typescript
{
  messageId: string;
  content: string;
  editedAt: string;           // ISO timestamp
  conversationId?: string;
  groupId?: string;
}
```

**Use Case:** When user edits a message, all participants see the update in real-time

**Notes:**
- Should have edit time limit (e.g., 15 minutes)
- Should show "edited" indicator
- Should keep edit history (optional)

---

### 2. Message Deletion (Real-time)

**Current Issue:** No Socket.IO event for real-time message deletion

**Client to Server Event:** `message:delete`

**Payload:**
```typescript
{
  messageId: string;
  conversationId?: string;
  groupId?: string;
  deleteForEveryone?: boolean; // true = delete for all, false = delete for me only
}
```

**Server to Client Event:** `message:deleted`

**Payload:**
```typescript
{
  messageId: string;
  deletedBy: string;          // User ID who deleted
  deletedAt: string;
  conversationId?: string;
  groupId?: string;
  deleteForEveryone: boolean;
}
```

**Use Case:** When user deletes a message, others see it removed in real-time

**Notes:**
- "Delete for me" only removes locally
- "Delete for everyone" removes for all participants
- Should have time limit (e.g., 1 hour)
- Consider keeping message with "This message was deleted" placeholder

---

### 3. Message Reactions (Real-time)

**Current Issue:** No Socket.IO events for emoji reactions

**Client to Server Event:** `message:reaction:add`

**Payload:**
```typescript
{
  messageId: string;
  emoji: string;              // Emoji character or code
  conversationId?: string;
  groupId?: string;
}
```

**Client to Server Event:** `message:reaction:remove`

**Payload:**
```typescript
{
  messageId: string;
  emoji: string;
  conversationId?: string;
  groupId?: string;
}
```

**Server to Client Event:** `message:reaction:added`

**Payload:**
```typescript
{
  messageId: string;
  userId: string;             // User who reacted
  emoji: string;
  createdAt: string;
  conversationId?: string;
  groupId?: string;
}
```

**Server to Client Event:** `message:reaction:removed`

**Payload:**
```typescript
{
  messageId: string;
  userId: string;
  emoji: string;
  conversationId?: string;
  groupId?: string;
}
```

**Use Case:** Quick reactions to messages (like, love, laugh, etc.)

**Notes:**
- Multiple users can react with same emoji
- User can add multiple different emojis
- Should aggregate reactions (e.g., "👍 5")

---

### 4. Bulk Read Receipts

**Current Issue:** Can only mark one message at a time as read

**Enhancement:** Accept array of messageIds in `message:read` event

**Current Payload:**
```typescript
{
  messageId: string;          // Single message
  targetUserId?: string;
  groupId?: string;
}
```

**Suggested Payload:**
```typescript
{
  messageIds: string[];       // Array of message IDs
  targetUserId?: string;
  groupId?: string;
  readAt?: string;
}
```

**Use Case:** Mark all unread messages as read when opening a chat

**Benefits:**
- Reduces number of Socket.IO events
- More efficient for marking multiple messages
- Better performance

---

## 🟡 MEDIUM PRIORITY

### 5. File Upload Progress

**Event:** `upload:progress`

**Description:** Real-time upload progress for media files

**Server to Client Event:** `upload:progress`

**Payload:**
```typescript
{
  uploadId: string;           // Unique upload ID
  fileName: string;
  progress: number;           // 0-100
  bytesUploaded: number;
  totalBytes: number;
}
```

**Server to Client Event:** `upload:complete`

**Payload:**
```typescript
{
  uploadId: string;
  fileName: string;
  mediaUrl: string;           // Final URL
  fileSize: number;
}
```

**Server to Client Event:** `upload:failed`

**Payload:**
```typescript
{
  uploadId: string;
  fileName: string;
  error: string;
}
```

**Use Case:** Show progress bar when uploading images/videos/files

---

### 6. User Status (Custom Status Messages)

**Event:** `status:update`

**Description:** Set custom status message (e.g., "In a meeting", "On vacation")

**Client to Server Event:** `status:set`

**Payload:**
```typescript
{
  status: string;             // Status message
  emoji?: string;             // Optional emoji
  expiresAt?: string;         // Optional expiration
}
```

**Server to Client Event:** `status:updated`

**Payload:**
```typescript
{
  userId: string;
  status: string;
  emoji?: string;
  expiresAt?: string;
}
```

**Use Case:** Show custom status in user profile/chat list

---

### 7. Voice/Video Call Signaling

**Events for WebRTC:**

**Client to Server Events:**
- `call:offer` - Initiate call
- `call:answer` - Accept call
- `call:ice-candidate` - Exchange ICE candidates
- `call:reject` - Reject call
- `call:end` - End call

**Example Payloads:**

```typescript
// call:offer
{
  targetUserId: string;
  offer: RTCSessionDescriptionInit;
  callType: 'audio' | 'video';
}

// call:answer
{
  callId: string;
  answer: RTCSessionDescriptionInit;
}

// call:ice-candidate
{
  callId: string;
  candidate: RTCIceCandidateInit;
}
```

**Server to Client Events:**
- `call:incoming` - Receive call
- `call:accepted` - Call accepted
- `call:rejected` - Call rejected
- `call:ended` - Call ended
- `call:ice-candidate` - Receive ICE candidate

**Use Case:** Voice and video calling

---

### 8. Message Search Results (Real-time)

**Event:** `search:messages`

**Description:** Real-time message search

**Client to Server Event:** `search:messages`

**Payload:**
```typescript
{
  query: string;
  conversationId?: string;
  groupId?: string;
  limit?: number;
}
```

**Server to Client Event:** `search:results`

**Payload:**
```typescript
{
  query: string;
  results: Message[];
  hasMore: boolean;
}
```

**Use Case:** Search messages in a conversation

---

## 🟢 LOW PRIORITY (Nice to Have)

### 9. User Blocking (Real-time)

**Events:**
- `user:block` - Block a user
- `user:unblock` - Unblock a user
- `user:blocked` - Notification that you were blocked

**Payloads:**

```typescript
// user:block
{
  userId: string;             // User to block
}

// user:blocked (received)
{
  blockedBy: string;          // User who blocked you
}
```

**Use Case:** Block/unblock users, prevent messages from blocked users

---

### 10. Group Events (Real-time)

**Current Issue:** No real-time events for group changes

**Server to Client Events:**
- `group:member:added` - Member added to group
- `group:member:removed` - Member removed from group
- `group:member:role_changed` - Member role changed
- `group:updated` - Group details updated
- `group:deleted` - Group deleted

**Example Payloads:**

```typescript
// group:member:added
{
  groupId: string;
  userId: string;             // New member
  addedBy: string;            // Who added them
  role: 'ADMIN' | 'MEMBER';
}

// group:updated
{
  groupId: string;
  name?: string;
  description?: string;
  avatarUrl?: string;
  updatedBy: string;
}
```

**Use Case:** Real-time group management updates

---

### 11. Message Forwarding

**Event:** `message:forward`

**Description:** Forward message to another chat

**Client to Server Event:** `message:forward`

**Payload:**
```typescript
{
  messageId: string;          // Message to forward
  targetConversationId?: string;
  targetGroupId?: string;
}
```

**Use Case:** Forward messages between chats

---

### 12. Conversation Muting (Real-time)

**Events:**
- `conversation:mute`
- `conversation:unmute`

**Payloads:**

```typescript
{
  conversationId?: string;
  groupId?: string;
  mutedUntil?: string;        // ISO timestamp or null for forever
}
```

**Use Case:** Mute notifications for specific chats

---

### 13. Last Seen Timestamp

**Event:** `presence:last_seen`

**Description:** Get last seen timestamp for offline users

**Server to Client Event:** `presence:last_seen`

**Payload:**
```typescript
{
  userId: string;
  lastSeenAt: string;         // ISO timestamp
}
```

**Use Case:** Show "Last seen 5 minutes ago"

---

### 14. Message Pinning

**Events:**
- `message:pin` - Pin message in chat
- `message:unpin` - Unpin message

**Payloads:**

```typescript
{
  messageId: string;
  conversationId?: string;
  groupId?: string;
}
```

**Server to Client Event:** `message:pinned`

**Payload:**
```typescript
{
  messageId: string;
  pinnedBy: string;
  pinnedAt: string;
  conversationId?: string;
  groupId?: string;
}
```

**Use Case:** Pin important messages at top of chat

---

### 15. Broadcast Messages

**Event:** `message:broadcast`

**Description:** Send message to multiple chats at once

**Client to Server Event:** `message:broadcast`

**Payload:**
```typescript
{
  content: string;
  type: MessageType;
  conversationIds: string[];
  groupIds: string[];
}
```

**Use Case:** Send announcement to multiple groups

---

## 🔄 Enhancements to Existing Events

### 1. Message Acknowledgment with Retry

**Enhancement:** Add retry mechanism for failed messages

**Suggested:** Add `retryCount` field to acknowledgment

```typescript
interface SendMessageAck {
  status: 'ok' | 'error' | 'retry';
  error?: string;
  message?: SocketMessage;
  retryAfter?: number;        // Milliseconds to wait before retry
  retryCount?: number;        // Number of retries attempted
}
```

---

### 2. Typing Indicator with User Info

**Enhancement:** Include user name in typing events

**Current:**
```typescript
{
  userId: string;
  conversationId?: string;
  groupId?: string;
}
```

**Suggested:**
```typescript
{
  userId: string;
  userName: string;           // Add user name
  userAvatar?: string;        // Add user avatar
  conversationId?: string;
  groupId?: string;
}
```

**Benefit:** Can show "John is typing..." instead of just "Someone is typing..."

---

### 3. Message with Reply Context

**Enhancement:** Include replied message in `message:new` event

**Current:**
```typescript
interface SocketMessage {
  id: string;
  content?: string;
  // ...
}
```

**Suggested:**
```typescript
interface SocketMessage {
  id: string;
  content?: string;
  replyTo?: {
    messageId: string;
    content: string;
    senderId: string;
    senderName: string;
  };
  // ...
}
```

**Benefit:** Can show reply context without additional API call

---

### 4. Presence with Additional Info

**Enhancement:** Include more user info in presence updates

**Current:**
```typescript
{
  userId: string;
  status: 'online' | 'offline';
}
```

**Suggested:**
```typescript
{
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeenAt?: string;
  customStatus?: string;
}
```

---

## 📊 Performance Optimizations

### 1. Message Batching

**Suggestion:** Batch multiple messages in one event

Instead of emitting `message:new` for each message, batch them:

```typescript
// message:batch
{
  messages: SocketMessage[];
  conversationId?: string;
  groupId?: string;
}
```

**Use Case:** When user comes online and receives multiple missed messages

---

### 2. Pagination for Group Members

**Suggestion:** Paginate online users in large groups

```typescript
// presence:state with pagination
{
  onlineUserIds: string[];
  total: number;
  hasMore: boolean;
  cursor?: string;
}
```

---

### 3. Compression

**Suggestion:** Enable Socket.IO compression for large payloads

Server-side configuration:
```javascript
io.on('connection', (socket) => {
  socket.compress(true);
});
```

---

## 🔔 Notification Events

### Push Notification Tokens

**Event:** `notification:register`

**Description:** Register device for push notifications

**Client to Server Event:** `notification:register`

**Payload:**
```typescript
{
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  token: string;              // FCM/APNS token
}
```

**Use Case:** Register device for push notifications when offline

---

## 📝 Questions for Backend Team

1. **Message Editing:**
   - Is there a time limit for editing messages?
   - Should we keep edit history?
   - Can users edit messages in groups?

2. **Message Deletion:**
   - Is there a time limit for "delete for everyone"?
   - What happens to replies when original message is deleted?
   - Can admins delete any message in groups?

3. **Reactions:**
   - Is there a limit on number of reactions per message?
   - Which emojis are supported?
   - Can users react to their own messages?

4. **File Uploads:**
   - What's the maximum file size?
   - Which file types are supported?
   - Are files stored permanently or with expiration?

5. **Voice/Video Calls:**
   - Are calls peer-to-peer or server-mediated?
   - Is there a call duration limit?
   - Are calls recorded?

6. **Performance:**
   - What's the maximum number of users in a group?
   - Are there rate limits on Socket.IO events?
   - Is message batching supported?

---

## 🎯 Implementation Priority

### Phase 1 (Immediate - Week 1)
1. Message Editing (Real-time)
2. Message Deletion (Real-time)
3. Bulk Read Receipts

### Phase 2 (Next Sprint - Week 2-3)
4. Message Reactions
5. File Upload Progress
6. Group Events (Real-time)

### Phase 3 (Future - Week 4+)
7. Voice/Video Call Signaling
8. User Status
9. Message Search
10. User Blocking

---

## 📧 Contact

For questions or clarifications, please reach out to the frontend team.

Thank you! 🙏
