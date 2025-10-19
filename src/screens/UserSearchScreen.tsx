// src/screens/UserSearchScreen.tsx

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { Searchbar, Text, List, Avatar, ActivityIndicator, Appbar } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useSearchUsers } from '../hooks/useChatManagement';
import { createChatAPI } from '../api/chat';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const UserSearchScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState<string | null>(null);
  
  // Get current user ID to filter them out
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  
  const { data, isLoading, error } = useSearchUsers(query);
  
  // Filter out the current user from search results
  const filteredUsers = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter(user => user.id !== currentUserId);
  }, [data?.data, currentUserId]);

  const handleUserPress = async (userId: string) => {
    try {
      setCreating(userId);
      
      // Create or get existing DM conversation
      const response = await createChatAPI({ recipientId: userId });
      
      // Navigate to chat screen
      navigation.navigate('Chat' as never, { chatId: response.chat.id } as never);
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setCreating(null);
    }
  };

  const renderUser = ({ item }: any) => {
    const isCreating = creating === item.id;
    
    return (
      <List.Item
        title={item.name}
        description={item.email}
        left={() => (
          item.avatarUrl ? (
            <Avatar.Image size={48} source={{ uri: item.avatarUrl }} />
          ) : (
            <Avatar.Text size={48} label={item.name.substring(0, 2).toUpperCase()} />
          )
        )}
        right={() => (
          isCreating ? (
            <ActivityIndicator size="small" />
          ) : item.verified ? (
            <List.Icon icon="check-circle" color="#4CAF50" />
          ) : null
        )}
        onPress={() => handleUserPress(item.id)}
        disabled={isCreating}
        style={styles.listItem}
      />
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" />
          <Text variant="bodyLarge" style={[styles.emptyText, { color: colors.text }]}>
            Searching...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={[styles.emptyText, { color: colors.text }]}>
            Failed to search users
          </Text>
        </View>
      );
    }

    if (query.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={[styles.emptyText, { color: colors.text }]}>
            Search for users by name or email
          </Text>
          <Text variant="bodyMedium" style={[styles.hintText, { color: colors.text }]}>
            Type at least 2 characters to start searching
          </Text>
        </View>
      );
    }

    if (query.length < 2) {
      return (
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={[styles.emptyText, { color: colors.text }]}>
            Type at least 2 characters
          </Text>
        </View>
      );
    }

    if (filteredUsers.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={[styles.emptyText, { color: colors.text }]}>
            No users found
          </Text>
          <Text variant="bodyMedium" style={[styles.hintText, { color: colors.text }]}>
            Try a different search term
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="New Chat" />
      </Appbar.Header>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search users..."
          value={query}
          onChangeText={setQuery}
          autoFocus
          style={styles.searchBar}
        />
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          filteredUsers.length === 0 ? styles.emptyList : undefined
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    elevation: 0,
  },
  listItem: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  hintText: {
    textAlign: 'center',
    opacity: 0.6,
  },
});

export default UserSearchScreen;
