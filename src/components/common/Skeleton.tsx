/**
 * Skeleton — shimmering placeholder for loading states.
 */
import React, {useEffect} from 'react';
import {View, StyleSheet, ViewStyle, DimensionValue} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {useTheme} from '@theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  circle?: boolean;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  radius = 8,
  circle = false,
  style,
}) => {
  const {colors, isDark} = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {duration: 1200, easing: Easing.inOut(Easing.ease)}),
      -1,
      false,
    );
  }, [progress]);

  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{translateX: (progress.value * 2 - 1) * 220}],
  }));

  const r = circle ? (typeof height === 'number' ? height / 2 : 999) : radius;
  const w = circle ? height : width;

  return (
    <View
      style={[
        {
          width: w,
          height,
          borderRadius: r,
          backgroundColor: colors.surface.sunken,
          overflow: 'hidden',
        },
        style,
      ]}>
      <Animated.View style={[StyleSheet.absoluteFill, sheenStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)',
            'transparent',
          ]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

export default Skeleton;
