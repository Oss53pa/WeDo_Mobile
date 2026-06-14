/**
 * Avatar — profile image with initials fallback, status dot, optional
 * gradient ring and verified badge. Theme-aware.
 */
import React from 'react';
import {View, Text, Image, StyleSheet, ViewStyle} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme, typography, avatarSize} from '@theme';
import type {GradientName} from '@theme';
import {GradientView} from './Gradient';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarProps {
  imageUrl?: string;
  name?: string;
  size?: AvatarSize | number;
  backgroundColor?: string;
  textColor?: string;
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'busy';
  showVerified?: boolean;
  /** gradient ring around the avatar */
  ring?: boolean;
  gradient?: GradientName;
  style?: ViewStyle;
  testID?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  imageUrl,
  name = '',
  size = 'md',
  backgroundColor,
  textColor,
  showStatus = false,
  status = 'offline',
  showVerified = false,
  ring = false,
  gradient = 'sunset',
  style,
  testID,
}) => {
  const {colors} = useTheme();
  const sizeValue = typeof size === 'number' ? size : avatarSize[size];

  const initials = (() => {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  })();

  // Couleur de fond déterministe par nom (initiales blanches) : contraste garanti
  // en clair comme en sombre, plutôt que crème-sur-crème.
  const palette = [
    colors.brand.terracotta,
    colors.brand.emerald,
    colors.brand.indigo,
    colors.brand.crimson,
  ];
  const hash = name
    ? name.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
    : 0;
  const autoBg = palette[hash % palette.length];

  const statusColor =
    status === 'online' ? colors.success : status === 'busy' ? colors.warning : colors.neutral[400];

  const circle = (
    <View
      style={[
        styles.avatar,
        {
          width: sizeValue,
          height: sizeValue,
          borderRadius: sizeValue / 2,
          backgroundColor: imageUrl ? colors.surface.sunken : backgroundColor ?? autoBg,
        },
      ]}>
      {imageUrl ? (
        <Image
          source={{uri: imageUrl}}
          style={{width: sizeValue, height: sizeValue, borderRadius: sizeValue / 2}}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.initials, {fontSize: sizeValue * 0.4, color: textColor ?? '#FFFFFF'}]}>
          {initials}
        </Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, style]} testID={testID}>
      {ring ? (
        <GradientView
          name={gradient}
          style={{
            width: sizeValue + 6,
            height: sizeValue + 6,
            borderRadius: (sizeValue + 6) / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View
            style={{
              padding: 2,
              borderRadius: (sizeValue + 4) / 2,
              backgroundColor: colors.bg.base,
            }}>
            {circle}
          </View>
        </GradientView>
      ) : (
        circle
      )}

      {showStatus && (
        <View
          style={[
            styles.status,
            {
              width: sizeValue * 0.26,
              height: sizeValue * 0.26,
              borderRadius: sizeValue * 0.13,
              backgroundColor: statusColor,
              borderColor: colors.bg.base,
            },
          ]}
        />
      )}

      {showVerified && (
        <View style={[styles.verified, {backgroundColor: colors.bg.base, borderRadius: sizeValue * 0.18}]}>
          <Icon name="check-decagram" size={sizeValue * 0.32} color={colors.brand.indigo} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {position: 'relative', alignSelf: 'flex-start'},
  avatar: {justifyContent: 'center', alignItems: 'center', overflow: 'hidden'},
  initials: {...typography.bodyMedium, fontWeight: '700'},
  status: {position: 'absolute', bottom: 0, right: 0, borderWidth: 2},
  verified: {position: 'absolute', bottom: -2, right: -2, justifyContent: 'center', alignItems: 'center'},
});

export default Avatar;
