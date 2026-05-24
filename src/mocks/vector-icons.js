/**
 * Web implementation for react-native-vector-icons
 * Uses Material Design Icons with CSS classes for web compatibility
 */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

// Icon name mapping from MaterialCommunityIcons to MDI CSS classes
const iconNameMap = {
  // Navigation & UI
  'home': 'mdi-home',
  'home-outline': 'mdi-home-outline',
  'menu': 'mdi-menu',
  'close': 'mdi-close',
  'close-circle': 'mdi-close-circle',
  'check': 'mdi-check',
  'check-circle': 'mdi-check-circle',
  'chevron-left': 'mdi-chevron-left',
  'chevron-right': 'mdi-chevron-right',
  'chevron-up': 'mdi-chevron-up',
  'chevron-down': 'mdi-chevron-down',
  'arrow-left': 'mdi-arrow-left',
  'arrow-right': 'mdi-arrow-right',
  'arrow-up': 'mdi-arrow-up',
  'arrow-down': 'mdi-arrow-down',
  'arrow-up-circle': 'mdi-arrow-up-circle',
  'arrow-down-circle': 'mdi-arrow-down-circle',
  'dots-horizontal': 'mdi-dots-horizontal',
  'dots-vertical': 'mdi-dots-vertical',
  'plus': 'mdi-plus',
  'plus-circle': 'mdi-plus-circle',
  'minus': 'mdi-minus',
  'minus-circle': 'mdi-minus-circle',
  'refresh': 'mdi-refresh',
  'reload': 'mdi-reload',

  // User & Account
  'account': 'mdi-account',
  'account-circle': 'mdi-account-circle',
  'account-outline': 'mdi-account-outline',
  'account-group': 'mdi-account-group',
  'account-multiple': 'mdi-account-multiple',
  'account-multiple-plus': 'mdi-account-multiple-plus',
  'account-plus': 'mdi-account-plus',

  // Communication
  'message': 'mdi-message',
  'message-outline': 'mdi-message-outline',
  'message-text': 'mdi-message-text',
  'email': 'mdi-email',
  'email-outline': 'mdi-email-outline',
  'bell': 'mdi-bell',
  'bell-outline': 'mdi-bell-outline',
  'bell-ring': 'mdi-bell-ring',
  'phone': 'mdi-phone',
  'send': 'mdi-send',
  'chat': 'mdi-chat',
  'chat-outline': 'mdi-chat-outline',

  // Finance & Money
  'wallet': 'mdi-wallet',
  'wallet-outline': 'mdi-wallet-outline',
  'wallet-plus': 'mdi-wallet-plus',
  'cash': 'mdi-cash',
  'cash-multiple': 'mdi-cash-multiple',
  'credit-card': 'mdi-credit-card',
  'credit-card-outline': 'mdi-credit-card-outline',
  'bank': 'mdi-bank',
  'bank-transfer': 'mdi-bank-transfer',
  'currency-usd': 'mdi-currency-usd',
  'chart-line': 'mdi-chart-line',
  'chart-bar': 'mdi-chart-bar',
  'trending-up': 'mdi-trending-up',
  'percent': 'mdi-percent',
  'calculator': 'mdi-calculator',
  'receipt': 'mdi-receipt',

  // Settings & Tools
  'cog': 'mdi-cog',
  'settings': 'mdi-cog',
  'cog-outline': 'mdi-cog-outline',
  'settings-outline': 'mdi-cog-outline',
  'tune': 'mdi-tune',
  'filter': 'mdi-filter',
  'filter-outline': 'mdi-filter-outline',
  'magnify': 'mdi-magnify',
  'pencil': 'mdi-pencil',
  'pencil-outline': 'mdi-pencil-outline',
  'delete': 'mdi-delete',
  'trash-can': 'mdi-trash-can',
  'trash-can-outline': 'mdi-trash-can-outline',

  // Security
  'lock': 'mdi-lock',
  'lock-outline': 'mdi-lock-outline',
  'lock-open': 'mdi-lock-open',
  'shield': 'mdi-shield',
  'shield-check': 'mdi-shield-check',
  'shield-lock': 'mdi-shield-lock',
  'security': 'mdi-security',
  'key': 'mdi-key',
  'fingerprint': 'mdi-fingerprint',
  'eye': 'mdi-eye',
  'eye-off': 'mdi-eye-off',
  'eye-outline': 'mdi-eye-outline',
  'eye-off-outline': 'mdi-eye-off-outline',

  // Time & Calendar
  'clock': 'mdi-clock',
  'clock-outline': 'mdi-clock-outline',
  'clock-check': 'mdi-clock-check',
  'timer': 'mdi-timer',
  'calendar': 'mdi-calendar',
  'calendar-clock': 'mdi-calendar-clock',
  'history': 'mdi-history',

  // Files & Media
  'file': 'mdi-file',
  'file-document': 'mdi-file-document',
  'folder': 'mdi-folder',
  'image': 'mdi-image',
  'camera': 'mdi-camera',
  'camera-outline': 'mdi-camera-outline',
  'attachment': 'mdi-attachment',
  'download': 'mdi-download',
  'upload': 'mdi-upload',
  'share': 'mdi-share',
  'share-variant': 'mdi-share-variant',
  'content-copy': 'mdi-content-copy',
  'qrcode': 'mdi-qrcode',
  'qrcode-scan': 'mdi-qrcode-scan',

  // Status & Feedback
  'alert': 'mdi-alert',
  'alert-circle': 'mdi-alert-circle',
  'alert-circle-outline': 'mdi-alert-circle-outline',
  'information': 'mdi-information',
  'information-outline': 'mdi-information-outline',
  'help': 'mdi-help',
  'help-circle': 'mdi-help-circle',
  'help-circle-outline': 'mdi-help-circle-outline',
  'star': 'mdi-star',
  'star-outline': 'mdi-star-outline',
  'heart': 'mdi-heart',
  'heart-outline': 'mdi-heart-outline',
  'thumb-up': 'mdi-thumb-up',
  'thumb-down': 'mdi-thumb-down',
  'emoticon': 'mdi-emoticon',
  'emoticon-happy': 'mdi-emoticon-happy',

  // Location & Maps
  'map-marker': 'mdi-map-marker',
  'map-marker-outline': 'mdi-map-marker-outline',
  'compass': 'mdi-compass',
  'earth': 'mdi-earth',
  'flag': 'mdi-flag',
  'pin': 'mdi-pin',

  // Social
  'facebook': 'mdi-facebook',
  'google': 'mdi-google',
  'twitter': 'mdi-twitter',
  'instagram': 'mdi-instagram',
  'linkedin': 'mdi-linkedin',
  'whatsapp': 'mdi-whatsapp',
  'youtube': 'mdi-youtube',
  'github': 'mdi-github',

  // Devices
  'cellphone': 'mdi-cellphone',
  'laptop': 'mdi-laptop',
  'tablet': 'mdi-tablet',
  'wifi': 'mdi-wifi',
  'wifi-off': 'mdi-wifi-off',
  'bluetooth': 'mdi-bluetooth',

  // Misc
  'gift': 'mdi-gift',
  'trophy': 'mdi-trophy',
  'crown': 'mdi-crown',
  'bookmark': 'mdi-bookmark',
  'tag': 'mdi-tag',
  'power': 'mdi-power',
  'logout': 'mdi-logout',
  'logout-variant': 'mdi-logout-variant',
  'login': 'mdi-login',
  'translate': 'mdi-translate',
  'apps': 'mdi-apps',
  'grid': 'mdi-grid',
  'view-grid': 'mdi-view-grid',
  'view-list': 'mdi-view-list',
  'format-list-bulleted': 'mdi-format-list-bulleted',
  'sync': 'mdi-sync',
  'cloud': 'mdi-cloud',
  'link': 'mdi-link',
  'printer': 'mdi-printer',
  'export': 'mdi-export',
  'import': 'mdi-import',
};

