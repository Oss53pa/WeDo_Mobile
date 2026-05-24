/**
 * TontineCard — themed list card for a tontine (default + compact variants).
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Card, Badge, ProgressBar, PressableScale} from '@components/common';
import {useTheme, useThemedStyles, typography, spacing, borderRadius, type ThemedTokens} from '@theme';
import {Tontine, TontineStatus} from '@types';
import {formatCurrency, formatFrequency} from '@utils/formatting';

export interface TontineCardProps {
  tontine: Tontine;
  onPress?: () => void;
  showProgress?: boolean;
  variant?: 'default' | 'compact';
}

const TontineCard: React.FC<TontineCardProps> = ({
  tontine,
  onPress,
  showProgress = true,
  variant = 'default',
}) => {
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);

  const statusTone = (status: TontineStatus): string => {
    switch (status) {
      case 'Active':
        return colors.success;
      case 'Open':
        return colors.brand.indigo;
      case 'Completed':
        return colors.text.tertiary;
      case 'Cancelled':
        return colors.error;
      default:
        return colors.text.tertiary;
    }
  };

  const statusLabel = (status: TontineStatus): string =>
    ({Active: 'Actif', Open: 'Ouvert', Completed: 'Terminé', Cancelled: 'Annulé'} as Record<string, string>)[
      status
    ] ?? status;

  const categoryMeta = (category: string): {icon: string; color: string; bg: string} => {
    switch (category) {
      case 'Family':
        return {icon: 'account-group', color: colors.brand.terracotta, bg: colors.brand.terracottaSoft};
      case 'Friends':
        return {icon: 'account-multiple', color: colors.brand.emerald, bg: colors.brand.emeraldSoft};
      case 'Professional':
        return {icon: 'briefcase', color: colors.brand.indigo, bg: colors.brand.indigoSoft};
      case 'Community':
        return {icon: 'town-hall', color: colors.brand.gold, bg: colors.brand.goldSoft};
      default:
        return {icon: 'wallet', color: colors.brand.terracotta, bg: colors.brand.terracottaSoft};
    }
  };

  const meta = categoryMeta(tontine.category);
  const progress = tontine.currentMembers ? (tontine.currentMembers / tontine.totalMembers) * 100 : 0;

  if (variant === 'compact') {
    return (
      <PressableScale onPress={onPress} style={s.compactCard}>
        <View style={[s.iconChip, {backgroundColor: meta.bg}]}>
          <Icon name={meta.icon} size={22} color={meta.color} />
        </View>
        <View style={{flex: 1}}>
          <Text style={s.name} numberOfLines={1}>
            {tontine.name}
          </Text>
          <Text style={s.muted}>{formatCurrency(tontine.contributionAmount, tontine.currency)}</Text>
        </View>
        <Icon name="chevron-right" size={22} color={colors.text.tertiary} />
      </PressableScale>
    );
  }

  return (
    <Card onPress={onPress} style={s.card} padding={spacing.md}>
      <View style={s.header}>
        <View style={[s.iconChip, {backgroundColor: meta.bg}]}>
          <Icon name={meta.icon} size={24} color={meta.color} />
        </View>
        <View style={{flex: 1, marginLeft: spacing.sm}}>
          <Text style={s.name} numberOfLines={1}>
            {tontine.name}
          </Text>
          {!!tontine.description && (
            <Text style={s.muted} numberOfLines={1}>
              {tontine.description}
            </Text>
          )}
        </View>
        <Badge variant="soft" tone={statusTone(tontine.status)} label={statusLabel(tontine.status)} size="small" />
      </View>

      <View style={s.infoRow}>
        <InfoChip icon="account-group" text={`${tontine.currentMembers}/${tontine.totalMembers}`} />
        <InfoChip icon="calendar" text={formatFrequency(tontine.frequency)} />
        <InfoChip icon="cash" text={formatCurrency(tontine.contributionAmount, tontine.currency)} />
      </View>

      {showProgress && tontine.status === 'Open' && (
        <View style={{marginTop: spacing.sm}}>
          <ProgressBar
            progress={progress}
            showPercentage
            showLabel
            label="Membres recrutés"
            height={6}
            gradientColors={[meta.color, meta.color]}
          />
        </View>
      )}
    </Card>
  );
};

const InfoChip: React.FC<{icon: string; text: string}> = ({icon, text}) => {
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  return (
    <View style={s.info}>
      <Icon name={icon} size={15} color={colors.text.tertiary} />
      <Text style={s.infoText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
};

const makeStyles = ({colors}: ThemedTokens) =>
  StyleSheet.create({
    card: {marginBottom: spacing.md},
    header: {flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md},
    iconChip: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700'},
    muted: {...typography.caption, color: colors.text.secondary, marginTop: 1},
    infoRow: {flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm},
    info: {flexDirection: 'row', alignItems: 'center', flex: 1, gap: 4},
    infoText: {...typography.caption, color: colors.text.secondary, flexShrink: 1},
    compactCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius.lg,
      padding: spacing.sm + 2,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
  });

export default TontineCard;
