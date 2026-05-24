/**
 * Central export for all TypeScript types
 */

// User types
export * from './user.types';

// Tontine types
export * from './tontine.types';

// Payment types
export * from './payment.types';

// Chat types
export * from './chat.types';

// Vote types
export * from './vote.types';

// Notification types
export * from './notification.types';

// Database types (Supabase)
export type {Database} from './database.types';

// Common/Shared types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  street?: string;
  city: string;
  region: string;
  country: string;
  postalCode?: string;
}
