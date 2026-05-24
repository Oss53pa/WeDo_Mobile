/**
 * Notification API Service
 * Handles all notification-related queries via Supabase
 */

import {supabase} from '@services/supabase';
import {IS_SUPABASE_CONFIGURED} from '@config/appConfig';
import {demoNotifications} from '@services/demo/demoData';
import {Notification, NotificationSettings} from '@types';

/**
 * Map notification row to Notification type
 */
const mapNotification = (row: any): Notification => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  body: row.body,
  type: row.type as any,
  relatedId: row.related_id || undefined,
  relatedData: row.related_data || undefined,
  isRead: row.is_read,
  sentAt: row.sent_at,
  readAt: row.read_at || undefined,
  actionUrl: row.action_url || undefined,
});

/**
 * Get user's notifications
 */
export const getNotifications = async (
  page: number = 1,
  limit: number = 20,
  unreadOnly: boolean = false,
): Promise<{
  data: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}> => {
  if (!IS_SUPABASE_CONFIGURED) {
    const list = unreadOnly ? demoNotifications.filter(n => !n.isRead) : demoNotifications;
    return {
      data: list,
      total: list.length,
      unreadCount: demoNotifications.filter(n => !n.isRead).length,
      page,
      limit,
    };
  }
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('notifications')
    .select('*', {count: 'exact'})
    .eq('user_id', user.id)
    .order('sent_at', {ascending: false});

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const {data, error, count} = await query.range(from, to);
  if (error) throw new Error(error.message);

  // Get unread count
  const {count: unreadCount} = await supabase
    .from('notifications')
    .select('*', {count: 'exact', head: true})
    .eq('user_id', user.id)
    .eq('is_read', false);

  return {
    data: (data || []).map(mapNotification),
    total: count || 0,
    unreadCount: unreadCount || 0,
    page,
    limit,
  };
};

/**
 * Get notification by ID
 */
export const getNotification = async (notificationId: string): Promise<Notification> => {
  const {data, error} = await supabase
    .from('notifications')
    .select('*')
    .eq('id', notificationId)
    .single();

  if (error) throw new Error(error.message);
  return mapNotification(data);
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId: string): Promise<{success: boolean}> => {
  if (!IS_SUPABASE_CONFIGURED) return {success: true};
  const {error} = await supabase
    .from('notifications')
    .update({is_read: true, read_at: new Date().toISOString()})
    .eq('id', notificationId);

  if (error) throw new Error(error.message);
  return {success: true};
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<{success: boolean; updatedCount: number}> => {
  if (!IS_SUPABASE_CONFIGURED) {
    return {success: true, updatedCount: demoNotifications.filter(n => !n.isRead).length};
  }
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const {data, error} = await supabase
    .from('notifications')
    .update({is_read: true, read_at: new Date().toISOString()})
    .eq('user_id', user.id)
    .eq('is_read', false)
    .select();

  if (error) throw new Error(error.message);
  return {success: true, updatedCount: data?.length || 0};
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId: string): Promise<{success: boolean}> => {
  const {error} = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw new Error(error.message);
  return {success: true};
};

/**
 * Delete all read notifications
 */
export const deleteAllRead = async (): Promise<{success: boolean; deletedCount: number}> => {
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const {data, error} = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', user.id)
    .eq('is_read', true)
    .select();

  if (error) throw new Error(error.message);
  return {success: true, deletedCount: data?.length || 0};
};

/**
 * Get unread count
 */
export const getUnreadCount = async (): Promise<{count: number}> => {
  if (!IS_SUPABASE_CONFIGURED) {
    return {count: demoNotifications.filter(n => !n.isRead).length};
  }
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const {count, error} = await supabase
    .from('notifications')
    .select('*', {count: 'exact', head: true})
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) throw new Error(error.message);
  return {count: count || 0};
};

/**
 * Get notification settings
 */
export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const {data, error} = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) throw new Error(error.message);

  return {
    userId: data.user_id,
    pushEnabled: data.push_enabled,
    smsEnabled: data.sms_enabled,
    emailEnabled: data.email_enabled,
    notificationPreferences: data.notification_preferences as any,
    quietHours: data.quiet_hours as any,
  };
};

/**
 * Update notification settings
 */
export const updateNotificationSettings = async (
  settings: Partial<NotificationSettings>,
): Promise<NotificationSettings> => {
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const updateData: any = {};
  if (settings.pushEnabled !== undefined) updateData.push_enabled = settings.pushEnabled;
  if (settings.smsEnabled !== undefined) updateData.sms_enabled = settings.smsEnabled;
  if (settings.emailEnabled !== undefined) updateData.email_enabled = settings.emailEnabled;
  if (settings.notificationPreferences !== undefined) {
    updateData.notification_preferences = settings.notificationPreferences;
  }
  if (settings.quietHours !== undefined) updateData.quiet_hours = settings.quietHours;

  const {data, error} = await supabase
    .from('notification_settings')
    .update(updateData)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    userId: data.user_id,
    pushEnabled: data.push_enabled,
    smsEnabled: data.sms_enabled,
    emailEnabled: data.email_enabled,
    notificationPreferences: data.notification_preferences as any,
    quietHours: data.quiet_hours as any,
  };
};

/**
 * Register device for push notifications
 */
export const registerDevice = async (data: {
  deviceToken: string;
  platform: 'ios' | 'android';
  deviceId: string;
}): Promise<{success: boolean}> => {
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const {error} = await supabase
    .from('device_tokens')
    .upsert({
      user_id: user.id,
      device_token: data.deviceToken,
      platform: data.platform,
      device_id: data.deviceId,
    }, {onConflict: 'user_id,device_id'});

  if (error) throw new Error(error.message);
  return {success: true};
};

/**
 * Unregister device from push notifications
 */
export const unregisterDevice = async (deviceId: string): Promise<{success: boolean}> => {
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const {error} = await supabase
    .from('device_tokens')
    .delete()
    .eq('user_id', user.id)
    .eq('device_id', deviceId);

  if (error) throw new Error(error.message);
  return {success: true};
};

export default {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  getUnreadCount,
  getNotificationSettings,
  updateNotificationSettings,
  registerDevice,
  unregisterDevice,
};
