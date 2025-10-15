# Send Message Button Fix

## Problem

When clicking the "Send Message" button in UserDetailsScreen, the app was trying to navigate directly to a chat using the user ID as the chat ID, resulting in a 404 error:

```
❌ API ERROR RESPONSE: 404 GET /chats/6da709d3-8064-425f-9170-62ee896e66d0
Error Data: {
  "message": "Chat not found",
  "statusCode": 404,
  "errorCode": "NOT_FOUND"
}
```

## Root Cause

The `handleStartChat` function was incorrectly navigating to a chat using the user ID directly:

```typescript
// ❌ WRONG
const handleStartChat = () => {
  navigation.navigate('Chat', { chatId: userId, isGroup: false });
};
```

**Issues:**
1. User ID ≠ Chat ID (conversation ID)
2. No conversation might exist yet between the two users
3. Need to create or find existing conversation first

## Solution

Updated the `handleStartChat` function to:
1. Call the `createChatAPI` with the recipient's user ID
2. Backend creates a new conversation OR returns existing one
3. Navigate to the chat using the returned conversation ID

### Changes Made

#### 1. Updated UserDetailsScreen (`/pulse/src/screens/UserDetailsScreen.tsx`)

**Added import:**
```typescript
import { createChatAPI } from '../api/chat';
```

**Updated handleStartChat function:**
```typescript
const handleStartChat = async () => {
  try {
    setLoading(true);
    // Create or get existing conversation
    const response = await createChatAPI({ recipientId: userId });
    
    // Navigate to the chat
    navigation.navigate('Chat', { 
      chatId: response.chat.id, 
      chatName: response.chat.name
    });
  } catch (err: any) {
    console.error('Error starting chat:', err);
    Alert.alert('Error', err.response?.data?.message || 'Failed to start chat');
  } finally {
    setLoading(false);
  }
};
```

#### 2. Updated Navigation Types (`/pulse/src/navigation/AppNavigator.tsx`)

Made `chatName` and `isGroup` optional in Chat route params:

```typescript
export type RootStackParamList = {
  // ... other routes
  Chat: { chatId: string; chatName?: string; isGroup?: boolean };
  // ... other routes
};
```

## How It Works Now

### Flow: Send Message from User Details

```
1. User clicks "Send Message" button
   ↓
2. Call createChatAPI({ recipientId: userId })
   ↓
3. Backend checks if conversation exists:
   - If exists → Return existing conversation
   - If not → Create new conversation
   ↓
4. Backend returns:
   {
     chat: {
       id: "conversation-uuid",
       name: "John Doe",
       avatar: "...",
       isGroup: false,
       otherUserId: "user-uuid"
     }
   }
   ↓
5. Navigate to Chat screen with conversation ID
   ↓
6. ✅ Chat screen loads successfully
```

### Backend Behavior (Already Implemented)

The `POST /chats` endpoint with `recipientId`:
- Checks if a conversation already exists between the two users
- If exists: Returns the existing conversation
- If not: Creates a new `DirectConversation` record
- Returns the conversation details

This is already implemented in `/pulse-api/src/modules/chat/chat.service.ts`:

```typescript
// Check if conversation already exists
const existingConv = await prisma.directConversation.findFirst({
  where: {
    OR: [
      { userAId: userId, userBId: data.recipientId },
      { userAId: data.recipientId, userBId: userId },
    ],
  },
});

if (existingConv) {
  // Return existing conversation
  return this.getChatById(existingConv.id, userId);
}

// Create new conversation
const conversation = await prisma.directConversation.create({
  data: {
    userAId: userId,
    userBId: data.recipientId,
  },
});
```

## Files Modified

### Frontend
- `/pulse/src/screens/UserDetailsScreen.tsx`
  - Added `createChatAPI` import
  - Updated `handleStartChat()` to create/get conversation
  - Added loading state during chat creation
  - Added error handling

- `/pulse/src/navigation/AppNavigator.tsx`
  - Updated `RootStackParamList` Chat route params

### Backend
- No changes needed (already handles create/get conversation)

## Testing Checklist

- [x] Click "Send Message" on user who has no existing conversation
  - [x] Creates new conversation
  - [x] Navigates to chat screen
  - [x] Chat screen loads successfully
  - [x] Can send messages

- [x] Click "Send Message" on user who has existing conversation
  - [x] Returns existing conversation
  - [x] Navigates to chat screen
  - [x] Shows previous messages
  - [x] Can continue conversation

- [x] Error handling
  - [x] Shows error alert if API fails
  - [x] Loading state shows during creation
  - [x] User can retry after error

## Benefits

1. **Correct Flow:** Properly creates or finds conversations
2. **No Duplicates:** Backend prevents duplicate conversations
3. **Better UX:** Loading state during creation
4. **Error Handling:** User-friendly error messages
5. **Idempotent:** Safe to call multiple times

## Related Features

This fix complements the previous User Details navigation fix:
- **Previous Fix:** Navigate from chat → user details (view profile)
- **This Fix:** Navigate from user details → chat (send message)

Together, these provide a complete user interaction flow:
```
Chat List → Chat Screen → User Details → Back to Chat
     ↑                          ↓
     └──────── Send Message ────┘
```

## Summary

✅ **Fixed:** The "Send Message" button now properly creates or retrieves a conversation before navigating to the chat screen. Users can now seamlessly start conversations from user profile pages.
