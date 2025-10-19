// src/screens/ChatScreen.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import type { Message, MessageType, SystemMessageType, Attachment } from '../types/message';
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
  EnrichedSocketMessage,
  NewMessagePayload,
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

const ensureMessageDefaults = (message: Message, currentUserId: string): Message => {
  const deliveredTo = message.deliveredTo ?? [];
  const readBy = message.readBy ?? [];
  const participantIds = message.participantIds ?? [];
  const attachments = message.attachments ?? [];
  const content = message.content ?? null;
  const senderAvatar = message.senderAvatar ?? null;
  const replyTo = message.replyTo ?? null;
  const editedAt = message.editedAt ?? null;
  const deletedAt = message.deletedAt ?? null;
  const type: MessageType = message.type ?? 'TEXT';
  const systemType: SystemMessageType | null = message.systemType ?? null;
  const metadata = ((): Record<string, unknown> | null => {
    if (!message.metadata) {
      return null;
    }
    return message.metadata;
  })();
  const actorId = message.actorId ?? null;
  const targetUserId = message.targetUserId ?? null;

  return {
    ...message,
    content,
    senderAvatar,
    attachments,
    replyTo,
    editedAt,
    deletedAt,
    deliveredTo,
    readBy,
    participantIds,
    type,
    systemType,
    metadata,
    actorId,
    targetUserId,
    isRead: message.isRead || readBy.includes(currentUserId) || message.senderId === currentUserId,
  };
};

const normalizeSocketMessage = (payload: EnrichedSocketMessage, currentUserId: string): Message =>
  ensureMessageDefaults(
    {
      id: payload.id,
      chatId: payload.chatId,
      senderId: payload.senderId,
      senderName: payload.senderName,
      senderAvatar: payload.senderAvatar ?? null,
      content: payload.content ?? null,
      timestamp: payload.timestamp,
      isRead: payload.isRead,
      isSent: payload.isSent,
      type: payload.type,
      attachments: payload.attachments ?? [],
      replyTo: payload.replyTo ?? null,
      editedAt: payload.editedAt ?? null,
      deletedAt: payload.deletedAt ?? null,
      deliveredTo: payload.deliveredTo ?? [],
      readBy: payload.readBy ?? [],
      participantIds: payload.participantIds ?? [],
      systemType: payload.systemType ?? null,
      metadata: payload.metadata ?? null,
      actorId: payload.actorId ?? null,
      targetUserId: payload.targetUserId ?? null,
    },
    currentUserId
  );

const HeaderAvatarButton: React.FC<{
  onPress: () => void;
  avatarUrl?: string | null;
  name: string;
  isGroup: boolean;
}> = ({ onPress, avatarUrl, name, isGroup }) => (
  <TouchableOpacity onPress={onPress} style={styles.headerButton}>
    <UserAvatar size={36} avatarUrl={avatarUrl} name={name} isGroup={isGroup} />
  </TouchableOpacity>
);

