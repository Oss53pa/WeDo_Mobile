/**
 * Adinkra — signature Akan symbols, one per ambiance.
 *  - sankofa        : return for what you forgot — wisdom of the elders (Héritage)
 *  - nkonsonkonson  : chain links — community / "we are linked" (Élan)
 *  - adinkrahene    : concentric circles — leadership (Souverain)
 *  - kente          : a woven diamond — the default WeDo mark (Standard)
 *
 * Drawn as clean stroked SVG on a 100×100 viewBox. Theme-aware via `color`.
 */
import React from 'react';
import Svg, {G, Path, Circle, Ellipse} from 'react-native-svg';
import type {AdinkraKey} from '@theme';

export interface AdinkraProps {
  name: AdinkraKey;
  size?: number;
  color?: string;
  /** stroke width on the 100×100 viewBox */
  weight?: number;
  opacity?: number;
}

export const Adinkra: React.FC<AdinkraProps> = ({
  name,
  size = 48,
  color = '#D4A03C',
  weight = 6,
  opacity = 1,
}) => {
  const stroke = {
    stroke: color,
    strokeWidth: weight,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" opacity={opacity}>
      {name === 'sankofa' && (
        <G {...stroke}>
          {/* heart-form sankofa: symmetric heart + upward stem */}
          <Path d="M50 30 C 70 30 70 60 50 60 C 30 60 30 30 50 30 Z" />
          <Path d="M50 60 L50 84 M34 76 C 46 86 60 78 56 64" />
          <Circle cx="50" cy="42" r="6" fill={color} stroke="none" />
        </G>
      )}

      {name === 'nkonsonkonson' && (
        <G {...stroke}>
          {/* three interlocking chain links */}
          <Ellipse cx="30" cy="50" rx="16" ry="11" />
          <Ellipse cx="50" cy="50" rx="16" ry="11" />
          <Ellipse cx="70" cy="50" rx="16" ry="11" />
        </G>
      )}

      {name === 'adinkrahene' && (
        <G {...stroke}>
          <Circle cx="50" cy="50" r="34" />
          <Circle cx="50" cy="50" r="22" strokeWidth={weight * 0.8} />
          <Circle cx="50" cy="50" r="10" strokeWidth={weight * 0.8} />
          <Circle cx="50" cy="50" r="3" fill={color} stroke="none" />
        </G>
      )}

      {name === 'kente' && (
        <G {...stroke}>
          {/* woven diamond cluster */}
          <Path d="M50 18 L74 50 L50 82 L26 50 Z" />
          <Path d="M50 34 L62 50 L50 66 L38 50 Z" />
          <Circle cx="50" cy="50" r="3.5" fill={color} stroke="none" />
        </G>
      )}
    </Svg>
  );
};

export default Adinkra;
