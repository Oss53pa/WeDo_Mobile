/**
 * Badge — reputation / status / count / tag pills. Theme-aware.
 */
import React from 'react';
import {View, Text, StyleSheet, ViewStyle, TextStyle} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme, typography, borderRadius, spacing} from '@theme';
import {ReputationLevel} from '@types';

export type BadgeVariant = 'reputation' | 'status' | 'count' | 'tag' | 'soft';
export type BadgeSize = 'small' | 'medium' | 'large';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  label?: string;
  icon?: string;
  reputationLevel?: ReputationLevel;
  reputationScore?: number;
  color?: string;
  backgroundColor?: string;
  /** for "soft" variant: tints bg with this tone */
  tone?: string;
  style?: ViewStyle;
  testID?: string;
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'tag',
  size = 'medium',
  label,
  icon,
  reputationLevel,
  reputationScore,
  color,
  backgroundColor,
  tone,
  style,
  testID,
}) => {
  const {colors} = useTheme();

  const reputationConfig = () => {
    if (!reputationLevel) return null;
    const map: Record<ReputationLevel, {color: string; icon: string; label: string}> = {
      [ReputationLevel.BRONZE]: {color: colors.reputation.bronze, icon: 'medal', label: 'Bronze'},
      [ReputationLevel.SILVER]: {color: colors.reputation.silver, icon: 'medal', label: 'Argent'},
      [ReputationLevel.GOLD]: {color: colors.reputation.gold, icon: 'medal', label: 'Or'},
      [ReputationLevel.PLATINUM]: {color: colors.reputation.platinum, icon: 'crown', label: 'Platine'},
      [ReputationLevel.DIAMOND]: {color: colors.reputation.diamond, icon: 'diamond-stone', label: 'Diamant'},
    };
    return map[reputationLevel];
  };

  const sizeStyle: ViewStyle =
    size === 'small'
      ? {paddingVertical: 2, paddingHorizontal: spacing.xs + 2, minHeight: 20}
      : size === 'large'
      ? {paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: 34}
      : {paddingVertical: 4, paddingHorizontal: spacing.sm + 2, minHeight: 26};

  const config = variant === 'reputation' ? reputationConfig() : null;

  const containerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.full,
      ...sizeStyle,
    };
    switch (variant) {
      case 'reputation':
        return {
          ...base,
          backgroundColor: backgroundColor ?? (config ? config.color + '1F' : colors.surface.sunken),
          borderWidth: 1,
          borderColor: (config?.color ?? colors.border.default) + '66',
        };
      case 'status':
        return {...base, backgroundColor: backgroundColor ?? color ?? colors.brand.terracotta};
      case 'count':
        return {
          ...base,
          backgroundColor: backgroundColor ?? colors.error,
          minWidth: size === 'small' ? 18 : 22,
          paddingHorizontal: 6,
        };
      case 'soft': {
        const t = tone ?? colors.brand.terracotta;
        return {...base, backgroundColor: backgroundColor ?? t + '1A'};
      }
      case 'tag':
      default:
        return {
          ...base,
          backgroundColor: backgroundColor ?? colors.surface.sunken,
          borderWidth: 1,
          borderColor: color ?? colors.border.default,
        };
    }
  };

  const textColor =
    variant === 'status'
      ? '#FFFFFF'
      : variant === 'count'
      ? '#FFFFFF'
      : variant === 'soft'
      ? tone ?? colors.brand.terracotta
      : color ?? config?.color ?? colors.text.primary;

  const textStyle: TextStyle = {
    ...(size === 'small' ? typography.small : typography.caption),
    fontWeight: '700',
    color: textColor,
  };

  const iconSize = size === 'small' ? 13 : size === 'large' ? 18 : 15;
  const iconName = icon || config?.icon;

  let displayLabel = label || config?.label;
  if (variant === 'reputation' && reputationScore !== undefined) {
    displayLabel = `${displayLabel} · ${reputationScore}`;
  }

  return (
    <View style={[containerStyle(), style]} testID={testID}>
      {iconName && (
        <Icon name={iconName} size={iconSize} color={textColor} style={displayLabel ? styles.icon : undefined} />
      )}
      {displayLabel != null && <Text style={textStyle}>{displayLabel}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  icon: {marginRight: 4},
});

export default Badge;
