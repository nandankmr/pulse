# Backend Connection Guide

**Date:** October 14, 2025  
**Backend:** localhost:3000  
**Emulator:** Android Studio

---

## ✅ Configuration Complete

The app is now configured to connect to your backend API running on `localhost:3000`.

---

## 🔧 Configuration Details

### Updated File: `src/config/index.ts`

```typescript
API_URL: 'http://10.0.2.2:3000/api'
SOCKET_URL: 'http://10.0.2.2:3000'
```

### Why `10.0.2.2`?

Android Emulator uses a special IP address to access the host machine's localhost:
- `10.0.2.2` → Maps to your computer's `localhost`
- `localhost` → Would refer to the emulator itself (won't work)

---

## 📱 Platform-Specific Configuration

### Android Emulator (Current Setup) ✅
```typescript
API_URL: 'http://10.0.2.2:3000/api'
SOCKET_URL: 'http://10.0.2.2:3000'
```

### iOS Simulator
If you switch to iOS, change to:
```typescript
API_URL: 'http://localhost:3000/api'
SOCKET_URL: 'http://localhost:3000'
```

### Physical Device (Android/iOS)
If testing on a real device, use your computer's local IP:
```typescript
// Find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)
API_URL: 'http://192.168.1.x:3000/api'  // Replace x with your IP
SOCKET_URL: 'http://192.168.1.x:3000'
```

---

## 🚀 Testing the Connection

### 1. Start Your Backend Server
```bash
cd backend
npm start
# Should be running on http://localhost:3000
```

### 2. Verify Backend is Running
Open browser and check:
- `http://localhost:3000` → Should show API response
- `http://localhost:3000/api/health` → Health check (if available)

### 3. Start React Native App
```bash
# In your project root
npm start
# or
npx react-native start

# In another terminal
npx react-native run-android
```

### 4. Test API Connection
Try these features in the app:
- **Login/Register** → Tests auth endpoints
- **Search Users** → Tests search endpoint
- **Send Message** → Tests Socket.IO connection

---

## 🐛 Troubleshooting

### Issue: "Network request failed"

**Solution 1: Check Backend is Running**
```bash
# Test from your computer
curl http://localhost:3000/api

# Should return API response
```

**Solution 2: Check Android Emulator Network**
```bash
# In Android Studio emulator, open Chrome
# Navigate to: http://10.0.2.2:3000
# Should show your backend response
```

**Solution 3: Disable Firewall (Temporarily)**
- Windows: Allow Node.js through Windows Firewall
- Mac: System Preferences → Security → Firewall → Allow Node

---

### Issue: "Connection timeout"

**Check API_TIMEOUT in config:**
```typescript
API_TIMEOUT: 10000, // 10 seconds
```

**Increase if needed:**
```typescript
API_TIMEOUT: 30000, // 30 seconds
```

---

### Issue: Socket.IO not connecting

**Check CORS on Backend:**
```javascript
// backend/server.js
const io = require('socket.io')(server, {
  cors: {
    origin: '*', // For development
    methods: ['GET', 'POST']
  }
});
```

**Check Socket.IO URL:**
```typescript
// Should NOT have /api suffix
SOCKET_URL: 'http://10.0.2.2:3000'  // ✅ Correct
SOCKET_URL: 'http://10.0.2.2:3000/api'  // ❌ Wrong
```

---

### Issue: "Unable to resolve module socket.io-client"

**Install Socket.IO Client:**
```bash
npm install socket.io-client
# or
yarn add socket.io-client
```

---

## 🔍 Debugging Tips

### 1. Enable Network Logging

Add to `src/api/client.ts`:
```typescript
apiClient.interceptors.request.use(request => {
  console.log('API Request:', request.method, request.url);
  return request;
});

apiClient.interceptors.response.use(
  response => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('API Error:', error.message, error.config?.url);
    return Promise.reject(error);
  }
);
```

### 2. Test Socket.IO Connection

Add to `src/utils/socketManager.ts`:
```typescript
socket.on('connect', () => {
  console.log('✅ Socket.IO Connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Socket.IO Disconnected');
});

socket.on('connect_error', (error) => {
  console.error('Socket.IO Connection Error:', error.message);
});
```

### 3. Check React Native Logs

```bash
# Android logs
npx react-native log-android

# iOS logs (if needed)
npx react-native log-ios
```

---

## 📋 Backend Requirements Checklist

Make sure your backend has:

- [x] **CORS enabled** for development
- [x] **Running on port 3000**
- [x] **All endpoints from FRONTEND_IMPLEMENTATION.md**
- [x] **Socket.IO server configured**
- [ ] **File upload endpoint** (optional, for attachments)

---

## 🔐 Backend CORS Configuration

### Express.js Example:
```javascript
const cors = require('cors');

app.use(cors({
  origin: '*', // For development
  credentials: true
}));
```

### Socket.IO Example:
```javascript
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

---

## 📊 API Endpoints to Test

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password`
- `POST /api/auth/logout`

### Chat Management
- `GET /api/users/search?q=query`
- `GET /api/chats/:id/members`
- `PATCH /api/chats/:id`
- `PATCH /api/chats/:id/members/:memberId/role`

### Socket.IO Events
- `message:send`
- `message:read`
- `message:edited`
- `message:deleted`
- `group:member:added`
- `group:member:removed`
- `group:member:role_changed`
- `group:updated`

---

## 🎯 Quick Test Commands

### Test API from Terminal:
```bash
# Test health endpoint
curl http://10.0.2.2:3000/api/health

# Test login (example)
curl -X POST http://10.0.2.2:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test from Android Emulator Browser:
1. Open Chrome in emulator
2. Navigate to: `http://10.0.2.2:3000`
3. Should see your backend response

---

## 📱 Alternative: Use ngrok (For Physical Devices)

If you need to test on a physical device:

```bash
# Install ngrok
npm install -g ngrok

# Start tunnel
ngrok http 3000

# Use the ngrok URL in config
API_URL: 'https://abc123.ngrok.io/api'
SOCKET_URL: 'https://abc123.ngrok.io'
```

---

## ✅ Verification Checklist

Before testing, verify:

- [ ] Backend server is running on port 3000
- [ ] Can access `http://localhost:3000` from browser
- [ ] CORS is enabled on backend
- [ ] Socket.IO is configured with CORS
- [ ] Android emulator is running
- [ ] React Native app is compiled and running
- [ ] No firewall blocking port 3000

---

## 🎉 Success Indicators

You'll know it's working when:

1. **Login Screen** → Can login successfully
2. **Console Logs** → See API requests/responses
3. **Socket.IO** → See "Connected" log
4. **Real-time Updates** → Messages appear instantly
5. **No Network Errors** → No "Network request failed" alerts

---

## 📞 Still Having Issues?

### Check These Files:
1. `src/config/index.ts` → API URLs configured
2. `src/api/client.ts` → Axios configuration
3. `src/utils/socketManager.ts` → Socket.IO setup

### Common Mistakes:
- ❌ Using `localhost` instead of `10.0.2.2`
- ❌ Backend not running
- ❌ Wrong port number
- ❌ CORS not enabled
- ❌ Firewall blocking connection

---

## 🚀 You're All Set!

Your app is now configured to connect to:
- **API:** `http://10.0.2.2:3000/api`
- **Socket.IO:** `http://10.0.2.2:3000`

Start your backend, launch the app, and test all the features! 🎉

---

**Happy Testing! 🚀**
