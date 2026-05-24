/**
 * AnimatedNumber — counts up to `value` with a tabular, formatted display.
 * Defaults to fr-FR grouped integers (great for FCFA amounts).
 */
import React, {useEffect, useState, useRef} from 'react';
import {Text, TextStyle, StyleProp} from 'react-native';
import {duration as motionDuration} from '@theme';

export interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
}

const defaultFormat = (n: number) => Math.round(n).toLocaleString('fr-FR');

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = motionDuration.slower,
  format = defaultFormat,
  prefix = '',
  suffix = '',
  style,
}) => {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    // Safety: guarantee the final value even if rAF is paused (e.g. background tab).
    const safety = setTimeout(() => {
      fromRef.current = to;
      setDisplay(to);
    }, duration + 120);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      clearTimeout(safety);
    };
  }, [value, duration]);

  return (
    <Text style={style} numberOfLines={1}>
      {prefix}
      {format(display)}
      {suffix}
    </Text>
  );
};

export default AnimatedNumber;
