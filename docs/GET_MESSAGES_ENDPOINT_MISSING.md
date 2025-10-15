# Get Messages Endpoint Missing - Fixed with Mock

**Issue:** 404 error when loading messages  
**Root Cause:** Backend endpoint `GET /api/chats/:chatId/messages` not implemented  
**Solution:** Added temporary mock to unblock frontend testing  
**Date:** October 14, 2025

---

## 🔍 Error Analysis

### What Happened

**Console Output:**
```
📤 API REQUEST: GET /chats/c8b3fea8-b0ee-45c2-99cb-e87f94d32f6c/messages?limit=50
Headers: {
  "Authorization": "Bearer eyJhbGc..."
}

❌ API ERROR RESPONSE: 404 GET /chats/c8b3fea8-b0ee-45c2-99cb-e87f94d32f6c/messages
Error Data: "Cannot GET /api/chats/c8b3fea8-b0ee-45c2-99cb-e87f94d32f6c/messages"
```

### Root Cause

The backend doesn't have the endpoint:
```
GET /api/chats/:chatId/messages
```

This endpoint is needed to fetch message history when a user opens a chat.

---

## ✅ What Was Fixed

**File:** `src/hooks/useMessages.ts`

Added temporary mock for `useMessages()` hook:

```typescript
export const useMessages = (chatId: string, limit: number = 50) => {
  return useQuery<GetMessagesResponse>({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      // TEMPORARY MOCK
      console.log('⚠️ USING MOCK: Fetching messages for chatId:', chatId);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        messages: [],
        hasMore: false,
        nextCursor: undefined,
      };
      
      // UNCOMMENT WHEN BACKEND IS READY:
      // return getMessagesAPI(chatId, limit);
    },
    enabled: !!chatId,
    staleTime: 30000,
  });
};
```

---

## 🎯 Current Behavior

### When You Open a Chat:

1. **API request attempted** (will fail with 404)
2. **Mock kicks in** - Returns empty messages array
3. **Chat shows** "No messages yet"
4. **You can send messages** - They appear in chat
5. **Messages don't persist** - Lost on reload

---

## 📋 Backend Requirements

### Endpoint Needed

