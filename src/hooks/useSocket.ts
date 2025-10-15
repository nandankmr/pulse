// src/hooks/useSocket.ts

import { useEffect, useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { socketManager } from '../utils/socketManager';
import type {
  SendMessagePayload,
  SendMessageAck,
  SocketMessage,
  MarkReadPayload,
  TypingPayload,
  PresenceUpdate,
  PresenceState,
  MessageNewCallback,
  MessageDeliveredCallback,
  MessageReadCallback,
  TypingCallback,
  PresenceUpdateCallback,
  PresenceStateCallback,
} from '../utils/socketManager';

/**
 * Hook to manage Socket.IO connection
 * Automatically connects when user is authenticated
 */
export const useSocketConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, accessToken } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    console.log('🔄 useSocketConnection effect - isAuthenticated:', isAuthenticated, 'hasToken:', !!accessToken);
    
    // Only connect if authenticated and has token
    if (isAuthenticated && accessToken) {
      console.log('✅ User authenticated, connecting socket...');
      socketManager.connect();
    } else {
      console.log('⏸️ User not authenticated, skipping socket connection');
      // Disconnect if user logs out
      if (!isAuthenticated) {
        socketManager.disconnect();
      }
    }

    // Listen for connection events
    const handleConnect = () => {
      console.log('✅ Socket connected event received in hook');
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnect = () => {
      console.log('❌ Socket disconnected event received in hook');
      setIsConnected(false);
    };

    const handleError = ({ error }: { error: string }) => {
      console.error('❌ Socket error event received in hook:', error);
      setError(error);
    };

    socketManager.on('connect', handleConnect);
    socketManager.on('disconnect', handleDisconnect);
    socketManager.on('connect_error', handleError);

    // Cleanup
    return () => {
      socketManager.off('connect', handleConnect);
      socketManager.off('disconnect', handleDisconnect);
      socketManager.off('connect_error', handleError);
    };
  }, [isAuthenticated, accessToken]); // Re-run when auth state changes

  return { isConnected, error };
};

/**
 * Hook to send messages via Socket.IO
 */
export const useSendMessage = () => {
  const sendMessage = useCallback(
    (payload: SendMessagePayload): Promise<SendMessageAck> => {
      return new Promise((resolve) => {
        socketManager.sendMessage(payload, (ack) => {
          resolve(ack);
        });
      });
    },
    []
  );

  return { sendMessage };
};

/**
 * Hook to listen for new messages
 */
export const useMessageListener = (callback: MessageNewCallback) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handler: MessageNewCallback = (data) => {
      callbackRef.current(data);
    };

    socketManager.on('message:new', handler);

    return () => {
      socketManager.off('message:new', handler);
    };
  }, []);
};

/**
 * Hook to listen for message delivered events
 */
export const useMessageDeliveredListener = (callback: MessageDeliveredCallback) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handler: MessageDeliveredCallback = (data) => {
      callbackRef.current(data);
    };

    socketManager.on('message:delivered', handler);

    return () => {
      socketManager.off('message:delivered', handler);
    };
  }, []);
};

/**
 * Hook to listen for message read events
 */
export const useMessageReadListener = (callback: MessageReadCallback) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handler: MessageReadCallback = (data) => {
      callbackRef.current(data);
    };

    socketManager.on('message:read', handler);

    return () => {
      socketManager.off('message:read', handler);
    };
  }, []);
};

/**
 * Hook to mark messages as read
 */
export const useMarkAsRead = () => {
  const markAsRead = useCallback((payload: MarkReadPayload) => {
    socketManager.markAsRead(payload);
  }, []);

  return { markAsRead };
};

/**
 * Hook to manage typing indicators
 */
export const useTypingIndicator = () => {
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTyping = useCallback((payload: TypingPayload) => {
    socketManager.startTyping(payload);

    // Auto-stop typing after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketManager.stopTyping(payload);
    }, 3000);
  }, []);

  const stopTyping = useCallback((payload: TypingPayload) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    socketManager.stopTyping(payload);
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return { startTyping, stopTyping };
};

