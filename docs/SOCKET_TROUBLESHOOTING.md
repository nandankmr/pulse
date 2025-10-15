# Socket.IO Real-time Messaging Troubleshooting

## Current Issue
Socket connection is not establishing when using production URL (`https://pulse-api-8yia.onrender.com`)

## Root Cause
The production server needs proper CORS configuration for Socket.IO connections from mobile clients.

## Fixes Applied

### 1. Server-Side Changes (`pulse-api`)

#### `/src/config/realtime.config.ts`
- **Added production CORS support**: Server now allows all origins (`*`) in production mode when `SOCKET_CORS_ORIGINS` env var is not set
- This enables mobile apps to connect without CORS errors

#### `/src/realtime/socket.server.ts`
- **Enriched message payloads**: Messages now include sender name and avatar
- Server fetches user info and adds it to the message before broadcasting

### 2. Client-Side Changes (`pulse`)

#### `/src/utils/socketManager.ts`
- **Added polling fallback**: `transports: ['websocket', 'polling']` for React Native compatibility
- **Enhanced logging**: Detailed connection logs with emojis for easier debugging
- **Better error handling**: Added error event listener and detailed error logging
- **Added reconnect method**: Manual reconnection capability
- **Improved connection status check**: Verifies both internal flag and socket state

#### `/src/screens/ChatScreen.tsx`
- **Fixed sender info extraction**: Properly extracts sender name/avatar from enriched message object
- **Added detailed logging**: Better visibility into message flow

## Deployment Steps

### For Render.com (Production)

1. **Deploy the backend changes**:
   ```bash
   cd pulse-api
   git add .
   git commit -m "Fix Socket.IO CORS for production"
   git push
   ```

2. **Render will auto-deploy** (if auto-deploy is enabled)
   - Or manually trigger deploy from Render dashboard

3. **Optional: Set SOCKET_CORS_ORIGINS** (for stricter security):
   - Go to Render dashboard → Your service → Environment
   - Add variable: `SOCKET_CORS_ORIGINS` = `*` (or specific origins)
   - This is optional since the code now defaults to `*` in production

### For Mobile App

1. **Rebuild the app**:
   ```bash
   cd pulse
   # For Android
   npx react-native run-android
   
   # For iOS
   npx react-native run-ios
   ```

2. **Check logs** for socket connection:
   - Look for: `🔌 Socket connect() called`
   - Look for: `✅ Socket connected: [socket-id]`
   - If errors: `❌ Socket connection error: [details]`

## Testing Checklist

After deployment, test these scenarios:

### 1. Connection Test
- [ ] Open app and login
- [ ] Check console for `✅ Socket connected`
- [ ] Verify socket URL in logs matches production URL

### 2. Real-time Messaging
- [ ] Send message from User A
- [ ] User B should see it **instantly** without refresh
- [ ] Message should show correct sender name and avatar

### 3. Group Messaging
- [ ] Send message in a group
- [ ] All members should receive it in real-time
- [ ] Group events (member added/removed) should broadcast

### 4. Typing Indicators
- [ ] Start typing in a chat
- [ ] Other user should see "typing..." indicator

### 5. Read Receipts
- [ ] Open a chat with unread messages
- [ ] Sender should see read receipts update in real-time

## Debug Commands

### Check if socket is connecting:
```javascript
// In React Native debugger console
import { socketManager } from './src/utils/socketManager';
console.log('Connected:', socketManager.getConnectionStatus());
console.log('Socket:', socketManager.getSocket());
```

### Manual reconnect:
```javascript
socketManager.reconnect();
```

### Check Redux state:
```javascript
// Check if token is available
store.getState().auth.accessToken
```

## Common Issues

### Issue: "Socket not connected, skipping mark as read"
**Cause**: Socket never connected  
**Solution**: Check logs for connection errors, verify CORS settings

### Issue: Connection timeout
**Cause**: Server not responding or CORS blocking  
**Solution**: Verify server is running, check CORS configuration

### Issue: Messages not appearing in real-time
**Cause**: Socket connected but events not firing  
**Solution**: Check event names match between client and server

### Issue: "connect_error" in logs
**Cause**: Authentication failure or CORS issue  
**Solution**: Verify token is valid, check server CORS settings

## Environment Variables (Backend)

Optional but recommended for production:

```env
# Socket.IO Configuration
SOCKET_CORS_ORIGINS=*  # Or specific origins: https://yourapp.com,https://anotherapp.com
SOCKET_REDIS_URL=redis://...  # For horizontal scaling (optional)
NODE_ENV=production
```

## Next Steps

1. **Deploy backend** with CORS fixes
2. **Rebuild mobile app** with enhanced logging
3. **Test connection** and check logs
4. **Monitor** for any connection errors
5. **Set up Redis** (optional) for multi-instance scaling

## Support

If issues persist after deployment:
1. Check Render logs for backend errors
2. Check React Native logs for connection errors
3. Verify firewall/network isn't blocking WebSocket connections
4. Try manual reconnect: `socketManager.reconnect()`