// Emoji fallback for unsupported icons
const emojiMap = {
  'home': '🏠',
  'home-outline': '🏠',
  'account': '👤',
  'account-circle': '👤',
  'account-outline': '👤',
  'account-group': '👥',
  'account-multiple': '👥',
  'message': '💬',
  'message-outline': '💬',
  'bell': '🔔',
  'bell-outline': '🔔',
  'wallet': '💰',
  'wallet-outline': '💰',
  'cash': '💵',
  'cash-multiple': '💰',
  'bank': '🏦',
  'credit-card': '💳',
  'settings': '⚙️',
  'cog': '⚙️',
  'lock': '🔒',
  'key': '🔑',
  'star': '⭐',
  'heart': '❤️',
  'check': '✓',
  'check-circle': '✅',
  'close': '✕',
  'plus': '+',
  'minus': '-',
  'magnify': '🔍',
  'calendar': '📅',
  'clock': '🕐',
  'phone': '📱',
  'email': '📧',
  'camera': '📷',
  'share': '↗️',
  'download': '⬇️',
  'upload': '⬆️',
  'refresh': '🔄',
  'alert': '⚠️',
  'information': 'ℹ️',
  'help': '❓',
  'gift': '🎁',
  'trophy': '🏆',
  'crown': '👑',
  'earth': '🌍',
  'logout': '🚪',
};

