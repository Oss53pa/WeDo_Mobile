/**
 * African pattern kit — Kente / bogolan inspired geometric motifs.
 * Used as low-opacity texture on hero cards, decorative dividers, and
 * empty-state emblems. All parametric and theme-aware.
 */
import React, {useMemo} from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import Svg, {
  Defs,
  Pattern,
  Rect,
  Path,
  Circle,
  G,
  Line,
  Polygon,
} from 'react-native-svg';
import {useTheme} from '@theme';

let _pid = 0;
const nextId = () => `wedo-pat-${++_pid}`;

export type MotifName = 'diamonds' | 'zigzag' | 'mudcloth' | 'dots' | 'weave';

interface PatternBackgroundProps {
  motif?: MotifName;
  color?: string;
  opacity?: number;
  /** tile size in px */
  scale?: number;
  style?: ViewStyle;
}

const Motif: React.FC<{motif: MotifName; color: string; s: number}> = ({
  motif,
  color,
  s,
}) => {
  switch (motif) {
    case 'zigzag':
      return (
        <Path
          d={`M0 ${s * 0.75} L${s * 0.25} ${s * 0.25} L${s * 0.5} ${s * 0.75} L${
            s * 0.75
          } ${s * 0.25} L${s} ${s * 0.75}`}
          stroke={color}
          strokeWidth={s * 0.06}
          fill="none"
        />
      );
    case 'mudcloth':
      return (
        <G stroke={color} strokeWidth={s * 0.05} strokeLinecap="round">
          <Line x1={s * 0.5} y1={s * 0.15} x2={s * 0.5} y2={s * 0.85} />
          <Line x1={s * 0.32} y1={s * 0.3} x2={s * 0.32} y2={s * 0.45} />
          <Line x1={s * 0.68} y1={s * 0.3} x2={s * 0.68} y2={s * 0.45} />
          <Line x1={s * 0.32} y1={s * 0.55} x2={s * 0.32} y2={s * 0.7} />
          <Line x1={s * 0.68} y1={s * 0.55} x2={s * 0.68} y2={s * 0.7} />
        </G>
      );
    case 'dots':
      return (
        <G fill={color}>
          <Circle cx={s * 0.25} cy={s * 0.25} r={s * 0.06} />
          <Circle cx={s * 0.75} cy={s * 0.25} r={s * 0.06} />
          <Circle cx={s * 0.5} cy={s * 0.5} r={s * 0.06} />
          <Circle cx={s * 0.25} cy={s * 0.75} r={s * 0.06} />
          <Circle cx={s * 0.75} cy={s * 0.75} r={s * 0.06} />
        </G>
      );
    case 'weave':
      return (
        <G stroke={color} strokeWidth={s * 0.07} fill="none">
          <Path d={`M0 ${s * 0.25} H${s}`} />
          <Path d={`M0 ${s * 0.75} H${s}`} />
          <Path d={`M${s * 0.25} 0 V${s}`} />
          <Path d={`M${s * 0.75} 0 V${s}`} />
        </G>
      );
    case 'diamonds':
    default:
      return (
        <G stroke={color} strokeWidth={s * 0.045} fill="none">
          {/* outer diamond */}
          <Polygon
            points={`${s * 0.5},${s * 0.08} ${s * 0.92},${s * 0.5} ${s * 0.5},${
              s * 0.92
            } ${s * 0.08},${s * 0.5}`}
          />
          {/* nested diamond */}
          <Polygon
            points={`${s * 0.5},${s * 0.26} ${s * 0.74},${s * 0.5} ${s * 0.5},${
              s * 0.74
            } ${s * 0.26},${s * 0.5}`}
          />
          <Circle cx={s * 0.5} cy={s * 0.5} r={s * 0.055} fill={color} stroke="none" />
          {/* corner ticks for a woven look */}
          <Circle cx={s * 0.5} cy={s * 0.02} r={s * 0.03} fill={color} stroke="none" />
          <Circle cx={s * 0.5} cy={s * 0.98} r={s * 0.03} fill={color} stroke="none" />
          <Circle cx={s * 0.02} cy={s * 0.5} r={s * 0.03} fill={color} stroke="none" />
          <Circle cx={s * 0.98} cy={s * 0.5} r={s * 0.03} fill={color} stroke="none" />
        </G>
      );
  }
};

/** Tiled motif that fills its parent — place inside a clipped/rounded view. */
export const PatternBackground: React.FC<PatternBackgroundProps> = ({
  motif = 'diamonds',
  color,
  opacity = 0.08,
  scale = 44,
  style,
}) => {
  const {colors} = useTheme();
  const stroke = color ?? colors.text.onBrand;
  const id = useMemo(() => nextId(), []);

  return (
    <View style={[StyleSheet.absoluteFill, {opacity}, style]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id={id}
            patternUnits="userSpaceOnUse"
            width={scale}
            height={scale}>
            <Motif motif={motif} color={stroke} s={scale} />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
};

interface KenteStripeProps {
  height?: number;
  radius?: number;
  style?: ViewStyle;
  /** override segment colors */
  segments?: string[];
}

/** Thin multicolor kente band — decorative divider / accent. */
export const KenteStripe: React.FC<KenteStripeProps> = ({
  height = 6,
  radius = 999,
  style,
  segments,
}) => {
  const {colors} = useTheme();
  const band = segments ?? [
    colors.brand.emerald,
    colors.brand.gold,
    colors.brand.terracotta,
    colors.brand.crimson,
    colors.brand.indigo,
  ];
  return (
    <View
      style={[
        {flexDirection: 'row', height, borderRadius: radius, overflow: 'hidden'},
        style,
      ]}>
      {band.map((c, i) => (
        <View key={i} style={{flex: 1, backgroundColor: c}} />
      ))}
    </View>
  );
};

interface EmblemProps {
  size?: number;
  color?: string;
  accent?: string;
}

/** Decorative concentric kente emblem for empty states / splashes. */
export const KenteEmblem: React.FC<EmblemProps> = ({
  size = 120,
  color,
  accent,
}) => {
  const {colors} = useTheme();
  const c = color ?? colors.brand.terracotta;
  const a = accent ?? colors.brand.gold;
  const cx = 60;
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Circle cx={cx} cy={cx} r={56} fill="none" stroke={c} strokeWidth={2} opacity={0.4} />
      <Circle cx={cx} cy={cx} r={44} fill="none" stroke={a} strokeWidth={2} opacity={0.6} />
      {/* radial diamonds */}
      <G>
        {Array.from({length: 8}).map((_, i) => {
          const ang = (i * Math.PI) / 4;
          const x = cx + Math.cos(ang) * 50;
          const y = cx + Math.sin(ang) * 50;
          const col = [c, a][i % 2];
          return (
            <Polygon
              key={i}
              points={`${x},${y - 5} ${x + 5},${y} ${x},${y + 5} ${x - 5},${y}`}
              fill={col}
            />
          );
        })}
      </G>
      <Circle cx={cx} cy={cx} r={26} fill={c} opacity={0.12} />
      <Polygon
        points={`${cx},${cx - 18} ${cx + 18},${cx} ${cx},${cx + 18} ${cx - 18},${cx}`}
        fill="none"
        stroke={c}
        strokeWidth={2.5}
      />
      <Circle cx={cx} cy={cx} r={5} fill={a} />
    </Svg>
  );
};

export default PatternBackground;
