/**
 * PressableScale — tactile press feedback (scale + dim) using reanimated.
 * Drop-in replacement for TouchableOpacity where a premium feel is wanted.
 */
import React from 'react';
import {Pressable, PressableProps, StyleProp, ViewStyle} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {duration, easing} from '@theme';

export interface PressableScaleProps extends PressableProps {
  scaleTo?: number;
  dimTo?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PressableScale: React.FC<PressableScaleProps> = ({
  scaleTo = 0.97,
  dimTo = 0.92,
  style,
  children,
  disabled,
  ...rest
}) => {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withTiming(pressed.value ? scaleTo : 1, {
          duration: duration.fast,
          easing: easing.inOut,
        }),
      },
    ],
    opacity: withTiming(pressed.value ? dimTo : 1, {duration: duration.fast}),
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={() => (pressed.value = 1)}
      onPressOut={() => (pressed.value = 0)}
      style={[style, animatedStyle]}
      {...rest}>
      {children as any}
    </AnimatedPressable>
  );
};

export default PressableScale;
