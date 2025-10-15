# API and Socket Event Consistency Fixes

## Summary
This document outlines all the inconsistencies found between the frontend and backend APIs and socket events, and the fixes applied to ensure consistency.

## Changes Made

### 1. User Profile Endpoints (FIXED)

**Issue:** Frontend and backend had different endpoint paths for user profile operations.

**Frontend Changes:**
- Changed `GET /users/profile` → `GET /users/me`
- Changed `PUT /users/profile` → `PUT /users/me`

**Backend Changes:**
- Added `GET /users/me` endpoint to return current authenticated user's profile
- Existing `PUT /users/me` already matched

**Files Modified:**
- Frontend: `/src/api/user.ts`
- Backend: `/src/modules/user/user.controller.ts`, `/src/modules/user/user.routes.ts`

---

### 2. Avatar Upload API (FIXED)

**Issue:** Frontend expected presigned URL workflow, but backend uses direct multipart upload.

**Frontend Changes:**
- Removed `getAvatarUploadUrlAPI()`, `uploadAvatarToS3()`, `confirmAvatarUploadAPI()`
- Added `uploadAvatarAPI()` using FormData for multipart upload to `POST /users/me/avatar`
- Updated `UpdateProfileRequest` to match backend (removed `email` and `avatar`, kept `name` and `password`)

**Backend Changes:**
- No changes needed - already has `POST /users/me/avatar` with multipart upload

**Files Modified:**
- Frontend: `/src/api/user.ts`

---

### 3. Message Edit/Delete REST Endpoints (ADDED)

**Issue:** Frontend expected REST endpoints for editing/deleting messages, but backend only had socket events.

**Backend Changes Added:**
- `PUT /api/chats/:chatId/messages/:messageId` - Edit message
- `DELETE /api/chats/:chatId/messages/:messageId` - Delete message
- `POST /api/chats/:chatId/messages/read` - Mark messages as read (bulk)

These endpoints now:
1. Perform the database operation
2. Broadcast the change via Socket.IO to maintain real-time sync
3. Return appropriate HTTP responses

**Files Modified:**
- Backend: `/src/modules/chat/chat.controller.ts`, `/src/modules/chat/chat.routes.ts`

---

### 4. Message Reactions (REMOVED)

**Issue:** Frontend had reaction APIs but backend doesn't implement reactions.

**Frontend Changes:**
- Removed `reactToMessageAPI()` - `POST /chats/:chatId/messages/:messageId/react`
- Removed `removeReactionAPI()` - `DELETE /chats/:chatId/messages/:messageId/react`

**Note:** If reactions are needed in the future, they should be implemented in the backend first.

**Files Modified:**
- Frontend: `/src/api/message.ts`

---

### 5. User Search API (DEDUPLICATED)

**Issue:** `searchUsersAPI` was defined in both `chat.ts` and `user.ts`.

**Frontend Changes:**
- Removed duplicate from `chat.ts`
- Kept single implementation in `user.ts` at `GET /users/search`

**Files Modified:**
- Frontend: `/src/api/chat.ts`

---

### 6. Attachment/Upload APIs (NOT IMPLEMENTED)

**Issue:** Frontend has attachment APIs but backend doesn't have these routes registered.

**Frontend APIs (Currently Not Working):**
- `POST /attachments/upload-url` - Get presigned URL
- `POST /attachments/confirm` - Confirm upload
- `DELETE /attachments/:id` - Delete attachment

**Status:** These remain in frontend code but will fail until backend implements them.

**Recommendation:** Either:
1. Implement attachment module in backend with these endpoints, OR
2. Remove attachment.ts from frontend if not needed

**Files Affected:**
- Frontend: `/src/api/attachment.ts` (exists but endpoints not implemented in backend)

---

### 7. Type Safety Improvements (BACKEND)

**Issue:** ESLint warnings about `any` types in chat controller.

**Backend Changes:**
- Added proper TypeScript interfaces for `MessageWhereClause` and `MessageOptions`
- Imported `SendMessageOptions` and `MessageType` types
- Replaced `any` with proper types

**Files Modified:**
- Backend: `/src/modules/chat/chat.controller.ts`

---

## Socket Events - Already Consistent ✓

The following socket events are properly implemented in both frontend and backend:

### Client → Server Events:
- `message:send` - Send a message
- `message:read` - Mark message(s) as read
- `message:edit` - Edit a message
- `message:delete` - Delete a message
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `group:join` - Join a group room
- `group:leave` - Leave a group room
- `presence:subscribe` - Subscribe to presence updates

