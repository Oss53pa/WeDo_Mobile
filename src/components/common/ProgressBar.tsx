/**
 * ProgressBar — themed linear progress with optional gradient fill + label.
 * API preserved: progress (0-100), height, showPercentage, showLabel, label,
 * color, backgroundColor, useGradient, gradientColors, animated.
 */
import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated, ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme, typography, borderRadius, spacing} from '@theme';

export interface ProgressBarProps {
  progress: number;
  height?: number;
  showPercentage?: boolean;
  showLabel?: boolean;
  label?: string;
  color?: string;
  backgroundColor?: string;
  useGradient?: boolean;
  gradientColors?: string[];
  animated?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 10,
  showPercentage = false,
  showLabel = false,
  label,
  color,
  backgroundColor,
  useGradient = true,
  gradientColors,
  animated = true,
  style,
  testID,
}) => {
  const {colors, gradients} = useTheme();
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const clamped = Math.min(Math.max(progress, 0), 100);

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: clamped,
        duration: 560,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(clamped);
    }
  }, [clamped, animated, animatedWidth]);

  const progressWidth = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const fill = color ?? colors.brand.terracotta;
  const track = backgroundColor ?? colors.border.default;
  const gradColors = gradientColors ?? gradients.sunset.colors;

  return (
    <View style={[styles.container, style]} testID={testID}>
      {showLabel && label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, {color: colors.text.secondary}]}>{label}</Text>
          {showPercentage && (
            <Text style={[styles.percentage, {color: colors.text.primary}]}>
              {Math.round(clamped)}%
            </Text>
          )}
        </View>
      )}

      <View
        style={[
          styles.progressContainer,
          {height, backgroundColor: track, borderRadius: borderRadius.full},
        ]}>
        <Animated.View style={[styles.progressFill, {width: progressWidth}]}>
          {useGradient ? (
            <LinearGradient
              colors={gradColors}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={{height, borderRadius: borderRadius.full}}
            />
          ) : (
            <View style={{height, backgroundColor: fill, borderRadius: borderRadius.full, flex: 1}} />
          )}
        </Animated.View>
      </View>

      {showPercentage && !showLabel && (
        <Text style={[styles.standalone, {color: colors.text.secondary}]}>
          {Math.round(clamped)}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {width: '100%'},
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {...typography.caption, fontWeight: '600'},
  percentage: {...typography.caption, fontWeight: '700'},
  progressContainer: {width: '100%', overflow: 'hidden'},
  progressFill: {height: '100%'},
  standalone: {
    ...typography.caption,
    fontWeight: '600',
    marginTop: spacing.xs,
    textAlign: 'right',
  },
});

export default ProgressBar;
