/**
 * GradientView — thin wrapper over LinearGradient that can pull a named
 * gradient from the active theme (e.g. "sunset", "night", "kente").
 */
import React from 'react';
import {ViewStyle, StyleProp} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '@theme';
import type {GradientName} from '@theme';

export interface GradientViewProps {
  /** Named gradient from the theme */
  name?: GradientName;
  /** Explicit color stops (overrides `name`) */
  colors?: string[];
  start?: {x: number; y: number};
  end?: {x: number; y: number};
  locations?: number[];
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
}

export const GradientView: React.FC<GradientViewProps> = ({
  name = 'sunset',
  colors,
  start,
  end,
  locations,
  style,
  children,
  pointerEvents,
}) => {
  const {gradients} = useTheme();
  const g = gradients[name];
  return (
    <LinearGradient
      colors={colors ?? g.colors}
      start={start ?? g.start}
      end={end ?? g.end}
      locations={locations ?? (colors ? undefined : (g as any).locations)}
      style={style}
      pointerEvents={pointerEvents}>
      {children}
    </LinearGradient>
  );
};

export default GradientView;
