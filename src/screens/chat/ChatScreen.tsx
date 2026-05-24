/**
 * Chat Screen
 * Individual tontine group conversation with Supabase Realtime — "Kente Vibrant".
 */

import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import {
  ScreenHeader,
  Avatar,
  GradientView,
  PressableScale,
} from '@components/common';
import {SendIcon, InfoIcon, CheckIcon, MoreVerticalIcon} from '@components/icons';
import {
  useTheme,
  useThemedStyles,
  typography,
  spacing,
  borderRadius,
  type ThemedTokens,
} from '@theme';
import {TAB_BAR_SPACE} from '@components/navigation/CustomTabBar';
import {RootState} from '@store/store';
import {supabase} from '@services/supabase';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'payment';
  isOwn: boolean;
}

interface ChatScreenProps {
  route?: {
    params?: {
      tontineId: string;
      tontineName: string;
    };
  };
  navigation?: any;
}

const ChatScreen: React.FC<ChatScreenProps> = ({route, navigation}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const user = useSelector((state: RootState) => state.auth.user);

  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const tontineId = route?.params?.tontineId;
  const tontineName = route?.params?.tontineName || 'Chat';

  // Load initial messages
  useEffect(() => {
    if (!tontineId) return;

    const loadMessages = async () => {
      const {data, error} = await supabase
        .from('messages')
        .select('*, profiles:sender_id(id, full_name, profile_photo_url)')
        .eq('tontine_id', tontineId)
        .order('created_at', {ascending: true})
        .limit(100);

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      const mapped: ChatMessage[] = (data || []).map((msg: any) => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderName: msg.profiles?.full_name || 'Inconnu',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        type: msg.message_type === 'System' ? 'system' : 'text',
        isOwn: msg.sender_id === user?.id,
      }));

      setMessages(mapped);
    };

    loadMessages();
  }, [tontineId, user?.id]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!tontineId) return;

    const channel = supabase
      .channel(`chat:${tontineId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'wedo',
          table: 'messages',
          filter: `tontine_id=eq.${tontineId}`,
        },
        async (payload) => {
          const msg = payload.new as any;

          // Don't duplicate own messages (already added optimistically)
          if (msg.sender_id === user?.id) return;

          // Fetch sender profile
          const {data: profile} = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', msg.sender_id)
            .single();

          const newMessage: ChatMessage = {
            id: msg.id,
            senderId: msg.sender_id,
            senderName: profile?.full_name || 'Inconnu',
            content: msg.content,
            timestamp: new Date(msg.created_at),
            type: msg.message_type === 'System' ? 'system' : 'text',
            isOwn: false,
          };

          setMessages(prev => [...prev, newMessage]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tontineId, user?.id]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false),
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateSeparator = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
  };

  const sendMessage = useCallback(async () => {
    if (inputText.trim() === '' || !tontineId || !user) return;

    const messageContent = inputText.trim();
    setInputText('');

    // Optimistically add the message
    const tempId = Date.now().toString();
    const optimisticMessage: ChatMessage = {
      id: tempId,
      senderId: user.id,
      senderName: 'Moi',
      content: messageContent,
      timestamp: new Date(),
      type: 'text',
      isOwn: true,
    };

    setMessages(prev => [...prev, optimisticMessage]);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({animated: true});
    }, 100);

    // Insert into Supabase
    const {data, error} = await supabase
      .from('messages')
      .insert({
        tontine_id: tontineId,
        sender_id: user.id,
        content: messageContent,
        message_type: 'Text',
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      return;
    }

    // Replace optimistic message with real one
    setMessages(prev =>
      prev.map(m => (m.id === tempId ? {...m, id: data.id} : m)),
    );
  }, [inputText, tontineId, user]);

  const renderMessage = ({item, index}: {item: ChatMessage; index: number}) => {
    const showDateSeparator =
      index === 0 ||
      new Date(messages[index - 1].timestamp).toDateString() !==
        new Date(item.timestamp).toDateString();

    return (
      <View>
        {showDateSeparator && (
          <View style={s.dateSeparator}>
            <Text style={s.dateSeparatorText}>
              {formatDateSeparator(item.timestamp)}
            </Text>
          </View>
        )}

        {item.type === 'system' && (
          <View style={s.systemMessageContainer}>
            <InfoIcon size={15} color={colors.text.secondary} />
            <Text style={s.systemMessageText}>{item.content}</Text>
          </View>
        )}

        {item.type === 'payment' && (
          <View style={s.paymentMessageContainer}>
            <CheckIcon size={15} color={colors.success} />
            <Text style={s.paymentMessageText}>{item.content}</Text>
          </View>
        )}

        {item.type === 'text' && (
          <View
            style={[
              s.bubbleRow,
              item.isOwn ? s.bubbleRowOwn : s.bubbleRowOther,
            ]}>
            {item.isOwn ? (
              <GradientView name="sunset" style={[s.messageBubble, s.ownBubble]}>
                <Text style={[s.messageText, s.ownMessageText]}>
                  {item.content}
                </Text>
                <Text style={[s.messageTime, s.ownMessageTime]}>
                  {formatTime(item.timestamp)}
                </Text>
              </GradientView>
            ) : (
              <View style={[s.messageBubble, s.otherBubble]}>
                <Text style={s.senderName}>{item.senderName}</Text>
                <Text style={s.messageText}>{item.content}</Text>
                <Text style={s.messageTime}>{formatTime(item.timestamp)}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const canSend = inputText.trim().length > 0;
  const composerBottom = isKeyboardVisible
    ? spacing.sm
    : Math.max(insets.bottom, spacing.sm);

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}>
      {/* Header */}
      <ScreenHeader
        title={tontineName}
        subtitle="Discussion de groupe"
        onBack={() => navigation?.goBack()}
        rightNode={
          <PressableScale style={s.menuButton} scaleTo={0.9} onPress={() => {}}>
            <MoreVerticalIcon size={22} color={colors.text.primary} />
          </PressableScale>
        }
      />

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={s.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({animated: false})
        }
      />

      {/* Input Bar */}
      <View style={[s.inputContainer, {paddingBottom: composerBottom}]}>
        <View style={s.inputWrapper}>
          <TextInput
            style={s.input}
            placeholder="Ecrire un message..."
            placeholderTextColor={colors.text.hint}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
        </View>

        <PressableScale
          scaleTo={0.9}
          onPress={sendMessage}
          disabled={!canSend}
          style={canSend ? s.sendActiveShadow : undefined}>
          {canSend ? (
            <GradientView name="sunset" style={s.sendButton}>
              <SendIcon size={20} color="#FFFFFF" />
            </GradientView>
          ) : (
            <View style={[s.sendButton, s.sendButtonInactive]}>
              <SendIcon size={20} color={colors.text.hint} />
            </View>
          )}
        </PressableScale>
      </View>
    </KeyboardAvoidingView>
  );
};

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },
    menuButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.sunken,
    },
    messagesList: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
    },
    dateSeparator: {
      alignItems: 'center',
      marginVertical: spacing.md,
    },
    dateSeparatorText: {
      ...typography.small,
      fontWeight: '600',
      color: colors.text.secondary,
      backgroundColor: colors.surface.sunken,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      overflow: 'hidden',
    },
    systemMessageContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      backgroundColor: colors.surface.sunken,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.full,
      marginVertical: spacing.xs,
      gap: spacing.xs,
    },
    systemMessageText: {
      ...typography.caption,
      color: colors.text.secondary,
      fontStyle: 'italic',
    },
    paymentMessageContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      backgroundColor: colors.status.successBg,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.full,
      marginVertical: spacing.xs,
      gap: spacing.xs,
    },
    paymentMessageText: {
      ...typography.caption,
      color: colors.success,
      fontWeight: '600',
    },
    bubbleRow: {
      flexDirection: 'row',
      marginVertical: spacing.xs,
    },
    bubbleRowOwn: {
      justifyContent: 'flex-end',
    },
    bubbleRowOther: {
      justifyContent: 'flex-start',
    },
    messageBubble: {
      maxWidth: '82%',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.xl,
    },
    ownBubble: {
      borderBottomRightRadius: borderRadius.xs,
      ...shadows.sm,
      shadowColor: colors.shadowColor,
    },
    otherBubble: {
      backgroundColor: colors.surface.sunken,
      borderBottomLeftRadius: borderRadius.xs,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border.subtle,
    },
    senderName: {
      ...typography.small,
      fontWeight: '700',
      color: colors.brand.terracotta,
      marginBottom: 3,
    },
    messageText: {
      ...typography.body,
      color: colors.text.primary,
    },
    ownMessageText: {
      color: '#FFFFFF',
    },
    messageTime: {
      ...typography.small,
      fontSize: 10,
      color: colors.text.tertiary,
      alignSelf: 'flex-end',
      marginTop: 3,
    },
    ownMessageTime: {
      color: 'rgba(255,255,255,0.8)',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      gap: spacing.sm,
      backgroundColor: colors.surface.default,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border.subtle,
    },
    inputWrapper: {
      flex: 1,
      backgroundColor: colors.surface.sunken,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      maxHeight: 120,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border.subtle,
    },
    input: {
      ...typography.body,
      color: colors.text.primary,
      maxHeight: 100,
      padding: 0,
    },
    sendActiveShadow: {
      borderRadius: 24,
    },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonInactive: {
      backgroundColor: colors.surface.sunken,
    },
  });

export default ChatScreen;
