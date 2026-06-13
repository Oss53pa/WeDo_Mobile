/**
 * CustomTabBar — floating, rounded bottom navigation with a central
 * gradient FAB for "Create". Theme-aware, safe-area aware, animated active dot.
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {
  useTheme,
  useThemedStyles,
  typography,
  spacing,
  borderRadius,
  makeGlow,
  type ThemedTokens,
} from '@theme';
import {HomeIcon, WalletIcon, PlusIcon, MessageIcon, UserIcon} from '@components/icons';
import {GradientView} from '@components/common';
import {PressableScale} from '@components/common';

/** Bottom padding screens should reserve so content clears the floating bar. */
export const TAB_BAR_SPACE = 112;

const ICONS: Record<string, React.FC<{size?: number; color?: string; filled?: boolean}>> = {
  Home: HomeIcon,
  Tontines: WalletIcon,
  Messages: MessageIcon,
  Profile: UserIcon,
};

const LABELS: Record<string, string> = {
  Home: 'Accueil',
  Tontines: 'Tontines',
  Messages: 'Messages',
  Profile: 'Profil',
};

const TabButton: React.FC<{
  routeName: string;
  focused: boolean;
  onPress: () => void;
}> = ({routeName, focused, onPress}) => {
  const {colors, copy} = useTheme();
  const s = useThemedStyles(makeStyles);
  const IconCmp = ICONS[routeName];
  // The "Tontines" tab follows the active ambiance's word (Groupes / Gbonhi…).
  const label = routeName === 'Tontines' ? copy.tontinesTab : LABELS[routeName] ?? routeName;

  const dotStyle = useAnimatedStyle(() => ({
    opacity: withTiming(focused ? 1 : 0, {duration: 180}),
    transform: [{scale: withTiming(focused ? 1 : 0.4, {duration: 180})}],
  }));

  return (
    <PressableScale
      onPress={onPress}
      style={s.tab}
      scaleTo={0.9}
      accessibilityRole="tab"
      accessibilityState={{selected: focused}}
      accessibilityLabel={label}>
      {IconCmp && (
        <IconCmp size={24} color={focused ? colors.accent.main : colors.text.tertiary} filled={focused} />
      )}
      <Text style={[s.label, {color: focused ? colors.accent.main : colors.text.tertiary}]}>
        {label}
      </Text>
      <Animated.View style={[s.dot, {backgroundColor: colors.accent.main}, dotStyle]} />
    </PressableScale>
  );
};

export const CustomTabBar: React.FC<BottomTabBarProps> = ({state, navigation}) => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const s = useThemedStyles(makeStyles);

  const onPress = (routeName: string, index: number, isFocused: boolean) => {
    const event = navigation.emit({type: 'tabPress', target: state.routes[index].key, canPreventDefault: true});
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  return (
    <View style={[s.wrap, {paddingBottom: Math.max(insets.bottom, spacing.md)}]} pointerEvents="box-none">
      <View style={s.bar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          if (route.name === 'Create') {
            return (
              <View key={route.key} style={s.fabSlot}>
                <PressableScale
                  onPress={() => onPress(route.name, index, isFocused)}
                  scaleTo={0.9}
                  accessibilityRole="button"
                  accessibilityLabel="Créer une tontine"
                  style={[s.fabTouch, makeGlow(colors.accent.main, 0.38)]}>
                  <GradientView name="sunset" style={s.fab}>
                    <PlusIcon size={26} color="#FFFFFF" />
                  </GradientView>
                </PressableScale>
              </View>
            );
          }

          return (
            <TabButton
              key={route.key}
              routeName={route.name}
              focused={isFocused}
              onPress={() => onPress(route.name, index, isFocused)}
            />
          );
        })}
      </View>
    </View>
  );
};

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: spacing.lg,
      backgroundColor: 'transparent',
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius['2xl'],
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.lg,
      shadowColor: colors.shadowColor,
    },
    tab: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4},
    label: {...typography.small, fontWeight: '600', marginTop: 3, fontSize: 10},
    dot: {width: 5, height: 5, borderRadius: 3, marginTop: 3},
    fabSlot: {flex: 1, alignItems: 'center', justifyContent: 'center'},
    fabTouch: {borderRadius: 30, marginTop: -22},
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      borderColor: colors.surface.default,
    },
  });

export default CustomTabBar;
