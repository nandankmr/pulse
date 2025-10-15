# Image Attachment Fix

## Problem
Image attachments were not displaying in chat messages. Messages showed "Sent attachment" text but no image preview or download option.

## Root Cause
**API Mismatch:** Frontend was sending `attachments` array, but backend expected `mediaUrl` string field.

### Frontend (Before):
```typescript
await sendMessageMutation.mutateAsync({
  chatId,
  content: messageContent,
  attachments: [{ id, type: 'image', url: '...' }], // ❌ Wrong format
  location,
});
```

### Backend Expected:
```typescript
{
  content?: string;
  mediaUrl?: string;  // ✅ Backend expects this
  type?: MessageType;
  location?: { latitude, longitude };
}
```

## Solution

### 1. Updated Frontend API Interface

**File:** `/src/api/message.ts`

**Before:**
```typescript
export interface SendMessageRequest {
  chatId: string;
  content?: string;
  attachments?: Attachment[];  // ❌ Wrong
  replyTo?: string;
  location?: { latitude, longitude };
}
```

**After:**
```typescript
export interface SendMessageRequest {
  chatId: string;
  content?: string;
  mediaUrl?: string;  // ✅ Correct
  type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'LOCATION';
  location?: { latitude, longitude };
}
```

### 2. Updated ChatScreen to Send Correct Format

**File:** `/src/screens/ChatScreen.tsx`

**Before:**
```typescript
await sendMessageMutation.mutateAsync({
  chatId,
  content: messageContent,
  attachments: attachment ? [attachment] : undefined,  // ❌ Wrong
  location,
});
```

**After:**
```typescript
await sendMessageMutation.mutateAsync({
  chatId,
  content: messageContent,
  mediaUrl: attachment?.url,  // ✅ Send URL directly
  type: attachment ? attachment.type.toUpperCase() : location ? 'LOCATION' : 'TEXT',
  location,
});
```

### 3. Updated Backend to Handle mediaUrl

**File:** `/pulse-api/src/modules/chat/chat.controller.ts`

#### Accept mediaUrl and type:
```typescript
const { content, mediaUrl, type, location } = req.body;

// Validation
if (!content && !location && !mediaUrl) {
  throw new ValidationError('Message must have content, location, or media');
}
```

#### Pass to message service:
```typescript
const messageOptions: SendMessageOptions = {
  senderId: userId,
  content: content ? content.trim() : undefined,
  type: (type || (location ? 'LOCATION' : 'TEXT')) as MessageType,
};

if (mediaUrl) {
  messageOptions.mediaUrl = mediaUrl;
}
```

#### Convert mediaUrl to attachments format for frontend:
```typescript
// Convert mediaUrl to attachment format for frontend
const mediaAttachment = result.message.mediaUrl ? [{
  id: `media_${result.message.id}`,
  type: result.message.type.toLowerCase(),
  url: result.message.mediaUrl,
  name: `${result.message.type.toLowerCase()}_${result.message.id}`,
}] : [];

const messageResponse = {
  // ... other fields
  attachments: [...mediaAttachment, ...locationAttachment],
};
```

### 4. Updated getMessages Endpoint

**File:** `/pulse-api/src/modules/chat/chat.controller.ts`

Convert stored `mediaUrl` to `attachments` array when fetching messages:

```typescript
const formattedMessages = messages.reverse().map((msg) => {
  // Convert mediaUrl to attachment format
  const mediaAttachment = msg.mediaUrl ? [{
    id: `media_${msg.id}`,
    type: msg.type.toLowerCase(),
    url: msg.mediaUrl,
    name: `${msg.type.toLowerCase()}_${msg.id}`,
  }] : [];

  // Convert location to attachment format
  const locationAttachment = msg.location ? [{
    id: `loc_${msg.id}`,
    type: 'location',
    url: '',
    latitude: msg.location.latitude,
    longitude: msg.location.longitude,
  }] : [];

  return {
    // ... other fields
    attachments: [...mediaAttachment, ...locationAttachment],
  };
});
```

## Data Flow

### Sending Message with Image:

1. **User picks image** → `pickAttachment()`
2. **Upload image** → `uploadAttachment()` → Returns `{ id, type: 'image', url: 'https://...' }`
3. **Send message** → API receives:
   ```json
   {
     "content": "Sent attachment",
     "mediaUrl": "https://storage.../image.jpg",
     "type": "IMAGE"
   }
   ```
