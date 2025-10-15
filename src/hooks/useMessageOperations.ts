// src/hooks/useMessageOperations.ts

import { useCallback } from 'react';
import { socketManager } from '../utils/socketManager';
import type {
  EditMessagePayload,
  DeleteMessagePayload,
} from '../utils/socketManager';

/**
 * Hook for message operations (edit, delete, bulk read)
 */
export const useMessageOperations = () => {
  /**
   * Edit a message
   */
  const editMessage = useCallback((payload: EditMessagePayload) => {
    socketManager.editMessage(payload);
  }, []);

  /**
   * Delete a message
   */
  const deleteMessage = useCallback((payload: DeleteMessagePayload) => {
    socketManager.deleteMessage(payload);
  }, []);

  /**
   * Mark single message as read
   */
  const markMessageAsRead = useCallback(
    (messageId: string, targetUserId?: string, groupId?: string) => {
      socketManager.markAsRead({
        messageId,
        targetUserId,
        groupId,
      });
    },
    []
  );

  /**
   * Mark multiple messages as read (bulk)
   */
  const markMessagesAsRead = useCallback(
    (
      messageIds: string[],
      targetUserId?: string,
      groupId?: string,
      conversationId?: string
    ) => {
      socketManager.markAsRead({
        messageIds,
        targetUserId,
        groupId,
        conversationId,
      });
    },
    []
  );

  return {
    editMessage,
    deleteMessage,
    markMessageAsRead,
    markMessagesAsRead,
  };
};
