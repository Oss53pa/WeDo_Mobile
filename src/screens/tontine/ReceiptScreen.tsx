/**
 * ReceiptScreen — reçu infalsifiable partageable.
 *
 * Matérialise un mouvement du registre SHA-256 (cotisation / distribution / …) en
 * un reçu horodaté, rattaché au hash chaîné de l'événement. Le membre peut le
 * consulter et le partager hors de l'app (preuve infalsifiable). Aucune donnée
 * sensible d'autrui : on n'expose que le type, le tour, le montant et le hash.
 */
import React, {useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, Share} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {ScreenHeader, Card, Button, Badge, useToast} from '@components/common';
import {CheckIcon, LockIcon, ShareIcon} from '@components/icons';
import {
  useTheme,
  useThemedStyles,
  typography,
  spacing,
  borderRadius,
  type ThemedTokens,
} from '@theme';
import {RootStackParamList} from '@navigation/types';
import {formatCurrency, formatDateTime} from '@utils/formatting';

type Nav = StackNavigationProp<RootStackParamList, 'Receipt'>;
type Route = RouteProp<RootStackParamList, 'Receipt'>;

const TYPE_LABELS: Record<string, string> = {
  cotisation: 'Cotisation',
  distribution: 'Distribution',
  penalite: 'Pénalité',
  remboursement: 'Remboursement',
  depot_sequestre: 'Dépôt séquestre',
  retrait_sequestre: 'Retrait séquestre',
};

const ReceiptScreen: React.FC<{navigation: Nav; route: Route}> = ({navigation, route}) => {
  const {receipt, tontineName, devise = 'XOF'} = route.params;
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const {show} = useToast();

  const credit = receipt.sens === 'credit';
  const tone = credit ? colors.brand.emerald : colors.brand.terracotta;
  const label = TYPE_LABELS[receipt.type] ?? receipt.type;

  const onShare = useCallback(async () => {
    const lines = [
      'Reçu WeDo — preuve infalsifiable',
      '',
      `${label}${receipt.round ? ` · tour ${receipt.round}` : ''}`,
      `Montant : ${credit ? '+' : '−'}${formatCurrency(receipt.montant, devise)}`,
      `Date : ${formatDateTime(receipt.createdAt)}`,
      tontineName ? `Tontine : ${tontineName}` : null,
      `Mouvement n°${receipt.seq}`,
      '',
      `Empreinte SHA-256 :`,
      receipt.hash,
      `Maillon précédent :`,
      receipt.prevHash || '— (premier mouvement)',
      '',
      'Chaque mouvement est chaîné en SHA-256 dans le registre WeDo : toute',
      'altération casse la chaîne. Vérifiable dans l’app WeDo.',
    ].filter(Boolean);
    try {
      await Share.share({message: lines.join('\n')});
    } catch {
      show('Partage annulé.', {type: 'info'});
    }
  }, [receipt, label, credit, devise, tontineName, show]);

  return (
    <View style={s.container}>
      <ScreenHeader title="Reçu" subtitle="Preuve infalsifiable" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.lg,
          paddingTop: spacing.sm,
        }}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(360)}>
          <Card variant="default" padding={spacing.lg}>
            {/* En-tête montant */}
            <View style={s.head}>
              <View style={[s.headIcon, {backgroundColor: tone + '1A'}]}>
                <CheckIcon size={26} color={tone} />
              </View>
              <Text style={s.label}>{label}{receipt.round ? ` · tour ${receipt.round}` : ''}</Text>
              <Text style={[s.amount, {color: tone}]}>
                {credit ? '+' : '−'}{formatCurrency(receipt.montant, devise)}
              </Text>
              <Text style={s.date}>{formatDateTime(receipt.createdAt)}</Text>
            </View>

            <View style={s.divider} />

            {/* Détails */}
            {tontineName ? (
              <Row label="Tontine" value={tontineName} s={s} />
            ) : null}
            <Row label="Mouvement" value={`n°${receipt.seq}`} s={s} />
            {receipt.referenceExterne ? (
              <Row label="Référence" value={receipt.referenceExterne} s={s} />
            ) : null}

            <View style={s.divider} />

            {/* Empreinte chaînée */}
            <View style={s.chainHead}>
              <LockIcon size={16} color={colors.brand.indigo} />
              <Text style={s.chainTitle}>Empreinte SHA-256 (chaînée)</Text>
            </View>
            <Text style={s.hash} selectable>{receipt.hash}</Text>
            <Text style={s.chainLabel}>Maillon précédent</Text>
            <Text style={s.hashPrev} selectable numberOfLines={2}>
              {receipt.prevHash || '— (premier mouvement)'}
            </Text>

            <Badge
              variant="soft"
              tone={colors.brand.emerald}
              label="Inscrit au registre infalsifiable"
              size="small"
            />
          </Card>
        </Animated.View>

        <Text style={s.note}>
          Chaque mouvement est chaîné en SHA-256 : toute altération d'un montant ou d'une date
          casse la chaîne et devient détectable par n'importe quel membre.
        </Text>

        <Button
          title="Partager le reçu"
          variant="gradient"
          gradient="indigo"
          size="large"
          fullWidth
          onPress={onShare}
          style={{marginTop: spacing.lg}}
        />
        <Button
          title="Vérifier le registre"
          variant="outline"
          size="medium"
          icon="shield-check"
          fullWidth
          onPress={() => navigation.goBack()}
          style={{marginTop: spacing.sm}}
        />
      </ScrollView>
    </View>
  );
};

const Row: React.FC<{label: string; value: string; s: any}> = ({label, value, s}) => (
  <View style={s.row}>
    <Text style={s.rowLabel}>{label}</Text>
    <Text style={s.rowValue} numberOfLines={1}>{value}</Text>
  </View>
);

const makeStyles = ({colors}: ThemedTokens) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg.base},
    head: {alignItems: 'center'},
    headIcon: {width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
    label: {...typography.bodyMedium, color: colors.text.secondary, fontWeight: '700', marginTop: spacing.md},
    amount: {...typography.h1, fontWeight: '800', marginTop: 4, fontVariant: ['tabular-nums']},
    date: {...typography.caption, color: colors.text.secondary, marginTop: 2},
    divider: {height: 1, backgroundColor: colors.border.subtle, marginVertical: spacing.lg},
    row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.sm},
    rowLabel: {...typography.caption, color: colors.text.secondary},
    rowValue: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700', flexShrink: 1},
    chainHead: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm},
    chainTitle: {...typography.captionMedium, color: colors.text.primary, fontWeight: '700'},
    hash: {...typography.small, color: colors.text.primary, fontVariant: ['tabular-nums'], lineHeight: 18},
    chainLabel: {...typography.small, color: colors.text.secondary, marginTop: spacing.md},
    hashPrev: {...typography.small, color: colors.text.tertiary, fontVariant: ['tabular-nums'], lineHeight: 18, marginBottom: spacing.md},
    note: {...typography.caption, color: colors.text.secondary, marginTop: spacing.lg, textAlign: 'center'},
  });

export default ReceiptScreen;
