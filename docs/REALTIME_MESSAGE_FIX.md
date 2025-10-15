# Real-time Message Fix

## Problem
Messages were not appearing in real-time for the sender. When a user sent a message, they wouldn't see it update in their chat until they refreshed or received another message.

## Root Causes

### 1. Socket Room Mismatch
**Backend** was broadcasting to:
- `chatId` (e.g., `"abc-123"`)

**Users** were joining rooms with prefixes:
- `user:${userId}` for DMs
- `group:${groupId}` for groups

**Result:** Messages broadcast to `chatId` weren't reaching anyone because no one was in that room!

### 2. Frontend Not Joining Group Rooms
The ChatScreen component wasn't calling `socketManager.joinGroup()` when entering a group chat, so group messages weren't being received.

## Solutions

### 1. Fixed Backend Broadcasting

**File:** `/pulse-api/src/modules/chat/chat.controller.ts`

**Before:**
```typescript
// Broadcast to chat room (works for both DM and group)
io.to(chatId).emit('message:new', socketPayload);
```

**After:**
```typescript
if (group) {
  // For groups, broadcast to group room
  io.to(`group:${chatId}`).emit('message:new', socketPayload);
  console.log(`📡 Broadcasting to group:${chatId}`);
} else {
  // For DMs, send to both participants
  const conversation = await prisma.directConversation.findUnique({
    where: { id: chatId },
  });
  
  if (conversation) {
    io.to(`user:${conversation.userAId}`).emit('message:new', socketPayload);
    io.to(`user:${conversation.userBId}`).emit('message:new', socketPayload);
    console.log(`📡 Broadcasting to user:${conversation.userAId} and user:${conversation.userBId}`);
  }
}
```

### 2. Added Group Room Joining

**File:** `/src/screens/ChatScreen.tsx`

**Added:**
```typescript
// Join chat room for real-time updates
useEffect(() => {
  if (isGroupChat) {
    console.log('🔌 Joining group room:', chatId);
    socketManager.joinGroup(chatId);
    
    return () => {
      console.log('🔌 Leaving group room:', chatId);
      socketManager.leaveGroup(chatId);
    };
  }
}, [chatId, isGroupChat]);
```

## How Socket Rooms Work

### User Joins (Automatic)
When a user connects, they automatically join their personal room:
```typescript
socket.join(`user:${userId}`);
```

### Group Joins (Manual)
When a user opens a group chat, they must explicitly join:
```typescript
socket.emit('group:join', { groupId });
// Backend: socket.join(`group:${groupId}`);
```

### Message Broadcasting

#### For Direct Messages:
```
User A sends message → Backend broadcasts to:
  - user:${userA_id} ✅ (sender receives)
  - user:${userB_id} ✅ (recipient receives)
```

#### For Group Messages:
```
User A sends message → Backend broadcasts to:
  - group:${groupId} ✅ (all members in the room receive)
```

## Socket Room Structure

```
Socket Rooms:
├── user:user-123          (User A's personal room)
├── user:user-456          (User B's personal room)
├── group:group-789        (Group chat room)
└── group:group-abc        (Another group chat room)

When User A sends a DM to User B:
  → Broadcast to user:user-123 and user:user-456

When User A sends a group message:
  → Broadcast to group:group-789
```

## Message Flow

### Before Fix:

**DM:**
1. User A sends message
2. Backend broadcasts to `chatId` (e.g., `"dm-123"`)
3. ❌ No one is in room `"dm-123"`
4. ❌ Neither user receives the message

**Group:**
1. User A sends message
2. Backend broadcasts to `chatId` (e.g., `"group-456"`)
3. ❌ No one is in room `"group-456"` (they're in `"group:group-456"`)
4. ❌ No one receives the message

### After Fix:

**DM:**
1. User A sends message
2. Backend broadcasts to `user:user-A` and `user:user-B`
3. ✅ Both users are in their personal rooms
4. ✅ Both users receive the message in real-time

**Group:**
1. User A opens group chat
2. Frontend calls `socketManager.joinGroup(groupId)`
3. Backend adds user to `group:${groupId}` room
4. User A sends message
5. Backend broadcasts to `group:${groupId}`
6. ✅ All members in the room receive the message

## Testing

### Test DM Real-time:
1. Login as User A on Device 1
2. Login as User B on Device 2
3. User A sends message to User B
4. ✅ User A sees message immediately (no refresh needed)
5. ✅ User B receives message in real-time

### Test Group Real-time:
1. Login as User A on Device 1
2. Login as User B on Device 2
3. Both join the same group chat
4. User A sends message
5. ✅ User A sees message immediately
6. ✅ User B receives message in real-time

### Console Logs to Check:

**Frontend (ChatScreen):**
```
🔌 Joining group room: group-123
New message received: { message: {...}, tempId: '...' }
```

**Backend (chat.controller):**
```
📡 Broadcasting to group:group-123
// or
📡 Broadcasting to user:user-A and user:user-B
```

## Files Modified

### Backend:
- ✅ `/pulse-api/src/modules/chat/chat.controller.ts`
  - Fixed broadcasting to use correct room names
  - DMs: Broadcast to both user rooms
  - Groups: Broadcast to group room

### Frontend:
- ✅ `/src/screens/ChatScreen.tsx`
  - Added group room joining on mount
  - Added group room leaving on unmount

## Summary

✅ **Fixed:**
- Backend now broadcasts to correct socket rooms
- DMs broadcast to both participants' user rooms
- Groups broadcast to group room
- Frontend joins group rooms when opening group chats

✅ **Result:**
- Messages appear in real-time for sender
- Messages appear in real-time for recipients
- Both DMs and group chats work correctly
- No refresh needed to see new messages

The real-time messaging is now fully functional! 💬⚡
