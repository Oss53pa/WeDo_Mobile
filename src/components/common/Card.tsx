/**
 * Card — themed surface container with premium soft shadows.
 * Backwards compatible: `elevation` (0|1|2|3|4|5|8) still accepted and mapped
 * to the new soft shadow scale. Adds `variant`: default | flat | outline | glass.
 */
import React from 'react';
import {View, StyleSheet, ViewStyle, StyleProp} from 'react-native';
import {useTheme, borderRadius as radii, spacing} from '@theme';
import {PressableScale} from './PressableScale';

export type CardElevation = 0 | 1 | 2 | 3 | 4 | 5 | 8;
export type CardVariant = 'default' | 'flat' | 'outline' | 'glass';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  elevation?: CardElevation;
  padding?: number;
  margin?: number;
  backgroundColor?: string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  testID?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  elevation = 2,
  padding = spacing.lg,
  margin,
  backgroundColor,
  borderRadius: customRadius = radii.xl,
  style,
  onPress,
  testID,
}) => {
  const {colors, shadows} = useTheme();

  const shadowKey =
    elevation <= 0 ? 'none' : elevation <= 1 ? 'xs' : elevation <= 2 ? 'sm' : elevation <= 4 ? 'md' : 'lg';
  const softShadow = {...shadows[shadowKey as keyof typeof shadows], shadowColor: colors.shadowColor};

  const surface: ViewStyle = (() => {
    switch (variant) {
      case 'flat':
        return {backgroundColor: backgroundColor ?? colors.surface.sunken};
      case 'outline':
        return {
          backgroundColor: backgroundColor ?? colors.surface.default,
          borderWidth: 1,
          borderColor: colors.border.default,
        };
      case 'glass':
        return {
          backgroundColor: backgroundColor ?? colors.surface.glass,
          borderWidth: 1,
          borderColor: colors.surface.glassBorder,
          ...softShadow,
        };
      case 'default':
      default:
        return {backgroundColor: backgroundColor ?? colors.surface.default, ...softShadow};
    }
  })();

  const cardStyle: ViewStyle = {
    borderRadius: customRadius,
    padding,
    margin,
    ...surface,
  };

  if (onPress) {
    return (
      <PressableScale onPress={onPress} testID={testID} style={[cardStyle, style]}>
        {children}
      </PressableScale>
    );
  }

  return (
    <View style={[cardStyle, style]} testID={testID}>
      {children}
    </View>
  );
};

export default Card;
