/**
 * TabIcon - Icônes monochromes simples pour la navigation
 * Utilise des caractères Unicode fiables qui s'affichent sur tous les appareils
 */

import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

// Définition des icônes avec variantes filled/outline
const ICONS = {
  // Navigation principale
  home: { filled: '⌂', outline: '⌂' },
  tontines: { filled: '●', outline: '○' },
  groups: { filled: '◐', outline: '◔' },
  payments: { filled: '◧', outline: '▢' },
  stats: { filled: '◪', outline: '◱' },
  messages: { filled: '◈', outline: '◇' },
  profile: { filled: '●', outline: '○' },

  // Actions
  plus: { filled: '+', outline: '+' },
  add: { filled: '＋', outline: '＋' },

  // Status
  check: { filled: '✓', outline: '✓' },
  close: { filled: '✕', outline: '✕' },

  // Autres
  settings: { filled: '⚙', outline: '⚙' },
  bell: { filled: '●', outline: '○' },
  wallet: { filled: '▣', outline: '▢' },
  user: { filled: '●', outline: '○' },
  chat: { filled: '▣', outline: '▢' },
  search: { filled: '◎', outline: '○' },

  // Arrows
  left: { filled: '◀', outline: '◁' },
  right: { filled: '▶', outline: '▷' },
  up: { filled: '▲', outline: '△' },
  down: { filled: '▼', outline: '▽' },
} as const;

type IconName = keyof typeof ICONS;

interface TabIconProps {
  name: IconName;
  size?: number;
  color?: string;
  focused?: boolean;
}

export const TabIcon: React.FC<TabIconProps> = ({
  name,
  size = 24,
  color = '#3A3A3A',
  focused = false,
}) => {
  const icon = ICONS[name];
  const symbol = focused ? icon.filled : icon.outline;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text
        style={[
          styles.icon,
          {
            fontSize: size * 0.85,
            color,
            lineHeight: size,
          },
        ]}
      >
        {symbol}
      </Text>
    </View>
  );
};

// Composant pour le bouton central "+"
export const AddButton: React.FC<{ size?: number; color?: string }> = ({
  size = 28,
  color = '#FFFFFF',
}) => (
  <Text style={[styles.addIcon, { fontSize: size, color }]}>+</Text>
);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    textAlign: 'center',
    fontWeight: '400',
  },
  addIcon: {
    fontWeight: '300',
    textAlign: 'center',
  },
});

export default TabIcon;
