/**
 * ProgressRing — animated circular progress indicator (reanimated + svg).
 * Optional gradient stroke and center content (label / icon / amount).
 */
import React, {useEffect} from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import Svg, {Circle, Defs, LinearGradient, Stop} from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useTheme, duration as motionDuration, easing} from '@theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  /** 0..1 */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  gradientColors?: [string, string];
  rounded?: boolean;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 132,
  strokeWidth = 12,
  color,
  trackColor,
  gradientColors,
  rounded = true,
  children,
  style,
}) => {
  const {colors} = useTheme();
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const offset = useSharedValue(circumference);

  useEffect(() => {
    offset.value = withTiming(circumference * (1 - clamped), {
      duration: motionDuration.slower,
      easing: easing.out,
    });
  }, [clamped, circumference, offset]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }));

  const stroke = color ?? colors.brand.terracotta;
  const track = trackColor ?? colors.border.default;

  return (
    <View style={[{width: size, height: size}, style]}>
      <Svg width={size} height={size}>
        {gradientColors && (
          <Defs>
            <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={gradientColors[0]} />
              <Stop offset="1" stopColor={gradientColors[1]} />
            </LinearGradient>
          </Defs>
        )}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={gradientColors ? 'url(#ringGrad)' : stroke}
          strokeWidth={strokeWidth}
          strokeLinecap={rounded ? 'round' : 'butt'}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          // rotate so progress starts at top
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children != null && (
        <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  center: {alignItems: 'center', justifyContent: 'center'},
});

export default ProgressRing;
