# Groups API Integration Summary

## ✅ Completed Integration

The Groups API from the backend documentation has been successfully integrated into the React Native app.

### Files Created/Modified

#### New Files
1. **`src/hooks/useGroups.ts`** - Custom React Query hooks for all group operations
   - `useMyGroups()` - Fetch all groups for current user
   - `useGroup(groupId)` - Fetch specific group
   - `useCreateGroup()` - Create new group
   - `useUpdateGroup()` - Update group details
   - `useDeleteGroup()` - Delete group
   - `useAddGroupMember()` - Add member to group
   - `useUpdateMemberRole()` - Update member role (ADMIN/MEMBER)
   - `useRemoveGroupMember()` - Remove member from group
   - `useCreateInvitation()` - Create invitation token
   - `useJoinGroup()` - Join group with invitation token

#### Modified Files
1. **`src/api/group.ts`** - Updated to match backend API exactly
   - Changed from `/groups` to `/groups/me` for listing user's groups
   - Updated all types to match backend (GroupRole, GroupMember, Group, GroupInvitation)
   - Changed HTTP methods (PUT → PATCH for updates)
   - Updated request/response structures
   - Added helper functions (isGroupAdmin, getUserRole, isGroupMember)

2. **`src/screens/GroupSettingsScreen.tsx`** - Integrated with Groups API
   - Uses `useGroup()` hook for fetching group data
   - Uses `useRemoveGroupMember()` for leaving/removing members
   - Uses `useUpdateMemberRole()` for promoting members to admin
   - Uses `useCreateInvitation()` for generating invite links
   - Real-time updates via React Query cache

---

## 📋 API Endpoints Integrated

### ✅ 1. POST /api/groups
**Purpose:** Create a new group  
**Hook:** `useCreateGroup()`  
**Request:**
```typescript
{
  name: string;
  description?: string;
  avatarUrl?: string;
}
```
**Response:** Group object with creator as ADMIN

### ✅ 2. GET /api/groups/me
**Purpose:** Get all groups for current user  
**Hook:** `useMyGroups()`  
**Response:** `{ data: Group[] }`

### ✅ 3. GET /api/groups/:groupId
**Purpose:** Get specific group details  
**Hook:** `useGroup(groupId)`  
**Response:** Group object with members array

### ✅ 4. PATCH /api/groups/:groupId
**Purpose:** Update group information (admin only)  
**Hook:** `useUpdateGroup()`  
**Request:**
```typescript
{
  name?: string;
  description?: string | null;
  avatarUrl?: string | null;
}
```

### ✅ 5. DELETE /api/groups/:groupId
**Purpose:** Delete group (admin only)  
**Hook:** `useDeleteGroup()`  
**Response:** 204 No Content

### ✅ 6. POST /api/groups/:groupId/members
**Purpose:** Add member to group (admin only)  
**Hook:** `useAddGroupMember()`  
**Request:**
```typescript
{
  userId: string;
  role?: 'ADMIN' | 'MEMBER';  // default: MEMBER
}
```

### ✅ 7. PATCH /api/groups/:groupId/members/:userId
**Purpose:** Update member role (admin only)  
**Hook:** `useUpdateMemberRole()`  
**Request:**
```typescript
{
  role: 'ADMIN' | 'MEMBER';
}
```

### ✅ 8. DELETE /api/groups/:groupId/members/:userId
**Purpose:** Remove member from group (admin or self)  
**Hook:** `useRemoveGroupMember()`  
**Response:** Updated Group object

### ✅ 9. POST /api/groups/:groupId/invite
**Purpose:** Create invitation token (admin only)  
**Hook:** `useCreateInvitation()`  
**Request:**
```typescript
{
  email?: string;
  expiresInHours?: number;  // default: 72, max: 336
}
```
**Response:** GroupInvitation object with token

### ✅ 10. POST /api/groups/:groupId/join
**Purpose:** Join group with invitation token  
**Hook:** `useJoinGroup()`  
**Request:**
```typescript
{
  token: string;  // min 10 characters
}
```
**Response:** Group object

---

## 🎯 Key Features Implemented

