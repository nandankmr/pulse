// src/types/message.ts

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  isSent: boolean;
  attachments?: Attachment[];
  replyTo?: string; // Message ID being replied to
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
