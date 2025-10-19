// src/utils/socketManager.ts

import { io, Socket } from 'socket.io-client';
import config from '../config';
import { store } from '../store';

// ============= Types matching backend API =============

export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'LOCATION';

export type SystemMessageType =
  | 'GROUP_CREATED'
  | 'MEMBER_ADDED'
  | 'MEMBER_REMOVED'
  | 'MEMBER_LEFT'
  | 'MEMBER_PROMOTED'
  | 'MEMBER_DEMOTED'
  | 'GROUP_RENAMED'
  | 'GROUP_DESCRIPTION_UPDATED'
  | 'GROUP_AVATAR_UPDATED';

export interface SendMessagePayload {
  receiverId?: string;
  groupId?: string;
  conversationId?: string;
  type?: MessageType;
  content?: string;
  mediaUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  tempId?: string;
}

export interface MarkReadPayload {
  messageId?: string; // Single message (legacy)
  messageIds?: string[]; // Bulk read receipts
  targetUserId?: string;
  groupId?: string;
  conversationId?: string;
  readAt?: string;
}

export interface EditMessagePayload {
  messageId: string;
  content: string;
  conversationId?: string;
  groupId?: string;
}

export interface MessageEditedData {
  messageId: string;
  content: string;
  editedAt: string;
  conversationId?: string;
  groupId?: string;
}

export interface DeleteMessagePayload {
  messageId: string;
  conversationId?: string;
  groupId?: string;
  deleteForEveryone?: boolean;
}

export interface MessageDeletedData {
  messageId: string;
  deletedBy: string;
  deletedAt: string;
  deleteForEveryone: boolean;
  conversationId?: string;
  groupId?: string;
}

export interface GroupMemberAddedData {
  groupId: string;
  userId: string;
  addedBy: string;
  role: 'ADMIN' | 'MEMBER';
}

export interface GroupMemberRemovedData {
  groupId: string;
  userId: string;
  removedBy: string;
}

export interface GroupMemberRoleChangedData {
  groupId: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER';
}

export interface GroupUpdatedData {
  groupId: string;
  name?: string;
  description?: string;
  avatarUrl?: string;
  updatedBy: string;
}

export interface TypingPayload {
  conversationId?: string;
  targetUserId?: string;
  groupId?: string;
}

export interface PresenceUpdate {
  userId: string;
  status: 'online' | 'offline';
}

export interface PresenceState {
  onlineUserIds: string[];
}

// Event callback types
export interface EnrichedSocketMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string | null;
  timestamp: string;
  isRead: boolean;
  isSent: boolean;
  type: MessageType;
  attachments?: AttachmentPayload[];
  replyTo?: string | null;
  deliveredTo?: string[];
  readBy?: string[];
  participantIds?: string[];
  editedAt?: string | null;
  deletedAt?: string | null;
  systemType?: SystemMessageType | null;
  metadata?: Record<string, unknown> | null;
  actorId?: string | null;
  targetUserId?: string | null;
}

export interface AttachmentPayload {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file' | 'location';
  url: string;
  name?: string;
  latitude?: number;
  longitude?: number;
}

export interface NewMessagePayload {
  message: EnrichedSocketMessage;
  tempId?: string;
}

export interface SendMessageAck {
  status: 'ok' | 'error';
  error?: string;
  message?: EnrichedSocketMessage;
  messageId?: string;
  tempId?: string;
}

export type MessageNewCallback = (data: NewMessagePayload) => void;
export type MessageDeliveredCallback = (data: { messageId: string; participantIds: string[] }) => void;
export type MessageReadCallback = (data: MarkReadPayload & { readerId: string; readAt: string }) => void;
export type TypingCallback = (data: { userId: string; conversationId?: string; targetUserId?: string; groupId?: string }) => void;
export type PresenceUpdateCallback = (data: PresenceUpdate) => void;
export type PresenceStateCallback = (data: PresenceState) => void;

class SocketManager {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private socketUrl: string = '';

  /**
   * Initialize and connect to socket server
   */
  connect() {
    console.log('🔌 Socket connect() called');
    
    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return;
    }

    const state = store.getState();
    const token = state.auth.accessToken;

    console.log('🔑 Token available:', !!token);
    console.log('🔑 Token preview:', token ? token.substring(0, 20) + '...' : 'none');

    if (!token) {
      console.log('⏸️ Socket connection skipped: User not authenticated yet');
      return;
    }

    this.socketUrl = config.SOCKET_URL || 'http://localhost:3000';
    console.log('🔗 Connecting to:', this.socketUrl);

