// src/services/notificationService.ts

import notifee, {
  AndroidImportance,
  EventType,
  Notification,
  InitialNotification,
} from '@notifee/react-native';
import { Platform } from 'react-native';

export interface NotificationPressPayload {
  chatId: string;
  chatName?: string;
  isGroup?: boolean;
  messageId?: string;
}

class NotificationService {
  private channelId = 'pulse_default_channel';
  private initialized = false;
  private notificationPressListeners = new Set<(payload: NotificationPressPayload) => void>();

  /**
   * Initialize notification service
   * Creates notification channel for Android
   */
  async initialize() {
    if (this.initialized) return;

    try {
      if (Platform.OS === 'android') {
        // Create notification channel for Android
        await notifee.createChannel({
          id: this.channelId,
          name: 'Messages',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
        });
        console.log('✅ Notification channel created');
      }

      // Set up notification event handlers
      this.setupEventHandlers();
      
      this.initialized = true;
      console.log('✅ Notification service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const settings = await notifee.requestPermission();
      console.log('📱 Notification permission status:', settings.authorizationStatus);
      return settings.authorizationStatus >= 1; // 1 = authorized, 2 = provisional
    } catch (error) {
      console.error('❌ Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const settings = await notifee.getNotificationSettings();
      return settings.authorizationStatus >= 1;
    } catch (error) {
      console.error('❌ Failed to check notification settings:', error);
      return false;
    }
  }

  /**
   * Display a new message notification
   */
  async displayMessageNotification(params: {
    messageId: string;
    chatId: string;
    senderName: string;
    senderAvatar?: string;
    content: string;
    isGroup?: boolean;
    chatName?: string;
  }) {
    try {
      const { messageId, chatId, senderName, content, isGroup, chatName } = params;

      // Don't show notification if app is in foreground and chat is open
      // This will be handled by the caller
      
      const iosOptions: Notification['ios'] = {
        sound: 'default',
        categoryId: 'message',
      };

      if (params.senderAvatar) {
        iosOptions.attachments = [{ url: params.senderAvatar }];
      }

      await notifee.displayNotification({
        id: messageId,
        title: senderName,
        body: content,
        android: {
          channelId: this.channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
          // Group notifications by chat
          groupId: chatId,
          groupSummary: false,
          // Use default icon if custom icon doesn't exist
          smallIcon: 'ic_launcher',
          sound: 'default',
          vibrationPattern: [300, 500],
          // Add action buttons
          actions: [
            {
              title: 'Reply',
              pressAction: { id: 'reply' },
              input: {
                allowFreeFormInput: true,
                placeholder: 'Type a message...',
              },
            },
            {
              title: 'Mark as Read',
              pressAction: { id: 'mark_read' },
            },
          ],
        },
        ios: iosOptions,
        data: {
          messageId,
          chatId,
          senderName,
          chatName: chatName ?? senderName,
          isGroup: isGroup ? 'true' : 'false',
        },
      });

      console.log('🔔 Notification displayed:', { senderName, content: content.substring(0, 30) });
    } catch (error) {
      console.error('❌ Failed to display notification:', error);
    }
  }

  /**
   * Cancel a specific notification
   */
  async cancelNotification(notificationId: string) {
    try {
      await notifee.cancelNotification(notificationId);
      console.log('🔕 Notification cancelled:', notificationId);
    } catch (error) {
      console.error('❌ Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all notifications for a specific chat
   */
  async cancelChatNotifications(chatId: string) {
    try {
      const notifications = await notifee.getDisplayedNotifications();
      const chatNotifications = notifications.filter(
        (n) => n.notification.data?.chatId === chatId
      );

      for (const notification of chatNotifications) {
        if (notification.id) {
          await notifee.cancelNotification(notification.id);
        }
      }

      console.log('🔕 Cancelled notifications for chat:', chatId);
    } catch (error) {
      console.error('❌ Failed to cancel chat notifications:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications() {
    try {
      await notifee.cancelAllNotifications();
      console.log('🔕 All notifications cancelled');
    } catch (error) {
      console.error('❌ Failed to cancel all notifications:', error);
    }
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    try {
      if (Platform.OS === 'ios') {
        return await notifee.getBadgeCount();
      }
      return 0;
    } catch (error) {
      console.error('❌ Failed to get badge count:', error);
      return 0;
    }
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number) {
    try {
      if (Platform.OS === 'ios') {
        await notifee.setBadgeCount(count);
        console.log('🔢 Badge count set to:', count);
      }
    } catch (error) {
      console.error('❌ Failed to set badge count:', error);
    }
  }

  /**
   * Increment badge count
   */
  async incrementBadge() {
    try {
      if (Platform.OS === 'ios') {
        const current = await this.getBadgeCount();
        await this.setBadgeCount(current + 1);
      }
    } catch (error) {
      console.error('❌ Failed to increment badge:', error);
    }
  }

  /**
   * Setup notification event handlers
   */
  private setupEventHandlers() {
    // Handle notification press
    notifee.onForegroundEvent(async ({ type, detail }) => {
      console.log('🔔 Foreground notification event:', type);

      if (type === EventType.PRESS) {
        console.log('🔔 Notification pressed:', detail.notification?.data);
        this.handleNotificationPress(detail.notification);
      } else if (type === EventType.ACTION_PRESS) {
        const actionId = detail.pressAction?.id;
        console.log('🔔 Notification action pressed:', actionId);

        if (actionId === 'mark_read') {
          // Handle mark as read
          const chatId = detail.notification?.data?.chatId;
          if (chatId) {
            await this.cancelChatNotifications(chatId as string);
          }
        } else if (actionId === 'reply') {
          // Handle reply - navigation will be handled by the app
          console.log('🔔 Reply action:', detail.input);
        }
      }
    });

    // Handle background events
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      console.log('🔔 Background notification event:', type);

      if (type === EventType.PRESS) {
        console.log('🔔 Background notification pressed:', detail.notification?.data);
        this.handleNotificationPress(detail.notification);
      } else if (type === EventType.ACTION_PRESS) {
        const actionId = detail.pressAction?.id;
        if (actionId === 'mark_read') {
          const chatId = detail.notification?.data?.chatId;
          if (chatId) {
            await this.cancelChatNotifications(chatId as string);
          }
        }
      }
    });
  }

  private emitNotificationPress(payload: NotificationPressPayload) {
    this.notificationPressListeners.forEach((listener) => {
      listener(payload);
    });
  }

  private parseNotificationPayload(notification: Notification | null | undefined): NotificationPressPayload | null {
    if (!notification?.data) {
      return null;
    }

    const { chatId, chatName, isGroup, messageId } = notification.data;

    if (!chatId) {
      return null;
    }

    return {
      chatId: String(chatId),
      chatName: chatName ? String(chatName) : undefined,
      isGroup: isGroup ? String(isGroup) === 'true' : undefined,
      messageId: messageId ? String(messageId) : undefined,
    };
  }

  private handleNotificationPress(notification: Notification | null | undefined) {
    const payload = this.parseNotificationPayload(notification);

    if (!payload) {
      return;
    }

    this.emitNotificationPress(payload);
  }

  onNotificationPress(listener: (payload: NotificationPressPayload) => void) {
    this.notificationPressListeners.add(listener);

    return () => {
      this.notificationPressListeners.delete(listener);
    };
  }

  async getInitialNotification(): Promise<NotificationPressPayload | null> {
    try {
      const initial: InitialNotification | null = await notifee.getInitialNotification();

      if (!initial) {
        return null;
      }

      return this.parseNotificationPayload(initial.notification);
    } catch (error) {
      console.error('❌ Failed to get initial notification:', error);
      return null;
    }
  }
}

export const notificationService = new NotificationService();
