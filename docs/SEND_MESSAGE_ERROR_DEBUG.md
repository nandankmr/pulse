# Send Message Error - Debugging Guide

**Error:** "Failed to send message" when clicking send icon  
**Date:** October 14, 2025

---

## 🔍 Possible Causes

### 1. **Backend Not Running**
The backend server might not be running on `localhost:3000`.

**Check:**
```bash
# Test if backend is accessible
curl http://localhost:3000/api/health

# Or test from Android emulator
curl http://10.0.2.2:3000/api/health
```

**Solution:** Start your backend server
```bash
cd backend
npm start
```

---

### 2. **Send Message Endpoint Missing**
The `POST /chats/:id/messages` endpoint might not be implemented.

**Expected Endpoint:**
```
POST http://10.0.2.2:3000/api/chats/:chatId/messages
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "content": "Hello!",
  "attachments": [],
  "replyTo": null
}
```

**Test Manually:**
```bash
# Replace with actual chatId and token
curl -X POST http://localhost:3000/api/chats/chat_123/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"content":"Test message"}'
```

---

### 3. **Authentication Token Missing/Invalid**
The access token might be expired or not set.

**Check in Code:**
- Token is stored in Redux: `state.auth.accessToken`
- Token is added to headers in `src/api/client.ts`

---

### 4. **CORS Issues**
Backend might not allow requests from the app.

**Backend CORS Config Needed:**
```javascript
// backend/server.js
app.use(cors({
  origin: '*', // For development
  credentials: true
}));
```

---

### 5. **Wrong Chat ID**
The `chatId` parameter might be invalid or not exist.

**Check:**
- Where does `chatId` come from?
- Is it passed correctly from navigation params?

---

## 🛠️ Debugging Steps

### Step 1: Check React Native Logs
```bash
# Android logs
npx react-native log-android

# Look for console.log output:
# "Sending message to chatId: xxx, content: xxx"
# "Failed to send message: ..."
# "Error details: ..."
```

### Step 2: Check Network Request
The app should make this request:
```
POST http://10.0.2.2:3000/api/chats/:chatId/messages
```

**Check:**
- Is the URL correct?
- Is the token in headers?
- What's the response status code?

### Step 3: Check Backend Logs
```bash
# In backend terminal
# Should see incoming POST request
# Check for any errors
```

---

## 🔧 Quick Fix Options

### Option 1: Add Temporary Mock (For Testing)

If backend isn't ready, add a mock response:

**File:** `src/hooks/useMessages.ts`

```typescript
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendMessageRequest) => {
      // TEMPORARY: Mock response for testing
      console.log('MOCK: Sending message', data);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        message: {
          id: `msg_${Date.now()}`,
          chatId: data.chatId,
          senderId: 'current-user',
          senderName: 'You',
          content: data.content,
          timestamp: new Date().toISOString(),
          isRead: false,
          isSent: true,
          attachments: data.attachments || [],
        }
      };
      
      // UNCOMMENT when backend is ready:
      // return sendMessageAPI(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};
```

### Option 2: Check Backend Implementation

**Backend needs this endpoint:**

```javascript
// backend/routes/messages.js
router.post('/chats/:chatId/messages', authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, attachments, replyTo } = req.body;
    const userId = req.user.id; // From auth middleware

    // Create message in database
    const message = await Message.create({
      chatId,
      senderId: userId,
      content,
      attachments,
      replyTo,
      timestamp: new Date(),
    });

    // Broadcast via Socket.IO
    io.to(chatId).emit('message:new', {
      message: message,
      messageId: message.id,
      conversationId: chatId,
      senderId: userId,
      senderName: req.user.name,
      senderAvatar: req.user.avatar,
      content: content,
      timestamp: message.timestamp,
      attachments: attachments,
    });

    res.json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});
```

---

## 📋 Backend Checklist

Make sure your backend has:

- [ ] `POST /api/chats/:chatId/messages` endpoint
- [ ] Authentication middleware to get user ID
- [ ] CORS enabled for development
- [ ] Socket.IO configured and running
- [ ] Database connection working
- [ ] Error handling and logging

---

## 🧪 Test Scenarios

### Test 1: Backend Health
```bash
curl http://localhost:3000/api/health
# Should return 200 OK
```

### Test 2: Authentication
```bash
# Login first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Should return access token
```

### Test 3: Send Message
```bash
# Use token from Test 2
curl -X POST http://localhost:3000/api/chats/chat_123/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"content":"Test message"}'

# Should return created message
```

---

## 🎯 Most Likely Issue

Based on the error, the most likely cause is:

**Backend send message endpoint is not implemented or not accessible**

### Immediate Actions:

1. **Check if backend is running**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Check backend logs** for any errors

3. **Verify endpoint exists**
   - Check backend routes
   - Look for `/chats/:chatId/messages` POST handler

4. **Test with curl** to isolate frontend vs backend issue

5. **Use temporary mock** (Option 1 above) to continue frontend development

---

## 📞 Next Steps

1. **Check React Native logs** - Look for detailed error
2. **Check backend logs** - See if request is reaching server
3. **Test endpoint manually** - Use curl or Postman
4. **Add mock if needed** - Continue development while backend is fixed
5. **Verify authentication** - Make sure token is valid

---

## 🔍 Expected Console Output

When you click send, you should see:
```
Sending message to chatId: chat_123, content: Hello!
POST http://10.0.2.2:3000/api/chats/chat_123/messages
```

If you see an error, it will show:
```
Failed to send message: [error details]
Error details: { ... }
```

**Check these logs to identify the exact issue!**

---

## ✅ Success Indicators

You'll know it's working when:
- No error alert appears
- Message stays in chat (not removed)
- Message shows checkmark (isSent: true)
- Backend logs show POST request
- Socket.IO broadcasts to other clients

---

**Run the debugging steps above and share the error details from console logs!**
