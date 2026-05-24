/**
 * Button — premium themed button with gradient + glow variants and tactile press.
 * Backwards compatible API (variant/size/icon/loading/fullWidth) plus:
 *  - variant "gradient" (uses `gradient` prop, default "sunset")
 *  - leftNode/rightNode for custom (SVG) icons
 */
import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  useTheme,
  useThemedStyles,
  typography,
  spacing,
  borderRadius,
  makeGlow,
} from '@theme';
import type {GradientName} from '@theme';
import {PressableScale} from './PressableScale';
import {GradientView} from './Gradient';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'gradient'
  | 'outline'
  | 'ghost'
  | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  leftNode?: React.ReactNode;
  rightNode?: React.ReactNode;
  gradient?: GradientName;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  leftNode,
  rightNode,
  gradient = 'sunset',
  fullWidth = false,
  style,
  textStyle,
  testID,
}) => {
  const {colors, gradients} = useTheme();
  const s = useThemedStyles(makeStyles);

  const sizeStyle: ViewStyle =
    size === 'small'
      ? {paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: 40}
      : size === 'large'
      ? {paddingVertical: spacing.md + 2, paddingHorizontal: spacing.xl, minHeight: 58}
      : {paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: 52};

  const isLight = variant === 'secondary' || variant === 'outline' || variant === 'ghost';
  const textColor = disabled
    ? colors.text.disabled
    : variant === 'gradient'
    ? '#FFFFFF'
    : variant === 'primary'
    ? colors.primary.contrast
    : variant === 'accent'
    ? colors.accent.contrast
    : variant === 'danger'
    ? '#FFFFFF'
    : variant === 'outline' || variant === 'ghost'
    ? colors.text.primary
    : colors.text.primary;

  const containerColor = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {backgroundColor: disabled ? colors.border.default : colors.primary.main};
      case 'accent':
        return {
          backgroundColor: disabled ? colors.border.default : colors.accent.main,
          ...(disabled ? {} : makeGlow(colors.accent.main, 0.3)),
        };
      case 'secondary':
        return {backgroundColor: colors.surface.sunken};
      case 'danger':
        return {backgroundColor: disabled ? colors.border.default : colors.error};
      case 'outline':
        return {
          backgroundColor: colors.transparent,
          borderWidth: 1.5,
          borderColor: disabled ? colors.border.default : colors.border.strong,
        };
      case 'ghost':
        return {backgroundColor: colors.transparent};
      default:
        return {};
    }
  };

  const iconSize = size === 'small' ? 18 : size === 'large' ? 24 : 20;

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {leftNode}
          {icon && iconPosition === 'left' && !leftNode && (
            <Icon name={icon} size={iconSize} color={textColor} style={s.iconLeft} />
          )}
          <Text style={[s.text, {color: textColor}, textStyle]} numberOfLines={1}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && !rightNode && (
            <Icon name={icon} size={iconSize} color={textColor} style={s.iconRight} />
          )}
          {rightNode}
        </>
      )}
    </>
  );

  const base: ViewStyle = {
    ...s.base,
    ...sizeStyle,
    ...(fullWidth ? {alignSelf: 'stretch'} : {}),
  };

  if (variant === 'gradient' && !disabled) {
    const glow = makeGlow(gradients[gradient].colors[1] ?? colors.accent.main, 0.34);
    return (
      <PressableScale
        onPress={onPress}
        disabled={loading}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{disabled: loading}}
        style={[{borderRadius: borderRadius.lg, ...glow}, fullWidth && {alignSelf: 'stretch'}, style]}>
        <GradientView name={gradient} style={[base, {width: fullWidth ? '100%' : undefined}]}>
          {content}
        </GradientView>
      </PressableScale>
    );
  }

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{disabled: disabled || loading}}
      style={[base, containerColor(), style]}>
      {content}
    </PressableScale>
  );
};

const makeStyles = () =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.lg,
    },
    text: {
      ...typography.button,
      textTransform: 'none',
      letterSpacing: 0.2,
      textAlign: 'center',
    },
    iconLeft: {marginRight: spacing.sm},
    iconRight: {marginLeft: spacing.sm},
  });

export default Button;