### 1. **Type Safety**
All types match backend exactly:
```typescript
export type GroupRole = 'ADMIN' | 'MEMBER';

export interface GroupMember {
  userId: string;
  role: GroupRole;
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: GroupMember[];
}
```

### 2. **Helper Functions**
```typescript
isGroupAdmin(group, userId)  // Check if user is admin
getUserRole(group, userId)   // Get user's role
isGroupMember(group, userId) // Check if user is member
```

### 3. **Automatic Cache Management**
- Creating group → Adds to list + caches details
- Updating group → Updates list + details
- Deleting group → Removes from list + cache
- Adding/removing members → Updates group data
- Joining group → Adds to list

### 4. **Permission-Based UI**
GroupSettingsScreen shows/hides features based on role:
- Admins can: Edit group, generate invites, add/remove members, promote members
- Members can: View group, leave group

---

## 📱 Usage Examples

### Create a Group
```typescript
import { useCreateGroup } from '../hooks/useGroups';

function CreateGroupButton() {
  const createGroup = useCreateGroup();
  
  const handleCreate = async () => {
    try {
      const group = await createGroup.mutateAsync({
        name: 'My Team',
        description: 'Team collaboration space',
        avatarUrl: 'https://example.com/avatar.png'
      });
      
      console.log('Group created:', group.id);
      navigation.navigate('GroupSettings', { groupId: group.id });
    } catch (error) {
      Alert.alert('Error', 'Failed to create group');
    }
  };
  
  return (
    <Button 
      onPress={handleCreate}
      loading={createGroup.isPending}
    >
      Create Group
    </Button>
  );
}
```

### List My Groups
```typescript
import { useMyGroups } from '../hooks/useGroups';

function MyGroupsList() {
  const { data, isLoading, refetch } = useMyGroups();
  
  if (isLoading) return <Loading />;
  
  return (
    <FlatList
      data={data?.data}
      renderItem={({ item }) => (
        <GroupListItem group={item} />
      )}
      onRefresh={refetch}
      refreshing={isLoading}
    />
  );
}
```

### Update Group
```typescript
import { useUpdateGroup } from '../hooks/useGroups';

function EditGroupScreen({ groupId }) {
  const updateGroup = useUpdateGroup();
  
  const handleSave = async (name: string, description: string) => {
    try {
      await updateGroup.mutateAsync({
        groupId,
        data: { name, description }
      });
      
      Alert.alert('Success', 'Group updated');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update group');
    }
  };
  
  return <EditForm onSave={handleSave} />;
}
```

### Add Member
```typescript
import { useAddGroupMember } from '../hooks/useGroups';

function AddMemberButton({ groupId, userId }) {
  const addMember = useAddGroupMember();
  
  const handleAdd = async () => {
    try {
      await addMember.mutateAsync({
        groupId,
        data: {
          userId,
          role: 'MEMBER'  // or 'ADMIN'
        }
      });
      
      Alert.alert('Success', 'Member added');
    } catch (error) {
      Alert.alert('Error', 'Failed to add member');
    }
  };
  
  return <Button onPress={handleAdd}>Add Member</Button>;
}
```

### Promote to Admin
```typescript
import { useUpdateMemberRole } from '../hooks/useGroups';

function PromoteMemberButton({ groupId, userId }) {
  const updateRole = useUpdateMemberRole();
  
  const handlePromote = async () => {
    try {
      await updateRole.mutateAsync({
        groupId,
        userId,
        data: { role: 'ADMIN' }
      });
      
      Alert.alert('Success', 'Member promoted to admin');
    } catch (error) {
      Alert.alert('Error', 'Failed to promote member');
    }
  };
  
  return <Button onPress={handlePromote}>Make Admin</Button>;
}
```

### Remove Member
```typescript
import { useRemoveGroupMember } from '../hooks/useGroups';

function RemoveMemberButton({ groupId, userId }) {
  const removeMember = useRemoveGroupMember();
  
  const handleRemove = async () => {
    Alert.alert(
      'Remove Member',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember.mutateAsync({ groupId, userId });
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member');
            }
          }
        }
      ]
    );
  };
  
  return <Button onPress={handleRemove}>Remove</Button>;
}
```

