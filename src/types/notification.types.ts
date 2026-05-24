/**
 * Notification Types
 */

export enum NotificationType {
  PAYMENT_DUE = 'PaymentDue',
  PAYMENT_SUCCESS = 'PaymentSuccess',
  PAYMENT_LATE = 'PaymentLate',
  DISTRIBUTION_UPCOMING = 'DistributionUpcoming',
  DISTRIBUTION_RECEIVED = 'DistributionReceived',
  JOIN_REQUEST = 'JoinRequest',
  JOIN_APPROVED = 'JoinApproved',
  JOIN_REJECTED = 'JoinRejected',
  TONTINE_COMPLETED = 'TontineCompleted',
  TONTINE_STARTED = 'TontineStarted',
  MESSAGE = 'Message',
  VOTE_CREATED = 'VoteCreated',
  VOTE_CLOSED = 'VoteClosed',
  MEMBER_JOINED = 'MemberJoined',
  MEMBER_LEFT = 'MemberLeft',
  REPUTATION_CHANGE = 'ReputationChange',
  SYSTEM = 'System',
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  relatedId?: string; // ID of tontine, contribution, etc.
  relatedData?: Record<string, any>;
  isRead: boolean;
  sentAt: string;
  readAt?: string;
  actionUrl?: string; // Deep link to specific screen
}

export interface PushNotificationData {
  title: string;
  body: string;
  type: NotificationType;
  relatedId?: string;
  data?: Record<string, any>;
}

export interface NotificationSettings {
  userId: string;
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  notificationPreferences: {
    [key in NotificationType]: {
      push: boolean;
      sms: boolean;
      email: boolean;
    };
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
  };
}
