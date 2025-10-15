# Network Request Logging Enabled 🔍

**Date:** October 14, 2025  
**Status:** ✅ Temporary Logging Active  
**Purpose:** Debug API calls and responses

---

## ✅ What Was Added

**File:** `src/api/client.ts`

Added comprehensive logging to Axios interceptors:

### 1. **Request Logging** 📤
Logs every outgoing API request:
- HTTP method (GET, POST, PUT, DELETE)
- Full URL
- Request headers (including auth token)
- Request body (if present)
- Query parameters (if present)

### 2. **Response Logging** 📥
Logs every successful API response:
- HTTP status code (200, 201, etc.)
- HTTP method and URL
- Response data

### 3. **Error Logging** ❌
Logs all API errors:
- HTTP error responses (400, 401, 404, 500, etc.)
- Network errors (no response)
- Unexpected errors

---

## 📊 Console Output Examples

### Successful Request
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 API REQUEST: POST http://10.0.2.2:3000/api/chats/chat_123/messages
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGc..."
}
Body: {
  "content": "Hello!",
  "attachments": [],
  "replyTo": null
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 API RESPONSE: 200 POST http://10.0.2.2:3000/api/chats/chat_123/messages
Data: {
  "message": {
    "id": "msg_abc123",
    "chatId": "chat_123",
    "senderId": "user_789",
    "content": "Hello!",
    "timestamp": "2025-10-14T10:30:00.000Z"
  }
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Error Response
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 API REQUEST: POST http://10.0.2.2:3000/api/chats/invalid_id/messages
Headers: {...}
Body: {...}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ API ERROR RESPONSE: 404 POST http://10.0.2.2:3000/api/chats/invalid_id/messages
Error Data: {
  "error": "Chat not found",
  "code": "CHAT_NOT_FOUND"
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Network Error
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 API REQUEST: GET http://10.0.2.2:3000/api/chats
Headers: {...}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ NETWORK ERROR: No response received
Request: [XMLHttpRequest object]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔍 What You Can Debug

### 1. **API Endpoints**
- Verify correct URLs
- Check if backend is accessible
- Confirm endpoint paths

### 2. **Authentication**
- See if token is included
- Check token format
- Verify Authorization header

### 3. **Request Data**
- Inspect request body
- Check data format
- Verify required fields

### 4. **Response Data**
- See what backend returns
- Check response structure
- Verify data format

### 5. **Error Details**
- Exact error messages
- HTTP status codes
- Error response data

### 6. **Network Issues**
- Connection problems
- Timeout errors
- CORS issues

---

## 🎯 Use Cases

### Debugging Send Message
1. Send a message
2. Check console for:
   - `📤 API REQUEST: POST .../messages`
   - Request body with content
   - `📥 API RESPONSE: 200` (success)
   - Or `❌ API ERROR RESPONSE` (failure)

### Debugging Authentication
1. Try to login
2. Check console for:
   - `📤 API REQUEST: POST .../auth/login`
   - Request body with email/password
   - `📥 API RESPONSE: 200` with tokens
   - Or `❌ API ERROR RESPONSE: 401` (invalid credentials)

### Debugging Load Messages
1. Open a chat
2. Check console for:
   - `📤 API REQUEST: GET .../chats/:id/messages`
   - Authorization header present
   - `📥 API RESPONSE: 200` with messages array
   - Or error if chat not found

---

## 📱 How to View Logs

### Android Emulator
```bash
# In terminal
npx react-native log-android

# Or use React Native Debugger
# Or check Metro bundler logs
```

### iOS Simulator
```bash
# In terminal
npx react-native log-ios

# Or use Xcode console
```

### React Native Debugger
1. Open React Native Debugger
2. Enable "Show Console"
3. All logs appear in console panel

---

## ⚠️ Important Notes

### Security Warning
**DO NOT leave this enabled in production!**

Reasons:
- Logs sensitive data (tokens, passwords)
- Logs user information
- Performance impact
- Console spam

### Performance Impact
- Minimal for development
- Adds ~10-50ms per request
- JSON.stringify can be slow for large responses
- Use only for debugging

### Token Exposure
The logs show:
- ✅ Full auth tokens (for debugging)
- ✅ User IDs
- ✅ Request/response data

**Remove before production build!**

---

## 🗑️ How to Remove Logging

When you're done debugging:

**File:** `src/api/client.ts`

### Option 1: Comment Out
```typescript
// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // COMMENTED OUT: Logging
    // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    // console.log('📤 API REQUEST:', ...);
    // ...

    return config;
  },
  ...
);
```

### Option 2: Delete Logging Code
Remove all lines marked with:
```typescript
// 🔵 TEMPORARY: Log all network requests
```

### Option 3: Environment Variable
```typescript
if (__DEV__) {
  console.log('📤 API REQUEST:', ...);
}
```

---

## 🧪 Testing Scenarios

### Test 1: Successful API Call
1. Send a message
2. **Expected logs:**
   - Request with POST method
   - Response with 200 status
   - Message object in response

### Test 2: Authentication Error
1. Try invalid login
2. **Expected logs:**
   - Request with credentials
   - Error response with 401 status
   - Error message from backend

### Test 3: Network Error
1. Stop backend server
2. Try any API call
3. **Expected logs:**
   - Request sent
   - Network error (no response)

### Test 4: Invalid Data
1. Send empty message
2. **Expected logs:**
   - Request with empty content
   - Error response with 400 status
   - Validation error message

---

## 📊 Common Issues & Solutions

### Issue: No Logs Appearing
**Solution:**
- Check console is open
- Verify app is running
- Try `npx react-native log-android`

### Issue: Logs Too Verbose
**Solution:**
- Filter by "API REQUEST" or "API RESPONSE"
- Use React Native Debugger filters
- Comment out less important logs

### Issue: Can't Read Token
**Solution:**
- Token is base64 encoded
- Use jwt.io to decode
- Check expiration date

### Issue: Headers Not Showing
**Solution:**
- Headers are logged as JSON
- Expand the object in console
- Check Authorization header specifically

---

## ✅ Summary

**Added:**
- ✅ Request logging (method, URL, headers, body)
- ✅ Response logging (status, data)
- ✅ Error logging (all error types)
- ✅ Clear visual separators
- ✅ Emoji indicators (📤📥❌)

**Benefits:**
- 🔍 Easy debugging
- 🎯 See exact API calls
- 🐛 Identify errors quickly
- 📊 Understand data flow
- 🔐 Verify authentication

**Remember:**
- ⚠️ Remove before production
- ⚠️ Contains sensitive data
- ⚠️ Performance impact
- ⚠️ Console spam

---

## 🎯 Next Steps

1. **Reload your app** - Logging is now active
2. **Perform actions** - Send messages, login, etc.
3. **Check console** - See all network activity
4. **Debug issues** - Use logs to identify problems
5. **Remove logging** - When done debugging

---

**All network requests are now logged! Check your console to see every API call.** 🔍

### Quick Test:
1. Open app
2. Try to send a message
3. Check console for:
   ```
   📤 API REQUEST: POST .../messages
   📥 API RESPONSE: 200 ...
   ```

**Happy debugging!** 🚀
