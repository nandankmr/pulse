# Frontend Integration Complete - Backend APIs & Socket Events

**Date:** October 14, 2025  
**Status:** ✅ Core Integration Complete  
**Next:** UI Component Updates

---

## Summary

All essential backend APIs and Socket.IO events have been successfully integrated into the frontend codebase. The integration includes:

1. ✅ **Authentication APIs** - 5 new endpoints
2. ✅ **Chat Management APIs** - 4 new endpoints  
3. ✅ **Socket.IO Events** - 6 new events + enhancements
4. ✅ **React Hooks** - Complete hook implementations
5. ⏳ **UI Components** - Pending updates

---

## What Was Implemented

### 1. Authentication API Updates (`src/api/auth.ts`)

**New Endpoints Added:**
- `resendVerificationAPI()` - Resend email verification OTP
- `logoutAPI()` - Logout and revoke refresh token on server
- `forgotPasswordAPI()` - Request password reset OTP
- `resetPasswordAPI()` - Reset password with OTP
- `changePasswordAPI()` - Change password for authenticated user

**New Types:**
- `ResendVerificationRequest`
- `LogoutRequest`
- `ForgotPasswordRequest`
- `ResetPasswordRequest`
- `ChangePasswordRequest`

---

### 2. Chat Management API Updates (`src/api/chat.ts`)

**New Endpoints Added:**
- `searchUsersAPI()` - Search users by name/email (for starting DMs)
- `getGroupMembersAPI()` - Get group members with full user details
- `updateGroupDetailsAPI()` - Update group name/description/avatar
- `updateMemberRoleAPI()` - Promote/demote group members

**New Types:**
- `UserSearchResult`
- `SearchUsersResponse`
- `GroupMember`
- `GetGroupMembersResponse`
- `UpdateGroupDetailsRequest`
- `UpdateGroupDetailsResponse`
- `UpdateMemberRoleRequest`

---

### 3. Socket.IO Service Updates (`src/utils/socketManager.ts`)

**New Events - Listening (Server → Client):**
- `message:edited` - Message was edited
- `message:deleted` - Message was deleted
- `group:member:added` - Member added to group
- `group:member:removed` - Member removed from group
- `group:member:role_changed` - Member role changed
- `group:updated` - Group details updated

**New Events - Emitting (Client → Server):**
- `message:edit` - Edit a message
- `message:delete` - Delete a message

**Enhanced Events:**
- `message:read` - Now supports bulk read receipts with `messageIds` array

**New Methods:**
- `editMessage(payload)` - Edit a message
- `deleteMessage(payload)` - Delete a message
- `markAsRead(payload)` - Mark message(s) as read (supports bulk)

**New Types:**
- `EditMessagePayload`
- `MessageEditedData`
- `DeleteMessagePayload`
- `MessageDeletedData`
- `GroupMemberAddedData`
- `GroupMemberRemovedData`
- `GroupMemberRoleChangedData`
- `GroupUpdatedData`

---

### 4. React Hooks Created

#### Authentication Hooks (`src/hooks/useAuth.ts`)

**New Hooks:**
```typescript
useResendVerification() // Resend OTP
useLogout()             // Logout (updated to call backend)
useForgotPassword()     // Request password reset
useResetPassword()      // Reset password with OTP
useChangePassword()     // Change password
```

**Usage Example:**
```typescript
import { useResendVerification } from '../hooks/useAuth';

function ResendOTPButton({ email }) {
  const resendOTP = useResendVerification();
  
  const handleResend = async () => {
    try {
      await resendOTP.mutateAsync({ email });
      Alert.alert('Success', 'Verification code sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send code');
    }
  };
  
  return (
    <Button 
      onPress={handleResend} 
      loading={resendOTP.isPending}
    >
      Resend Code
    </Button>
  );
}
```

---

#### Chat Management Hooks (`src/hooks/useChatManagement.ts`)

**New Hooks:**
```typescript
useSearchUsers(query, limit)      // Search users
useGroupMembers(chatId)           // Get group members
useUpdateGroupDetails()           // Update group details
useUpdateMemberRole()             // Promote/demote member
```

**Usage Example:**
```typescript
import { useSearchUsers } from '../hooks/useChatManagement';

function UserSearchScreen() {
  const [query, setQuery] = useState('');
  const { data, isLoading } = useSearchUsers(query, 20);
  
  return (
    <View>
      <TextInput 
        value={query}
        onChangeText={setQuery}
        placeholder="Search users..."
      />
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={data?.data}
          renderItem={({ item }) => (
            <UserListItem user={item} />
          )}
        />
      )}
    </View>
  );
}
```

