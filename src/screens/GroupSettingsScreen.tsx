// src/screens/GroupSettingsScreen.tsx

import React, { useState } from 'react';
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
import { useGroup, useRemoveGroupMember, useCreateInvitation } from '../hooks/useGroups';
import { useGroupMembers, useUpdateMemberRole, useUpdateGroupDetails } from '../hooks/useChatManagement';
import { isGroupAdmin } from '../api/group';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface RouteParams {
  groupId: string;
}

const GroupSettingsScreen: React.FC = () => {
  const { colors } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { groupId } = (route.params as RouteParams) || {};
  
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentUserId = currentUser?.id || '';

  // Fetch group data
  const { data: group, isLoading } = useGroup(groupId);
  const { data: membersData, isLoading: membersLoading } = useGroupMembers(groupId);
  const removeMemberMutation = useRemoveGroupMember();
  const updateRoleMutation = useUpdateMemberRole();
  const updateGroupMutation = useUpdateGroupDetails();
  const createInvitationMutation = useCreateInvitation();

  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = group ? isGroupAdmin(group, currentUserId) : false;

  const handleLeaveGroup = () => {
    setShowLeaveDialog(true);
  };

  const confirmLeaveGroup = async () => {
    try {
      await removeMemberMutation.mutateAsync({
        groupId,
        userId: currentUserId,
      });
      setShowLeaveDialog(false);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to leave group:', error);
      Alert.alert('Error', 'Failed to leave group');
    }
  };

  const handleRemoveMember = (memberId: string) => {
    const member = group?.members.find(m => m.userId === memberId);
    if (!member) return;

    Alert.alert(
      'Remove Member',
      `Remove this member from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMemberMutation.mutateAsync({
                groupId,
                userId: memberId,
              });
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
              await updateRoleMutation.mutateAsync({
                chatId: groupId,
                memberId,
                data: { role: 'ADMIN' },
              });
              Alert.alert('Success', `${memberName} is now an admin`);
            } catch (error) {
              console.error('Failed to update role:', error);
              Alert.alert('Error', 'Failed to update member role');
            }
          },
        },
      ]
    );
  };

  const handleDemoteMember = async (memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Admin',
      `Remove admin privileges from ${memberName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateRoleMutation.mutateAsync({
                chatId: groupId,
                memberId,
                data: { role: 'MEMBER' },
              });
              Alert.alert('Success', `${memberName} is now a regular member`);
            } catch (error) {
              console.error('Failed to update role:', error);
              Alert.alert('Error', 'Failed to update member role');
            }
          },
        },
      ]
    );
  };

  const handleEditGroup = () => {
    navigation.navigate('EditGroup' as never, { groupId } as never);
  };

  const handleGenerateInvite = async () => {
    try {
      const invitation = await createInvitationMutation.mutateAsync({
        groupId,
        data: { expiresInHours: 72 },
      });
      
      // Create shareable link
      const inviteLink = `pulse://join/${groupId}?token=${invitation.token}`;
      
      Alert.alert(
        'Invitation Link',
        inviteLink,
        [
          { text: 'Close', style: 'cancel' },
          {
            text: 'Copy',
            onPress: () => {
              // TODO: Implement clipboard copy
              console.log('Copy to clipboard:', inviteLink);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to generate invite:', error);
      Alert.alert('Error', 'Failed to generate invitation link');
    }
  };

  if (isLoading || !group) {
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
          {group.avatarUrl ? (
            <Image source={{ uri: group.avatarUrl }} style={styles.groupAvatar} />
          ) : (
            <View style={[styles.groupAvatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Icon name="account-group" size={48} color="#FFFFFF" />
            </View>
          )}
          <Text variant="headlineSmall" style={[styles.groupName, { color: colors.text }]}>
            {group.name}
          </Text>
          {group.description && (
            <Text variant="bodyMedium" style={[styles.groupDescription, { color: colors.text }]}>
              {group.description}
            </Text>
          )}
          <Text variant="bodySmall" style={[styles.memberCount, { color: colors.text }]}>
            {group.members.length} members
          </Text>
        </View>

        <Divider />

        {/* Group Settings */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
            Settings
          </Text>
          
          {isAdmin && (
            <>
              <List.Item
                title="Edit Group Info"
                description="Change name, description, or photo"
                left={() => <List.Icon icon="pencil" />}
                onPress={handleEditGroup}
              />
              
              <List.Item
                title="Generate Invite Link"
                description="Create a link to invite new members"
                left={() => <List.Icon icon="link" />}
                onPress={handleGenerateInvite}
              />
            </>
          )}
        </View>

        <Divider />

        {/* Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
              Members ({group.members.length})
            </Text>
          </View>

          {membersLoading ? (
            <Text variant="bodyMedium" style={[styles.loadingText, { color: colors.text }]}>
              Loading members...
            </Text>
          ) : membersData?.members ? (
            membersData.members.map((member) => {
              const isCurrentUser = member.id === currentUserId;
              const canManage = isAdmin && !isCurrentUser;

              return (
                <List.Item
                  key={member.id}
                  title={member.name}
                  description={
                    <View style={styles.memberDescription}>
                      <Text variant="bodySmall">{member.email}</Text>
                      <Text variant="bodySmall" style={styles.roleBadge}>
                        {member.role === 'ADMIN' ? '👑 Admin' : 'Member'}
                      </Text>
                      {member.isOnline && (
                        <Text variant="bodySmall" style={{ color: '#4CAF50' }}>
                          • Online
                        </Text>
                      )}
                    </View>
                  }
                  left={() => (
                    member.avatar ? (
                      <Avatar.Image size={40} source={{ uri: member.avatar }} />
                    ) : (
                      <Avatar.Text
                        size={40}
                        label={member.name.substring(0, 2).toUpperCase()}
                      />
                    )
                  )}
                  right={() =>
                    canManage ? (
                      <IconButton
                        icon="dots-vertical"
                        onPress={() => {
                          Alert.alert(
                            'Manage Member',
                            `Manage ${member.name}`,
                            [
                              member.role === 'MEMBER' && {
                                text: 'Make Admin',
                                onPress: () => handleMakeAdmin(member.id, member.name),
                              },
                              member.role === 'ADMIN' && {
                                text: 'Remove Admin',
                                onPress: () => handleDemoteMember(member.id, member.name),
                              },
                              {
                                text: 'Remove from Group',
                                style: 'destructive',
                                onPress: () => handleRemoveMember(member.id),
                              },
                              { text: 'Cancel', style: 'cancel' },
                            ].filter(Boolean) as any
                          );
                        }}
                      />
                    ) : isCurrentUser && member.role === 'ADMIN' ? (
                      <Text variant="bodySmall" style={styles.youBadge}>
                        You
                      </Text>
                    ) : null
                  }
                />
              );
            })
          ) : (
            <Text variant="bodyMedium" style={[styles.loadingText, { color: colors.text }]}>
              No members found
            </Text>
          )}
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
              Are you sure you want to leave "{group.name}"?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLeaveDialog(false)}>Cancel</Button>
            <Button onPress={confirmLeaveGroup} textColor="#F44336">
              Leave
            </Button>
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
  loadingText: {
    padding: 16,
    textAlign: 'center',
    opacity: 0.6,
  },
  memberDescription: {
    flexDirection: 'column',
    gap: 4,
  },
  roleBadge: {
    fontWeight: 'bold',
    marginTop: 2,
  },
  youBadge: {
    alignSelf: 'center',
    opacity: 0.6,
    marginRight: 8,
  },
});

export default GroupSettingsScreen;
