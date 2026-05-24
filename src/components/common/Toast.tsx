/**
 * Toast / Snackbar — lightweight global feedback.
 * Usage: const {show} = useToast(); show('Message', {type: 'success'});
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme, typography, spacing, borderRadius} from '@theme';
import {CheckIcon, AlertIcon, InfoIcon} from '@components/icons';

type ToastType = 'success' | 'error' | 'info';
interface ToastOptions {
  type?: ToastType;
  duration?: number;
}
interface ToastContextValue {
  show: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue>({show: () => {}});
export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {colors, shadows} = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{message: string; type: ToastType} | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = () => {
    Animated.parallel([
      Animated.timing(opacity, {toValue: 0, duration: 180, useNativeDriver: true}),
      Animated.timing(translateY, {toValue: 20, duration: 180, useNativeDriver: true}),
    ]).start(() => setToast(null));
  };

  const show = (message: string, options?: ToastOptions) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setToast({message, type: options?.type ?? 'info'});
    opacity.setValue(0);
    translateY.setValue(20);
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: 220, useNativeDriver: true}),
      Animated.timing(translateY, {toValue: 0, duration: 220, useNativeDriver: true}),
    ]).start();
    hideTimer.current = setTimeout(hide, options?.duration ?? 3000);
  };

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const tone =
    toast?.type === 'success'
      ? colors.success
      : toast?.type === 'error'
      ? colors.error
      : colors.brand.indigo;

  return (
    <ToastContext.Provider value={{show}}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrap,
            {bottom: insets.bottom + spacing.xl, opacity, transform: [{translateY}]},
          ]}>
          <View
            style={[
              styles.toast,
              {backgroundColor: colors.surface.default, borderColor: colors.border.default},
              {...shadows.lg, shadowColor: colors.shadowColor},
            ]}>
            <View style={[styles.dot, {backgroundColor: tone}]}>
              {toast.type === 'success' ? (
                <CheckIcon size={14} color="#FFFFFF" />
              ) : toast.type === 'error' ? (
                <AlertIcon size={14} color="#FFFFFF" />
              ) : (
                <InfoIcon size={14} color="#FFFFFF" />
              )}
            </View>
            <Text style={[styles.text, {color: colors.text.primary}]} numberOfLines={2}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  wrap: {position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center'},
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    maxWidth: 480,
  },
  dot: {width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center'},
  text: {...typography.captionMedium, flexShrink: 1, fontWeight: '600'},
});

export default ToastProvider;
