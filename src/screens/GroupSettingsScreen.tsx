// src/screens/GroupSettingsScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {
  Text,
  List,
  Avatar,
  Button,
  Divider,
  IconButton,
  Switch,
  Dialog,
  Portal,
  Searchbar,
} from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member';
  isOnline: boolean;
}

interface GroupInfo {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  isPrivate: boolean;
  createdBy: string;
  memberCount: number;
  createdAt: string;
}

interface RouteParams {
  groupId: string;
}

const GroupSettingsScreen: React.FC = () => {
  const { colors } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { groupId } = (route.params as RouteParams) || {};

  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const currentUserId = 'current-user';

  useEffect(() => {
    loadGroupInfo();
    loadMembers();
  }, [groupId]);

  const loadGroupInfo = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await getGroupInfoAPI(groupId);
      // setGroupInfo(response.group);

      // Mock data
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
      setGroupInfo({
        id: groupId,
        name: 'Project Team',
        description: 'Discussing project updates and tasks',
        isPrivate: true,
        createdBy: 'current-user',
        memberCount: 5,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to load group info:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await getGroupMembersAPI(groupId);
      // setMembers(response.members);

      // Mock data
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
      setMembers([
        {
          id: 'current-user',
          name: 'You',
          email: 'you@example.com',
          role: 'admin',
          isOnline: true,
        },
        {
          id: '1',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          role: 'admin',
          isOnline: true,
        },
        {
          id: '2',
          name: 'Bob Smith',
          email: 'bob@example.com',
          role: 'member',
          isOnline: false,
        },
        {
          id: '3',
          name: 'Carol White',
          email: 'carol@example.com',
          role: 'member',
          isOnline: true,
        },
      ]);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const isAdmin = () => {
    const currentMember = members.find((m) => m.id === currentUserId);
    return currentMember?.role === 'admin';
  };

  const handleLeaveGroup = () => {
    setShowLeaveDialog(true);
  };

  const confirmLeaveGroup = async () => {
    try {
      // TODO: Replace with actual API call
      // await leaveGroupAPI(groupId);

      await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
      setShowLeaveDialog(false);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to leave group:', error);
      Alert.alert('Error', 'Failed to leave group');
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Remove ${memberName} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Replace with actual API call
              // await removeMemberAPI(groupId, memberId);

              await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
              setMembers(members.filter((m) => m.id !== memberId));
            } catch (error) {
              console.error('Failed to remove member:', error);
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const handleMakeAdmin = async (memberId: string, memberName: string) => {
    Alert.alert(
      'Make Admin',
      `Make ${memberName} a group admin?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Make Admin',
          onPress: async () => {
            try {
              // TODO: Replace with actual API call
              // await updateMemberRoleAPI(groupId, memberId, 'admin');

              await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
              setMembers(
                members.map((m) =>
                  m.id === memberId ? { ...m, role: 'admin' } : m
                )
              );
            } catch (error) {
              console.error('Failed to update role:', error);
              Alert.alert('Error', 'Failed to update member role');
            }
          },
        },
      ]
    );
  };

  const handleAddMembers = () => {
    setShowAddMemberDialog(true);
  };

  const renderMember = (member: GroupMember) => {
    const isCurrentUser = member.id === currentUserId;
    const canManage = isAdmin() && !isCurrentUser;

    return (
      <List.Item
        key={member.id}
        title={member.name}
        description={member.role === 'admin' ? 'Admin' : 'Member'}
        left={() => (
          <View>
            <Avatar.Text
              size={40}
              label={member.name.substring(0, 2).toUpperCase()}
            />
            {member.isOnline && <View style={styles.onlineBadge} />}
          </View>
        )}
        right={() =>
          canManage ? (
            <IconButton
              icon="dots-vertical"
              onPress={() => {
                Alert.alert(
                  member.name,
                  'Choose an action',
                  [
                    {
                      text: 'Make Admin',
                      onPress: () => handleMakeAdmin(member.id, member.name),
                    },
                    {
                      text: 'Remove from Group',
                      style: 'destructive',
                      onPress: () => handleRemoveMember(member.id, member.name),
                    },
                    { text: 'Cancel', style: 'cancel' },
                  ]
                );
              }}
            />
          ) : null
        }
      />
    );
  };

  if (loading || !groupInfo) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text variant="bodyLarge" style={{ color: colors.text }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        {/* Group Info */}
        <View style={styles.headerSection}>
          {groupInfo.avatar ? (
            <Image source={{ uri: groupInfo.avatar }} style={styles.groupAvatar} />
          ) : (
            <View style={[styles.groupAvatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Icon name="account-group" size={48} color="#FFFFFF" />
            </View>
          )}
          <Text variant="headlineSmall" style={[styles.groupName, { color: colors.text }]}>
            {groupInfo.name}
          </Text>
          {groupInfo.description && (
            <Text variant="bodyMedium" style={[styles.groupDescription, { color: colors.text }]}>
              {groupInfo.description}
            </Text>
          )}
          <Text variant="bodySmall" style={[styles.memberCount, { color: colors.text }]}>
            {members.length} members
          </Text>
        </View>

        <Divider />

        {/* Group Settings */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
            Settings
          </Text>
          
          <List.Item
            title="Private Group"
            description={groupInfo.isPrivate ? 'Only invited members can join' : 'Anyone can join'}
            left={() => <List.Icon icon="lock" />}
            right={() => <Switch value={groupInfo.isPrivate} disabled />}
          />

          {isAdmin() && (
            <List.Item
              title="Edit Group Info"
              description="Change name, description, or photo"
              left={() => <List.Icon icon="pencil" />}
              onPress={() => {
                // TODO: Navigate to edit group screen
                console.log('Edit group info');
              }}
            />
          )}
        </View>

        <Divider />

        {/* Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
              Members ({members.length})
            </Text>
            {isAdmin() && (
              <IconButton
                icon="account-plus"
                size={24}
                onPress={handleAddMembers}
              />
            )}
          </View>

          {members.map(renderMember)}
        </View>

        <Divider />

        {/* Actions */}
        <View style={styles.section}>
          <List.Item
            title="Leave Group"
            titleStyle={{ color: '#F44336' }}
            left={() => <List.Icon icon="exit-to-app" color="#F44336" />}
            onPress={handleLeaveGroup}
          />
        </View>
      </ScrollView>

      {/* Leave Group Dialog */}
      <Portal>
        <Dialog visible={showLeaveDialog} onDismiss={() => setShowLeaveDialog(false)}>
          <Dialog.Title>Leave Group?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to leave "{groupInfo.name}"?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLeaveDialog(false)}>Cancel</Button>
            <Button onPress={confirmLeaveGroup} textColor="#F44336">
              Leave
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Add Members Dialog */}
        <Dialog visible={showAddMemberDialog} onDismiss={() => setShowAddMemberDialog(false)}>
          <Dialog.Title>Add Members</Dialog.Title>
          <Dialog.Content>
            <Searchbar
              placeholder="Search users"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Text variant="bodySmall" style={styles.dialogHint}>
              Feature coming soon
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddMemberDialog(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  groupAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  groupAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupName: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  groupDescription: {
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 24,
    opacity: 0.7,
  },
  memberCount: {
    marginTop: 8,
    opacity: 0.6,
  },
  section: {
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontWeight: 'bold',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dialogHint: {
    marginTop: 16,
    opacity: 0.6,
  },
});

export default GroupSettingsScreen;
