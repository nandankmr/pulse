# Chats API Integration Summary

## ✅ Completed Integration

The Chats API from the backend documentation has been successfully integrated into the React Native app.

### Files Created/Modified

#### New Files
1. **`src/hooks/useChats.ts`** - Custom React Query hooks for all chat operations
   - `useChats()` - Fetch all chats
   - `useChat(chatId)` - Fetch specific chat
   - `useCreateChat()` - Create DM or group
   - `useMarkChatAsRead()` - Mark chat as read
   - `useDeleteChat()` - Delete/hide chat
   - `useLeaveGroup()` - Leave group chat
   - `useAddGroupMembers()` - Add members to group
   - `useRemoveGroupMember()` - Remove member from group

#### Existing Files (Already Correct)
1. **`src/api/chat.ts`** - Already matches backend API perfectly ✅
   - All 8 endpoints implemented
   - Correct request/response types
   - Proper error handling

#### Modified Files
1. **`src/screens/HomeScreen.tsx`** - Updated to use React Query
   - Uses `useChats()` hook for fetching chats
   - Automatic loading states
   - Pull-to-refresh functionality
   - Real-time unread count calculation

2. **`src/screens/ChatScreen.tsx`** - Added mark as read functionality
   - Automatically marks chat as read when opened
   - Uses `useMarkChatAsRead()` hook

3. **`src/screens/CreateGroupScreen.tsx`** - Integrated with create chat API
   - Uses `useCreateChat()` hook
   - Creates group and navigates to it
   - Automatic error handling

---

## 📋 API Endpoints Integrated

### ✅ 1. GET /api/chats
**Purpose:** Fetch all chats (DMs and groups)  
**Hook:** `useChats()`  
**Used in:** HomeScreen  
**Features:**
- Automatic caching
- Pull-to-refresh
- Loading states

### ✅ 2. GET /api/chats/:chatId
**Purpose:** Fetch specific chat details  
**Hook:** `useChat(chatId)`  
**Status:** Hook created, not yet used in UI  
**Note:** Can be used for chat settings or details screen

### ✅ 3. POST /api/chats
**Purpose:** Create new chat (DM or group)  
**Hook:** `useCreateChat()`  
**Used in:** CreateGroupScreen  
**Request:**
```typescript
// For DM
{ recipientId: "user-id" }

// For Group
{ groupName: "Group Name", memberIds: ["user-1", "user-2"] }
```

### ✅ 4. POST /api/chats/:chatId/read
**Purpose:** Mark all messages in chat as read  
**Hook:** `useMarkChatAsRead()`  
**Used in:** ChatScreen  
**Features:**
- Automatically called when opening chat
- Updates unread count in chat list
- Optimistic UI updates

### ✅ 5. DELETE /api/chats/:chatId
**Purpose:** Delete or hide chat  
**Hook:** `useDeleteChat()`  
**Status:** Hook created, ready to use  
**Usage:** Add to chat context menu or swipe actions

### ✅ 6. POST /api/chats/:chatId/leave
**Purpose:** Leave a group chat  
**Hook:** `useLeaveGroup()`  
**Status:** Hook created, ready to use  
**Usage:** Add to group settings screen

### ✅ 7. POST /api/chats/:chatId/members
**Purpose:** Add members to group  
**Hook:** `useAddGroupMembers()`  
**Status:** Hook created, ready to use  
**Usage:** Add to group settings screen

### ✅ 8. DELETE /api/chats/:chatId/members/:memberId
**Purpose:** Remove member from group  
**Hook:** `useRemoveGroupMember()`  
**Status:** Hook created, ready to use  
**Usage:** Add to group settings screen

---

## 🎯 Key Features Implemented

### 1. **Automatic Caching**
React Query automatically caches chat data:
- Chats list cached for 5 minutes (default)
- Individual chat details cached separately
- Automatic background refetching

### 2. **Optimistic Updates**
UI updates immediately before server confirmation:
- Mark as read updates unread count instantly
- New chats appear in list immediately
- Deleted chats removed from list instantly

### 3. **Smart Invalidation**
Cache automatically invalidated when needed:
- Creating chat → Invalidates chat list
- Deleting chat → Removes from cache
- Adding/removing members → Invalidates chat details

### 4. **Error Handling**
All mutations include error handling:
- Network errors caught automatically
- User-friendly error messages
- Automatic retry on failure (configurable)

### 5. **Loading States**
All operations have loading indicators:
- `isLoading` - Initial data fetch
- `isPending` - Mutation in progress
- `isRefetching` - Background refresh

---

## 📱 Usage Examples

### Fetch All Chats
```typescript
import { useChats } from '../hooks/useChats';

function ChatList() {
  const { data, isLoading, refetch } = useChats();
  
  if (isLoading) return <Loading />;
  
  return (
    <FlatList
      data={data?.chats}
      onRefresh={refetch}
      // ...
    />
  );
}
```

