/**
 * Chat and Messaging Types
 */

export enum MessageType {
  TEXT = 'Text',
  IMAGE = 'Image',
  DOCUMENT = 'Document',
  SYSTEM = 'System', // Automated messages (payment, distribution, etc.)
}

export interface Message {
  id: string;
  tontineId: string;
  senderId: string;
  sender?: {
    id: string;
    fullName: string;
    profilePhotoUrl?: string;
  };
  content: string;
  messageType: MessageType;
  attachmentUrl?: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt?: string;
  readBy: string[]; // Array of user IDs who have read the message
}

export interface SendMessageData {
  tontineId: string;
  content: string;
  messageType: MessageType;
  attachmentUrl?: string;
}

export interface ChatRoom {
  id: string;
  tontineId: string;
  tontineName: string;
  tontinePhotoUrl?: string;
  lastMessage?: Message;
  unreadCount: number;
  membersCount: number;
  updatedAt: string;
}

export interface TypingIndicator {
  tontineId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}