    this.socket = io(this.socketUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'], // Allow polling fallback for React Native
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 10000, // Connection timeout
    });

    this.setupEventListeners();
    console.log('🔌 Socket connection initialized, waiting for connect event...');
  }

  /**
   * Set up socket event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      console.log('🔗 Socket URL:', this.socketUrl);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connect', { socketId: this.socket?.id });
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnect', { reason });
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ Socket connection error:', error.message);
      console.error('❌ Error details:', error);
      console.error('🔗 Attempted URL:', this.socketUrl);
      console.error('🔄 Reconnect attempt:', this.reconnectAttempts + 1, '/', this.maxReconnectAttempts);
      this.reconnectAttempts++;
      this.emit('connect_error', { error: error.message });
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('error', (error: Error) => {
      console.error('❌ Socket error:', error);
    });

    // Message events
    this.socket.on('message:new', (data: NewMessagePayload) => {
      console.log('New message received:', data);
      this.emit('message:new', data);
    });

    this.socket.on('message:delivered', (data: { messageId: string; participantIds: string[] }) => {
      console.log('Message delivered:', data);
      this.emit('message:delivered', data);
    });

    this.socket.on('message:read', (data: any) => {
      console.log('Message read:', data);
      this.emit('message:read', data);
    });

    this.socket.on('message:read:confirmed', (data: any) => {
      console.log('Read receipt confirmed:', data);
      this.emit('message:read:confirmed', data);
    });

    // Message editing
    this.socket.on('message:edited', (data: MessageEditedData) => {
      console.log('Message edited:', data);
      this.emit('message:edited', data);
    });

    // Message deletion
    this.socket.on('message:deleted', (data: MessageDeletedData) => {
      console.log('Message deleted:', data);
      this.emit('message:deleted', data);
    });

    // Group member events
    this.socket.on('group:member:added', (data: GroupMemberAddedData) => {
      console.log('Group member added:', data);
      this.emit('group:member:added', data);
    });

    this.socket.on('group:member:removed', (data: GroupMemberRemovedData) => {
      console.log('Group member removed:', data);
      this.emit('group:member:removed', data);
    });

    this.socket.on('group:member:role_changed', (data: GroupMemberRoleChangedData) => {
      console.log('Group member role changed:', data);
      this.emit('group:member:role_changed', data);
    });

    this.socket.on('group:updated', (data: GroupUpdatedData) => {
      console.log('Group updated:', data);
      this.emit('group:updated', data);
    });

    // Typing indicators
    this.socket.on('typing:start', (data: any) => {
      console.log('User started typing:', data);
      this.emit('typing:start', data);
    });

    this.socket.on('typing:stop', (data: any) => {
      console.log('User stopped typing:', data);
      this.emit('typing:stop', data);
    });

    // Presence events
    this.socket.on('presence:update', (data: PresenceUpdate) => {
      console.log('Presence update:', data);
      this.emit('presence:update', data);
    });

    this.socket.on('presence:state', (data: PresenceState) => {
      console.log('Presence state:', data);
      this.emit('presence:state', data);
    });
  }

  /**
   * Send a message
   */
  sendMessage(
    payload: SendMessagePayload,
    callback?: (ack: SendMessageAck) => void
  ) {
    if (!this.isConnected || !this.socket) {
      console.log('Socket not connected, cannot send message');
      callback?.({ status: 'error', error: 'Socket not connected' });
      return;
    }

    this.socket.emit('message:send', payload, (ack: SendMessageAck) => {
      console.log('Message send acknowledgment:', ack);
      callback?.(ack);
    });
  }

  /**
   * Mark message(s) as read (supports single or bulk)
   */
  markAsRead(payload: MarkReadPayload) {
    if (!this.isConnected || !this.socket) {
      // Silently skip if socket not connected - not critical
      console.log('Socket not connected, skipping mark as read');
      return;
    }

    this.socket.emit('message:read', payload);
  }

  /**
   * Edit a message
   */
  editMessage(payload: EditMessagePayload) {
    if (!this.isConnected || !this.socket) {
      console.log('Socket not connected, skipping message edit');
      return;
    }

    this.socket.emit('message:edit', payload);
    console.log('Message edit sent:', payload);
  }

  /**
   * Delete a message
   */
  deleteMessage(payload: DeleteMessagePayload) {
    if (!this.isConnected || !this.socket) {
      console.log('Socket not connected, skipping message delete');
      return;
    }

    this.socket.emit('message:delete', payload);
    console.log('Message delete sent:', payload);
  }

  /**
   * Send typing start indicator
   */
  startTyping(payload: TypingPayload) {
    if (!this.isConnected || !this.socket) return;
    this.socket.emit('typing:start', payload);
  }

  /**
   * Send typing stop indicator
   */
  stopTyping(payload: TypingPayload) {
    if (!this.isConnected || !this.socket) return;
    this.socket.emit('typing:stop', payload);
  }

  /**
   * Join a group room
   */
  joinGroup(groupId: string) {
    if (!this.isConnected || !this.socket) {
      console.warn('⚠️ Cannot join group - socket not connected:', groupId);
      return;
    }
    this.socket.emit('group:join', { groupId });
    console.log('✅ Joined group room:', groupId);
  }

  /**
   * Leave a group room
   */
  leaveGroup(groupId: string) {
    if (!this.isConnected || !this.socket) return;
    this.socket.emit('group:leave', { groupId });
    console.log('Left group:', groupId);
  }

  /**
   * Subscribe to presence updates
   */
  subscribeToPresence() {
    if (!this.isConnected || !this.socket) return;
    this.socket.emit('presence:subscribe');
  }

  /**
   * Register event listener (internal event emitter)
   */
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener (internal event emitter)
   */
  off(event: string, callback?: Function) {
    if (!callback) {
      this.eventListeners.delete(event);
    } else {
      this.eventListeners.get(event)?.delete(callback);
    }
  }

  /**
   * Emit event to internal listeners
   */
  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Reconnect to socket server
   */
  reconnect() {
    console.log('🔄 Manual reconnect triggered');
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }

  /**
   * Disconnect from socket server
   */
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
      console.log('✅ Socket disconnected');
    }
  }

  /**
   * Check if socket is connected (method)
   */
  isSocketConnected() {
    return this.socket?.connected ?? false;
  }

  /**
   * Get socket instance (for debugging)
   */
  getSocket() {
    return this.socket;
  }
}

// Export singleton instance
export const socketManager = new SocketManager();
