/**
 * LoadingSpinner — themed activity indicator with optional text + fullscreen.
 * Accepts both `fullscreen` and `fullScreen` for backwards compatibility.
 */
import React from 'react';
import {View, ActivityIndicator, Text, StyleSheet, ViewStyle} from 'react-native';
import {useTheme, typography, spacing} from '@theme';

export type LoadingSize = 'small' | 'large';

export interface LoadingSpinnerProps {
  size?: LoadingSize;
  color?: string;
  text?: string;
  fullscreen?: boolean;
  fullScreen?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color,
  text,
  fullscreen = false,
  fullScreen = false,
  style,
  testID,
}) => {
  const {colors} = useTheme();
  const isFull = fullscreen || fullScreen;

  return (
    <View
      style={[
        isFull
          ? [styles.fullscreen, {backgroundColor: colors.bg.base}]
          : styles.container,
        style,
      ]}
      testID={testID}>
      <ActivityIndicator size={size} color={color ?? colors.accent.main} />
      {text && <Text style={[styles.text, {color: colors.text.secondary}]}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {justifyContent: 'center', alignItems: 'center', padding: spacing.lg},
  fullscreen: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  text: {...typography.body, marginTop: spacing.md, textAlign: 'center'},
});

export default LoadingSpinner;
