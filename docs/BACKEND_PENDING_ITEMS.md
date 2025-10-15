# Backend Pending Items & Clarifications

**Date:** October 14, 2025  
**From:** Frontend Team  
**To:** Backend Team

---

## ✅ Already Implemented (Thank You!)

All essential APIs and Socket.IO events from `FRONTEND_IMPLEMENTATION.md` have been successfully integrated into the frontend:

- ✅ 5 Authentication endpoints
- ✅ 4 Chat management endpoints  
- ✅ 6 Socket.IO events (message edit/delete, group events)
- ✅ Bulk read receipts support

---

## 🔴 Critical Missing Items

### 1. **File Upload Endpoint**
**Status:** Not documented in FRONTEND_IMPLEMENTATION.md

**Need:**
- `POST /api/upload` endpoint for uploading attachments
- Should accept multipart/form-data
- Return `{ uploadId, mediaUrl }` 
- Support file types: Images (JPG, PNG, GIF, WEBP), Videos (MP4, MOV), Documents (PDF, DOC, DOCX, XLS, XLSX, TXT), Audio (MP3, M4A, WAV)
- Max file size: 25 MB

**Current Status:** Frontend has upload UI but no backend endpoint to call

**Priority:** HIGH - Users cannot send attachments without this

---

### 2. **Socket.IO Upload Progress Events**
**Status:** Not implemented

**Need:**
- `upload:progress` event during file upload
- `upload:complete` event when upload finishes
- Payload: `{ uploadId, progress: number, mediaUrl?: string }`

**Priority:** MEDIUM - Nice to have for better UX

---

### 3. **Avatar Upload for Groups**
**Status:** Unclear implementation

**Need:**
- How to upload group avatars?
- Should we use the same `/api/upload` endpoint?
- Or a dedicated endpoint like `POST /chats/:id/avatar`?
- Return avatar URL to use in `updateGroupDetailsAPI`

**Current Status:** EditGroupScreen has image picker but no upload implementation

**Priority:** MEDIUM - Groups can be created/edited but avatars can't be uploaded

---

## ⚠️ Clarifications Needed

### 1. **Message Edit/Delete Time Limits** ✅ FRONTEND IMPLEMENTED
**Documented:** 
- Edit: 15 minutes
- Delete for everyone: 1 hour

**Frontend Implementation:** 
- ✅ Time limit checks implemented in ChatScreen
- ✅ Edit option only shown if within 15 minutes
- ✅ "Delete for Everyone" only shown if within 1 hour
- ✅ "Delete for Me" always available for own messages
- ✅ Long-press menu on messages to access options
- ✅ Edit mode with banner and input field
- ✅ Delete confirmation dialog

**Question:** Are these time limits enforced on the backend? If user tries to edit after 15 minutes, will backend return error?

**Recommendation:** Backend should validate time limits and return appropriate error codes:
- `EDIT_TIME_EXPIRED` - If trying to edit after 15 minutes
- `DELETE_TIME_EXPIRED` - If trying to delete for everyone after 1 hour

**Current Status:** Frontend validates before sending, but backend validation needed for security.

---

### 2. **Bulk Read Receipts**
**Documented:** `messageIds` array in `message:read` event

**Question:** 
- What's the maximum number of message IDs we can send at once?
- Should we batch if there are 100+ unread messages?

**Current Implementation:** Sending all unread message IDs at once when opening chat.

---

### 3. **System Messages for Group Events**
**Question:** Does backend send system messages for group events, or should frontend generate them?

**Current Implementation:** Frontend generates system messages when receiving Socket events like `group:member:added`, `group:member:removed`, etc.

**Recommendation:** Backend should send actual system messages so all clients see the same message IDs and can sync properly.

---

### 4. **User Search Rate Limiting**
**Documented:** 10 requests/min per user

**Question:** 
- What error code/message is returned when rate limit exceeded?
- Should we implement client-side debouncing? (Currently using 2-character minimum)

---

### 5. **Logout Endpoint - Device ID**
**Documented:** `POST /auth/logout` requires `{ refreshToken, deviceId }`