const createIconSet = (nameMap, fallbackMap) => {
  const Icon = ({ name, size = 24, color = '#000', style, ...props }) => {
    const mdiClass = nameMap[name];
    const emoji = fallbackMap[name];

    // Use the MDI CSS class approach
    if (mdiClass && typeof document !== 'undefined') {
      return (
        <Text
          className={`mdi ${mdiClass}`}
          style={[
            {
              fontSize: size,
              color,
              width: size,
              height: size,
              lineHeight: size,
              textAlign: 'center',
            },
            style,
          ]}
          selectable={false}
          {...props}
        />
      );
    }

    // Fallback to emoji or placeholder
    return (
      <Text
        style={[
          {
            fontSize: size * 0.8,
            color,
            width: size,
            height: size,
            lineHeight: size,
            textAlign: 'center',
          },
          style,
        ]}
        {...props}
      >
        {emoji || '•'}
      </Text>
    );
  };

  Icon.Button = ({
    name,
    size = 24,
    color = '#fff',
    backgroundColor = '#007AFF',
    borderRadius = 5,
    iconStyle,
    style,
    children,
    onPress,
    ...props
  }) => (
    <TouchableOpacity
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor,
          borderRadius,
          padding: 8,
        },
        style,
      ]}
      onPress={onPress}
      {...props}
    >
      <Icon name={name} size={size} color={color} style={iconStyle} />
      {children && (
        <Text style={{ color, marginLeft: 8, fontSize: size * 0.7 }}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );

  Icon.displayName = 'Icon';
  Icon.Button.displayName = 'IconButton';

  return Icon;
};

const MaterialCommunityIcons = createIconSet(iconNameMap, emojiMap);
const MaterialIcons = MaterialCommunityIcons;
const FontAwesome = MaterialCommunityIcons;
const FontAwesome5 = MaterialCommunityIcons;
const Ionicons = MaterialCommunityIcons;
const Feather = MaterialCommunityIcons;
const AntDesign = MaterialCommunityIcons;
const Entypo = MaterialCommunityIcons;
const EvilIcons = MaterialCommunityIcons;
const Foundation = MaterialCommunityIcons;
const Octicons = MaterialCommunityIcons;
const SimpleLineIcons = MaterialCommunityIcons;
const Zocial = MaterialCommunityIcons;

export {
  MaterialCommunityIcons,
  MaterialIcons,
  FontAwesome,
  FontAwesome5,
  Ionicons,
  Feather,
  AntDesign,
  Entypo,
  EvilIcons,
  Foundation,
  Octicons,
  SimpleLineIcons,
  Zocial,
  createIconSet,
};

export default MaterialCommunityIcons;