/**
 * Hook to listen for typing indicators
 */
export const useTypingListener = (
  onTypingStart: TypingCallback,
  onTypingStop: TypingCallback
) => {
  const startCallbackRef = useRef(onTypingStart);
  const stopCallbackRef = useRef(onTypingStop);

  startCallbackRef.current = onTypingStart;
  stopCallbackRef.current = onTypingStop;

  useEffect(() => {
    const handleStart: TypingCallback = (data) => {
      startCallbackRef.current(data);
    };

    const handleStop: TypingCallback = (data) => {
      stopCallbackRef.current(data);
    };

    socketManager.on('typing:start', handleStart);
    socketManager.on('typing:stop', handleStop);

    return () => {
      socketManager.off('typing:start', handleStart);
      socketManager.off('typing:stop', handleStop);
    };
  }, []);
};

/**
 * Hook to manage group rooms
 */
export const useGroupRoom = (groupId: string | null) => {
  useEffect(() => {
    if (!groupId) return;

    // Join group room
    socketManager.joinGroup(groupId);

    // Leave group room on cleanup
    return () => {
      socketManager.leaveGroup(groupId);
    };
  }, [groupId]);
};

/**
 * Hook to manage presence
 */
export const usePresence = () => {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    // Subscribe to presence updates
    socketManager.subscribeToPresence();

    const handlePresenceUpdate: PresenceUpdateCallback = ({ userId, status }) => {
      setOnlineUsers((prev) => {
        if (status === 'online') {
          return prev.includes(userId) ? prev : [...prev, userId];
        } else {
          return prev.filter((id) => id !== userId);
        }
      });
    };

    const handlePresenceState: PresenceStateCallback = ({ onlineUserIds }) => {
      setOnlineUsers(onlineUserIds);
    };

    socketManager.on('presence:update', handlePresenceUpdate);
    socketManager.on('presence:state', handlePresenceState);

    return () => {
      socketManager.off('presence:update', handlePresenceUpdate);
      socketManager.off('presence:state', handlePresenceState);
    };
  }, []);

  const isUserOnline = useCallback(
    (userId: string) => {
      return onlineUsers.includes(userId);
    },
    [onlineUsers]
  );

  return { onlineUsers, isUserOnline };
};

/**
 * Combined hook for chat screen
 */
export const useChatSocket = (
  chatId: string,
  isGroup: boolean,
  currentUserId: string
) => {
  const [messages, setMessages] = useState<SocketMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Join group room if it's a group chat
  useGroupRoom(isGroup ? chatId : null);

  // Listen for new messages
  useMessageListener(
    useCallback(
      ({ message, tempId }) => {
        setMessages((prev) => {
          // Replace temp message or add new
          if (tempId) {
            return prev.map((m) =>
              (m as any).tempId === tempId ? message : m
            );
          }
          return [...prev, message];
        });
      },
      []
    )
  );

  // Listen for message delivered
  useMessageDeliveredListener(
    useCallback(({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, status: 'delivered' } : m
        ) as any
      );
    }, [])
  );

  // Listen for message read
  useMessageReadListener(
    useCallback(({ messageId, readerId }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId) {
            return {
              ...m,
              readBy: [...((m as any).readBy || []), readerId],
            } as any;
          }
          return m;
        })
      );
    }, [])
  );

  // Listen for typing indicators
  useTypingListener(
    useCallback(
      ({ userId }) => {
        if (userId !== currentUserId) {
          setTypingUsers((prev) => new Set([...prev, userId]));
        }
      },
      [currentUserId]
    ),
    useCallback(
      ({ userId }) => {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      },
      []
    )
  );

  // Send message
  const { sendMessage } = useSendMessage();

  // Mark as read
  const { markAsRead } = useMarkAsRead();

  // Typing indicator
  const { startTyping, stopTyping } = useTypingIndicator();

  return {
    messages,
    setMessages,
    typingUsers,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
  };
};
