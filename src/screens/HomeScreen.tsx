// src/screens/HomeScreen.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Searchbar, FAB, Divider, Portal, Dialog, Button, List } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import ChatListItem, { Chat } from '../components/ChatListItem';
import { useChats } from '../hooks/useChats';
import { socketManager } from '../utils/socketManager';
import { useQueryClient } from '@tanstack/react-query';

const HomeScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { data, isLoading, refetch, isRefetching } = useChats();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);

  const chats = data?.chats || [];

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

  const filteredChats = useMemo(() => {
    if (searchQuery.trim() === '') {
      return chats;
    }
    return chats.filter((chat) =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, chats]);

  const handleChatPress = (chat: Chat) => {
    (navigation as any).navigate('Chat', {
      chatId: chat.id,
      chatName: chat.name,
    });
  };

  const handleNewChat = () => {
    // Show dialog with options: Direct Message or Create Group
    setShowNewChatDialog(true);
  };

  const handleDirectMessage = () => {
    setShowNewChatDialog(false);
    (navigation as any).navigate('UserSearch');
  };

  const handleCreateGroup = () => {
    setShowNewChatDialog(false);
    (navigation as any).navigate('CreateGroup');
  };

  const unreadCount = chats.reduce((sum, chat) => sum + chat.unreadCount, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={[styles.title, { color: colors.text }]}>
          Chats
        </Text>
        {unreadCount > 0 && (
          <Text variant="bodyMedium" style={[styles.unreadCount, { color: colors.text }]}>
            {unreadCount} unread
          </Text>
        )}
      </View>

      <Searchbar
        placeholder="Search chats"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={{ color: colors.text }}>
            Loading chats...
          </Text>
        </View>
      ) : filteredChats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={{ color: colors.text }}>
            {searchQuery ? 'No chats found' : 'No chats yet'}
          </Text>
          {!searchQuery && (
            <Text variant="bodyMedium" style={[styles.emptySubtext, { color: colors.text }]}>
              Start a conversation by tapping the + button
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatListItem chat={item} onPress={handleChatPress} />
          )}
          ItemSeparatorComponent={() => <Divider />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
          }
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleNewChat}
        label="New Chat"
      />

      {/* New Chat Options Dialog */}
      <Portal>
        <Dialog visible={showNewChatDialog} onDismiss={() => setShowNewChatDialog(false)}>
          <Dialog.Title>New Chat</Dialog.Title>
          <Dialog.Content>
            <List.Item
              title="Direct Message"
              description="Start a one-on-one conversation"
              left={props => <List.Icon {...props} icon="account" />}
              onPress={handleDirectMessage}
              style={styles.dialogOption}
            />
            <Divider />
            <List.Item
              title="Create Group"
              description="Start a group conversation"
              left={props => <List.Icon {...props} icon="account-group" />}
              onPress={handleCreateGroup}
              style={styles.dialogOption}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowNewChatDialog(false)}>Cancel</Button>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 24,
  },
  title: {
    fontWeight: 'bold',
  },
  unreadCount: {
    opacity: 0.7,
  },
  searchbar: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptySubtext: {
    marginTop: 8,
    opacity: 0.7,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  dialogOption: {
    paddingVertical: 8,
  },
});

export default HomeScreen;
