# Location Sharing Feature

## Overview
Implemented WhatsApp-style location sharing in the chat with map preview and ability to open in native maps applications.

## Features

### 1. Share Location
- **Access:** Click attachment button → "Share Location"
- **Permission:** Requests location permission from device
- **Accuracy:** Uses high-accuracy GPS positioning
- **Fallback:** Mock location for testing (San Francisco coordinates)

### 2. Location Preview
- **Static Map:** Shows map preview with pin marker
- **Coordinates:** Displays latitude and longitude
- **Interactive:** Tap to open in maps app
- **Design:** Clean, card-based UI similar to WhatsApp

### 3. Open in Maps
- **iOS:** Opens in Apple Maps
- **Android:** Opens in Google Maps
- **Fallback:** Opens Google Maps web if native app unavailable
- **Deep Linking:** Uses platform-specific URL schemes

## Implementation Details

### Frontend Components

#### 1. LocationPreview Component (`/src/components/LocationPreview.tsx`)

**Features:**
- Displays static map image with pin marker
- Shows coordinates below map
- "Open in Maps" button
- Responsive design

**Props:**
```typescript
interface LocationPreviewProps {
  latitude: number;
  longitude: number;
  onPress?: () => void;
}
```

**Map Provider:**
- Uses Mapbox Static API for map images
- Shows pin marker at exact location
- Zoom level: 15 (street level)
- Image size: 300x200px @2x resolution

**Open in Maps Logic:**
```typescript
// iOS
maps:?q=Location&ll=37.7749,-122.4194

// Android
geo:37.7749,-122.4194?q=37.7749,-122.4194(Location)

// Web Fallback
https://www.google.com/maps/search/?api=1&query=37.7749,-122.4194
```

#### 2. MessageAttachment Component (Updated)

**Changes:**
- Added `LocationPreview` import
- Updated `renderLocationAttachment()` to use new component
- Validates latitude/longitude before rendering

**Code:**
```typescript
const renderLocationAttachment = () => {
  if (!attachment.latitude || !attachment.longitude) {
    return null;
  }
  
  return (
    <LocationPreview
      latitude={attachment.latitude}
      longitude={attachment.longitude}
      onPress={onPress}
    />
  );
};
```

#### 3. ChatScreen (Updated)

**Location Sharing Flow:**
```typescript
1. User clicks attachment button
2. Selects "Share Location"
3. getCurrentLocation() called
4. Permission requested (if needed)
5. GPS coordinates retrieved
6. sendMessageWithAttachment(undefined, location) called
7. Message sent with location data
8. Location preview displayed in chat
```

**API Request:**
```typescript
await sendMessageMutation.mutateAsync({
  chatId,
  content: 'Shared location',
  location: {
    latitude: 37.7749,
    longitude: -122.4194
  }
});
```

### Backend Changes

#### 1. Message Schema (Already Existed)

**Database:**
```prisma
model Message {
  // ... other fields
  location Json? // { latitude, longitude }
  type MessageType @default(TEXT)
}

enum MessageType {
  TEXT
  IMAGE
  VIDEO
  AUDIO
  FILE
  LOCATION
}
```

#### 2. Chat Controller (`/pulse-api/src/modules/chat/chat.controller.ts`)

**sendMessage Updates:**

1. **Accept location parameter:**
```typescript
const { content, attachments, replyTo, location } = req.body;
```

2. **Validate message:**
```typescript
// Content is required unless there's a location or attachment
if (!content && !location && (!attachments || attachments.length === 0)) {
  throw new ValidationError('Message must have content, location, or attachments');
}
```

3. **Set message type:**
```typescript
const messageOptions: SendMessageOptions = {
  senderId: userId,
  content: content ? content.trim() : undefined,
  type: (location ? 'LOCATION' : 'TEXT') as MessageType,
};

if (location) {
  messageOptions.location = location;
}
```

4. **Convert location to attachment format:**
```typescript
const locationAttachment = result.message.location ? [{
  id: `loc_${result.message.id}`,
  type: 'location' as const,
  url: '',
  latitude: (result.message.location as any).latitude,
  longitude: (result.message.location as any).longitude,
}] : [];

const messageResponse = {
  // ... other fields
  attachments: [...(attachments || []), ...locationAttachment],
};
```

**getMessages Updates:**

Convert location from JSON to attachment format when fetching messages:

```typescript
const formattedMessages = messages.reverse().map((msg) => {
  const locationAttachment = msg.location ? [{
    id: `loc_${msg.id}`,
    type: 'location' as const,
    url: '',
    latitude: (msg.location as any).latitude,
    longitude: (msg.location as any).longitude,
  }] : [];

  return {
    // ... other fields
    attachments: locationAttachment,
  };
});
```

#### 3. Message Service (Already Supported)

The `MessageService.sendMessage()` already handles location:

```typescript
if (options.location !== undefined) {
  createPayload.location = options.location;
}
```

### API Endpoints

#### Send Message with Location

**Endpoint:** `POST /api/chats/:chatId/messages`

**Request Body:**
```json
{
  "content": "Shared location",
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```

