# Backend Server Restart Required

## Issue
The attachment upload endpoint is returning a network error because the backend server needs to be restarted to load the new routes.

## Solution

### 1. Stop the current backend server
Press `Ctrl+C` in the terminal running the backend

### 2. Restart the backend server
```bash
cd pulse-api
npm run dev
```

### 3. Verify the server started
You should see:
```
🚀 Server running on port 3000
📚 API Documentation: http://localhost:3000/api-docs
🔌 Socket.IO ready on /socket.io
📱 Android Emulator: Use http://10.0.2.2:3000
```

### 4. Test the upload endpoint
The new routes should now be available:
- `POST /api/attachments/upload` - Upload file
- `GET /api/attachments/:filename` - Serve file

## What Changed

### New Routes Added:
```typescript
app.use('/api/attachments', attachmentRoutes);
```

### New Files Created:
- `/pulse-api/src/modules/attachment/attachment.controller.ts`
- `/pulse-api/src/modules/attachment/attachment.routes.ts`

### Dependencies Installed:
- `multer` - File upload middleware
- `uuid` - Unique filename generation

## Testing After Restart

1. **Open the app** (already running)
2. **Open a chat**
3. **Click attachment button**
4. **Select an image**
5. **Watch the console logs:**
   ```
   📤 Starting file upload: { fileUri, fileName, fileType }
   📦 FormData prepared, uploading to: http://10.0.2.2:3000/api/attachments/upload
   📊 Upload progress: 50%
   📊 Upload progress: 100%
   ✅ Upload successful: { url, filename, ... }
   🔗 Full file URL: http://10.0.2.2:3000/api/attachments/abc123.jpg
   ```

6. **Image should display in chat**

## Troubleshooting

### If still getting network error:
1. Check backend is running on port 3000
2. Check Android emulator can reach `http://10.0.2.2:3000`
3. Check CORS is configured for Android emulator
4. Check `/api/attachments` route is registered

### If getting 404 error:
1. Verify routes are registered in `/pulse-api/src/index.ts`
2. Check import paths are correct
3. Restart backend server

### If getting 401 Unauthorized:
1. Check authentication token is being sent
2. Verify `authenticate` middleware is working
3. Check token is valid

### If file upload fails:
1. Check `/pulse-api/uploads/` directory exists
2. Check write permissions on uploads directory
3. Check file size is under 50MB
4. Check file type is supported

## Expected Behavior

### Upload Flow:
1. User selects image
2. Frontend uploads to `/api/attachments/upload`
3. Backend saves to `/pulse-api/uploads/{uuid}.jpg`
4. Backend returns URL: `/api/attachments/{uuid}.jpg`
5. Frontend sends message with full URL
6. Image displays in chat

### File Serving:
1. Image URL: `http://10.0.2.2:3000/api/attachments/{uuid}.jpg`
2. Backend serves file from `/pulse-api/uploads/{uuid}.jpg`
3. Image loads and displays

## Summary

✅ **Backend changes are complete**
⚠️ **Backend server needs restart**
✅ **Frontend changes are complete**
✅ **App is already running**

**Next step:** Restart the backend server!
