# User Details Navigation Fix

## Problem

When clicking on a DM chat header to navigate to UserDetailsScreen, the app was passing the chat/conversation ID instead of the actual user ID, resulting in a 404 error:

```
❌ API ERROR RESPONSE: 404 GET /users/47d31488-7eff-405b-81cc-2559e61bb440
Error Data: {
  "message": "User not found",
  "statusCode": 404,
  "errorCode": "NOT_FOUND"
}
```

## Root Cause

In direct message (DM) conversations:
- The `chatId` is the conversation ID (from `DirectConversation` table)
- The conversation ID is NOT the same as the user ID
- The frontend was incorrectly using `chatInfo?.id` (which is the conversation ID) as the user ID

## Solution

### Backend Changes

Updated the `ChatResponse` interface to include the other user's ID for DM conversations.

#### 1. Updated ChatResponse Interface (`/pulse-api/src/modules/chat/chat.service.ts`)

```typescript
export interface ChatResponse {
  id: string;
  name: string;
  avatar?: string | undefined;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isGroup: boolean;
  isOnline?: boolean | undefined;
  otherUserId?: string | undefined; // NEW: For DM conversations, the ID of the other user
}
```

#### 2. Updated getUserChats Method

Added `otherUserId` to the response when processing direct conversations:

```typescript
chats.push({
  id: conv.id,
  name: otherUser.name,
  avatar: otherUser.avatarUrl ?? undefined,
  lastMessage: lastMessage?.content || '',
  timestamp: lastMessage?.createdAt.toISOString() || conv.createdAt.toISOString(),
  unreadCount,
  isGroup: false,
  isOnline,
  otherUserId: otherUser.id, // Include the other user's ID
});
```

#### 3. Updated getChatById Method

Added `otherUserId` to the response for DM conversations:

```typescript
return {
  id: conversation.id,
  name: otherUser.name,
  avatar: otherUser.avatarUrl ?? undefined,
  lastMessage: lastMessage?.content || '',
  timestamp: lastMessage?.createdAt.toISOString() || conversation.createdAt.toISOString(),
  unreadCount,
  isGroup: false,
  isOnline: false,
  otherUserId: otherUser.id, // Include the other user's ID
};
```

### Frontend Changes

#### 1. Updated ChatResponse Interface (`/pulse/src/api/chat.ts`)

```typescript
export interface ChatResponse {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isGroup: boolean;
  isOnline?: boolean;
  otherUserId?: string; // NEW: For DM conversations, the ID of the other user
}
```

#### 2. Updated ChatScreen Navigation (`/pulse/src/screens/ChatScreen.tsx`)

Changed the `handleHeaderPress` function to use `otherUserId`:

```typescript
const handleHeaderPress = () => {
  if (isGroupChat) {
    navigation.navigate('GroupDetails', {
      groupId: chatId,
      groupName: groupName,
      groupAvatar: chatInfo?.avatar,
    });
  } else {
    // For DM, navigate to user details using the otherUserId from chatInfo
    const otherUserId = chatInfo?.otherUserId;
    if (!otherUserId) {
      console.error('No otherUserId found in chatInfo');
      return;
    }
    navigation.navigate('UserDetails', {
      userId: otherUserId,
    });
  }
};
```

## How It Works Now

### DM Conversation Flow

1. User opens a DM chat
2. Frontend fetches chat info: `GET /chats/:chatId`
3. Backend returns:
   ```json
   {
     "id": "conversation-uuid",
     "name": "John Doe",
     "avatar": "https://...",
     "isGroup": false,
     "otherUserId": "user-uuid-123"  // ← The actual user ID
   }
   ```
4. User clicks on header avatar
5. Frontend navigates to UserDetailsScreen with `userId: "user-uuid-123"`
6. UserDetailsScreen fetches: `GET /users/user-uuid-123`
7. ✅ User details load successfully

### Group Conversation Flow

1. User opens a group chat
2. Frontend fetches chat info: `GET /chats/:chatId`
3. Backend returns:
   ```json
   {
     "id": "group-uuid",
     "name": "Project Team",
     "avatar": "https://...",
     "isGroup": true
     // No otherUserId for groups
   }
   ```
4. User clicks on header avatar
5. Frontend navigates to GroupDetailsScreen with `groupId: "group-uuid"`
6. GroupDetailsScreen fetches: `GET /chats/group-uuid/members`
7. ✅ Group details load successfully

## Files Modified

### Backend
- `/pulse-api/src/modules/chat/chat.service.ts`
  - Updated `ChatResponse` interface
  - Updated `getUserChats()` method
  - Updated `getChatById()` method

### Frontend
- `/pulse/src/api/chat.ts`
  - Updated `ChatResponse` interface
- `/pulse/src/screens/ChatScreen.tsx`
  - Updated `handleHeaderPress()` function

## Testing Checklist

- [x] Backend returns `otherUserId` for DM conversations
- [x] Backend does NOT return `otherUserId` for group chats
- [x] Frontend receives `otherUserId` in chat info
- [x] Clicking DM chat header navigates to correct user
- [x] Clicking group chat header navigates to group details
- [x] UserDetailsScreen loads user data successfully
- [x] No 404 errors when navigating to user details

## Benefits

1. **Correct Navigation:** Users can now view profile details of their DM contacts
2. **Clean API:** Backend provides the necessary user ID directly
3. **No Workarounds:** No need to parse or guess user IDs
4. **Type Safe:** TypeScript interfaces ensure correct usage
5. **Backward Compatible:** Groups continue to work as before

## Summary

✅ **Fixed:** User details navigation now works correctly for DM conversations by including the `otherUserId` field in the chat response. The backend now explicitly provides the other user's ID, and the frontend uses it to navigate to the correct user profile.