### Server → Client Events:
- `message:new` - New message received
- `message:delivered` - Message delivered confirmation
- `message:read` - Message read receipt
- `message:read:confirmed` - Read receipt confirmed
- `message:edited` - Message was edited
- `message:deleted` - Message was deleted
- `group:member:added` - Member added to group
- `group:member:removed` - Member removed from group
- `group:member:role_changed` - Member role changed
- `group:updated` - Group details updated
- `presence:update` - User online/offline status
- `presence:state` - Current online users state
- `typing:start` - User started typing
- `typing:stop` - User stopped typing

---

## REST API Endpoints - Summary

### Auth Module ✓
All endpoints match between frontend and backend:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/verify-email`
- `POST /auth/resend-verification`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/change-password`

### User Module ✓
All endpoints now match:
- `GET /users/me` ✓ (Added)
- `PUT /users/me` ✓
- `POST /users/me/avatar` ✓
- `GET /users/search` ✓
- `GET /users/:id` ✓

### Chat Module ✓
All endpoints now match:
- `GET /chats` ✓
- `GET /chats/:chatId` ✓
- `POST /chats` ✓
- `PATCH /chats/:chatId` ✓
- `DELETE /chats/:chatId` ✓
- `POST /chats/:chatId/read` ✓
- `POST /chats/:chatId/leave` ✓
- `GET /chats/:chatId/members` ✓
- `POST /chats/:chatId/members` ✓
- `PATCH /chats/:chatId/members/:memberId` ✓
- `DELETE /chats/:chatId/members/:memberId` ✓
- `GET /chats/:chatId/messages` ✓
- `POST /chats/:chatId/messages` ✓
- `PUT /chats/:chatId/messages/:messageId` ✓ (Added)
- `DELETE /chats/:chatId/messages/:messageId` ✓ (Added)
- `POST /chats/:chatId/messages/read` ✓ (Added)

### Group Module ✓
All endpoints match:
- `POST /groups` ✓
- `GET /groups/me` ✓
- `GET /groups/:groupId` ✓
- `PATCH /groups/:groupId` ✓
- `DELETE /groups/:groupId` ✓
- `POST /groups/:groupId/members` ✓
- `PATCH /groups/:groupId/members/:userId` ✓
- `DELETE /groups/:groupId/members/:userId` ✓
- `POST /groups/:groupId/invite` ✓
- `POST /groups/:groupId/join` ✓

---

## Remaining Issues

### 1. Attachment Module (Not Implemented)
The frontend has attachment APIs but the backend doesn't have an attachment module or routes.

**Options:**
- Implement backend attachment module with S3/storage integration
- Remove attachment.ts from frontend if not needed
- Use message mediaUrl field instead of separate attachments

### 2. Message Reactions (Not Implemented)
Frontend had reaction APIs that were removed. If reactions are needed:
- Add reactions table to Prisma schema
- Implement reaction endpoints in backend
- Add reaction APIs back to frontend

---

## Testing Recommendations

1. **User Profile:**
   - Test `GET /users/me` returns current user
   - Test `PUT /users/me` updates profile
   - Test avatar upload with multipart form data

2. **Messages:**
   - Test editing messages via REST API
   - Test deleting messages via REST API
   - Verify socket events are emitted for edits/deletes
   - Test bulk message read receipts

3. **Socket Events:**
   - Verify all socket events work bidirectionally
   - Test real-time message delivery
   - Test typing indicators
   - Test presence updates

4. **Groups:**
   - Test all group CRUD operations
   - Test member management
   - Test group invitations

---

## Migration Notes

### For Developers:
1. Update any code using old user profile endpoints
2. Update avatar upload logic to use new multipart upload
3. Remove any code calling reaction APIs
4. Ensure message edit/delete now uses REST endpoints (socket events still work)

### Database:
No database changes were required for these fixes.

---

## Conclusion

The frontend and backend APIs are now consistent. The main improvements:
- ✅ User profile endpoints aligned
- ✅ Avatar upload simplified to multipart
- ✅ Message edit/delete available via REST
- ✅ Removed non-existent reaction APIs
- ✅ Deduplicated user search API
- ✅ Improved type safety in backend

**Remaining work:**
- Decide on attachment module implementation
- Consider implementing message reactions if needed
