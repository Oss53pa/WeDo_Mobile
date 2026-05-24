/**
 * StatTile — compact metric card: tinted icon chip, value, label.
 */
import React from 'react';
import {View, Text, StyleSheet, ViewStyle, StyleProp} from 'react-native';
import {
  useTheme,
  useThemedStyles,
  typography,
  spacing,
  borderRadius,
  type ThemedTokens,
} from '@theme';
import {PressableScale} from './PressableScale';

export interface StatTileProps {
  icon?: React.ReactNode;
  value: string | number;
  label: string;
  /** accent color for the icon chip (defaults to terracotta) */
  tone?: string;
  toneSoft?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const StatTile: React.FC<StatTileProps> = ({
  icon,
  value,
  label,
  tone,
  toneSoft,
  onPress,
  style,
}) => {
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const chipColor = tone ?? colors.brand.terracotta;
  const chipBg = toneSoft ?? colors.brand.terracottaSoft;

  const body = (
    <>
      {icon != null && (
        <View style={[s.chip, {backgroundColor: chipBg}]}>{icon}</View>
      )}
      <Text style={s.value} numberOfLines={1}>
        {value}
      </Text>
      <Text style={s.label} numberOfLines={2}>
        {label}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <PressableScale onPress={onPress} style={[s.tile, style]}>
        {body}
      </PressableScale>
    );
  }
  return <View style={[s.tile, style]}>{body}</View>;
};

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    tile: {
      flex: 1,
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius.xl,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm + 2,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.sm,
      shadowColor: colors.shadowColor,
    },
    chip: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    value: {
      ...typography.h2,
      fontSize: 24,
      color: colors.text.primary,
    },
    label: {
      ...typography.small,
      fontSize: 12,
      lineHeight: 15,
      color: colors.text.secondary,
      marginTop: 2,
    },
  });

export default StatTile;
