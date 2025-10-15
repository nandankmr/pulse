// src/screens/CreateGroupScreen.tsx

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Avatar,
  Chip,
  Searchbar,
  List,
  Switch,
  Divider,
} from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCreateChat } from '../hooks/useChats';
import { useUserSearch } from '../hooks/useUserSearch';
import config from '../config';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

const CreateGroupScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const createChatMutation = useCreateChat();

  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupAvatar, setGroupAvatar] = useState<string | undefined>();
  const [isPrivate, setIsPrivate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);

  // Use the user search hook with debouncing
  const { users: searchResults, loading: searchLoading, error: searchError } = useUserSearch(
    searchQuery,
    {
      minLength: 2,
      debounceMs: 300,
      limit: 20,
      excludeIds: selectedMembers.map((m) => m.id),
    }
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectMember = (user: User) => {
    setSelectedMembers([...selectedMembers, user]);
    setSearchQuery('');
  };

  const handleRemoveMember = (userId: string) => {
    setSelectedMembers(selectedMembers.filter((m) => m.id !== userId));
  };

  const handlePickAvatar = () => {
    // TODO: Implement avatar picker
    console.log('Pick group avatar');
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (selectedMembers.length === 0) {
      Alert.alert('Error', 'Please add at least one member');
      return;
    }

    try {
      const response = await createChatMutation.mutateAsync({
        groupName: groupName.trim(),
        memberIds: selectedMembers.map(m => m.id),
      });

      // Navigate to the new group chat
      (navigation as any).navigate('Chat', {
        chatId: response.chat.id,
        chatName: response.chat.name,
      });
    } catch (error) {
      console.error('Failed to create group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView}>
        {/* Group Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.7}>
            {groupAvatar ? (
              <Image source={{ uri: groupAvatar }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Icon name="camera" size={32} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          <Text variant="bodySmall" style={[styles.avatarHint, { color: colors.text }]}>
            Tap to add group photo
          </Text>
        </View>

        {/* Group Name */}
        <TextInput
          mode="outlined"
          label="Group Name *"
          value={groupName}
          onChangeText={setGroupName}
          style={styles.input}
          maxLength={50}
          placeholder="Enter group name"
        />

        {/* Group Description */}
        <TextInput
          mode="outlined"
          label="Description (Optional)"
          value={groupDescription}
          onChangeText={setGroupDescription}
          style={styles.input}
          multiline
          numberOfLines={3}
          maxLength={200}
          placeholder="What's this group about?"
        />

        {/* Privacy Setting */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text variant="bodyLarge" style={{ color: colors.text }}>
              Private Group
            </Text>
            <Text variant="bodySmall" style={[styles.settingHint, { color: colors.text }]}>
              Only invited members can join
            </Text>
          </View>
          <Switch value={isPrivate} onValueChange={setIsPrivate} />
        </View>

        <Divider style={styles.divider} />

        {/* Selected Members */}
        {selectedMembers.length > 0 && (
          <View style={styles.selectedSection}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
              Members ({selectedMembers.length})
            </Text>
            <View style={styles.chipsContainer}>
              {selectedMembers.map((member) => (
                <Chip
                  key={member.id}
                  onClose={() => handleRemoveMember(member.id)}
                  style={styles.chip}
                >
                  {member.name}
                </Chip>
              ))}
            </View>
          </View>
        )}

        {/* Search Members */}
        <View style={styles.searchSection}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
            Add Members
          </Text>
          <Searchbar
            placeholder="Search by name or email"
            value={searchQuery}
            onChangeText={handleSearch}
            style={styles.searchbar}
          />

          {/* Loading State */}
          {searchLoading && (
            <View style={styles.loadingContainer}>
              <Text variant="bodyMedium" style={{ color: colors.text }}>
                Searching...
              </Text>
            </View>
          )}

          {/* Error State */}
          {searchError && (
            <View style={styles.errorContainer}>
              <Text variant="bodyMedium" style={{ color: colors.error }}>
                {searchError}
              </Text>
            </View>
          )}

          {/* Search Results */}
          {!searchLoading && !searchError && searchResults.length > 0 && (
            <View style={styles.resultsContainer}>
              {searchResults.map((user) => (
                <List.Item
                  key={user.id}
                  title={user.name}
                  description={user.email}
                  left={() => (
                    user.avatarUrl ? (
                      <Avatar.Image
                        size={40}
                        source={{ uri: `${config.SOCKET_URL}${user.avatarUrl}` }}
                      />
                    ) : (
                      <Avatar.Text
                        size={40}
                        label={user.name.substring(0, 2).toUpperCase()}
                      />
                    )
                  )}
                  right={() => (
                    <Icon
                      name="plus-circle"
                      size={24}
                      color={colors.primary}
                      style={styles.addIcon}
                    />
                  )}
                  onPress={() => handleSelectMember(user)}
                  style={styles.userItem}
                />
              ))}
            </View>
          )}

          {!searchLoading && !searchError && searchQuery.length >= 2 && searchResults.length === 0 && (
            <View style={styles.emptyResults}>
              <Text variant="bodyMedium" style={{ color: colors.text }}>
                No users found
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <Button
          mode="contained"
          onPress={handleCreateGroup}
          loading={createChatMutation.isPending}
          disabled={createChatMutation.isPending || !groupName.trim() || selectedMembers.length === 0}
          style={styles.createButton}
        >
          Create Group
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    marginTop: 8,
    opacity: 0.7,
  },
  input: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingHint: {
    marginTop: 4,
    opacity: 0.7,
  },
  divider: {
    marginVertical: 16,
  },
  selectedSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchbar: {
    marginBottom: 8,
  },
  resultsContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginTop: 8,
  },
  userItem: {
    paddingVertical: 8,
  },
  addIcon: {
    alignSelf: 'center',
  },
  emptyResults: {
    padding: 24,
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  createButton: {
    paddingVertical: 8,
  },
});

export default CreateGroupScreen;
