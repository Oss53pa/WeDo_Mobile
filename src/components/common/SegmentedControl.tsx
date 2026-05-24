/**
 * SegmentedControl — pill switch for filters / tabs with an animated thumb.
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  LayoutChangeEvent,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {useTheme, useThemedStyles, typography, spacing, borderRadius, type ThemedTokens, duration, easing} from '@theme';
import {PressableScale} from './PressableScale';

export interface SegmentOption<T extends string = string> {
  label: string;
  value: T;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const [trackW, setTrackW] = useState(0);
  const index = Math.max(0, options.findIndex(o => o.value === value));
  const segW = trackW > 0 ? (trackW - 8) / options.length : 0;

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: withTiming(index * segW, {duration: duration.base, easing: easing.out})},
    ],
    width: segW,
  }));

  const onLayout = (e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width);

  return (
    <View style={[s.track, style]} onLayout={onLayout}>
      {segW > 0 && <Animated.View style={[s.thumb, thumbStyle]} />}
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <PressableScale
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={s.segment}
            scaleTo={0.96}>
            <Text
              style={[
                s.label,
                {color: active ? colors.text.primary : colors.text.secondary},
              ]}
              numberOfLines={1}>
              {opt.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      backgroundColor: colors.surface.sunken,
      borderRadius: borderRadius.full,
      padding: 4,
    },
    thumb: {
      position: 'absolute',
      top: 4,
      bottom: 4,
      left: 4,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface.default,
      ...shadows.xs,
      shadowColor: colors.shadowColor,
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
    },
    label: {...typography.captionMedium, fontWeight: '600'},
  });

export default SegmentedControl;
