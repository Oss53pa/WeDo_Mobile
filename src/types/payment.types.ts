/**
 * Payment and Transaction Types
 */

export enum ContributionStatus {
  PENDING = 'Pending',
  PAID = 'Paid',
  LATE = 'Late',
  FAILED = 'Failed',
}

export enum DistributionStatus {
  SCHEDULED = 'Scheduled',
  PROCESSING = 'Processing',
  COMPLETED = 'Completed',
  FAILED = 'Failed',
}

export enum TransactionType {
  CONTRIBUTION = 'Contribution',
  DISTRIBUTION = 'Distribution',
  PENALTY = 'Penalty',
  REFUND = 'Refund',
  DEPOSIT = 'Deposit',
}

export interface Contribution {
  id: string;
  tontineId: string;
  memberId: string;
  userId: string;
  amount: number;
  penaltyAmount: number;
  dueDate: string;
  paidDate?: string;
  status: ContributionStatus;
  paymentMethod?: string;
  transactionId?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface Distribution {
  id: string;
  tontineId: string;
  recipientId: string;
  recipient?: {
    id: string;
    fullName: string;
    profilePhotoUrl?: string;
  };
  amount: number;
  scheduledDate: string;
  distributedDate?: string;
  status: DistributionStatus;
  transactionId?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  type: 'mobile_money';
  operator: string;
  accountNumber: string;
  accountName?: string;
  isDefault: boolean;
}

export interface PaymentRequest {
  contributionId: string;
  paymentMethodId: string;
  amount: number;
  pin: string; // App PIN for confirmation
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  contribution: Contribution;
  receiptUrl: string;
  message?: string;
}

export interface AutoPayConfig {
  id: string;
  userId: string;
  tontineId: string;
  paymentMethodId: string;
  isEnabled: boolean;
  daysBefore: number; // Pay X days before due date
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  tontineId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: 'Pending' | 'Completed' | 'Failed';
  description: string;
  referenceId?: string; // contributionId or distributionId
  transactionId?: string; // External transaction ID
  createdAt: string;
}

export interface PaymentReceipt {
  id: string;
  transactionId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  tontineName: string;
  payerName: string;
  paymentMethod: string;
  date: string;
  receiptNumber: string;
  status: string;
}

export interface MobileMoneyPaymentData {
  operator: string;
  phoneNumber: string;
  amount: number;
  currency: string;
  reference: string;
  description: string;
  callbackUrl?: string;
}

export interface MobileMoneyWebhook {
  event: 'payment.success' | 'payment.failed' | 'payment.pending';
  timestamp: string;
  transactionId: string;
  operator: string;
  amount: number;
  currency: string;
  senderPhone: string;
  receiverPhone: string;
  reference: string;
  status: string;
  signature: string;
}
