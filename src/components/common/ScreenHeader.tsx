/**
 * ScreenHeader — consistent top bar with optional back button, title,
 * subtitle and a right-side action. Safe-area aware.
 */
import React from 'react';
import {View, Text, StyleSheet, ViewStyle, StyleProp} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme, useThemedStyles, typography, spacing, type ThemedTokens} from '@theme';
import {ChevronLeftIcon} from '@components/icons';
import {PressableScale} from './PressableScale';

export interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  rightNode?: React.ReactNode;
  large?: boolean;
  /** transparent background (e.g. over a gradient) */
  transparent?: boolean;
  /** force light/dark content color */
  tint?: string;
  style?: StyleProp<ViewStyle>;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightNode,
  large = false,
  transparent = false,
  tint,
  style,
}) => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const s = useThemedStyles(makeStyles);
  const contentColor = tint ?? colors.text.primary;

  return (
    <View
      style={[
        s.wrap,
        {paddingTop: insets.top + spacing.sm},
        !transparent && s.solid,
        style,
      ]}>
      <View style={s.row}>
        <View style={s.side}>
          {onBack && (
            <PressableScale onPress={onBack} style={[s.iconBtn, transparent ? s.glassBtn : s.softBtn]}>
              <ChevronLeftIcon size={22} color={contentColor} />
            </PressableScale>
          )}
        </View>

        {!large && (
          <View style={s.centerTitle}>
            {!!title && (
              <Text style={[s.title, {color: contentColor}]} numberOfLines={1}>
                {title}
              </Text>
            )}
            {!!subtitle && (
              <Text style={[s.subtitle, {color: tint ? contentColor : colors.text.secondary}]} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        )}

        <View style={[s.side, s.sideRight]}>{rightNode}</View>
      </View>

      {large && (
        <View style={s.largeBlock}>
          {!!title && (
            <Text style={[s.largeTitle, {color: contentColor}]}>{title}</Text>
          )}
          {!!subtitle && (
            <Text style={[s.subtitle, {color: tint ? contentColor : colors.text.secondary}]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const makeStyles = ({colors}: ThemedTokens) =>
  StyleSheet.create({
    wrap: {paddingHorizontal: spacing.lg, paddingBottom: spacing.sm},
    solid: {backgroundColor: colors.bg.base},
    row: {flexDirection: 'row', alignItems: 'center', minHeight: 44},
    side: {minWidth: 44, justifyContent: 'center'},
    sideRight: {alignItems: 'flex-end'},
    centerTitle: {flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm},
    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    softBtn: {backgroundColor: colors.surface.sunken},
    glassBtn: {backgroundColor: colors.surface.onBrand, borderWidth: 1, borderColor: colors.surface.onBrandBorder},
    title: {...typography.h3, fontWeight: '700'},
    subtitle: {...typography.caption},
    largeBlock: {marginTop: spacing.md},
    largeTitle: {...typography.h1},
  });

export default ScreenHeader;