### Generate Invite Link
```typescript
import { useCreateInvitation } from '../hooks/useGroups';
import Clipboard from '@react-native-clipboard/clipboard';

function GenerateInviteButton({ groupId }) {
  const createInvitation = useCreateInvitation();
  
  const handleGenerate = async () => {
    try {
      const invitation = await createInvitation.mutateAsync({
        groupId,
        data: {
          expiresInHours: 72  // 3 days
        }
      });
      
      const link = `pulse://join/${groupId}?token=${invitation.token}`;
      
      Clipboard.setString(link);
      Alert.alert('Success', 'Invite link copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate invite');
    }
  };
  
  return <Button onPress={handleGenerate}>Generate Invite</Button>;
}
```

### Join Group with Token
```typescript
import { useJoinGroup } from '../hooks/useGroups';
import { useEffect } from 'react';

function JoinGroupScreen({ route }) {
  const { groupId, token } = route.params;
  const joinGroup = useJoinGroup();
  
  useEffect(() => {
    handleJoin();
  }, []);
  
  const handleJoin = async () => {
    try {
      const group = await joinGroup.mutateAsync({
        groupId,
        data: { token }
      });
      
      Alert.alert('Success', `Joined ${group.name}!`);
      navigation.replace('GroupSettings', { groupId: group.id });
    } catch (error) {
      Alert.alert('Error', 'Invalid or expired invitation');
      navigation.goBack();
    }
  };
  
  return <Loading />;
}
```

### Check Permissions
```typescript
import { isGroupAdmin, getUserRole } from '../api/group';

function GroupActions({ group, currentUserId }) {
  const isAdmin = isGroupAdmin(group, currentUserId);
  const role = getUserRole(group, currentUserId);
  
  return (
    <View>
      {isAdmin && (
        <>
          <Button>Edit Group</Button>
          <Button>Add Members</Button>
          <Button>Generate Invite</Button>
        </>
      )}
      
      <Text>Your role: {role}</Text>
      <Button>Leave Group</Button>
    </View>
  );
}
```

---

## 🚀 Recommended Next Steps

### High Priority
1. **Create "My Groups" Screen**
   - List all groups user is member of
   - Use `useMyGroups()` hook
   - Show group avatar, name, member count
   - Navigate to GroupSettingsScreen on tap

2. **Implement Deep Linking for Invitations**
   - Handle `pulse://join/:groupId?token=xxx` URLs
   - Auto-join group when link is opened
   - Use `useJoinGroup()` hook

3. **Add User Search for Adding Members**
   - Search users by name/email
   - Select users to add to group
   - Use `useAddGroupMember()` hook

### Medium Priority
4. **Create Edit Group Screen**
   - Edit group name, description, avatar
   - Use `useUpdateGroup()` hook
   - Image picker for avatar

5. **Implement Group Avatar Upload**
   - Pick image from gallery/camera
   - Upload to server
   - Update group with avatarUrl

6. **Add Member Management UI**
   - View all members with roles
   - Promote/demote members
   - Remove members
   - Already partially implemented in GroupSettingsScreen

### Low Priority
7. **Group Activity Feed**
   - Show when members join/leave
   - Show when group details change
   - Show when roles change

8. **Group Settings**
   - Mute notifications
   - Archive group
   - Report group

---

## ⚠️ Missing APIs (Not in Backend Docs)

The following features are **NOT available** in the backend Groups API:

### 1. **Search Users**
**Endpoint:** Not documented  
**Suggested:** `GET /api/users/search?q={query}`  
**Use Case:** Search for users to add to group  
**Note:** This was in the old API but not in the new Groups API docs

### 2. **Get Group Members with User Details**
**Current:** Members array only has `userId`, `role`, `joinedAt`  
**Missing:** User details (name, email, avatar, isOnline)  
**Suggested:** Either:
- Expand members in GET /api/groups/:groupId response
- Add GET /api/groups/:groupId/members endpoint that returns full user details

