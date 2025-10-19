// src/types/message.ts

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

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string | null;
  timestamp: string;
  isRead: boolean;
  isSent: boolean;
  type?: MessageType;
  attachments?: Attachment[];
  replyTo?: string | null; // Message ID being replied to
  editedAt?: string | null; // Timestamp when message was edited
  deletedAt?: string | null; // Timestamp when message was deleted
  deliveredTo?: string[];
  readBy?: string[];
  participantIds?: string[];
  systemType?: SystemMessageType | null;
  metadata?: Record<string, unknown> | null;
  actorId?: string | null;
  targetUserId?: string | null;
}

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file' | 'location';
  url: string;
  name?: string;
  size?: number;
  thumbnail?: string;
  duration?: number; // For audio/video
  latitude?: number; // For location
  longitude?: number; // For location
}

export interface TypingIndicator {
  chatId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface MessageGroup {
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  messages: Message[];
  timestamp: string;
}
