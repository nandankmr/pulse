// src/hooks/useNotifications.ts

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { notificationService } from '../services/notificationService';
import { socketManager } from '../utils/socketManager';

/**
 * Hook to manage notifications for incoming messages
 * Only shows notifications when app is in background or when chat is not open
 */
export const useMessageNotifications = (currentChatId?: string) => {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);

  useEffect(() => {
    // Initialize notification service
    notificationService.initialize();
    notificationService.requestPermissions();

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appState.current = nextAppState;
      console.log('📱 App state changed to:', nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const handleNewMessage = async (data: any) => {
      console.log('🔔 New message for notification check:', data);

      // Backend sends: { message: {...}, tempId?: string }
      const messageData = data.message || data;
      const messageId = messageData.id;
      const conversationId = messageData.chatId || messageData.conversationId;
      const groupId = messageData.chatId;
      const senderId = messageData.senderId;
      const senderName = messageData.senderName || messageData.sender?.name || 'Someone';
      const senderAvatar = messageData.senderAvatar || messageData.sender?.avatarUrl;
      const content = messageData.content;
      const isGroup = !!groupId;
      const chatId = isGroup ? groupId : conversationId;

      // Don't show notification for own messages
      if (senderId === currentUserId) {
        console.log('🔕 Skipping notification: own message');
        return;
      }

      // Don't show notification if app is in foreground and this chat is open
      if (appState.current === 'active' && currentChatId === chatId) {
        console.log('🔕 Skipping notification: chat is open');
        return;
      }

      // Show notification
      console.log('🔔 Showing notification for message from:', senderName);
      await notificationService.displayMessageNotification({
        messageId,
        chatId,
        senderName,
        senderAvatar,
        content,
        isGroup,
      });

      // Increment badge count on iOS
      await notificationService.incrementBadge();
    };

    // Register socket listener
    socketManager.on('message:new', handleNewMessage);

    return () => {
      socketManager.off('message:new', handleNewMessage);
    };
  }, [currentChatId, currentUserId]);
};

/**
 * Hook to clear notifications when chat is opened
 */
export const useClearChatNotifications = (chatId: string) => {
  useEffect(() => {
    if (chatId) {
      notificationService.cancelChatNotifications(chatId);
    }
  }, [chatId]);
};

/**
 * Hook to manage badge count based on unread messages
 */
export const useNotificationBadge = () => {
  const unreadCount = useSelector((_state: RootState) => {
    // Calculate total unread messages across all chats
    // This assumes you have unread counts in your Redux store
    // Adjust based on your actual store structure
    return 0; // TODO: Implement based on your store structure
  });

  useEffect(() => {
    notificationService.setBadgeCount(unreadCount);
  }, [unreadCount]);
};
