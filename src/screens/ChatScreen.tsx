// src/screens/ChatScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { Text, TextInput, IconButton, Avatar, Button, Portal, Dialog } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Message, Attachment } from '../types/message';
import { pickAttachment, validateAttachment, getCurrentLocation } from '../utils/attachmentPicker';
import { uploadAttachment } from '../utils/attachmentUpload';
import MessageAttachment from '../components/MessageAttachment';
import UserAvatar from '../components/UserAvatar';
import { useMarkChatAsRead, useChat } from '../hooks/useChats';
import { useMessageOperations } from '../hooks/useMessageOperations';
import { useMessages, useSendMessage } from '../hooks/useMessages';
import { socketManager } from '../utils/socketManager';
import { notificationService } from '../services/notificationService';
import type {
  MessageEditedData,
  MessageDeletedData,
  GroupMemberAddedData,
  GroupMemberRemovedData,
  GroupMemberRoleChangedData,
  GroupUpdatedData,
} from '../utils/socketManager';

interface RouteParams {
  chatId: string;
  chatName: string;
}

const ChatScreen: React.FC = () => {
  const { colors } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId, chatName } = (route.params as RouteParams) || {};
  const markAsReadMutation = useMarkChatAsRead();
  const { data: chatInfo } = useChat(chatId);
  const { markMessagesAsRead, editMessage, deleteMessage } = useMessageOperations();
  const { data: messagesData, isLoading, refetch } = useMessages(chatId);
  const sendMessageMutation = useSendMessage();

  const [messages, setMessages] = useState<Message[]>([]);
  const [groupName, setGroupName] = useState(chatName);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editText, setEditText] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [typingUserName, setTypingUserName] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get current user ID from Redux store
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentUserId = currentUser?.id || '';

  const isGroupChat = chatInfo?.isGroup ?? false;

  // Handle header press to navigate to details
  const handleHeaderPress = () => {
    if (isGroupChat) {
      navigation.navigate('GroupDetails', {
        groupId: chatId,
        groupName: groupName,
        groupAvatar: chatInfo?.avatar,
      });
    } else {
      // For DM, navigate to user details using the otherUserId from chatInfo
      const otherUserId = chatInfo?.otherUserId;
      if (!otherUserId) {
        console.error('No otherUserId found in chatInfo');
        return;
      }
      navigation.navigate('UserDetails', {
        userId: otherUserId,
      });
    }
  };

  // Load messages from API
  useEffect(() => {
    if (messagesData?.messages) {
      setMessages(messagesData.messages);
      // Scroll to bottom when messages first load
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messagesData]);

  useEffect(() => {
    // Mark chat as read when opening
    if (chatId) {
      markAsReadMutation.mutate(chatId);
      // Clear notifications for this chat
      notificationService.cancelChatNotifications(chatId);
    }
    
    // Set header with clickable title
    navigation.setOptions({
      title: groupName,
      headerRight: () => (
        <TouchableOpacity
          onPress={handleHeaderPress}
          style={{ marginRight: 16 }}
        >
          <UserAvatar
            size={36}
            avatarUrl={chatInfo?.avatar}
            name={groupName}
            isGroup={isGroupChat}
          />
        </TouchableOpacity>
      ),
    });
  }, [chatId, groupName, chatInfo, isGroupChat]);

  // Join chat room for real-time updates
  useEffect(() => {
    if (isGroupChat) {
      console.log('🔌 Joining group room:', chatId);
      socketManager.joinGroup(chatId);
      
      return () => {
        console.log('🔌 Leaving group room:', chatId);
        socketManager.leaveGroup(chatId);
      };
    }
  }, [chatId, isGroupChat]);

  // Socket.IO Event Listeners
  useEffect(() => {
    // New message received
    const handleNewMessage = (data: any) => {
      console.log('📨 New message received:', data);
      
      // Handle both formats: direct fields or nested message object
      const messageData = data.message || data;
      const messageId = data.messageId || messageData.id;
      const conversationId = data.conversationId || messageData.conversationId;
      const senderId = data.senderId || messageData.senderId;
      
      // Extract sender info from enriched message
      const senderName = data.senderName || messageData.sender?.name || messageData.senderName || 'Unknown';
      const senderAvatar = data.senderAvatar || messageData.sender?.avatarUrl || messageData.senderAvatar;
      
      const content = data.content || messageData.content;
      const timestamp = data.timestamp || messageData.createdAt;
      const attachments = data.attachments || messageData.attachments;
      const tempId = data.tempId;
      
      const groupId = data.groupId || messageData.groupId;
      
      console.log('📨 Parsed message:', { messageId, senderId, senderName, conversationId, groupId, chatId, isGroupChat });
      console.log('📨 Chat matching - isGroupChat:', isGroupChat, 'groupId === chatId:', groupId === chatId, 'conversationId === chatId:', conversationId === chatId);

      // For group chats, match by groupId. For DMs, match by conversationId
      const isSameChat = isGroupChat ? groupId === chatId : conversationId === chatId;

      if (isSameChat) {
        // Check if this is our own message
        const isOwnMessage = senderId === currentUserId;
        
        const newMessage: Message = {
          id: messageId,
          chatId: conversationId,
          senderId: senderId,
          senderName: senderName || 'Unknown',
          senderAvatar: senderAvatar,
          content: content,
          timestamp: timestamp,
          isRead: isOwnMessage, // Own messages are already "read"
          isSent: true,
          attachments: attachments,
        };
        
        // If tempId exists, replace optimistic message
        if (tempId) {
          setMessages(prev => prev.map(msg => 
            msg.id === tempId ? newMessage : msg
          ));
        } else {
          // New message from another user
          setMessages(prev => [...prev, newMessage]);
          // Scroll to bottom when new message arrives
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
        
        // Mark as read if not from current user
        if (!isOwnMessage) {
          markMessagesAsRead(
            [messageId],
            undefined,
            isGroupChat ? chatId : undefined,
            !isGroupChat ? chatId : undefined
          );
        }
      }
    };


    // Message edited
    const handleMessageEdited = (data: MessageEditedData) => {
      console.log('Message edited:', data);
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, content: data.content, editedAt: data.editedAt }
          : msg
      ));
    };

    // Message deleted
    const handleMessageDeleted = (data: MessageDeletedData) => {
      console.log('Message deleted:', data);
      if (data.deleteForEveryone) {
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, deletedAt: data.deletedAt, content: '🚫 This message was deleted' }
            : msg
        ));
      } else {
        // Only remove for specific user (current user)
        setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
      }
    };

    // Group member added
    const handleMemberAdded = (data: GroupMemberAddedData) => {
      console.log('Member added:', data);
      // Add system message
      const systemMessage: Message = {
        id: `system-${Date.now()}`,
        chatId: data.groupId,
        senderId: 'system',
        senderName: 'System',
        content: '👤 A new member joined the group',
        timestamp: new Date().toISOString(),
        isRead: true,
        isSent: true,
      };
      setMessages(prev => [...prev, systemMessage]);
    };

    // Group member removed
    const handleMemberRemoved = (data: GroupMemberRemovedData) => {
      console.log('Member removed:', data);
      const systemMessage: Message = {
        id: `system-${Date.now()}`,
        chatId: data.groupId,
        senderId: 'system',
        senderName: 'System',
        content: '👋 A member left the group',
        timestamp: new Date().toISOString(),
        isRead: true,
        isSent: true,
      };
      setMessages(prev => [...prev, systemMessage]);
    };

    // Group member role changed
    const handleRoleChanged = (data: GroupMemberRoleChangedData) => {
      console.log('Member role changed:', data);
      const systemMessage: Message = {
        id: `system-${Date.now()}`,
        chatId: data.groupId,
        senderId: 'system',
        senderName: 'System',
        content: `👑 A member is now ${data.role === 'ADMIN' ? 'an admin' : 'a regular member'}`,
        timestamp: new Date().toISOString(),
        isRead: true,
        isSent: true,
      };
      setMessages(prev => [...prev, systemMessage]);
    };

    // Group updated
    const handleGroupUpdated = (data: GroupUpdatedData) => {
      console.log('Group updated:', data);
      if (data.name) {
        setGroupName(data.name);
        navigation.setOptions({ title: data.name });
      }
      const systemMessage: Message = {
        id: `system-${Date.now()}`,
        chatId: data.groupId,
        senderId: 'system',
        senderName: 'System',
        content: '✏️ Group details were updated',
        timestamp: new Date().toISOString(),
        isRead: true,
        isSent: true,
      };
      setMessages(prev => [...prev, systemMessage]);
    };

    // Typing indicators
    const handleTypingStart = (data: any) => {
      console.log('⌨️ Typing start:', data);
      const { userId, userName, conversationId: typingConvId, groupId: typingGroupId } = data;
      
      // Only show typing if it's from another user in this chat
      if (userId !== currentUserId) {
        const isThisChat = isGroupChat ? typingGroupId === chatId : typingConvId === chatId;
        if (isThisChat) {
          setIsTyping(true);
          setTypingUserId(userId);
          setTypingUserName(userName || 'Someone');
        }
      }
    };

    const handleTypingStop = (data: any) => {
      console.log('⌨️ Typing stop:', data);
      const { userId } = data;
      if (userId === typingUserId) {
        setIsTyping(false);
        setTypingUserId(null);
        setTypingUserName(null);
      }
    };

    // Register event listeners
    socketManager.on('message:new', handleNewMessage);
    socketManager.on('message:edited', handleMessageEdited);
    socketManager.on('message:deleted', handleMessageDeleted);
    socketManager.on('group:member:added', handleMemberAdded);
    socketManager.on('group:member:removed', handleMemberRemoved);
    socketManager.on('group:member:role_changed', handleRoleChanged);
    socketManager.on('group:updated', handleGroupUpdated);
    socketManager.on('typing:start', handleTypingStart);
    socketManager.on('typing:stop', handleTypingStop);

    // Cleanup
    return () => {
      socketManager.off('message:new', handleNewMessage);
      socketManager.off('message:edited', handleMessageEdited);
      socketManager.off('message:deleted', handleMessageDeleted);
      socketManager.off('group:member:added', handleMemberAdded);
      socketManager.off('group:member:removed', handleMemberRemoved);
      socketManager.off('group:member:role_changed', handleRoleChanged);
      socketManager.off('group:updated', handleGroupUpdated);
      socketManager.off('typing:start', handleTypingStart);
      socketManager.off('typing:stop', handleTypingStop);
    };
  }, [navigation, chatId, currentUserId, isGroupChat, markMessagesAsRead]);

  // Bulk read receipts - mark all unread messages as read when opening chat
  useEffect(() => {
    const unreadMessages = messages.filter(msg => !msg.isRead && msg.senderId !== currentUserId);
    if (unreadMessages.length > 0) {
      const unreadIds = unreadMessages.map(msg => msg.id);
      // Mark as read via Socket.IO
      markMessagesAsRead(
        unreadIds,
        undefined,
        isGroupChat ? chatId : undefined,
        !isGroupChat ? chatId : undefined
      );
      // Update local state
      setMessages(prev => prev.map(msg => 
        unreadIds.includes(msg.id) ? { ...msg, isRead: true } : msg
      ));
    }
  }, [messages, isGroupChat, chatId, currentUserId, markMessagesAsRead]);

  // Handle keyboard events to scroll to bottom
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  // Removed loadMessages - now using useMessages hook

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

    const tempId = `temp-${Date.now()}`;
    const messageContent = inputText.trim() || (location ? 'Shared location' : 'Sent attachment');

    // Optimistic update
    const tempMessage: Message = {
      id: tempId,
      chatId,
      senderId: currentUserId,
      senderName: 'You',
      content: messageContent,
      timestamp: new Date().toISOString(),
      isRead: false,
      isSent: false,
      attachments,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setInputText('');

    try {
      // Send via API hook
      await sendMessageMutation.mutateAsync({
        chatId,
        content: messageContent,
        mediaUrl: attachment?.url,
        type: attachment ? attachment.type.toUpperCase() as any : location ? 'LOCATION' : 'TEXT',
        location,
      });

      // Update temp message to sent
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, isSent: true } : msg
        )
      );

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message with attachment');
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  // Handle typing indicator
  const handleInputChange = (text: string) => {
    setInputText(text);
    
    // Send typing start event
    if (text.length > 0 && !typingTimeoutRef.current) {
      const payload = isGroupChat 
        ? { groupId: chatId }
        : { conversationId: chatId, targetUserId: chatInfo?.otherUserId };
      
      socketManager.startTyping(payload);
      console.log('⌨️ Sent typing start');
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to send typing stop after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      const payload = isGroupChat 
        ? { groupId: chatId }
        : { conversationId: chatId, targetUserId: chatInfo?.otherUserId };
      
      socketManager.stopTyping(payload);
      typingTimeoutRef.current = null;
      console.log('⌨️ Sent typing stop (timeout)');
    }, 3000);
  };

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    const payload = isGroupChat 
      ? { groupId: chatId }
      : { conversationId: chatId, targetUserId: chatInfo?.otherUserId };
    socketManager.stopTyping(payload);

    const messageContent = inputText.trim();
    const tempId = `temp-${Date.now()}`;
    setInputText('');
    setSending(true);

    // Optimistic update
    const tempMessage: Message = {
      id: tempId,
      chatId,
      senderId: currentUserId,
      senderName: 'You',
      content: messageContent,
      timestamp: new Date().toISOString(),
      isRead: false,
      isSent: false,
    };

    setMessages((prev) => [...prev, tempMessage]);
    
    // Scroll to bottom after adding optimistic message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Send via API hook
      console.log('Sending message to chatId:', chatId, 'content:', messageContent);
      await sendMessageMutation.mutateAsync({
        chatId,
        content: messageContent,
      });

      // Update temp message to sent
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, isSent: true } : msg
        )
      );

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      const errorMessage = error?.message || error?.data?.message || 'Failed to send message';
      Alert.alert('Error', errorMessage);
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === currentUserId;
    const isSystemMessage = item.senderId === 'system';

    // System messages (group events)
    if (isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text variant="bodySmall" style={styles.systemMessageText}>
            {item.content}
          </Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        onLongPress={() => handleMessageLongPress(item)}
        activeOpacity={0.9}
        disabled={item.deletedAt !== undefined}
      >
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
            <View>
              <Text
                variant="bodyMedium"
                style={[
                  styles.messageText,
                  { color: isOwnMessage ? '#FFFFFF' : colors.text },
                  (item as any).deletedAt && styles.deletedText,
                ]}
              >
                {item.content}
              </Text>
              {item.editedAt && !item.deletedAt && (
                <Text
                  variant="bodySmall"
                  style={[
                    styles.editedBadge,
                    { color: isOwnMessage ? '#FFFFFF' : colors.text },
                  ]}
                >
                  (edited)
                </Text>
              )}
            </View>
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
      </TouchableOpacity>
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

  // Check if message can be edited (within 15 minutes)
  const canEditMessage = (message: Message): boolean => {
    if (message.senderId !== currentUserId) return false;
    if (message.deletedAt) return false;
    
    const messageTime = new Date(message.timestamp).getTime();
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    return (now - messageTime) < fifteenMinutes;
  };

  // Check if message can be deleted for everyone (within 1 hour)
  const canDeleteForEveryone = (message: Message): boolean => {
    if (message.senderId !== currentUserId) return false;
    
    const messageTime = new Date(message.timestamp).getTime();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    return (now - messageTime) < oneHour;
  };

  // Handle long press on message
  const handleMessageLongPress = (message: Message) => {
    if (message.senderId !== currentUserId) return;
    if (message.deletedAt) return;

    const options: any[] = [];

    if (canEditMessage(message)) {
      options.push({
        text: 'Edit Message',
        onPress: () => handleEditMessage(message),
      });
    }

    options.push({
      text: 'Delete for Me',
      style: 'destructive',
      onPress: () => handleDeleteMessage(message, false),
    });

    if (canDeleteForEveryone(message)) {
      options.push({
        text: 'Delete for Everyone',
        style: 'destructive',
        onPress: () => handleDeleteMessage(message, true),
      });
    }

    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Message Options', 'Choose an action', options);
  };

  // Handle edit message
  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setEditText(message.content);
  };

  // Save edited message
  const handleSaveEdit = () => {
    if (!editingMessage || !editText.trim()) return;

    editMessage({
      messageId: editingMessage.id,
      content: editText.trim(),
      conversationId: chatId,
    });

    // Optimistically update local state
    setMessages(prev => prev.map(msg => 
      msg.id === editingMessage.id 
        ? { ...msg, content: editText.trim(), editedAt: new Date().toISOString() }
        : msg
    ));

    setEditingMessage(null);
    setEditText('');
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditText('');
  };

  // Handle delete message
  const handleDeleteMessage = (message: Message, deleteForEveryone: boolean) => {
    setMessageToDelete(message);
    setShowDeleteDialog(true);
  };

  // Confirm delete
  const confirmDelete = (deleteForEveryone: boolean) => {
    if (!messageToDelete) return;

    deleteMessage({
      messageId: messageToDelete.id,
      conversationId: chatId,
      deleteForEveryone,
    });

    // Optimistically update local state
    if (deleteForEveryone) {
      setMessages(prev => prev.map(msg => 
        msg.id === messageToDelete.id 
          ? { ...msg, content: '🚫 This message was deleted', deletedAt: new Date().toISOString() }
          : msg
      ));
    } else {
      setMessages(prev => prev.filter(msg => msg.id !== messageToDelete.id));
    }

    setShowDeleteDialog(false);
    setMessageToDelete(null);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {isLoading ? (
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
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />
      )}

      {/* Typing Indicator */}
      {isTyping && (
        <View style={[styles.typingIndicator, { backgroundColor: colors.surface }]}>
          <Text variant="bodySmall" style={{ color: colors.text }}>
            {typingUserName || 'Someone'} is typing...
          </Text>
        </View>
      )}

      <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
        <IconButton
          icon="paperclip"
          size={24}
          onPress={handleAttachment}
          disabled={uploading || sending || !!editingMessage}
        />
        <TextInput
          mode="outlined"
          placeholder={editingMessage ? "Edit message..." : "Type a message..."}
          value={editingMessage ? editText : inputText}
          onChangeText={editingMessage ? setEditText : handleInputChange}
          style={styles.input}
          multiline
          maxLength={1000}
          right={
            <TextInput.Icon
              icon={editingMessage ? "check" : "send"}
              onPress={editingMessage ? handleSaveEdit : handleSend}
              disabled={editingMessage ? !editText.trim() : (!inputText.trim() || sending)}
              color={(editingMessage ? editText.trim() : inputText.trim()) && !sending ? '#2196F3' : undefined}
            />
          }
        />
        {editingMessage && (
          <IconButton
            icon="close"
            size={20}
            onPress={handleCancelEdit}
          />
        )}
      </View>

      {/* Edit Message Banner */}
      {editingMessage && (
        <View style={[styles.editBanner, { backgroundColor: colors.primary }]}>
          <Text variant="bodySmall" style={styles.editBannerText}>
            Editing message
          </Text>
        </View>
      )}

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Message</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete this message?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={() => confirmDelete(false)}>Delete for Me</Button>
            {messageToDelete && canDeleteForEveryone(messageToDelete) && (
              <Button 
                onPress={() => confirmDelete(true)}
                textColor="#F44336"
              >
                Delete for Everyone
              </Button>
            )}
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  editedBadge: {
    fontSize: 10,
    opacity: 0.6,
    fontStyle: 'italic',
    marginTop: 2,
  },
  deletedText: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  systemMessageText: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    maxHeight: 100,
  },
  editBanner: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  editBannerText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default ChatScreen;