4. **Backend stores** → Database:
   ```
   Message {
     content: "Sent attachment",
     mediaUrl: "https://storage.../image.jpg",
     type: "IMAGE"
   }
   ```
5. **Backend responds** → Frontend receives:
   ```json
   {
     "id": "msg-123",
     "content": "Sent attachment",
     "attachments": [{
       "id": "media_msg-123",
       "type": "image",
       "url": "https://storage.../image.jpg",
       "name": "image_msg-123"
     }]
   }
   ```
6. **Frontend displays** → `MessageAttachment` component renders image

### Fetching Messages:

1. **Frontend requests** → `GET /chats/:chatId/messages`
2. **Backend fetches** → Database returns messages with `mediaUrl`
3. **Backend converts** → `mediaUrl` → `attachments` array
4. **Frontend receives** → Messages with `attachments` array
5. **Frontend displays** → Images render correctly

## Message Types

### Database Schema:
```prisma
model Message {
  content   String?
  mediaUrl  String?  // Stores single media URL
  type      MessageType  // TEXT, IMAGE, VIDEO, AUDIO, FILE, LOCATION
  location  Json?    // Stores { latitude, longitude }
}
```

### Frontend Format:
```typescript
interface Message {
  content: string;
  attachments: Attachment[];  // Array of attachments
}

interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file' | 'location';
  url: string;
  name?: string;
  latitude?: number;  // For location
  longitude?: number; // For location
}
```

## Supported Attachment Types

| Type | Backend Field | Frontend Display |
|------|--------------|------------------|
| **Image** | `mediaUrl` | Image preview (200x200) |
| **Video** | `mediaUrl` | Video thumbnail + play button |
| **Audio** | `mediaUrl` | Audio player UI |
| **File** | `mediaUrl` | File icon + download button |
| **Location** | `location` JSON | Map preview + coordinates |

## Testing Checklist

### Image Attachments
- [x] Send image from camera
- [x] Send image from gallery
- [x] Image displays in chat
- [x] Image is clickable
- [x] Image opens in full view
- [x] Image URL is correct

### Video Attachments
- [ ] Send video from camera
- [ ] Send video from gallery
- [ ] Video thumbnail displays
- [ ] Play button appears
- [ ] Video opens on click

### File Attachments
- [ ] Send file
- [ ] File icon displays
- [ ] File name shows
- [ ] Download button works
- [ ] File opens correctly

### Location Attachments
- [x] Share location
- [x] Map preview displays
- [x] Coordinates show
- [x] Opens in maps app

## API Endpoints

### Send Message
```
POST /api/chats/:chatId/messages

Body:
{
  "content": "Optional text",
  "mediaUrl": "https://storage.../file.jpg",  // For media
  "type": "IMAGE",  // TEXT, IMAGE, VIDEO, AUDIO, FILE, LOCATION
  "location": {  // For location
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}

Response:
{
  "id": "msg-123",
  "content": "Optional text",
  "attachments": [{
    "id": "media_msg-123",
    "type": "image",
    "url": "https://storage.../file.jpg"
  }],
  "timestamp": "2025-01-14T...",
  ...
}
```

### Get Messages
```
GET /api/chats/:chatId/messages?limit=50&cursor=msg-456

Response:
{
  "messages": [{
    "id": "msg-123",
    "content": "Text",
    "attachments": [{
      "id": "media_msg-123",
      "type": "image",
      "url": "https://..."
    }]
  }],
  "hasMore": true,
  "nextCursor": "msg-789"
}
```

## Files Modified

### Frontend:
- `/src/api/message.ts` - Updated SendMessageRequest interface
- `/src/screens/ChatScreen.tsx` - Send mediaUrl instead of attachments array

### Backend:
- `/pulse-api/src/modules/chat/chat.controller.ts`
  - Updated `sendMessage()` to accept mediaUrl and type
  - Convert mediaUrl to attachments in response
  - Updated `getMessages()` to convert mediaUrl to attachments

## Summary

✅ **Fixed:**
- Image attachments now display correctly
- Video, audio, and file attachments supported
- Backend properly handles mediaUrl field
- Frontend receives attachments in correct format
- Consistent data format between send and fetch

✅ **How it works:**
1. Frontend uploads media → Gets URL
2. Frontend sends mediaUrl + type to backend
3. Backend stores mediaUrl in database
4. Backend converts mediaUrl → attachments array in responses
5. Frontend displays attachments using MessageAttachment component

The image attachment feature is now fully functional! 📷✨