### 3. **Bulk Add Members**
**Current:** Can only add one member at a time  
**Suggested:** Accept array of userIds in POST /api/groups/:groupId/members
```typescript
{
  members: [
    { userId: 'user-1', role: 'MEMBER' },
    { userId: 'user-2', role: 'ADMIN' }
  ]
}
```

### 4. **Transfer Ownership**
**Endpoint:** Not documented  
**Suggested:** `POST /api/groups/:groupId/transfer-ownership`  
**Use Case:** Transfer group ownership to another admin

### 5. **Group Statistics**
**Endpoint:** Not documented  
**Suggested:** `GET /api/groups/:groupId/stats`  
**Response:**
```json
{
  "memberCount": 15,
  "messageCount": 1234,
  "createdAt": "ISO 8601"
}
```

---

## 🔗 Relationship with Chats API

The Groups API is separate from the Chats API:

- **Groups API** (`/api/groups`) - For managing group membership, roles, invitations
- **Chats API** (`/api/chats`) - For managing conversations, messages

**When to use which:**
- Use **Groups API** for:
  - Creating groups
  - Managing members
  - Updating group details
  - Generating invitations
  - Joining groups

- Use **Chats API** for:
  - Fetching chat list (includes groups)
  - Sending/receiving messages
  - Marking messages as read
  - Deleting chats

**Integration:**
- When creating a group via Chats API (`POST /api/chats` with `groupName`), it likely creates both a chat and a group
- Group chat messages go through Chats/Messages API
- Group membership management goes through Groups API

---

## 🔧 Configuration

Ensure your API base URL is correct in `src/config/index.ts`:

```typescript
const config = {
  API_URL: __DEV__ 
    ? 'http://localhost:3000/api'
    : 'https://your-production-api.com/api',
};
```

---

## 📊 Permission Matrix

| Action | Admin | Member | Non-Member |
|--------|-------|--------|------------|
| View group | ✓ | ✓ | ✗ |
| Update group | ✓ | ✗ | ✗ |
| Delete group | ✓ | ✗ | ✗ |
| Add members | ✓ | ✗ | ✗ |
| Remove members | ✓ | Self only | ✗ |
| Update roles | ✓ | ✗ | ✗ |
| Create invitations | ✓ | ✗ | ✗ |
| Join via invitation | ✓ | ✓ | ✓ |

---

## 🧪 Testing Checklist

- [ ] **Create Group**
  - Create group with name only
  - Create group with name + description
  - Create group with name + description + avatar
  - Group appears in "My Groups" list

- [ ] **View Group**
  - Open group settings
  - See group name, description, avatar
  - See list of members with roles

- [ ] **Update Group**
  - Edit group name
  - Edit group description
  - Remove description (set to null)
  - Update group avatar

- [ ] **Delete Group**
  - Delete group as admin
  - Group removed from list
  - Cannot access group after deletion

- [ ] **Add Member**
  - Add member with MEMBER role
  - Add member with ADMIN role
  - Member appears in group

- [ ] **Update Role**
  - Promote member to admin
  - Demote admin to member
  - Role updates in UI

- [ ] **Remove Member**
  - Remove member as admin
  - Leave group as member
  - Member removed from group

- [ ] **Generate Invitation**
  - Generate invite with default expiration
  - Generate invite with custom expiration
  - Generate invite with email
  - Copy invite link

- [ ] **Join Group**
  - Join group with valid token
  - Fail to join with invalid token
  - Fail to join with expired token
  - Fail to join if already member

---

## ✅ Summary

**All 10 Groups API endpoints have been successfully integrated!**

- ✅ API client updated to match backend exactly
- ✅ React Query hooks created for all operations
- ✅ GroupSettingsScreen updated to use real API
- ✅ Type-safe with full TypeScript support
- ✅ Automatic caching and invalidation
- ✅ Permission-based UI
- ✅ Helper functions for common checks

**Next Steps:**
1. Create "My Groups" list screen
2. Implement deep linking for invitations
3. Add user search for adding members
4. Request missing APIs from backend team (see list above)
5. Integrate with Chats API for messaging
