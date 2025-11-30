// src/screens/GroupDetailsScreen.tsx

import React, { useEffect, useLayoutEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import {
  Text,
  Avatar,
  Divider,
  Button,
  ActivityIndicator,
  IconButton,
  Menu,
  TextInput,
  Portal,
  Dialog,
  Chip,
} from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { layout } from '../theme';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  getGroupMembersAPI,
  removeGroupMemberAPI,
  updateMemberRoleAPI,
  leaveGroupAPI,
  addGroupMembersAPI,
  GroupMember,
} from '../api/chat';
import { useDeleteGroup } from '../hooks/useGroups';
import { searchUsersAPI, UserSearchResult } from '../api/user';
import UserAvatar from '../components/UserAvatar';

type GroupDetailsScreenRouteProp = RouteProp<RootStackParamList, 'GroupDetails'>;
type GroupDetailsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'GroupDetails'
>;

const GroupDetailsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<GroupDetailsScreenNavigationProp>();
  const route = useRoute<GroupDetailsScreenRouteProp>();
  const { groupId, groupName, groupAvatar } = route.params;
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [addMemberDialogVisible, setAddMemberDialogVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);

  const currentUserMember = members.find(m => m.id === currentUser?.id);
  const isAdmin = currentUserMember?.role === 'ADMIN';

  const handleOpenEditGroup = useCallback(() => {
    navigation.navigate('EditGroup', { groupId });
  }, [groupId, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: groupName ?? 'Group Details',
      headerBackTitle: 'Back',
      headerRight: isAdmin
        ? () => (
            <IconButton icon="pencil" size={20} onPress={handleOpenEditGroup} />
          )
        : undefined,
    });
  }, [groupName, handleOpenEditGroup, isAdmin, navigation]);

  useEffect(() => {
    fetchGroupMembers();
  }, [groupId]);

  const fetchGroupMembers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getGroupMembersAPI(groupId);
      setMembers(response.members);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load group members');
      console.error('Error fetching group members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteDemote = async (memberId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    const action = newRole === 'ADMIN' ? 'promote' : 'demote';

    Alert.alert(
      `${action === 'promote' ? 'Promote' : 'Demote'} Member`,
      `Are you sure you want to ${action} this member?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'promote' ? 'Promote' : 'Demote',
          onPress: async () => {
            try {
              await updateMemberRoleAPI(groupId, memberId, { role: newRole as 'ADMIN' | 'MEMBER' });
              fetchGroupMembers();
              Alert.alert('Success', `Member ${action}d successfully`);
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || `Failed to ${action} member`);
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeGroupMemberAPI(groupId, memberId);
              fetchGroupMembers();
              Alert.alert('Success', 'Member removed successfully');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveGroupAPI(groupId);
              Alert.alert('Success', 'You have left the group');
              // Navigate back to chat list by going back multiple screens
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to leave group');
            }
          },
        },
      ]
    );
  };

  const handleSearchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await searchUsersAPI({ q: query, limit: 20 });
      // Filter out users who are already members
      const memberIds = members.map(m => m.id);
      const filtered = response.data.filter(user => !memberIds.includes(user.id));
      setSearchResults(filtered);
    } catch (err: any) {
      console.error('Error searching users:', err);
    } finally {
      setSearching(false);
    }
  }, [members]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearchUsers]);

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one user to add');
      return;
    }

    try {
      await addGroupMembersAPI(groupId, selectedUsers);
      setAddMemberDialogVisible(false);
      setSelectedUsers([]);
      setSearchQuery('');
      setSearchResults([]);
      fetchGroupMembers();
      Alert.alert('Success', 'Members added successfully');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add members');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const renderMemberItem = ({ item }: { item: GroupMember }) => {
    const isCurrentUser = item.id === currentUser?.id;
    const canManage = isAdmin && !isCurrentUser;

    return (
      <TouchableOpacity
        style={styles.memberItem}
        onLongPress={() => canManage && setMenuVisible(item.id)}
        delayLongPress={500}
      >
        <UserAvatar
          size={48}
          avatarUrl={item.avatar}
          name={item.name}
        />
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={{ color: colors.text, fontWeight: '500' }}>
              {item.name}
              {isCurrentUser && ' (You)'}
            </Text>
            {item.role === 'ADMIN' && (
              <Chip
                mode="outlined"
                compact
                style={styles.adminChip}
                textStyle={{ fontSize: 10 }}
              >
                Admin
              </Chip>
            )}
          </View>
          <Text style={{ color: colors.text, opacity: 0.7, fontSize: 12 }}>
            {item.email}
          </Text>
          <Text style={{ color: colors.text, opacity: 0.5, fontSize: 10 }}>
            Joined {new Date(item.joinedAt).toLocaleDateString()}
          </Text>
        </View>

        {item.isOnline && (
          <View style={styles.onlineIndicator} />
        )}

        {canManage && (
          <Menu
            visible={menuVisible === item.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={20}
                onPress={() => setMenuVisible(item.id)}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                handlePromoteDemote(item.id, item.role);
              }}
              title={item.role === 'ADMIN' ? 'Demote to Member' : 'Promote to Admin'}
              leadingIcon={item.role === 'ADMIN' ? 'arrow-down' : 'arrow-up'}
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                handleRemoveMember(item.id, item.name);
              }}
              title="Remove from Group"
              leadingIcon="account-remove"
            />
          </Menu>
        )}
      </TouchableOpacity>
    );
  };

  const renderSearchResultItem = ({ item }: { item: UserSearchResult }) => {
    const isSelected = selectedUsers.includes(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.searchResultItem,
          isSelected && { backgroundColor: colors.primary + '20' },
        ]}
        onPress={() => toggleUserSelection(item.id)}
      >
        <UserAvatar
          size={40}
          avatarUrl={item.avatarUrl}
          name={item.name}
        />
        <View style={styles.searchResultInfo}>
          <Text style={{ color: colors.text, fontWeight: '500' }}>{item.name}</Text>
          <Text style={{ color: colors.text, opacity: 0.7, fontSize: 12 }}>
            {item.email}
          </Text>
        </View>
        {isSelected && (
          <IconButton icon="check-circle" iconColor={colors.primary} size={24} />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.error, marginBottom: 16 }}>{error}</Text>
        <Button mode="contained" onPress={fetchGroupMembers}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        {/* Group Info */}
        <View style={styles.groupSection}>
          <UserAvatar
            size={100}
            avatarUrl={groupAvatar}
            name={groupName}
            isGroup={true}
          />
          <Text variant="headlineMedium" style={[styles.groupName, { color: colors.text }]}>
            {groupName}
          </Text>
          <Text style={{ color: colors.text, opacity: 0.7 }}>
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </Text>
        </View>

        <Divider style={styles.divider} />

        {/* Members Section */}
        <View style={styles.membersSection}>
          <View style={styles.membersSectionHeader}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
              Members ({members.length})
            </Text>
            {isAdmin && (
              <Button
                mode="contained-tonal"
                icon="account-plus"
                onPress={() => setAddMemberDialogVisible(true)}
                compact
              >
                Add
              </Button>
            )}
          </View>

          <FlatList
            data={members}
            renderItem={renderMemberItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <Divider />}
          />
        </View>

        <Divider style={styles.divider} />

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Button
            mode="outlined"
            icon="exit-to-app"
            onPress={handleLeaveGroup}
            style={styles.actionButton}
            textColor={colors.error}
          >
            Leave Group
          </Button>
        </View>
      </ScrollView>

      {/* Add Members Dialog */}
      <Portal>
        <Dialog
          visible={addMemberDialogVisible}
          onDismiss={() => {
            setAddMemberDialogVisible(false);
            setSelectedUsers([]);
            setSearchQuery('');
            setSearchResults([]);
          }}
          style={styles.addMemberDialog}
        >
          <Dialog.Title>Add Members</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Search users"
              value={searchQuery}
              onChangeText={setSearchQuery}
              mode="outlined"
              left={<TextInput.Icon icon="magnify" />}
              right={searching ? <TextInput.Icon icon="loading" /> : undefined}
              style={styles.searchInput}
            />

            {selectedUsers.length > 0 && (
              <View style={styles.selectedUsersContainer}>
                <Text style={{ color: colors.text, marginBottom: 8 }}>
                  Selected ({selectedUsers.length}):
                </Text>
                <View style={styles.selectedUsersChips}>
                  {selectedUsers.map(userId => {
                    const user = searchResults.find(u => u.id === userId);
                    return user ? (
                      <Chip
                        key={userId}
                        onClose={() => toggleUserSelection(userId)}
                        style={styles.selectedChip}
                      >
                        {user.name}
                      </Chip>
                    ) : null;
                  })}
                </View>
              </View>
            )}

            <FlatList
              data={searchResults}
              renderItem={renderSearchResultItem}
              keyExtractor={item => item.id}
              style={styles.searchResultsList}
              ListEmptyComponent={
                searchQuery.length >= 2 && !searching ? (
                  <Text style={{ color: colors.text, opacity: 0.7, textAlign: 'center', marginTop: 16 }}>
                    No users found
                  </Text>
                ) : null
              }
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setAddMemberDialogVisible(false);
                setSelectedUsers([]);
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onPress={handleAddMembers}
              disabled={selectedUsers.length === 0}
            >
              Add ({selectedUsers.length})
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
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
  content: {
    paddingBottom: 32,
  },
  groupSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  groupName: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
  },
  membersSection: {
    paddingHorizontal: 16,
  },
  membersSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminChip: {
    height: 20,
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  actionsSection: {
    paddingHorizontal: 16,
  },
  actionButton: {
    marginVertical: 8,
  },
  input: {
    marginBottom: 12,
  },
  addMemberDialog: {
    maxHeight: '80%',
  },
  searchInput: {
    marginBottom: 16,
  },
  selectedUsersContainer: {
    marginBottom: 16,
  },
  selectedUsersChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedChip: {
    marginBottom: 4,
  },
  searchResultsList: {
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: 12,
  },
});

export default GroupDetailsScreen;