---

#### Message Operations Hook (`src/hooks/useMessageOperations.ts`)

**New Hook:**
```typescript
useMessageOperations() // Returns: { editMessage, deleteMessage, markMessageAsRead, markMessagesAsRead }
```

**Usage Example:**
```typescript
import { useMessageOperations } from '../hooks/useMessageOperations';

function MessageItem({ message, conversationId }) {
  const { editMessage, deleteMessage } = useMessageOperations();
  
  const handleEdit = () => {
    editMessage({
      messageId: message.id,
      content: 'Updated content',
      conversationId,
    });
  };
  
  const handleDelete = () => {
    deleteMessage({
      messageId: message.id,
      conversationId,
      deleteForEveryone: true,
    });
  };
  
  return (
    <View>
      <Text>{message.content}</Text>
      <Button onPress={handleEdit}>Edit</Button>
      <Button onPress={handleDelete}>Delete</Button>
    </View>
  );
}
```

---

## Next Steps - UI Component Updates

### Priority 1: Authentication Screens

#### 1. Update Verification Screen
**File:** `src/screens/VerificationScreen.tsx`

**Add:**
- "Resend Code" button using `useResendVerification()`
- Countdown timer (60 seconds) before allowing resend
- Success/error toast messages

---

#### 2. Create Forgot Password Flow

**New Screens Needed:**
- `ForgotPasswordScreen.tsx` - Enter email
- `ResetPasswordScreen.tsx` - Enter OTP and new password

**Flow:**
1. User enters email → calls `useForgotPassword()`
2. User receives OTP via email
3. User enters OTP + new password → calls `useResetPassword()`
4. Navigate to login screen on success

---

#### 3. Create Change Password Screen
**File:** `src/screens/ChangePasswordScreen.tsx`

**Fields:**
- Current password
- New password
- Confirm new password

**Hook:** `useChangePassword()`

---

#### 4. Update Logout Functionality
**Files:** `src/screens/ProfileScreen.tsx` or wherever logout is triggered

**Update:**
```typescript
const logout = useLogout();
const { refreshToken, deviceId } = useSelector((state) => state.auth);

const handleLogout = async () => {
  try {
    await logout.mutateAsync({ refreshToken, deviceId });
    // Navigation handled by hook
  } catch (error) {
    // Still clear local data even if backend call fails
    await clearAllData();
  }
};
```

---

### Priority 2: Chat Management Features

#### 1. Create User Search Screen
**File:** `src/screens/UserSearchScreen.tsx`

**Features:**
- Search input with debouncing
- User list with avatars
- Tap user to start DM
- Use `useSearchUsers()` hook

---

#### 2. Update Group Settings Screen
**File:** `src/screens/GroupSettingsScreen.tsx`

**Add:**
- Edit group name/description/avatar button
- Member list with roles (ADMIN/MEMBER badges)
- Promote/Demote buttons for admins
- Use `useGroupMembers()` and `useUpdateMemberRole()` hooks

**Example:**
```typescript
const { data: members } = useGroupMembers(groupId);
const updateRole = useUpdateMemberRole();

const handlePromote = async (memberId: string) => {
  try {
    await updateRole.mutateAsync({
      chatId: groupId,
      memberId,
      data: { role: 'ADMIN' },
    });
    Alert.alert('Success', 'Member promoted to admin');
  } catch (error) {
    Alert.alert('Error', 'Failed to promote member');
  }
};
```

---

#### 3. Create Edit Group Screen
**File:** `src/screens/EditGroupScreen.tsx`

**Fields:**
- Group name
- Group description
- Group avatar (image picker)

**Hook:** `useUpdateGroupDetails()`

---

### Priority 3: Message Operations

#### 1. Update Message Component
**File:** `src/components/MessageBubble.tsx` or similar

**Add:**
- Long press menu with "Edit" and "Delete" options
- Show "edited" badge if message was edited
- Show "Message deleted" placeholder for deleted messages
- Time limit checks (15 min for edit, 1 hour for delete for everyone)

