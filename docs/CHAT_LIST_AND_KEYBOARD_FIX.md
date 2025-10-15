# Chat List Real-time Updates & Keyboard Fix

## Issues Fixed

### 1. Chat List Not Updating in Real-time
**Problem:** When a new message was received, the chat list on HomeScreen didn't update to show the latest message or updated unread count.

**Solution:** Added socket listener to HomeScreen that invalidates the chats query when a new message is received, triggering a refetch.

### 2. Input Box Hidden by Keyboard
**Problem:** On Android devices, when the virtual keyboard opened, it covered the input box, making it impossible to see what you're typing.

**Solution:** Changed `KeyboardAvoidingView` behavior from `undefined` to `'height'` for Android.

## Changes Made

### 1. Real-time Chat List Updates

**File:** `/src/screens/HomeScreen.tsx`

**Added imports:**
```typescript
import { useEffect } from 'react';
import { socketManager } from '../utils/socketManager';
import { useQueryClient } from '@tanstack/react-query';
```

**Added socket listener:**
```typescript
const queryClient = useQueryClient();

// Listen for new messages to update chat list
useEffect(() => {
  const handleNewMessage = () => {
    // Invalidate chats query to refetch the list
    queryClient.invalidateQueries({ queryKey: ['chats'] });
  };

  socketManager.on('message:new', handleNewMessage);

  return () => {
    socketManager.off('message:new', handleNewMessage);
  };
}, [queryClient]);
```

**How it works:**
1. HomeScreen listens for `message:new` socket events
2. When a new message arrives, it invalidates the chats query
3. React Query automatically refetches the chat list
4. Chat list updates with latest message and unread count

### 2. Keyboard Avoiding Fix

**File:** `/src/screens/ChatScreen.tsx`

**Before:**
```typescript
<KeyboardAvoidingView
  style={[styles.container, { backgroundColor: colors.background }]}
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}  // ❌ undefined for Android
  keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
>
```

**After:**
```typescript
<KeyboardAvoidingView
  style={[styles.container, { backgroundColor: colors.background }]}
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}  // ✅ 'height' for Android
  keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
>
```

**Android Manifest** (already configured):
```xml
<activity
  android:name=".MainActivity"
  android:windowSoftInputMode="adjustResize"  // ✅ Correct setting
  ...
>
```

## How It Works

### Chat List Real-time Updates

#### Before Fix:
```
User A sends message → Backend broadcasts → User B receives in ChatScreen
                                         ↓
                                    HomeScreen doesn't update
                                         ↓
                                    Chat list shows old data
```

#### After Fix:
```
User A sends message → Backend broadcasts → User B receives in ChatScreen
                                         ↓
                                    HomeScreen socket listener fires
                                         ↓
                                    Invalidates chats query
                                         ↓
                                    React Query refetches
                                         ↓
                                    Chat list updates with new message & unread count
```

### Keyboard Behavior

#### iOS:
- Uses `behavior="padding"`
- Adds padding to push content up
- Works well with iOS keyboard

#### Android:
- Uses `behavior="height"`
- Adjusts view height when keyboard appears
- Combined with `adjustResize` in manifest
- Input box stays visible above keyboard

## KeyboardAvoidingView Behaviors

| Behavior | Description | Best For |
|----------|-------------|----------|
| `padding` | Adds padding to bottom | iOS |
| `height` | Adjusts view height | Android |
| `position` | Adjusts view position | Special cases |
| `undefined` | No adjustment | ❌ Causes issues |

## Testing

### Test Chat List Updates:
1. **Open app on Device 1** (User A)
2. **Open app on Device 2** (User B)
3. User A sends message to User B
4. ✅ User B's HomeScreen should update immediately
5. ✅ Chat should move to top of list
6. ✅ Unread count should increase
7. ✅ Latest message preview should show

### Test Keyboard Behavior:
1. Open any chat
2. Tap on input box
3. ✅ Keyboard should appear
4. ✅ Input box should stay visible above keyboard
5. ✅ You should see what you're typing
6. Type a long message
7. ✅ Input should expand (multiline)
8. ✅ Input should not be covered by keyboard

### Test on Different Devices:
- **Android Emulator:** ✅ Should work
- **Physical Android Device:** ✅ Should work
- **iOS Simulator:** ✅ Should work (if testing on Mac)
- **Physical iPhone:** ✅ Should work (if testing on Mac)

## Additional Features

### Chat List Updates Include:
- ✅ Latest message preview
- ✅ Unread count
- ✅ Timestamp
- ✅ Chat moves to top of list
- ✅ Real-time updates (no refresh needed)

### Keyboard Features:
- ✅ Multiline input
- ✅ Auto-scroll to bottom when typing
- ✅ Input stays visible
- ✅ Smooth keyboard animation
- ✅ Works on both platforms

## Files Modified

### Frontend:
- ✅ `/src/screens/HomeScreen.tsx` - Added socket listener for chat list updates
- ✅ `/src/screens/ChatScreen.tsx` - Fixed keyboard behavior for Android

### Backend:
- No changes needed (already broadcasting correctly)

## Related Fixes

This fix works together with the previous real-time messaging fix:
1. **Message Broadcasting:** Backend broadcasts to correct rooms
2. **Message Reception:** ChatScreen receives messages in real-time
3. **Chat List Updates:** HomeScreen updates when messages arrive ← **This fix**
4. **Keyboard Handling:** Input stays visible when typing ← **This fix**

## Summary

✅ **Fixed:**
- Chat list updates in real-time when new messages arrive
- Unread counts update automatically
- Latest message preview shows immediately
- Input box stays visible when keyboard opens on Android
- Smooth typing experience on all devices

✅ **Result:**
- Users see new messages in chat list instantly
- No need to pull-to-refresh
- Can see what they're typing
- Professional messaging experience

The chat list and keyboard handling are now fully functional! 💬⌨️
