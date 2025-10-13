// src/utils/socketManager.ts

/**
 * Socket.io client manager for real-time messaging
 * 
 * NOTE: Install socket.io-client first:
 * npm install socket.io-client
 */

// Uncomment after installing socket.io-client
// import { io, Socket } from 'socket.io-client';
import Config from 'react-native-config';
import { store } from '../store';

class SocketManager {
  // private socket: Socket | null = null;
  private socket: any = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  /**
   * Initialize and connect to socket server
   */
  connect() {
    const state = store.getState();
    const token = state.auth.token;

    if (!token) {
      console.error('Cannot connect to socket: No auth token');
      return;
    }

    const socketUrl = Config.SOCKET_URL || 'http://localhost:3000';

    // Uncomment after installing socket.io-client
    /*
    this.socket = io(socketUrl, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
    */

    console.log('Socket connection initialized (mock)');
    this.isConnected = true;
  }

  /**
   * Set up socket event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    // Uncomment after installing socket.io-client
    /*
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    // Message events
    this.socket.on('message:new', (message: any) => {
      console.log('New message received:', message);
      // Dispatch to Redux or handle in component
    });

    this.socket.on('message:sent', (message: any) => {
      console.log('Message sent confirmation:', message);
    });

    this.socket.on('message:read', (data: any) => {
      console.log('Message read:', data);
    });

    this.socket.on('typing:start', (data: any) => {
      console.log('User started typing:', data);
    });

    this.socket.on('typing:stop', (data: any) => {
      console.log('User stopped typing:', data);
    });

    this.socket.on('presence:online', (data: any) => {
      console.log('User came online:', data);
    });

    this.socket.on('presence:offline', (data: any) => {
      console.log('User went offline:', data);
    });
    */
  }

  /**
   * Send a message
   */
  sendMessage(chatId: string, content: string, attachments?: any[]) {
    if (!this.isConnected || !this.socket) {
      console.error('Socket not connected');
      return;
    }

    // Uncomment after installing socket.io-client
    /*
    this.socket.emit('message:send', {
      chatId,
      content,
      attachments,
      timestamp: new Date().toISOString(),
    });
    */

    console.log('Send message (mock):', { chatId, content });
  }

  /**
   * Mark messages as read
   */
  markAsRead(chatId: string, messageIds: string[]) {
    if (!this.isConnected || !this.socket) {
      console.error('Socket not connected');
      return;
    }

    // Uncomment after installing socket.io-client
    /*
    this.socket.emit('message:read', {
      chatId,
      messageIds,
    });
    */

    console.log('Mark as read (mock):', { chatId, messageIds });
  }

  /**
   * Send typing indicator
   */
  sendTyping(chatId: string, isTyping: boolean) {
    if (!this.isConnected || !this.socket) return;

    // Uncomment after installing socket.io-client
    /*
    this.socket.emit(isTyping ? 'typing:start' : 'typing:stop', {
      chatId,
    });
    */

    console.log('Typing indicator (mock):', { chatId, isTyping });
  }

  /**
   * Join a chat room
   */
  joinChat(chatId: string) {
    if (!this.isConnected || !this.socket) return;

    // Uncomment after installing socket.io-client
    /*
    this.socket.emit('chat:join', { chatId });
    */

    console.log('Join chat (mock):', chatId);
  }

  /**
   * Leave a chat room
   */
  leaveChat(chatId: string) {
    if (!this.isConnected || !this.socket) return;

    // Uncomment after installing socket.io-client
    /*
    this.socket.emit('chat:leave', { chatId });
    */

    console.log('Leave chat (mock):', chatId);
  }

  /**
   * Register event listener
   */
  on(event: string, callback: (data: any) => void) {
    if (!this.socket) return;

    // Uncomment after installing socket.io-client
    /*
    this.socket.on(event, callback);
    */

    console.log('Register listener (mock):', event);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: (data: any) => void) {
    if (!this.socket) return;

    // Uncomment after installing socket.io-client
    /*
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
    */

    console.log('Remove listener (mock):', event);
  }

  /**
   * Disconnect from socket server
   */
  disconnect() {
    if (this.socket) {
      // Uncomment after installing socket.io-client
      /*
      this.socket.disconnect();
      */
      this.socket = null;
      this.isConnected = false;
      console.log('Socket disconnected');
    }
  }

  /**
   * Check if socket is connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const socketManager = new SocketManager();