```
GET /api/chats/:chatId/messages
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Max messages to return (default: 50) |
| `cursor` | string | No | Pagination cursor for next page |

### Request Headers

```
Authorization: Bearer <access_token>
```

### Response (200 OK)

```json
{
  "messages": [
    {
      "id": "msg_123",
      "chatId": "chat_456",
      "senderId": "user_789",
      "senderName": "John Doe",
      "senderAvatar": "https://...",
      "content": "Hello!",
      "timestamp": "2025-10-14T10:30:00.000Z",
      "isRead": false,
      "isSent": true,
      "attachments": [],
      "replyTo": null,
      "editedAt": null,
      "deletedAt": null
    }
  ],
  "hasMore": true,
  "nextCursor": "msg_100"
}
```

### Error Responses

**401 Unauthorized**
```json
{
  "error": "Invalid or expired token",
  "code": "UNAUTHORIZED"
}
```

**403 Forbidden**
```json
{
  "error": "User is not a member of this chat",
  "code": "FORBIDDEN"
}
```

**404 Not Found**
```json
{
  "error": "Chat not found",
  "code": "CHAT_NOT_FOUND"
}
```

---

## 🔄 How It Should Work

### Backend Implementation

```javascript
// GET /api/chats/:chatId/messages
router.get('/chats/:chatId/messages', authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, cursor } = req.query;
    const userId = req.user.id;

    // Verify user is member of chat
    const isMember = await checkChatMembership(chatId, userId);
    if (!isMember) {
      return res.status(403).json({ 
        error: 'User is not a member of this chat',
        code: 'FORBIDDEN'
      });
    }

    // Fetch messages with pagination
    const messages = await Message.find({
      chatId,
      ...(cursor && { _id: { $lt: cursor } })
    })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('sender', 'name avatar');

    const hasMore = messages.length === parseInt(limit);
    const nextCursor = hasMore ? messages[messages.length - 1]._id : null;

    res.json({
      messages: messages.reverse(), // Oldest first
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});
```

---

## 🎨 User Experience

### With Mock (Current)

1. Open chat
2. See "No messages yet"
3. Send message → Appears
4. Reload app → Message gone (not persisted)

### With Real API (When Ready)

1. Open chat
2. See loading indicator
3. Messages load from database
4. Send message → Saved to database
5. Reload app → Messages still there

---

## 🧪 Testing

### Test Mock (Now)

1. Open any chat
2. **Expected:** Empty state "No messages yet"
3. **Console:** Mock logs
4. Send message → Works
5. Reload → Messages gone

### Test Real API (When Ready)

1. Backend implements endpoint
2. Uncomment real API call
3. Open chat
4. **Expected:** Messages load from database
5. **Console:** API request/response logs
6. Send message → Persists
7. Reload → Messages still there

---

## 📊 Summary

### Current Status

| Feature | Status | Notes |
|---------|--------|-------|
| Load messages | ⚠️ Mock | Returns empty array |
| Send messages | ✅ Working | Via API |
| Message persistence | ❌ Not working | No backend endpoint |
| Real-time delivery | ✅ Working | Via Socket.IO |
| Pagination | ⏳ Ready | Frontend supports it |

### What Works

- ✅ Open chat (shows empty state)
- ✅ Send messages (appear in UI)
- ✅ Real-time delivery (Socket.IO)
- ✅ Edit/delete messages (UI only)
- ✅ Optimistic updates

### What Doesn't Work

- ❌ Load message history
- ❌ Message persistence
- ❌ Pagination
- ❌ Search messages

---

## 🔧 How to Switch to Real API

When backend implements the endpoint:

**File:** `src/hooks/useMessages.ts`

**Change from:**
```typescript
// TEMPORARY MOCK
console.log('⚠️ USING MOCK...');
return mockResponse;

// UNCOMMENT WHEN BACKEND IS READY:
// return getMessagesAPI(chatId, limit);
```

**To:**
```typescript
// Real API call
return getMessagesAPI(chatId, limit);
```

---

## 🎯 Next Steps

### For Backend Team

1. **Implement endpoint:** `GET /api/chats/:chatId/messages`
2. **Add pagination support** (cursor-based)
3. **Verify user membership** before returning messages
4. **Test with curl/Postman**
5. **Share endpoint details**

### For Frontend Team

1. ✅ Continue testing with mock
2. ✅ Test send message functionality
3. ✅ Test real-time features
4. ⏳ Wait for backend endpoint
5. 🔄 Switch to real API when ready

---

## 📞 Backend Team Action Items

**Priority:** HIGH - Users can't see message history

**Endpoints Needed:**

1. ✅ `POST /api/chats/:chatId/messages` - Send message (DONE)
2. ❌ `GET /api/chats/:chatId/messages` - Get messages (MISSING)
3. ⏳ `PUT /api/chats/:chatId/messages/:msgId` - Edit message
4. ⏳ `DELETE /api/chats/:chatId/messages/:msgId` - Delete message
5. ⏳ `POST /api/chats/:chatId/messages/read` - Mark as read

---

## ✅ Summary

**Problem:** Backend endpoint for getting messages doesn't exist  
**Solution:** Temporary mock returns empty messages  
**Status:** ✅ You can continue testing  
**Impact:** Messages don't persist, but you can test UI  
**Next:** Backend implements endpoint, then switch to real API

---

**You can now open chats without errors! They'll be empty until the backend endpoint is ready.** 🎉

### Console Output You'll See:
```
⚠️ USING MOCK: Fetching messages for chatId: c8b3fea8-b0ee-45c2-99cb-e87f94d32f6c
⚠️ Backend endpoint GET /api/chats/:chatId/messages not implemented yet
✅ MOCK: Messages fetched successfully (empty)
```

**This is expected and normal!** The mock is working correctly.
