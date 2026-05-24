/**
 * SimpleIcon - Composant d'icônes Unicode monochromes
 * Fonctionne sur tous les appareils sans dépendances externes
 */

import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';

// Bibliothèque d'icônes Unicode simples et fiables
const ICON_MAP = {
  // Navigation
  'home': '⌂',
  'home-outline': '⌂',
  'menu': '☰',
  'close': '✕',
  'back': '←',
  'forward': '→',
  'up': '↑',
  'down': '↓',
  'chevron-left': '‹',
  'chevron-right': '›',
  'chevron-up': '⌃',
  'chevron-down': '⌄',

  // Actions
  'plus': '+',
  'plus-circle': '⊕',
  'minus': '−',
  'minus-circle': '⊖',
  'check': '✓',
  'check-circle': '✓',
  'close-circle': '⊗',
  'refresh': '↻',
  'search': '○',
  'magnify': '◎',
  'filter': '▽',
  'sort': '⇅',
  'edit': '✎',
  'pencil': '✎',
  'delete': '✕',
  'trash': '▢',
  'share': '↗',
  'download': '↓',
  'upload': '↑',
  'copy': '⧉',
  'link': '⚭',

  // User & Account
  'account': '●',
  'account-outline': '○',
  'account-circle': '◉',
  'account-group': '●●',
  'account-multiple': '●●',
  'user': '●',
  'user-outline': '○',
  'users': '●●',

  // Communication
  'message': '◆',
  'message-outline': '◇',
  'chat': '◆',
  'chat-outline': '◇',
  'bell': '◉',
  'bell-outline': '◎',
  'notification': '●',
  'email': '✉',
  'phone': '☎',
  'send': '➤',

  // Finance & Money
  'wallet': '▣',
  'wallet-outline': '▢',
  'cash': '◧',
  'money': '◧',
  'credit-card': '▭',
  'bank': '⌂',
  'coins': '●●●',
  'chart': '◪',
  'chart-line': '╱',
  'trending-up': '↗',
  'trending-down': '↘',
  'percent': '%',

  // Status
  'success': '✓',
  'error': '✕',
  'warning': '⚠',
  'info': 'ⓘ',
  'alert': '⚠',
  'alert-circle': '⊛',
  'help': '?',
  'help-circle': '?',

  // Objects
  'star': '★',
  'star-outline': '☆',
  'heart': '♥',
  'heart-outline': '♡',
  'lock': '⬤',
  'lock-outline': '○',
  'unlock': '○',
  'key': '⚷',
  'shield': '◆',
  'shield-check': '◆',
  'eye': '◉',
  'eye-off': '◎',
  'eye-outline': '◎',
  'calendar': '▢',
  'clock': '◔',
  'clock-outline': '◔',
  'timer': '◔',
  'history': '↺',
  'settings': '⚙',
  'cog': '⚙',
  'gear': '⚙',
  'camera': '◻',
  'image': '◻',
  'file': '▢',
  'folder': '▢',
  'document': '▢',

  // Arrows & Direction
  'arrow-left': '←',
  'arrow-right': '→',
  'arrow-up': '↑',
  'arrow-down': '↓',
  'arrow-up-circle': '⬆',
  'arrow-down-circle': '⬇',

  // Geometric shapes for custom use
  'circle': '●',
  'circle-outline': '○',
  'square': '■',
  'square-outline': '□',
  'diamond': '◆',
  'diamond-outline': '◇',
  'triangle': '▲',
  'triangle-outline': '△',

  // Misc
  'more': '⋯',
  'dots-horizontal': '⋯',
  'dots-vertical': '⋮',
  'options': '⋮',
  'qrcode': '▦',
  'fingerprint': '◉',
  'logout': '→',
  'login': '←',
  'gift': '◈',
  'trophy': '◆',
  'crown': '◇',
  'flag': '▸',
  'pin': '◉',
  'location': '◉',
  'map-marker': '◉',
} as const;

type IconName = keyof typeof ICON_MAP;

interface SimpleIconProps {
  name: IconName | string;
  size?: number;
  color?: string;
  style?: TextStyle;
}

export const SimpleIcon: React.FC<SimpleIconProps> = ({
  name,
  size = 24,
  color = '#3A3A3A',
  style,
}) => {
  const symbol = ICON_MAP[name as IconName] || '•';

  return (
    <Text
      style={[
        styles.icon,
        {
          fontSize: size,
          color,
          lineHeight: size * 1.1,
          width: size,
          height: size,
        },
        style,
      ]}
    >
      {symbol}
    </Text>
  );
};

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
    fontWeight: '400',
  },
});

// Export aussi comme Icon pour remplacer facilement les imports existants
export const Icon = SimpleIcon;

export default SimpleIcon;