**Example:**
```typescript
const { editMessage, deleteMessage } = useMessageOperations();
const [showMenu, setShowMenu] = useState(false);

const canEdit = () => {
  const messageTime = new Date(message.createdAt).getTime();
  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;
  return (now - messageTime) < fifteenMinutes && message.senderId === currentUserId;
};

const canDeleteForEveryone = () => {
  const messageTime = new Date(message.createdAt).getTime();
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  return (now - messageTime) < oneHour && message.senderId === currentUserId;
};
```

---

#### 2. Add Socket Event Listeners
**File:** `src/screens/ChatScreen.tsx` or message context

**Add listeners for:**
- `message:edited` - Update message in list
- `message:deleted` - Remove or mark as deleted
- `group:member:added` - Show system message
- `group:member:removed` - Show system message
- `group:member:role_changed` - Update member role
- `group:updated` - Update group name/avatar in header

**Example:**
```typescript
useEffect(() => {
  socketManager.on('message:edited', (data: MessageEditedData) => {
    // Update message in state
    setMessages(prev => prev.map(msg => 
      msg.id === data.messageId 
        ? { ...msg, content: data.content, editedAt: data.editedAt }
        : msg
    ));
  });

  socketManager.on('message:deleted', (data: MessageDeletedData) => {
    // Mark message as deleted
    setMessages(prev => prev.map(msg => 
      msg.id === data.messageId 
        ? { ...msg, deletedAt: data.deletedAt, content: 'Message deleted' }
        : msg
    ));
  });

  return () => {
    socketManager.off('message:edited');
    socketManager.off('message:deleted');
  };
}, []);
```

---

#### 3. Implement Bulk Read Receipts
**File:** `src/screens/ChatScreen.tsx`

**Update:** When opening a chat, mark all unread messages as read at once

```typescript
useEffect(() => {
  if (unreadMessages.length > 0) {
    const unreadIds = unreadMessages.map(msg => msg.id);
    markMessagesAsRead(unreadIds, targetUserId, groupId);
  }
}, [unreadMessages]);
```

---

## Testing Checklist

### Authentication
- [ ] Resend verification OTP works
- [ ] Logout calls backend and clears local data
- [ ] Forgot password sends OTP
- [ ] Reset password with OTP works
- [ ] Change password works for authenticated user
- [ ] Error handling for all auth operations

### Chat Management
- [ ] User search returns results
- [ ] Search works with min 2 characters
- [ ] Group members list shows full details
- [ ] Group details can be updated
- [ ] Member roles can be changed
- [ ] Only admins can update group/roles

### Message Operations
- [ ] Messages can be edited within 15 minutes
- [ ] Messages can be deleted
- [ ] "Delete for everyone" works within 1 hour
- [ ] Bulk read receipts work
- [ ] Edited messages show "edited" badge
- [ ] Deleted messages show placeholder

### Socket Events
- [ ] Message edit events received in real-time
- [ ] Message delete events received in real-time
- [ ] Group member events received in real-time
- [ ] Group update events received in real-time
- [ ] All events update UI correctly

---

## Known Issues / Notes

### Pre-existing Lint Errors
The following lint errors exist in `socketManager.ts` but are pre-existing:
- `Cannot find module 'socket.io-client'` - Need to install package
- `Property 'token' does not exist on type 'AuthState'` - Need to check auth slice structure

**Action:** These should be fixed separately as they affect existing functionality.

---

## File Structure

```
src/
├── api/
│   ├── auth.ts          ✅ Updated with 5 new endpoints
│   └── chat.ts          ✅ Updated with 4 new endpoints
├── hooks/
│   ├── useAuth.ts       ✅ Updated with 5 new hooks
│   ├── useChatManagement.ts  ✅ New file
│   └── useMessageOperations.ts  ✅ New file
└── utils/
    └── socketManager.ts  ✅ Updated with 6 new events + methods
```

---

## API Documentation Reference

For detailed API specifications, refer to:
- `FRONTEND_IMPLEMENTATION.md` - Backend team's implementation doc
- `BACKEND_REMAINING_APIS_AND_EVENTS.md` - Original request doc

---

## Support

If you encounter any issues during UI integration:
1. Check the backend implementation doc for payload structures
2. Verify Socket.IO connection is established
3. Check network requests in React Native Debugger
4. Review console logs for Socket.IO events

---

**Status:** Ready for UI Component Development ✅

**Estimated Time for UI Updates:** 2-3 days
- Day 1: Authentication screens
- Day 2: Chat management features  
- Day 3: Message operations + testing