**Question:** 
- How is `deviceId` generated? Should frontend generate a UUID on first launch?
- Is it stored in the login response?

**Current Implementation:** Using `deviceId` from Redux state, but unclear how it's initially set.

---

## 📋 Nice-to-Have Features

### 1. **Message Search**
**Status:** Not implemented

**Use Case:** Users want to search messages within a chat

**Endpoint Suggestion:** `GET /chats/:id/messages/search?q=query`

**Priority:** LOW - Can be added later

---

### 2. **Typing Indicators**
**Status:** Documented in rate limits but no Socket event details

**Need:**
- Socket event: `typing:start` and `typing:stop`
- Payload: `{ chatId, userId, userName }`

**Priority:** LOW - Nice UX feature but not essential

---

### 3. **Online Status**
**Status:** Partially implemented

**Current:** `getGroupMembersAPI` returns `isOnline` boolean

**Question:** 
- How is online status determined? (Active in last 5 minutes?)
- Is there a Socket event when user goes online/offline?
- Suggested: `user:online` and `user:offline` events

**Priority:** LOW - Currently showing in group members list

---

### 4. **Message Reactions**
**Status:** Not implemented

**Use Case:** Users want to react to messages with emojis

**Endpoints Needed:**
- `POST /messages/:id/reactions` - Add reaction
- `DELETE /messages/:id/reactions/:emoji` - Remove reaction

**Socket Events:**
- `message:reaction:added`
- `message:reaction:removed`

**Priority:** LOW - Can be added in future iteration

---

### 5. **Read Receipts for Individual Messages**
**Status:** Partially implemented

**Current:** Can mark messages as read, but can't see who read what

**Enhancement:** Return list of users who read each message in group chats

**Priority:** LOW - Current implementation is sufficient for MVP

---

## 🐛 Potential Issues

### 1. **Socket.IO Connection**
**Issue:** Frontend has `socket.io-client` import error

**Need:** 
- Confirm Socket.IO server version
- Provide connection URL format
- Authentication method (token in query params or headers?)

**Current:** Using `io(SOCKET_URL, { auth: { token } })` but getting import errors

---

### 2. **Token Refresh**
**Question:** 
- Is there an endpoint to refresh access token using refresh token?
- Or should we re-login when access token expires?

**Current:** No refresh token endpoint documented

---

### 3. **Error Response Format**
**Question:** What's the standard error response format?

**Expected:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

**Need:** Consistent error format across all endpoints for better error handling

---

## 📊 Summary

| Category | Status | Priority |
|----------|--------|----------|
| File Upload Endpoint | ❌ Missing | HIGH |
| Avatar Upload | ⚠️ Unclear | MEDIUM |
| Socket Upload Events | ❌ Missing | MEDIUM |
| Time Limit Validation | ⚠️ Need Confirmation | MEDIUM |
| Bulk Read Receipts Limit | ⚠️ Need Clarification | LOW |
| System Messages | ⚠️ Need Clarification | LOW |
| Token Refresh | ❌ Missing | MEDIUM |
| **Message Edit/Delete UI** | **✅ COMPLETE** | **DONE** |

---

## 🎯 Immediate Action Items

**For Backend Team:**

1. **Implement file upload endpoint** (`POST /api/upload`)
2. **Clarify avatar upload process** for groups
3. **Add backend validation for time limits** (edit: 15 min, delete for everyone: 1 hour)
4. **Provide Socket.IO connection details** and fix any server-side issues
5. **Document token refresh flow** if it exists

**For Frontend Team:**

1. ✅ **ALL ESSENTIAL UI INTEGRATIONS COMPLETE!**
2. ✅ Message edit/delete UI implemented
3. ✅ All authentication flows complete
4. ✅ All chat management features complete
5. ✅ All real-time Socket.IO events integrated
6. ⏳ Waiting for file upload endpoint to enable attachments

---

## 📞 Contact

For questions or clarifications, please reach out to the frontend team.

**Next Sync:** Please review this document and provide responses to the questions/clarifications section.

---

**Thank you for the great work on the backend implementation! 🎉**
