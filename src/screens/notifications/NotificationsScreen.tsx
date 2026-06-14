/**
 * NotificationsScreen
 * Display notifications with filtering and mark as read — "Kente Vibrant" restyle.
 */

import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, FlatList, RefreshControl} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {
  LoadingSpinner,
  EmptyState,
  Badge,
  SegmentedControl,
  ScreenHeader,
  PressableScale,
} from '@components/common';
import {
  useTheme,
  useThemedStyles,
  typography,
  spacing,
  borderRadius,
  type ThemedTokens,
} from '@theme';
import {
  CashIcon,
  BellIcon,
  InfoIcon,
  UsersIcon,
  MessageIcon,
  StarIcon,
  CheckIcon,
  ChevronRightIcon,
} from '@components/icons';
import {TAB_BAR_SPACE} from '@components/navigation/CustomTabBar';
import {RootStackParamList} from '@navigation/types';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '@store/store';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} from '@store/slices/notification.slice';
import {formatRelativeTime} from '@utils/formatting';
import {Notification, NotificationType} from '@types';

type NotificationsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Notifications'
>;

interface Props {
  navigation: NotificationsScreenNavigationProp;
}

type FilterType = 'all' | 'unread';

type IconComponent = React.FC<{size?: number; color?: string}>;

const NotificationsScreen: React.FC<Props> = ({navigation}) => {
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);

  const dispatch = useDispatch<AppDispatch>();
  const {notifications, unreadCount, isLoading} = useSelector(
    (state: RootState) => state.notification
  );

  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      await dispatch(fetchNotifications({})).unwrap();
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await dispatch(markAsRead(notificationId)).unwrap();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllAsRead()).unwrap();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case NotificationType.JOIN_REQUEST:
      case NotificationType.JOIN_APPROVED:
      case NotificationType.JOIN_REJECTED:
      case NotificationType.MEMBER_JOINED:
      case NotificationType.MEMBER_LEFT:
      case NotificationType.TONTINE_STARTED:
      case NotificationType.TONTINE_COMPLETED:
      case NotificationType.PAYMENT_DUE:
      case NotificationType.PAYMENT_SUCCESS:
      case NotificationType.PAYMENT_LATE:
      case NotificationType.DISTRIBUTION_UPCOMING:
      case NotificationType.DISTRIBUTION_RECEIVED:
        if (notification.relatedId) {
          navigation.navigate('TontineDetail', {tontineId: notification.relatedId});
        }
        break;
      case NotificationType.VOTE_CREATED:
      case NotificationType.VOTE_CLOSED:
        // L'écran de vote dédié n'existe pas encore — ouvrir la tontine concernée
        // évite un crash (la route VoteDetail n'est pas enregistrée).
        if (notification.relatedId) {
          navigation.navigate('TontineDetail', {tontineId: notification.relatedId});
        }
        break;
      case NotificationType.MESSAGE:
        if (notification.relatedId) {
          navigation.navigate('Chat', {tontineId: notification.relatedId});
        }
        break;
      default:
        break;
    }
  };

  // Maps each notification type to a tinted icon chip (brand color + soft bg)
  const getNotificationVisual = (
    type: NotificationType
  ): {tone: string; toneSoft: string; Icon: IconComponent} => {
    switch (type) {
      case NotificationType.PAYMENT_SUCCESS:
      case NotificationType.DISTRIBUTION_RECEIVED:
      case NotificationType.MEMBER_JOINED:
      case NotificationType.JOIN_APPROVED:
        return {
          tone: colors.brand.emerald,
          toneSoft: colors.brand.emeraldSoft,
          Icon: CashIcon,
        };
      case NotificationType.PAYMENT_DUE:
      case NotificationType.DISTRIBUTION_UPCOMING:
        return {
          tone: colors.brand.gold,
          toneSoft: colors.brand.goldSoft,
          Icon: BellIcon,
        };
      case NotificationType.PAYMENT_LATE:
      case NotificationType.MEMBER_LEFT:
      case NotificationType.JOIN_REJECTED:
        return {
          tone: colors.brand.crimson,
          toneSoft: colors.brand.crimsonSoft,
          Icon: InfoIcon,
        };
      case NotificationType.JOIN_REQUEST:
        return {
          tone: colors.brand.terracotta,
          toneSoft: colors.brand.terracottaSoft,
          Icon: UsersIcon,
        };
      case NotificationType.VOTE_CREATED:
      case NotificationType.VOTE_CLOSED:
        return {
          tone: colors.brand.indigo,
          toneSoft: colors.brand.indigoSoft,
          Icon: StarIcon,
        };
      case NotificationType.MESSAGE:
        return {
          tone: colors.brand.indigo,
          toneSoft: colors.brand.indigoSoft,
          Icon: MessageIcon,
        };
      case NotificationType.TONTINE_STARTED:
      case NotificationType.TONTINE_COMPLETED:
      case NotificationType.REPUTATION_CHANGE:
        return {
          tone: colors.brand.terracotta,
          toneSoft: colors.brand.terracottaSoft,
          Icon: InfoIcon,
        };
      case NotificationType.SYSTEM:
      default:
        return {
          tone: colors.text.secondary,
          toneSoft: colors.surface.sunken,
          Icon: BellIcon,
        };
    }
  };

  const getFilteredNotifications = (): Notification[] => {
    if (filter === 'unread') {
      return notifications.filter(n => !n.isRead);
    }
    return notifications;
  };

  const filteredNotifications = getFilteredNotifications();

  const renderHeader = () => (
    <View style={s.headerBlock}>
      <SegmentedControl
        options={[
          {label: `Toutes (${notifications.length})`, value: 'all'},
          {
            label: unreadCount > 0 ? `Non lues (${unreadCount})` : 'Non lues',
            value: 'unread',
          },
        ]}
        value={filter}
        onChange={setFilter}
      />

      {unreadCount > 0 && (
        <PressableScale style={s.markAllButton} onPress={handleMarkAllAsRead}>
          <CheckIcon size={16} color={colors.brand.terracotta} />
          <Text style={s.markAllText}>Tout marquer comme lu</Text>
        </PressableScale>
      )}
    </View>
  );

  const renderNotification = ({
    item,
    index,
  }: {
    item: Notification;
    index: number;
  }) => {
    const visual = getNotificationVisual(item.type);
    const NotifIcon = visual.Icon;
    const unread = !item.isRead;

    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).springify()}>
        <PressableScale
          style={[
            s.notificationCard,
            {
              backgroundColor: unread
                ? colors.brand.terracottaSoft
                : colors.surface.default,
            },
          ]}
          scaleTo={0.98}
          onPress={() => handleNotificationPress(item)}>
          {unread && <View style={s.unreadAccent} />}

          <View style={[s.notificationIcon, {backgroundColor: visual.toneSoft}]}>
            <NotifIcon size={22} color={visual.tone} />
          </View>

          <View style={s.notificationContent}>
            <View style={s.notificationHeader}>
              <Text style={s.notificationTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {unread && <View style={s.unreadDot} />}
            </View>

            <Text style={s.notificationMessage} numberOfLines={2}>
              {item.body}
            </Text>

            <Text style={s.notificationTime}>
              {formatRelativeTime(item.sentAt)}
            </Text>
          </View>

          <ChevronRightIcon size={18} color={colors.text.tertiary} />
        </PressableScale>
      </Animated.View>
    );
  };

  const renderEmptyState = () => {
    if (filter === 'unread') {
      return (
        <EmptyState
          icon="check-all"
          title="Aucune notification non lue"
          description="Vous avez lu toutes vos notifications. Bon travail !"
        />
      );
    }

    return (
      <EmptyState
        icon="bell-outline"
        title="Aucune notification"
        description="Vous n'avez pas encore de notifications. Elles apparaitront ici."
      />
    );
  };

  if (isLoading && notifications.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Notifications"
        rightNode={
          unreadCount > 0 ? (
            <Badge variant="count" label={String(unreadCount)} />
          ) : undefined
        }
      />

      <FlatList
        data={filteredNotifications}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.brand.terracotta]}
            tintColor={colors.brand.terracotta}
          />
        }
        renderItem={renderNotification}
      />
    </View>
  );
};

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: TAB_BAR_SPACE + spacing.lg,
      flexGrow: 1,
    },
    headerBlock: {
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    markAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-end',
      paddingTop: spacing.md,
      gap: spacing.xs,
    },
    markAllText: {
      ...typography.captionMedium,
      color: colors.brand.terracotta,
      fontWeight: '600',
    },
    notificationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      marginBottom: spacing.sm,
      overflow: 'hidden',
      ...shadows.sm,
      shadowColor: colors.shadowColor,
    },
    unreadAccent: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: colors.brand.terracotta,
    },
    notificationIcon: {
      width: 46,
      height: 46,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    notificationContent: {
      flex: 1,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    notificationTitle: {
      ...typography.bodyMedium,
      fontWeight: '700',
      color: colors.text.primary,
      flex: 1,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.brand.terracotta,
      marginLeft: spacing.xs,
    },
    notificationMessage: {
      ...typography.caption,
      color: colors.text.secondary,
      marginBottom: 4,
    },
    notificationTime: {
      ...typography.small,
      color: colors.text.tertiary,
    },
  });

export default NotificationsScreen;
