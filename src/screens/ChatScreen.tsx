// src/screens/ChatScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text, TextInput, IconButton, Avatar } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Message, Attachment } from '../types/message';
import { getMockMessagesAsync } from '../utils/mockData';
import { pickAttachment, validateAttachment, getCurrentLocation } from '../utils/attachmentPicker';
import { uploadAttachment } from '../utils/attachmentUpload';
import MessageAttachment from '../components/MessageAttachment';

interface RouteParams {
  chatId: string;
  chatName: string;
}

const ChatScreen: React.FC = () => {
  const { colors } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId, chatName } = (route.params as RouteParams) || {};

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const currentUserId = 'current-user';

  useEffect(() => {
    loadMessages();
    // Set header title
    navigation.setOptions({ title: chatName });
  }, [chatId]);

  const loadMessages = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await getMessagesAPI(chatId);
      // setMessages(response.messages);

      const mockMessages = await getMockMessagesAsync(chatId);
      setMessages(mockMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttachment = async () => {
    try {
      const picked = await pickAttachment();
      if (!picked) return;

      // Handle location separately
      if ((picked as any).type === 'location') {
        const location = await getCurrentLocation();
        if (location) {
          await sendMessageWithAttachment(undefined, location);
        }
        return;
      }

      // Validate attachment
      const validation = validateAttachment(picked);
      if (!validation.valid) {
        Alert.alert('Error', validation.error);
        return;
      }

      setUploading(true);

      // Upload attachment
      const attachment = await uploadAttachment(picked);

      // Send message with attachment
      await sendMessageWithAttachment(attachment);
    } catch (error) {
      console.error('Failed to handle attachment:', error);
      Alert.alert('Error', 'Failed to upload attachment');
    } finally {
      setUploading(false);
    }
  };

  const sendMessageWithAttachment = async (
    attachment?: Attachment,
    location?: { latitude: number; longitude: number }
  ) => {
    setSending(true);

    const attachments: Attachment[] = [];
    
    if (attachment) {
      attachments.push(attachment);
    }
    
    if (location) {
      attachments.push({
        id: `loc_${Date.now()}`,
        type: 'location',
        url: '',
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }

    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      chatId,
      senderId: currentUserId,
      senderName: 'You',
      content: inputText.trim() || (location ? 'Shared location' : 'Sent attachment'),
      timestamp: new Date().toISOString(),
      isRead: false,
      isSent: false,
      attachments,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setInputText('');

    try {
      // TODO: Replace with actual API call
      // const response = await sendMessageAPI({
      //   chatId,
      //   content: tempMessage.content,
      //   attachments,
      // });

      // Mock delay
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 800));

      // Update temp message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id
            ? { ...msg, id: `msg-${Date.now()}`, isSent: true }
            : msg
        )
      );

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    const messageContent = inputText.trim();
    setInputText('');
    setSending(true);

    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      chatId,
      senderId: currentUserId,
      senderName: 'You',
      content: messageContent,
      timestamp: new Date().toISOString(),
      isRead: false,
      isSent: false,
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      // TODO: Replace with actual API call and socket emit
      // const response = await sendMessageAPI(chatId, messageContent);
      // socketManager.sendMessage(chatId, messageContent);

      // Mock delay
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));

      // Update temp message with real data
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id
            ? { ...msg, id: `msg-${Date.now()}`, isSent: true }
            : msg
        )
      );

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === currentUserId;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwnMessage && (
          <Avatar.Text
            size={32}
            label={item.senderName.substring(0, 2).toUpperCase()}
            style={styles.avatar}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
          ]}
        >
          {!isOwnMessage && (
            <Text variant="bodySmall" style={styles.senderName}>
              {item.senderName}
            </Text>
          )}
          
          {/* Render attachments */}
          {item.attachments && item.attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {item.attachments.map((attachment) => (
                <MessageAttachment key={attachment.id} attachment={attachment} />
              ))}
            </View>
          )}
          
          {/* Render text content */}
          {item.content && (
            <Text
              variant="bodyMedium"
              style={[
                styles.messageText,
                { color: isOwnMessage ? '#FFFFFF' : colors.text },
              ]}
            >
              {item.content}
            </Text>
          )}
          
          <View style={styles.messageFooter}>
            <Text
              variant="bodySmall"
              style={[
                styles.timestamp,
                { color: isOwnMessage ? '#FFFFFF' : colors.text },
              ]}
            >
              {formatMessageTime(item.timestamp)}
            </Text>
            {isOwnMessage && (
              <Text style={[styles.status, { color: '#FFFFFF' }]}>
                {item.isSent ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const formatMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text variant="bodyLarge" style={{ color: colors.text }}>
            Loading messages...
          </Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={{ color: colors.text }}>
            No messages yet
          </Text>
          <Text variant="bodyMedium" style={[styles.emptySubtext, { color: colors.text }]}>
            Start the conversation!
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
        <IconButton
          icon="paperclip"
          size={24}
          onPress={handleAttachment}
          disabled={uploading || sending}
        />
        <TextInput
          mode="outlined"
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          style={styles.input}
          multiline
          maxLength={1000}
          right={
            <TextInput.Icon
              icon="send"
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
              color={inputText.trim() && !sending ? '#2196F3' : undefined}
            />
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  avatar: {
    marginHorizontal: 8,
  },
  messageBubble: {
    borderRadius: 12,
    padding: 12,
    maxWidth: '100%',
  },
  ownBubble: {
    backgroundColor: '#2196F3',
  },
  otherBubble: {
    backgroundColor: '#E0E0E0',
  },
  senderName: {
    fontWeight: 'bold',
    marginBottom: 4,
    opacity: 0.8,
  },
  attachmentsContainer: {
    marginBottom: 8,
  },
  messageText: {
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.7,
  },
  status: {
    fontSize: 12,
    opacity: 0.8,
  },
  inputContainer: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    maxHeight: 100,
  },
});

export default ChatScreen;