### Create a DM
```typescript
import { useCreateChat } from '../hooks/useChats';

function UserProfile({ userId }) {
  const createChat = useCreateChat();
  
  const handleMessage = async () => {
    try {
      const { chat } = await createChat.mutateAsync({
        recipientId: userId
      });
      
      // Navigate to chat
      navigation.navigate('Chat', { chatId: chat.id });
    } catch (error) {
      Alert.alert('Error', 'Failed to create chat');
    }
  };
  
  return <Button onPress={handleMessage}>Message</Button>;
}
```

### Create a Group
```typescript
import { useCreateChat } from '../hooks/useChats';

function CreateGroup() {
  const createChat = useCreateChat();
  
  const handleCreate = async () => {
    const { chat } = await createChat.mutateAsync({
      groupName: 'Team Chat',
      memberIds: ['user-1', 'user-2', 'user-3']
    });
    
    navigation.navigate('Chat', { chatId: chat.id });
  };
  
  return <Button onPress={handleCreate}>Create Group</Button>;
}
```

### Mark as Read
```typescript
import { useMarkChatAsRead } from '../hooks/useChats';

function ChatScreen({ chatId }) {
  const markAsRead = useMarkChatAsRead();
  
  useEffect(() => {
    markAsRead.mutate(chatId);
  }, [chatId]);
  
  // ...
}
```

### Delete Chat
```typescript
import { useDeleteChat } from '../hooks/useChats';

function ChatListItem({ chat }) {
  const deleteChat = useDeleteChat();
  
  const handleDelete = () => {
    Alert.alert(
      'Delete Chat',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteChat.mutate(chat.id)
        }
      ]
    );
  };
  
  return <SwipeableRow onDelete={handleDelete} />;
}
```

### Leave Group
```typescript
import { useLeaveGroup } from '../hooks/useChats';

function GroupSettings({ groupId }) {
  const leaveGroup = useLeaveGroup();
  
  const handleLeave = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            await leaveGroup.mutateAsync(groupId);
            navigation.goBack();
          }
        }
      ]
    );
  };
  
  return <Button onPress={handleLeave}>Leave Group</Button>;
}
```

### Add Group Members
```typescript
import { useAddGroupMembers } from '../hooks/useChats';

function AddMembers({ groupId }) {
  const addMembers = useAddGroupMembers();
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  const handleAdd = async () => {
    await addMembers.mutateAsync({
      chatId: groupId,
      memberIds: selectedUsers.map(u => u.id)
    });
    
    Alert.alert('Success', 'Members added to group');
    navigation.goBack();
  };
  
  return <Button onPress={handleAdd}>Add Members</Button>;
}
```

### Remove Group Member
```typescript
import { useRemoveGroupMember } from '../hooks/useChats';

function MemberListItem({ groupId, member }) {
  const removeMember = useRemoveGroupMember();
  
  const handleRemove = () => {
    Alert.alert(
      'Remove Member',
      `Remove ${member.name} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeMember.mutate({
            chatId: groupId,
            memberId: member.id
          })
        }
      ]
    );
  };
  
  return <MenuItem onPress={handleRemove}>Remove</MenuItem>;
}
```

---

## 🚀 Recommended Next Steps

### High Priority
1. **Add Swipe Actions to Chat List**
   - Swipe left to delete chat
   - Swipe right to mark as read/unread
   - Use `useDeleteChat()` hook

2. **Create Group Settings Screen**
   - View group members
   - Add members (use `useAddGroupMembers()`)
   - Remove members (use `useRemoveGroupMember()`)
   - Leave group (use `useLeaveGroup()`)
   - Edit group name/avatar

3. **Add "Start Chat" Flow**
   - User search/selection screen
   - Create DM with selected user
   - Use `useCreateChat()` with `recipientId`

### Medium Priority
4. **Implement Chat Context Menu**
   - Long-press on chat for options
   - Delete chat
   - Mute notifications
   - Pin chat

5. **Add Empty States**
   - No chats yet → Show "Start a conversation"
   - No search results → Show "No users found"

6. **Implement Pull-to-Refresh**
   - Already implemented in HomeScreen ✅
   - Add to other list screens

### Low Priority
7. **Add Chat Filters**
   - Filter by unread
   - Filter by groups only
   - Filter by DMs only

8. **Implement Chat Pinning**
   - Pin important chats to top
   - Requires backend API (not documented)

---

## ⚠️ Missing APIs (Need Backend Implementation)

Based on the documentation, the following features are **NOT available** in the backend:

### 1. **Search Users for DM**
**Endpoint:** Not documented  
**Suggested:** `GET /api/users/search?q={query}`  
**Use Case:** When creating a new DM, need to search for users  
**Request:**
```
GET /api/users/search?q=john
```
**Response:**
```json
{
  "users": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "avatar": "string",
      "isOnline": true
    }
  ]
}
```

### 2. **Get Group Members**
**Endpoint:** Not documented  
**Suggested:** `GET /api/chats/:chatId/members`  
**Use Case:** Display group members in settings  
**Response:**
```json
{
  "members": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "avatar": "string",
      "role": "ADMIN" | "MEMBER",
      "joinedAt": "ISO 8601"
    }
  ]
}
```

### 3. **Update Group Details**
**Endpoint:** Not documented  
**Suggested:** `PATCH /api/chats/:chatId`  
**Use Case:** Edit group name, description, avatar  
**Request:**
```json
{
  "name": "string",
  "description": "string",
  "avatar": "string"
}
```

### 4. **Promote/Demote Group Member**
**Endpoint:** Not documented  
**Suggested:** `PATCH /api/chats/:chatId/members/:memberId`  
**Use Case:** Change member role (ADMIN/MEMBER)  
**Request:**
```json
{
  "role": "ADMIN" | "MEMBER"
}
```

### 5. **Mute/Unmute Chat**
**Endpoint:** Not documented  
**Suggested:** `POST /api/chats/:chatId/mute`  
**Use Case:** Mute notifications for specific chat  
**Request:**
```json
{
  "duration": "1h" | "8h" | "1w" | "forever"
}
```

### 6. **Pin/Unpin Chat**
**Endpoint:** Not documented  
**Suggested:** `POST /api/chats/:chatId/pin`  
**Use Case:** Pin important chats to top of list

### 7. **Archive Chat**
**Endpoint:** Not documented  
**Suggested:** `POST /api/chats/:chatId/archive`  
**Use Case:** Archive old chats without deleting

---

## 🔗 Integration with Socket.IO

The documentation mentions Socket.IO integration for real-time updates. Here's how to integrate:

```typescript
// src/services/socket.ts
import io from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { chatKeys } from '../hooks/useChats';

