// src/components/ChatListItem.tsx

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Avatar, Badge } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';

export interface Chat {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isGroup: boolean;
  isOnline?: boolean;
}

interface ChatListItemProps {
  chat: Chat;
  onPress: (chat: Chat) => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ chat, onPress }) => {
  const { colors } = useTheme();

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.background }]}
      onPress={() => onPress(chat)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {chat.avatar ? (
          <Avatar.Image size={56} source={{ uri: chat.avatar }} />
        ) : (
          <Avatar.Text
            size={56}
            label={chat.name.substring(0, 2).toUpperCase()}
          />
        )}
        {!chat.isGroup && chat.isOnline && (
          <View style={[styles.onlineIndicator, { borderColor: colors.background }]} />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            variant="titleMedium"
            style={[
              styles.name,
              { color: colors.text },
              chat.unreadCount > 0 && styles.unreadName,
            ]}
            numberOfLines={1}
          >
            {chat.name}
          </Text>
          <Text
            variant="bodySmall"
            style={[
              styles.timestamp,
              { color: colors.text },
              chat.unreadCount > 0 && styles.unreadTimestamp,
            ]}
          >
            {formatTimestamp(chat.timestamp)}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text
            variant="bodyMedium"
            style={[
              styles.lastMessage,
              { color: colors.text },
              chat.unreadCount > 0 && styles.unreadMessage,
            ]}
            numberOfLines={1}
          >
            {chat.lastMessage}
          </Text>
          {chat.unreadCount > 0 && (
            <Badge size={20} style={styles.badge}>
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </Badge>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    flex: 1,
    marginRight: 8,
  },
  unreadName: {
    fontWeight: 'bold',
  },
  timestamp: {
    opacity: 0.6,
  },
  unreadTimestamp: {
    opacity: 1,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    opacity: 0.7,
    marginRight: 8,
  },
  unreadMessage: {
    opacity: 1,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#2196F3',
  },
});

export default ChatListItem;
