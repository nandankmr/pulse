// src/screens/HomeScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Searchbar, FAB, Divider } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import ChatListItem, { Chat } from '../components/ChatListItem';
import { getMockChats } from '../utils/mockData';

const HomeScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadChats = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await getChatsAPI();
      // setChats(response.chats);
      
      const mockChats = await getMockChats();
      setChats(mockChats);
      setFilteredChats(mockChats);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredChats(chats);
    } else {
      const filtered = chats.filter((chat) =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChats(filtered);
    }
  }, [searchQuery, chats]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const handleChatPress = (chat: Chat) => {
    (navigation as any).navigate('Chat', {
      chatId: chat.id,
      chatName: chat.name,
    });
  };

  const handleNewChat = () => {
    // Show options: New Chat or New Group
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

      {loading ? (
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
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleNewChat}
        label="New Chat"
      />
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
});

export default HomeScreen;
