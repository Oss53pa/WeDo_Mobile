/**
 * GradientCard — hero surface with a themed gradient, optional African motif
 * overlay, a glossy sheen, and colored glow. Used for balance cards / spotlights.
 */
import React from 'react';
import {View, StyleSheet, ViewStyle, StyleProp} from 'react-native';
import {useTheme, borderRadius as radii, spacing, makeGlow} from '@theme';
import type {GradientName} from '@theme';
import {GradientView} from './Gradient';
import {PressableScale} from './PressableScale';
import {PatternBackground, type MotifName} from '../patterns';

export interface GradientCardProps {
  children: React.ReactNode;
  gradient?: GradientName;
  motif?: MotifName | 'none';
  motifOpacity?: number;
  glow?: boolean;
  sheen?: boolean;
  padding?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  testID?: string;
}

export const GradientCard: React.FC<GradientCardProps> = ({
  children,
  gradient = 'sunset',
  motif = 'diamonds',
  motifOpacity = 0.1,
  glow = true,
  sheen = true,
  padding = spacing.lg,
  borderRadius: r = radii['2xl'],
  style,
  onPress,
  testID,
}) => {
  const {gradients} = useTheme();
  const glowColor = gradients[gradient].colors[1] ?? gradients[gradient].colors[0];

  const inner = (
    <GradientView
      name={gradient}
      style={[{borderRadius: r, overflow: 'hidden', padding}, style as ViewStyle]}>
      {motif !== 'none' && (
        <PatternBackground motif={motif as MotifName} opacity={motifOpacity} />
      )}
      {sheen && (
        <GradientView
          name="sheen"
          style={StyleSheet.absoluteFill as ViewStyle}
          pointerEvents="none"
        />
      )}
      <View style={{position: 'relative'}}>{children}</View>
    </GradientView>
  );

  const glowStyle = glow ? makeGlow(glowColor, 0.34) : undefined;

  if (onPress) {
    return (
      <PressableScale onPress={onPress} testID={testID} style={[{borderRadius: r}, glowStyle]}>
        {inner}
      </PressableScale>
    );
  }
  return <View style={[{borderRadius: r}, glowStyle]}>{inner}</View>;
};

export default GradientCard;