export function useSocketChatUpdates() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const socket = io('http://localhost:3000', {
      auth: {
        token: localStorage.getItem('accessToken')
      }
    });
    
    // New message received
    socket.on('message:new', ({ message }) => {
      const chatId = message.conversationId || message.groupId;
      
      // Update chat list with new message
      queryClient.setQueryData(chatKeys.list(), (old: any) => {
        if (!old) return old;
        
        return {
          chats: old.chats.map((chat: any) => {
            if (chat.id === chatId) {
              return {
                ...chat,
                lastMessage: message.content,
                timestamp: message.createdAt,
                unreadCount: chat.unreadCount + 1
              };
            }
            return chat;
          })
        };
      });
    });
    
    // Message read confirmation
    socket.on('message:read:confirmed', ({ messageId, readerId }) => {
      // Update UI to show message was read
    });
    
    // User online/offline status
    socket.on('presence:update', ({ userId, status }) => {
      // Update online status for DMs
      queryClient.setQueryData(chatKeys.list(), (old: any) => {
        if (!old) return old;
        
        return {
          chats: old.chats.map((chat: any) => {
            if (!chat.isGroup && chat.id.includes(userId)) {
              return {
                ...chat,
                isOnline: status === 'online'
              };
            }
            return chat;
          })
        };
      });
    });
    
    return () => {
      socket.disconnect();
    };
  }, [queryClient]);
}
```

---

## 📊 Data Flow

```
User Action → React Query Hook → API Client → Backend
                    ↓
              Optimistic Update (UI)
                    ↓
              Server Response
                    ↓
              Cache Update
                    ↓
              UI Re-render
```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] **Fetch Chats**
  - Open app → See list of chats
  - Pull to refresh → Chats update
  - Search chats → Results filter correctly

- [ ] **Create DM**
  - Select user → Create DM
  - DM appears in chat list
  - Navigate to chat screen

- [ ] **Create Group**
  - Enter group name
  - Select members
  - Create group → Group appears in list
  - Navigate to group chat

- [ ] **Mark as Read**
  - Open chat with unread messages
  - Unread count decreases in list
  - Badge disappears when all read

- [ ] **Delete Chat**
  - Swipe or long-press chat
  - Confirm deletion
  - Chat removed from list

- [ ] **Leave Group**
  - Open group settings
  - Tap "Leave Group"
  - Confirm → Group removed from list

- [ ] **Add Members**
  - Open group settings
  - Tap "Add Members"
  - Select users → Members added

- [ ] **Remove Member**
  - Open group settings
  - Tap member → Remove
  - Member removed from group

---

## 🔧 Configuration

Ensure your API base URL is correct in `src/config/index.ts`:

```typescript
const config = {
  API_URL: __DEV__ 
    ? 'http://localhost:3000/api'  // Update to your backend URL
    : 'https://your-production-api.com/api',
};
```

---

## 📚 Additional Resources

- **Backend API Docs:** `api-chats.md`
- **React Query Docs:** https://tanstack.com/query/latest
- **Socket.IO Docs:** https://socket.io/docs/v4/

---

## ✅ Summary

**All 8 Chats API endpoints have been successfully integrated!**

- ✅ API client already existed and matches backend perfectly
- ✅ React Query hooks created for all operations
- ✅ HomeScreen updated to use real API
- ✅ ChatScreen marks chats as read automatically
- ✅ CreateGroupScreen creates groups via API
- ✅ Optimistic updates for better UX
- ✅ Automatic caching and invalidation
- ✅ Error handling and loading states

**Next Steps:**
1. Implement Group Settings screen with member management
2. Add user search for creating DMs
3. Request missing APIs from backend team (see list above)
4. Integrate Socket.IO for real-time updates
