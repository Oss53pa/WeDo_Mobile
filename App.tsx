/**
 * TontineDigital - Main Application Component
 * Entry point with Supabase auth state management
 */

import React, {useEffect} from 'react';
import {StatusBar, View, StyleSheet, Platform} from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  SafeAreaInsetsContext,
} from 'react-native-safe-area-context';

// On web the browser reports no safe-area insets, so screens render under the
// preview notch / behind the floating tab bar. Inject realistic insets on web
// so every screen clears the top and bottom correctly (no-op on device).
const WEB_INSETS = {top: 50, bottom: 24, left: 0, right: 0};
import {Provider, useDispatch, useSelector} from 'react-redux';
import {RootNavigator} from '@navigation';
import {ThemeProvider, useTheme} from '@theme';
import {store, RootState, AppDispatch} from '@store/store';
import {LoadingSpinner, ErrorBoundary, ToastProvider, useToast} from '@components/common';
import {restoreSession, clearSession, setLoading, demoLogin} from '@store/slices/auth.slice';
import {IS_SUPABASE_CONFIGURED} from '@config/appConfig';

// Skip the real OTP flow only when the backend isn't configured (demo/preview).
// The Supabase project is now connected, so the real auth flow is used.
const DEV_SKIP_AUTH = !IS_SUPABASE_CONFIGURED;
import {addNotification} from '@store/slices/notification.slice';
import {supabase} from '@services/supabase';
import type {User} from '@types';

/**
 * AppContent Component
 * Inner component that has access to Redux store
 */
const AppContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {colors, isDark} = useTheme();
  const {isAuthenticated, isRestoring} = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // TEMP dev bypass: enter the app with a demo user and skip Supabase auth
    // entirely (placeholder keys otherwise block on an auth lock).
    if (DEV_SKIP_AUTH) {
      dispatch(demoLogin());
      return;
    }

    dispatch(setLoading(true));

    // Listen for auth state changes
    const {data: {subscription}} = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Fetch profile from profiles table
          const {data: profile} = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const user: User = {
              id: profile.id,
              phoneNumber: profile.phone_number,
              fullName: profile.full_name,
              email: profile.email || undefined,
              profilePhotoUrl: profile.profile_photo_url || undefined,
              reputationScore: profile.reputation_score,
              reputationLevel: profile.reputation_level as any,
              kycLevel: profile.kyc_level as any,
              isVerified: profile.is_verified,
              city: profile.city || undefined,
              region: profile.region || undefined,
              dateOfBirth: profile.date_of_birth || undefined,
              createdAt: profile.created_at,
              updatedAt: profile.updated_at,
            };
            dispatch(restoreSession({user}));
          } else {
            dispatch(setLoading(false));
          }
        } else if (event === 'SIGNED_OUT') {
          dispatch(clearSession());
        } else if (event === 'INITIAL_SESSION') {
          if (!session) {
            dispatch(setLoading(false));
          }
          // If session exists, SIGNED_IN will fire
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);

  // Subscribe to realtime notifications when authenticated
  useEffect(() => {
    if (DEV_SKIP_AUTH) return;
    if (!isAuthenticated) return;

    const setupRealtimeNotifications = async () => {
      const {data: {user}} = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('notifications-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'wedo',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const row = payload.new as any;
            dispatch(addNotification({
              id: row.id,
              userId: row.user_id,
              title: row.title,
              body: row.body,
              type: row.type,
              relatedId: row.related_id,
              relatedData: row.related_data,
              isRead: row.is_read,
              sentAt: row.sent_at,
              readAt: row.read_at,
              actionUrl: row.action_url,
            }));
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtimeNotifications();
    return () => {
      cleanup.then(fn => fn?.());
    };
  }, [isAuthenticated, dispatch]);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: colors.bg.base,
      card: colors.surface.default,
      text: colors.text.primary,
      border: colors.border.subtle,
      primary: colors.accent.main,
    },
  };

  if (isRestoring) {
    return (
      <View style={[styles.container, {backgroundColor: colors.bg.base}]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.bg.base}
        />
        <LoadingSpinner fullScreen text="Chargement..." />
      </View>
    );
  }

  const inner = (
    <ToastProvider>
      <ReduxErrorToaster />
      <NavigationContainer theme={navTheme}>
        <View style={[styles.container, {backgroundColor: colors.bg.base}]}>
          <RootNavigator isAuthenticated={isAuthenticated || DEV_SKIP_AUTH} />
        </View>
      </NavigationContainer>
    </ToastProvider>
  );

  return (
    <GestureHandlerRootView style={[styles.container, {backgroundColor: colors.bg.base}]}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.bg.base}
        />
        {Platform.OS === 'web' ? (
          <SafeAreaInsetsContext.Provider value={WEB_INSETS}>
            {inner}
          </SafeAreaInsetsContext.Provider>
        ) : (
          inner
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

/**
 * Surfaces backend error messages (from any slice) as a toast.
 */
const ReduxErrorToaster: React.FC = () => {
  const {show} = useToast();
  const errors = useSelector((state: RootState) => [
    state.auth.error,
    state.user.error,
    state.tontine.error,
    state.notification.error,
  ]);
  const lastShown = React.useRef<string | null>(null);
  useEffect(() => {
    const msg = errors.find(e => !!e) as string | undefined;
    if (msg && msg !== lastShown.current) {
      lastShown.current = msg;
      show(msg, {type: 'error'});
    }
    if (!msg) lastShown.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, errors);
  return null;
};

/**
 * App Component
 * Main app wrapper with Redux Provider and ErrorBoundary
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Provider store={store}>
          <AppContent />
        </Provider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
