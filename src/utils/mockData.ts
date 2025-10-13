// src/utils/mockData.ts

import { Chat } from '../components/ChatListItem';

/**
 * Mock chat data for development and testing
 */
export const mockChats: Chat[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    avatar: undefined,
    lastMessage: 'Hey! How are you doing?',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
    unreadCount: 3,
    isGroup: false,
    isOnline: true,
  },
  {
    id: '2',
    name: 'Project Team',
    avatar: undefined,
    lastMessage: 'John: The meeting is scheduled for 3 PM',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
    unreadCount: 12,
    isGroup: true,
    isOnline: false,
  },
  {
    id: '3',
    name: 'Bob Smith',
    avatar: undefined,
    lastMessage: 'Thanks for your help!',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
    unreadCount: 0,
    isGroup: false,
    isOnline: false,
  },
  {
    id: '4',
    name: 'Design Team',
    avatar: undefined,
    lastMessage: 'Sarah: Check out the new mockups',
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), // 5 hours ago
    unreadCount: 5,
    isGroup: true,
    isOnline: false,
  },
  {
    id: '5',
    name: 'Carol Williams',
    avatar: undefined,
    lastMessage: 'See you tomorrow!',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    unreadCount: 0,
    isGroup: false,
    isOnline: true,
  },
  {
    id: '6',
    name: 'Marketing Squad',
    avatar: undefined,
    lastMessage: 'Mike: Campaign results are looking great',
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
    unreadCount: 0,
    isGroup: true,
    isOnline: false,
  },
  {
    id: '7',
    name: 'David Brown',
    avatar: undefined,
    lastMessage: 'Can you review the PR?',
    timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago
    unreadCount: 1,
    isGroup: false,
    isOnline: false,
  },
  {
    id: '8',
    name: 'Engineering Team',
    avatar: undefined,
    lastMessage: 'Lisa: Sprint planning starts at 10 AM',
    timestamp: new Date(Date.now() - 5 * 86400000).toISOString(), // 5 days ago
    unreadCount: 0,
    isGroup: true,
    isOnline: false,
  },
  {
    id: '9',
    name: 'Emma Davis',
    avatar: undefined,
    lastMessage: 'Happy birthday! 🎉',
    timestamp: new Date(Date.now() - 7 * 86400000).toISOString(), // 1 week ago
    unreadCount: 0,
    isGroup: false,
    isOnline: true,
  },
  {
    id: '10',
    name: 'Frank Miller',
    avatar: undefined,
    lastMessage: 'Got it, thanks!',
    timestamp: new Date(Date.now() - 14 * 86400000).toISOString(), // 2 weeks ago
    unreadCount: 0,
    isGroup: false,
    isOnline: false,
  },
];

/**
 * Get mock chats (simulates API call)
 */
export const getMockChats = async (): Promise<Chat[]> => {
  // Simulate network delay
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 800));
  return mockChats;
};

/**
 * Mock messages for a chat
 */
import { Message } from '../types/message';

export const getMockMessages = (chatId: string): Message[] => {
  const currentUserId = 'current-user';
  const otherUserId = 'other-user';

  return [
    {
      id: '1',
      chatId,
      senderId: otherUserId,
      senderName: 'Alice Johnson',
      content: 'Hey! How are you doing?',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      isRead: true,
      isSent: true,
    },
    {
      id: '2',
      chatId,
      senderId: currentUserId,
      senderName: 'You',
      content: "I'm doing great! Thanks for asking. How about you?",
      timestamp: new Date(Date.now() - 3500000).toISOString(),
      isRead: true,
      isSent: true,
    },
    {
      id: '3',
      chatId,
      senderId: otherUserId,
      senderName: 'Alice Johnson',
      content: "Pretty good! Just finished a big project at work.",
      timestamp: new Date(Date.now() - 3400000).toISOString(),
      isRead: true,
      isSent: true,
    },
    {
      id: '4',
      chatId,
      senderId: currentUserId,
      senderName: 'You',
      content: 'Congratulations! That must feel amazing.',
      timestamp: new Date(Date.now() - 3300000).toISOString(),
      isRead: true,
      isSent: true,
    },
    {
      id: '5',
      chatId,
      senderId: otherUserId,
      senderName: 'Alice Johnson',
      content: 'It really does! Want to grab coffee later to celebrate?',
      timestamp: new Date(Date.now() - 3200000).toISOString(),
      isRead: true,
      isSent: true,
    },
    {
      id: '6',
      chatId,
      senderId: currentUserId,
      senderName: 'You',
      content: "Absolutely! What time works for you?",
      timestamp: new Date(Date.now() - 3100000).toISOString(),
      isRead: true,
      isSent: true,
    },
    {
      id: '7',
      chatId,
      senderId: otherUserId,
      senderName: 'Alice Johnson',
      content: 'How about 3 PM at the usual spot?',
      timestamp: new Date(Date.now() - 3000000).toISOString(),
      isRead: true,
      isSent: true,
    },
    {
      id: '8',
      chatId,
      senderId: currentUserId,
      senderName: 'You',
      content: 'Perfect! See you then! 😊',
      timestamp: new Date(Date.now() - 2900000).toISOString(),
      isRead: false,
      isSent: true,
    },
  ];
};

/**
 * Get mock messages with API simulation
 */
export const getMockMessagesAsync = async (chatId: string): Promise<Message[]> => {
  // Simulate network delay
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 600));
  return getMockMessages(chatId);
};