const ChatScreen: React.FC = () => {
  const { colors } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId, chatName } = (route.params as RouteParams) || {};
  const { mutate: markChatAsRead } = useMarkChatAsRead();
  const { data: chatInfo } = useChat(chatId);
  const { markMessagesAsRead, editMessage, deleteMessage } = useMessageOperations();
  const { data: messagesData, isLoading } = useMessages(chatId);
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
  const [typingUserName, setTypingUserName] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markedMessageIdsRef = useRef<Set<string>>(new Set());
  const typingUserIdRef = useRef<string | null>(null);

  // Get current user ID from Redux store
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentUserId = currentUser?.id || '';

  const isGroupChat = chatInfo?.isGroup ?? false;

  // Handle header press to navigate to details
  const handleHeaderPress = useCallback(() => {
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
  }, [chatId, chatInfo?.avatar, chatInfo?.otherUserId, groupName, isGroupChat, navigation]);

  useEffect(() => {
    typingUserIdRef.current = typingUserId;
  }, [typingUserId]);

  useEffect(() => {
    markedMessageIdsRef.current.clear();
  }, [chatId]);

  const buildOptimisticMessage = useCallback(
    (overrides: Partial<Message> & { id: string; content: string | null }) => {
      const baseTimestamp = overrides.timestamp ?? new Date().toISOString();
      const attachmentList = overrides.attachments ?? [];
      const delivered = overrides.deliveredTo ?? [];
      const read = overrides.readBy ?? (currentUserId ? [currentUserId] : []);
      const participants = overrides.participantIds ?? (currentUserId ? [currentUserId] : []);

      return ensureMessageDefaults(
        {
          id: overrides.id,
          chatId,
          senderId: currentUserId,
          senderName: currentUser?.name ?? 'You',
          senderAvatar: currentUser?.avatarUrl ?? null,
          content: overrides.content,
          timestamp: baseTimestamp,
          isRead: true,
          isSent: overrides.isSent ?? false,
          type: overrides.type ?? 'TEXT',
          attachments: attachmentList,
          replyTo: overrides.replyTo ?? null,
          editedAt: overrides.editedAt ?? null,
          deletedAt: overrides.deletedAt ?? null,
          deliveredTo: delivered,
          readBy: read,
          participantIds: participants,
          systemType: overrides.systemType ?? null,
          metadata: overrides.metadata ?? null,
          actorId: overrides.actorId ?? null,
          targetUserId: overrides.targetUserId ?? null,
        },
        currentUserId
      );
    },
    [chatId, currentUser?.avatarUrl, currentUser?.name, currentUserId]
  );

  const getSystemMessageText = useCallback(
    (message: Message): string => {
      if (!message.systemType) {
        return message.content ?? '';
      }

      const metadata = message.metadata ?? null;
      const getMetadataValue = (key: string): string | undefined => {
        if (!metadata) {
          return undefined;
        }
        const value = metadata[key];
        return typeof value === 'string' ? value : undefined;
      };

      const actorName = getMetadataValue('actorName') ?? message.senderName ?? 'Someone';
      const targetName = getMetadataValue('targetUserName');

      const lower = (value?: string | null) => (value ? value.toLowerCase() : undefined);

      switch (message.systemType) {
        case 'GROUP_CREATED':
          return `${actorName} created the group.`;
        case 'MEMBER_ADDED':
          if (targetName && targetName !== actorName) {
            return `${actorName} added ${targetName}.`;
          }
          if (targetName) {
            return `${targetName} joined the group.`;
          }
          return `${actorName} added a new member.`;
        case 'MEMBER_REMOVED':
          return targetName ? `${actorName} removed ${targetName}.` : `${actorName} removed a member.`;
        case 'MEMBER_LEFT':
          return `${actorName} left the group.`;
        case 'MEMBER_PROMOTED': {
          const newRole = lower(getMetadataValue('newRole')) ?? 'admin';
          return targetName
            ? `${actorName} promoted ${targetName} to ${newRole}.`
            : `${actorName} promoted a member to ${newRole}.`;
        }
        case 'MEMBER_DEMOTED': {
          const newRole = lower(getMetadataValue('newRole')) ?? 'member';
          return targetName
            ? `${actorName} changed ${targetName}'s role to ${newRole}.`
            : `${actorName} changed a member's role to ${newRole}.`;
        }
        case 'GROUP_RENAMED': {
          const previousName = getMetadataValue('previousName');
          const newName = getMetadataValue('newName');
          if (previousName && newName) {
            return `${actorName} renamed the group from ${previousName} to ${newName}.`;
          }
          return `${actorName} renamed the group.`;
        }
        case 'GROUP_DESCRIPTION_UPDATED': {
          const newDescription = getMetadataValue('newDescription');
          if (newDescription && newDescription.trim().length > 0) {
            return `${actorName} updated the group description.`;
          }
          return `${actorName} cleared the group description.`;
        }
        case 'GROUP_AVATAR_UPDATED':
          return `${actorName} updated the group avatar.`;
        default:
          return message.content ?? '';
      }
    },
    []
  );

  const getMessageStatus = useCallback(
    (message: Message) => {
      if (message.senderId !== currentUserId) {
        return null;
      }

      if (!message.isSent) {
        return { icon: '⌛', color: '#FFFFFF', label: 'Sending' };
      }

      const others = (message.participantIds ?? []).filter((id) => id !== currentUserId);
      if (others.length === 0) {
        return { icon: '✓', color: '#FFFFFF', label: 'Sent' };
      }

      const deliveredSet = new Set((message.deliveredTo ?? []).filter((id) => id !== currentUserId));
      const readSet = new Set((message.readBy ?? []).filter((id) => id !== currentUserId));

      const allDelivered = others.every((id) => deliveredSet.has(id));
      const allRead = others.every((id) => readSet.has(id));

      if (allRead) {
        return { icon: '✓✓', color: '#4CAF50', label: 'Read' };
      }

      if (allDelivered) {
        return { icon: '✓✓', color: 'rgba(255,255,255,0.85)', label: 'Delivered' };
      }

      return { icon: '✓', color: 'rgba(255,255,255,0.85)', label: 'Sent' };
    },
    [currentUserId]
  );

  // Load messages from API
  useEffect(() => {
    if (messagesData?.messages) {
      const normalizedMessages = messagesData.messages.map((msg) => ensureMessageDefaults(msg, currentUserId));
      setMessages(normalizedMessages);
      // Scroll to bottom when messages first load
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messagesData, currentUserId]);

  useEffect(() => {
    if (!chatId) {
      return;
    }

    markChatAsRead(chatId);
    notificationService.cancelChatNotifications(chatId);
  }, [chatId, markChatAsRead]);

  useEffect(() => {
    navigation.setOptions({
      title: groupName,
      headerRight: () => (
        <HeaderAvatarButton
          onPress={handleHeaderPress}
          avatarUrl={chatInfo?.avatar}
          name={groupName}
          isGroup={isGroupChat}
        />
      ),
    });
  }, [chatInfo?.avatar, groupName, handleHeaderPress, isGroupChat, navigation]);

  // Note: Users are automatically joined to all their groups on socket connection
  // No need to manually join/leave group rooms here

  // Socket.IO Event Listeners
  useEffect(() => {
    // New message received
    const handleNewMessage = ({ message, tempId }: NewMessagePayload) => {
      console.log('📨 New message received:', { message, tempId });

      const normalizedMessage = normalizeSocketMessage(message, currentUserId);

      if (normalizedMessage.chatId !== chatId) {
        return;
      }

      const isOwnMessage = normalizedMessage.senderId === currentUserId;

      if (normalizedMessage.senderId === typingUserIdRef.current) {
        setIsTyping(false);
        setTypingUserId(null);
        setTypingUserName('');
      }

      if (tempId) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? normalizedMessage : msg))
        );
      } else {
        setMessages((prev) => {
          if (isOwnMessage) {
            const tempIndex = prev.findIndex((msg) =>
              msg.id.startsWith('temp-') &&
              msg.senderId === currentUserId &&
              msg.content === normalizedMessage.content
            );

            if (tempIndex !== -1) {
              const updated = [...prev];
              updated[tempIndex] = normalizedMessage;
              return updated;
            }
          }

          return [...prev, normalizedMessage];
        });
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }

      if (!isOwnMessage && !markedMessageIdsRef.current.has(normalizedMessage.id)) {
        const targetUserId = isGroupChat ? undefined : normalizedMessage.senderId;
        markMessagesAsRead(
          [normalizedMessage.id],
          targetUserId,
          isGroupChat ? chatId : undefined,
          !isGroupChat ? chatId : undefined
        );
        markedMessageIdsRef.current.add(normalizedMessage.id);
      }
    };

    const handleMessageDelivered = ({ messageId, participantIds }: { messageId: string; participantIds: string[] }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) {
            return msg;
          }

          const deliveredSet = new Set(msg.deliveredTo ?? []);
          participantIds.forEach((id) => {
            if (id !== msg.senderId) {
              deliveredSet.add(id);
            }
          });

          const mergedParticipants = Array.from(new Set([...(msg.participantIds ?? []), ...participantIds]));

          return ensureMessageDefaults(
            {
              ...msg,
              deliveredTo: Array.from(deliveredSet),
              participantIds: mergedParticipants,
              isSent: true,
            },
            currentUserId
          );
        })
      );
    };

    const applyReadReceipt = (messageId: string, readerId: string) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) {
            return msg;
          }

          const readSet = new Set(msg.readBy ?? []);
          readSet.add(readerId);

          const updated = {
            ...msg,
            readBy: Array.from(readSet),
          };

          if (readerId === currentUserId) {
            updated.isRead = true;
          }

          return ensureMessageDefaults(updated, currentUserId);
        })
      );
    };

    const handleMessageRead = (data: { messageId?: string; messageIds?: string[]; readerId: string }) => {
      if (data.messageId) {
        applyReadReceipt(data.messageId, data.readerId);
      }

      if (Array.isArray(data.messageIds)) {
        data.messageIds.forEach((id) => applyReadReceipt(id, data.readerId));
      }
    };

    const handleMessageReadConfirmed = (data: { messageId: string; readerId: string }) => {
      applyReadReceipt(data.messageId, data.readerId);
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
    };

    // Group member removed
    const handleMemberRemoved = (data: GroupMemberRemovedData) => {
      console.log('Member removed:', data);
    };

    // Group member role changed
    const handleRoleChanged = (data: GroupMemberRoleChangedData) => {
      console.log('Member role changed:', data);
    };

    // Group updated
    const handleGroupUpdated = (data: GroupUpdatedData) => {
      console.log('Group updated:', data);
      if (data.name) {
        setGroupName(data.name);
        navigation.setOptions({ title: data.name });
      }
      // System message will arrive from backend via socket
    };

    // Typing indicators
    const handleTypingStart = (data: any) => {
      console.log('⌨️ Typing start:', data);
      const { userId, userName, targetUserId, groupId: typingGroupId } = data;
      
      // Only show typing if it's from another user in this chat
      if (userId !== currentUserId) {
        const isThisChat = isGroupChat ? typingGroupId === chatId : targetUserId === currentUserId;
        if (isThisChat) {
          setIsTyping(true);
          setTypingUserId(userId);
          setTypingUserName(userName && userName.trim().length > 0 ? userName : 'Someone');
        }
      }
    };

    const handleTypingStop = (data: any) => {
      console.log('⌨️ Typing stop:', data);
      const { userId } = data;
      console.log('Typing stop for user:', userId, 'typingUserId:', typingUserId);
      if (userId === typingUserId) {
        setIsTyping(false);
        setTypingUserId(null);
        setTypingUserName('');
      }
    };

    // Register event listeners
    socketManager.on('message:new', handleNewMessage);
    socketManager.on('message:delivered', handleMessageDelivered);
    socketManager.on('message:read', handleMessageRead);
    socketManager.on('message:read:confirmed', handleMessageReadConfirmed);
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
      socketManager.off('message:delivered', handleMessageDelivered);
      socketManager.off('message:read', handleMessageRead);
      socketManager.off('message:read:confirmed', handleMessageReadConfirmed);
      socketManager.off('message:edited', handleMessageEdited);
      socketManager.off('message:deleted', handleMessageDeleted);
      socketManager.off('group:member:added', handleMemberAdded);
      socketManager.off('group:member:removed', handleMemberRemoved);
      socketManager.off('group:member:role_changed', handleRoleChanged);
      socketManager.off('group:updated', handleGroupUpdated);
      socketManager.off('typing:start', handleTypingStart);
      socketManager.off('typing:stop', handleTypingStop);
    };
  }, [chatId, chatInfo?.otherUserId, currentUserId, isGroupChat, markMessagesAsRead, navigation, typingUserId]);

  // Bulk read receipts - mark all unread messages as read when opening chat
  useEffect(() => {
    markedMessageIdsRef.current.clear();
  }, [chatId]);

  useEffect(() => {
    const unreadMessages = messages.filter(msg => !msg.isRead && msg.senderId !== currentUserId);
    if (unreadMessages.length === 0) {
      return;
    }

    const unreadIds = unreadMessages
      .map(msg => msg.id)
      .filter(id => !markedMessageIdsRef.current.has(id));

    if (unreadIds.length > 0) {
      const targetUserId = isGroupChat ? undefined : chatInfo?.otherUserId ?? unreadMessages[0]?.senderId;
      markMessagesAsRead(
        unreadIds,
        targetUserId,
        isGroupChat ? chatId : undefined,
        !isGroupChat ? chatId : undefined
      );
      unreadIds.forEach((id) => markedMessageIdsRef.current.add(id));
    }

    const markIdsSet = new Set(unreadMessages.map((msg) => msg.id));
    if (markIdsSet.size > 0) {
      markIdsSet.forEach((id) => markedMessageIdsRef.current.add(id));
      setMessages(prev => prev.map(msg =>
        markIdsSet.has(msg.id) ? { ...msg, isRead: true } : msg
      ));
    }
  }, [messages, isGroupChat, chatId, currentUserId, chatInfo?.otherUserId, markMessagesAsRead]);

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

    const mapAttachmentTypeToMessageType = (att?: Attachment): MessageType => {
      if (!att) {
        return location ? 'LOCATION' : 'TEXT';
      }

      switch (att.type) {
        case 'image':
          return 'IMAGE';
        case 'video':
          return 'VIDEO';
        case 'audio':
          return 'AUDIO';
        case 'file':
          return 'FILE';
        case 'location':
          return 'LOCATION';
        default:
          return 'TEXT';
      }
    };

    const resolvedType: MessageType = mapAttachmentTypeToMessageType(attachment);

    const tempMessage = buildOptimisticMessage({
      id: tempId,
      content: messageContent,
      attachments,
      isSent: false,
      type: resolvedType,
    });

    setMessages((prev) => [...prev, tempMessage]);
    setInputText('');

    try {
      // Send via API hook
      await sendMessageMutation.mutateAsync({
        chatId,
        content: messageContent,
        mediaUrl: attachment?.url,
        type: resolvedType,
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

    const tempMessage = buildOptimisticMessage({
      id: tempId,
      content: messageContent,
      isSent: false,
    });

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
    const isSystemMessage = Boolean(item.systemType);

    // System messages (group events)
    if (isSystemMessage) {
      const systemText = getSystemMessageText(item);
      return (
        <View style={styles.systemMessageContainer}>
          <Text variant="bodySmall" style={styles.systemMessageText}>
            {systemText}
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
            {(() => {
              const status = getMessageStatus(item);
              if (!status) {
                return null;
              }
              return (
                <Text style={[styles.status, { color: status.color }]} accessibilityLabel={status.label}>
                  {status.icon}
                </Text>
              );
            })()}
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
    setEditText(message.content ?? '');
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
    paddingBottom: 16,
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