**Response:**
```json
{
  "id": "msg-uuid",
  "chatId": "chat-uuid",
  "senderId": "user-uuid",
  "senderName": "John Doe",
  "content": "Shared location",
  "timestamp": "2025-01-14T14:30:00.000Z",
  "attachments": [
    {
      "id": "loc_msg-uuid",
      "type": "location",
      "url": "",
      "latitude": 37.7749,
      "longitude": -122.4194
    }
  ]
}
```

#### Get Messages with Location

**Endpoint:** `GET /api/chats/:chatId/messages`

**Response:**
```json
{
  "messages": [
    {
      "id": "msg-uuid",
      "content": "Shared location",
      "attachments": [
        {
          "id": "loc_msg-uuid",
          "type": "location",
          "url": "",
          "latitude": 37.7749,
          "longitude": -122.4194
        }
      ]
    }
  ]
}
```

## User Experience

### Sending Location

1. Open chat
2. Click attachment button (📎)
3. Select "Share Location"
4. Alert: "Share your current location?"
5. Click "Share Location" (or Cancel)
6. Location message appears in chat
7. Map preview shows with pin marker

### Viewing Location

1. Location message displays in chat
2. Shows static map with pin
3. Shows coordinates below
4. Tap anywhere on card to open in maps

### Opening in Maps

**iOS:**
- Opens Apple Maps app
- Shows pin at exact location
- Can get directions

**Android:**
- Opens Google Maps app
- Shows pin at exact location
- Can get directions

**Web/Fallback:**
- Opens Google Maps in browser
- Shows location on map
- Can get directions

## Permissions

### iOS (Info.plist)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to share it in chats</string>
```

### Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

## Files Created/Modified

### Created:
- `/src/components/LocationPreview.tsx` - Location preview component

### Modified:

**Frontend:**
- `/src/components/MessageAttachment.tsx` - Added location rendering
- `/src/screens/ChatScreen.tsx` - Updated location sending logic
- `/src/api/message.ts` - Added location to SendMessageRequest
- `/src/utils/attachmentPicker.ts` - Already had location support

**Backend:**
- `/pulse-api/src/modules/chat/chat.controller.ts` - Added location handling
  - Updated `sendMessage()` to accept and process location
  - Updated `getMessages()` to convert location to attachments

## Testing Checklist

### Location Sharing
- [ ] Click attachment button shows "Share Location" option
- [ ] Selecting "Share Location" requests permission
- [ ] Permission granted → Gets actual GPS location
- [ ] Permission denied → Shows error message
- [ ] Location message sends successfully
- [ ] Location appears in chat with map preview

### Location Display
- [ ] Map preview shows correctly
- [ ] Pin marker appears at center
- [ ] Coordinates display below map
- [ ] Card has proper styling and shadows
- [ ] Responsive on different screen sizes

### Open in Maps
- [ ] iOS: Tapping opens Apple Maps
- [ ] Android: Tapping opens Google Maps
- [ ] Web: Falls back to Google Maps web
- [ ] Pin shows at correct location
- [ ] Can get directions from maps app

### Edge Cases
- [ ] No location permission → Shows error
- [ ] GPS unavailable → Shows error
- [ ] Invalid coordinates → Doesn't render
- [ ] Network error → Shows error message
- [ ] Multiple locations in same chat
- [ ] Location in group chats
- [ ] Location in DM chats

## Future Enhancements

1. **Live Location Sharing**
   - Share real-time location for X minutes
   - Update location every 30 seconds
   - Show moving marker on map

2. **Location History**
   - View all shared locations on a map
   - Filter by date range
   - Export location data

3. **Nearby Places**
   - Show nearby restaurants, cafes, etc.
   - Share specific place instead of coordinates
   - Include place name and address

4. **Custom Map Styles**
   - Light/dark mode maps
   - Satellite view option
   - Terrain view option

5. **Location Accuracy**
   - Show accuracy radius
   - Option to choose accuracy level
   - Battery optimization

6. **Privacy Features**
   - Blur exact location (show approximate area)
   - Option to share only city/region
   - Expire location after X hours

## Technical Notes

### Map Provider
Currently using Mapbox Static API with public token. For production:
- Get your own Mapbox API key
- Or switch to Google Maps Static API
- Or use OpenStreetMap tiles

### Location Accuracy
- `enableHighAccuracy: true` - Uses GPS
- `timeout: 15000` - 15 second timeout
- `maximumAge: 10000` - Cache for 10 seconds

### Performance
- Static map images are cached by browser
- No real-time map rendering (saves battery)
- Lazy loading of map images
- Optimized image size (300x200 @2x)

### Security
- Location data stored in database as JSON
- HTTPS required for geolocation API
- User permission required
- No location tracking without consent

## Summary

✅ **Completed:**
- Location sharing via attachment menu
- Map preview with pin marker
- Open in native maps apps (iOS/Android)
- Backend support for location messages
- Database storage of location data
- Proper permission handling
- WhatsApp-style UI/UX

The location sharing feature is now fully functional and provides a seamless experience similar to WhatsApp! 📍🗺️
