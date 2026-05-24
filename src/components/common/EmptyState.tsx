/**
 * EmptyState — premium empty/zero-data state with a Kente emblem illustration.
 * API preserved: icon (MCI name, optional overlay), title, description, action.
 */
import React from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme, typography, spacing} from '@theme';
import Button from './Button';
import {KenteEmblem} from '../patterns';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  iconColor?: string;
  emblemColor?: string;
  emblemAccent?: string;
  style?: ViewStyle;
  testID?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  iconColor,
  emblemColor,
  emblemAccent,
  style,
  testID,
}) => {
  const {colors} = useTheme();

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.art}>
        <KenteEmblem size={132} color={emblemColor} accent={emblemAccent} />
        {icon && (
          <View style={styles.iconOverlay} pointerEvents="none">
            <Icon name={icon} size={34} color={iconColor ?? colors.brand.terracotta} />
          </View>
        )}
      </View>

      <Text style={[styles.title, {color: colors.text.primary}]}>{title}</Text>
      {description && (
        <Text style={[styles.description, {color: colors.text.secondary}]}>{description}</Text>
      )}

      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="gradient" style={styles.button} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  art: {marginBottom: spacing.lg, alignItems: 'center', justifyContent: 'center'},
  iconOverlay: {...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center'},
  title: {...typography.h2, textAlign: 'center', marginBottom: spacing.sm},
  description: {...typography.body, textAlign: 'center', marginBottom: spacing.lg, maxWidth: '82%'},
  button: {marginTop: spacing.sm, minWidth: 200},
});

export default EmptyState;
