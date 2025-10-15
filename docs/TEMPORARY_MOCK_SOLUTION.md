# Temporary Mock Solution for Send Message

**Issue:** Backend send message endpoint not ready  
**Solution:** Use temporary mock until backend is implemented

---

## 🎯 Quick Fix

I've added better error logging to help debug. Here's what to do:

### Option 1: Use Temporary Mock (Recommended for Testing)

Replace the `useSendMessage` hook with a mock version:

**File:** `src/hooks/useMessages.ts`

Find this function and replace it:

```typescript
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendMessageRequest) => {
      // TEMPORARY MOCK - Remove when backend is ready
      console.log('🔵 MOCK: Sending message', data);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock successful response
      return {
        message: {
          id: `msg_${Date.now()}`,
          chatId: data.chatId,
          senderId: 'current-user',
          senderName: 'You',
          senderAvatar: undefined,
          content: data.content,
          timestamp: new Date().toISOString(),
          isRead: false,
          isSent: true,
          attachments: data.attachments || [],
        }
      };
      
      // REAL API CALL (Uncomment when backend is ready):
      // return sendMessageAPI(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};
```

**This will:**
- ✅ Allow you to test the UI
- ✅ Show messages being sent
- ✅ Simulate network delay
- ✅ No errors
- ⚠️ Won't actually save to backend
- ⚠️ Won't sync to other devices

---

### Option 2: Debug the Real Issue

Check the console logs in your app:

1. **Open React Native debugger** or check Metro bundler logs
2. **Look for these logs:**
   ```
   Sending message to chatId: xxx, content: xxx
   Failed to send message: [error]
   Error details: {...}
   ```

3. **Common errors:**
   - `Network request failed` → Backend not running
   - `404 Not Found` → Endpoint doesn't exist
   - `401 Unauthorized` → Token invalid/missing
   - `500 Internal Server Error` → Backend error

---

## 🔧 Backend Requirements

For the real API to work, your backend needs:

### 1. Endpoint Implementation

```javascript
// POST /api/chats/:chatId/messages
router.post('/chats/:chatId/messages', authenticate, async (req, res) => {
  const { chatId } = req.params;
  const { content, attachments, replyTo } = req.body;
  const userId = req.user.id;

  const message = await createMessage({
    chatId,
    senderId: userId,
    content,
    attachments,
    replyTo,
  });

  // Broadcast via Socket.IO
  io.to(chatId).emit('message:new', {
    message,
    messageId: message.id,
    conversationId: chatId,
    senderId: userId,
    senderName: req.user.name,
    content,
    timestamp: message.timestamp,
    attachments,
  });

  res.json({ message });
});
```

### 2. Expected Request

```
POST http://10.0.2.2:3000/api/chats/:chatId/messages
Headers:
  Content-Type: application/json
  Authorization: Bearer <token>

Body:
{
  "content": "Hello!",
  "attachments": [],
  "replyTo": null
}
```

### 3. Expected Response

```json
{
  "message": {
    "id": "msg_123",
    "chatId": "chat_456",
    "senderId": "user_789",
    "senderName": "John Doe",
    "senderAvatar": "https://...",
    "content": "Hello!",
    "timestamp": "2025-10-14T10:30:00Z",
    "isRead": false,
    "isSent": true,
    "attachments": []
  }
}
```

---

## 🧪 Testing Steps

### With Mock (Option 1):
1. Apply the mock code above
2. Reload app
3. Try sending a message
4. Should work without errors
5. Message appears in chat

### With Real Backend (Option 2):
1. Start backend: `cd backend && npm start`
2. Test endpoint: `curl http://localhost:3000/api/health`
3. Check if send message endpoint exists
4. Try sending from app
5. Check backend logs for errors

---

## 📊 Decision Matrix

| Scenario | Solution |
|----------|----------|
| Backend not ready | Use Option 1 (Mock) |
| Backend ready but not working | Use Option 2 (Debug) |
| Want to test UI only | Use Option 1 (Mock) |
| Need real data sync | Fix backend, use real API |

---

## ✅ Recommended Approach

**For Now:**
1. Use the mock (Option 1) to continue UI testing
2. Share backend logs with backend team
3. Once backend is ready, uncomment the real API call

**For Production:**
1. Backend implements the endpoint
2. Test with curl/Postman
3. Remove mock, use real API
4. Test end-to-end

---

## 🎯 Next Steps

1. **Try the mock solution** to unblock your testing
2. **Check console logs** for detailed error
3. **Share error details** with backend team
4. **Test backend endpoint** independently
5. **Switch to real API** when backend is ready

---

**The mock will let you continue testing the UI while the backend team implements the endpoint!**
