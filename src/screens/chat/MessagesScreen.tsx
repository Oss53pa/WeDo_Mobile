/**
 * Messages Screen
 * List of conversations with tontine groups — "Kente Vibrant" restyle.
 */

import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Animated, {FadeInDown} from 'react-native-reanimated';
import tontineApi from '@services/api/tontine.api';
import {LoadingSpinner} from '@components/common';
import {
  useTheme,
  useThemedStyles,
  typography,
  spacing,
  borderRadius,
  type ThemedTokens,
} from '@theme';
import {
  ScreenHeader,
  Avatar,
  Badge,
  EmptyState,
  PressableScale,
} from '@components/common';
import {SearchIcon, CloseIcon} from '@components/icons';
import {TAB_BAR_SPACE} from '@components/navigation/CustomTabBar';

interface Conversation {
  id: string;
  tontineId: string;
  tontineName: string;
  tontineImage?: string;
  lastMessage: string;
  lastMessageTime: Date;
  lastMessageSender: string;
  unreadCount: number;
  memberCount: number;
  isActive: boolean;
}

const MessagesScreen: React.FC = () => {
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const navigation = useNavigation<any>();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const rows = await tontineApi.getConversations();
      setConversations(
        rows.map((c, i) => ({
          id: c.tontineId || String(i),
          tontineId: c.tontineId,
          tontineName: c.tontineName,
          tontineImage: c.photoUrl,
          lastMessage: c.lastMessage || 'Démarrez la conversation',
          lastMessageTime: c.lastMessageTime ? new Date(c.lastMessageTime) : new Date(),
          lastMessageSender: c.lastMessageSender || '',
          unreadCount: 0,
          memberCount: c.memberCount,
          isActive: c.status === 'Active',
        })),
      );
    } catch {
      // empty state covers failure
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const filteredConversations = conversations.filter(conv =>
    conv.tontineName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    if (days === 1) return 'Hier';
    if (days < 7) return `${days}j`;
    return date.toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'});
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderConversation = ({
    item,
    index,
  }: {
    item: Conversation;
    index: number;
  }) => {
    const unread = item.unreadCount > 0;

    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).springify()}>
        <PressableScale
          style={s.conversationItem}
          scaleTo={0.98}
          onPress={() =>
            navigation.navigate('Chat', {
              tontineId: item.tontineId,
              tontineName: item.tontineName,
            })
          }>

          <Avatar
            name={item.tontineName}
            imageUrl={item.tontineImage}
            size="lg"
            ring={unread}
            gradient="kente"
            showStatus={!unread && item.isActive}
            status="online"
          />

          <View style={s.conversationContent}>
            <View style={s.conversationHeader}>
              <Text style={s.tontineName} numberOfLines={1}>
                {item.tontineName}
              </Text>
              <Text
                style={[s.timeText, unread && {color: colors.brand.terracotta}]}>
                {formatTime(item.lastMessageTime)}
              </Text>
            </View>

            <View style={s.conversationFooter}>
              <Text
                style={[s.lastMessage, unread && s.lastMessageUnread]}
                numberOfLines={1}>
                <Text style={s.senderName}>{item.lastMessageSender}: </Text>
                {item.lastMessage}
              </Text>

              {unread && (
                <Badge
                  variant="count"
                  label={item.unreadCount > 99 ? '99+' : String(item.unreadCount)}
                  backgroundColor={colors.brand.terracotta}
                  style={s.unreadBadge}
                />
              )}
            </View>

            <Text style={s.memberCount}>{item.memberCount} membres</Text>
          </View>
        </PressableScale>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <EmptyState
      icon="message-text-outline"
      title="Aucune conversation"
      description="Rejoignez une tontine pour commencer a discuter avec les membres."
    />
  );

  const totalUnread = conversations.reduce(
    (sum, conv) => sum + conv.unreadCount,
    0
  );

  if (loading) {
    return (
      <View style={s.container}>
        <ScreenHeader title="Messages" />
        <LoadingSpinner fullScreen text="Chargement des conversations…" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Messages"
        rightNode={
          totalUnread > 0 ? (
            <Badge
              variant="count"
              label={String(totalUnread)}
              backgroundColor={colors.brand.terracotta}
            />
          ) : undefined
        }
      />

      {/* Search Bar */}
      <View style={s.searchContainer}>
        <SearchIcon size={20} color={colors.text.tertiary} />
        <TextInput
          style={s.searchInput}
          placeholder="Rechercher une conversation..."
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <PressableScale onPress={() => setSearchQuery('')}>
            <CloseIcon size={18} color={colors.text.secondary} />
          </PressableScale>
        )}
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={item => item.id}
        renderItem={renderConversation}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.brand.terracotta]}
            tintColor={colors.brand.terracotta}
          />
        }
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
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.sunken,
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    searchInput: {
      flex: 1,
      marginLeft: spacing.sm,
      ...typography.body,
      color: colors.text.primary,
      padding: 0,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: TAB_BAR_SPACE + spacing.lg,
      flexGrow: 1,
    },
    conversationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: borderRadius.xl,
      backgroundColor: colors.surface.default,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      marginBottom: spacing.sm,
      ...shadows.sm,
      shadowColor: colors.shadowColor,
    },
    conversationContent: {
      flex: 1,
      marginLeft: spacing.md,
    },
    conversationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    tontineName: {
      ...typography.bodyMedium,
      fontWeight: '700',
      color: colors.text.primary,
      flex: 1,
      marginRight: spacing.sm,
    },
    timeText: {
      ...typography.small,
      color: colors.text.tertiary,
    },
    conversationFooter: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    lastMessage: {
      ...typography.caption,
      color: colors.text.secondary,
      flex: 1,
    },
    lastMessageUnread: {
      color: colors.text.primary,
      fontWeight: '600',
    },
    senderName: {
      fontWeight: '700',
      color: colors.text.secondary,
    },
    unreadBadge: {
      marginLeft: spacing.sm,
    },
    memberCount: {
      ...typography.small,
      color: colors.text.tertiary,
      marginTop: 4,
    },
  });

export default MessagesScreen;
