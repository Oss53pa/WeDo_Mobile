/**
 * Chip — selectable pill (filters, amount presets, tags).
 */
import React from 'react';
import {Text, StyleSheet, ViewStyle, StyleProp, View} from 'react-native';
import {useTheme, typography, spacing, borderRadius} from '@theme';
import {PressableScale} from './PressableScale';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  tone?: string;
  style?: StyleProp<ViewStyle>;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  icon,
  tone,
  style,
}) => {
  const {colors} = useTheme();
  const accent = tone ?? colors.accent.main;

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.95}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? accent : colors.surface.sunken,
          borderColor: selected ? accent : colors.border.default,
        },
        style,
      ]}>
      {icon != null && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          styles.label,
          {color: selected ? colors.accent.contrast : colors.text.secondary},
        ]}
        numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
  },
  icon: {marginRight: 6},
  label: {...typography.captionMedium, fontWeight: '600'},
});

export default Chip;
