/**
 * RegistreScreen — the infalsifiable, SHA-256 hash-chained ledger.
 *
 * This is the "0 litige" surface: every cotisation and distribution is an
 * append-only `mouvement` chained in SHA-256. A live verification banner runs
 * `verifier_registre` (independent chain recompute + escrow-conservation check)
 * so any member can prove the books are intact and no funds went missing.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, RefreshControl} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {
  ScreenHeader,
  Card,
  Button,
  Badge,
  LoadingSpinner,
  EmptyState,
  PressableScale,
} from '@components/common';
import {
  CheckIcon,
  AlertIcon,
  LockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  RefreshIcon,
  ChevronRightIcon,
} from '@components/icons';
import {
  useTheme,
  useThemedStyles,
  typography,
  spacing,
  borderRadius,
  type ThemedTokens,
} from '@theme';
import {RootStackParamList} from '@navigation/types';
import * as trustApi from '@services/api/trust.api';
import {formatCurrency, formatDateTime} from '@utils/formatting';

type Nav = StackNavigationProp<RootStackParamList, 'Registre'>;
type Route = RouteProp<RootStackParamList, 'Registre'>;

const TYPE_LABELS: Record<trustApi.MouvementType, string> = {
  cotisation: 'Cotisation',
  distribution: 'Distribution',
  penalite: 'Pénalité',
  remboursement: 'Remboursement',
  depot_sequestre: 'Dépôt séquestre',
  retrait_sequestre: 'Retrait séquestre',
};

const RegistreScreen: React.FC<{navigation: Nav; route: Route}> = ({
  navigation,
  route,
}) => {
  const {tontineId} = route.params;
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [mouvements, setMouvements] = useState<trustApi.Mouvement[]>([]);
  const [sequestre, setSequestre] = useState<trustApi.Sequestre | null>(null);
  const [check, setCheck] = useState<trustApi.RegistreVerification | null>(null);

  const devise = sequestre?.devise ?? 'XOF';

  const load = useCallback(async () => {
    try {
      const [reg, seq] = await Promise.all([
        trustApi.getRegistre(tontineId),
        trustApi.getSequestre(tontineId),
      ]);
      setMouvements(reg);
      setSequestre(seq);
    } finally {
      setLoading(false);
    }
  }, [tontineId]);

  const verify = useCallback(async () => {
    setVerifying(true);
    try {
      setCheck(await trustApi.verifierRegistre(tontineId));
    } catch {
      setCheck(null);
    } finally {
      setVerifying(false);
    }
  }, [tontineId]);

  useEffect(() => {
    load();
    verify();
  }, [load, verify]);

  if (loading) return <LoadingSpinner fullScreen text="Chargement du registre…" />;

  const valid = check?.valid && check?.conservationOk;
  const bannerColor = check == null
    ? colors.text.tertiary
    : valid
    ? colors.brand.emerald
    : colors.error;

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Registre infalsifiable"
        subtitle="Chaîne SHA-256 · append-only"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.lg,
          paddingTop: spacing.sm,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => {load(); verify();}} />
        }>
        {/* Verification banner */}
        <Animated.View entering={FadeInDown.duration(360)}>
          <Card variant="default" padding={spacing.lg}>
            <View style={s.bannerHead}>
              <View style={[s.bannerIcon, {backgroundColor: bannerColor + '1A'}]}>
                {valid ? (
                  <CheckIcon size={22} color={bannerColor} />
                ) : (
                  <AlertIcon size={22} color={bannerColor} />
                )}
              </View>
              <View style={{flex: 1}}>
                <Text style={[s.bannerTitle, {color: bannerColor}]}>
                  {check == null
                    ? 'Vérification…'
                    : valid
                    ? 'Registre vérifié'
                    : check.error
                    ? check.error
                    : 'Anomalie détectée'}
                </Text>
                <Text style={s.bannerSub}>
                  {valid
                    ? `${check?.length ?? 0} mouvements · chaîne intacte · fonds conservés`
                    : check?.brokenAtSeq != null
                    ? `Chaîne rompue au mouvement #${check.brokenAtSeq}`
                    : 'Impossible de confirmer l’intégrité'}
                </Text>
              </View>
            </View>

            {check && valid && (
              <View style={s.conservation}>
                <View style={s.consItem}>
                  <Text style={s.consLabel}>Solde calculé</Text>
                  <Text style={s.consValue}>{formatCurrency(check.soldeCalcule, devise)}</Text>
                </View>
                <View style={s.consDivider} />
                <View style={s.consItem}>
                  <Text style={s.consLabel}>Solde séquestre</Text>
                  <Text style={s.consValue}>{formatCurrency(check.soldeSequestre, devise)}</Text>
                </View>
              </View>
            )}

            <Button
              title="Vérifier maintenant"
              variant="outline"
              size="medium"
              icon="refresh"
              fullWidth
              loading={verifying}
              disabled={verifying}
              onPress={verify}
              style={{marginTop: spacing.md}}
            />
          </Card>
        </Animated.View>

        {/* Séquestre card */}
        <Animated.View entering={FadeInDown.delay(60).duration(360)} style={s.section}>
          <Card variant="default" padding={spacing.lg}>
            <View style={s.seqHead}>
              <View style={[s.bannerIcon, {backgroundColor: colors.brand.indigoSoft}]}>
                <LockIcon size={20} color={colors.brand.indigo} />
              </View>
              <View style={{flex: 1}}>
                <Text style={s.seqTitle}>Séquestre (cantonnement EME)</Text>
                {sequestre ? (
                  <Text style={s.seqRef}>Réf. {sequestre.emeAccountRef}</Text>
                ) : (
                  <Text style={s.seqRef}>Réservé au niveau de vérification P2</Text>
                )}
              </View>
            </View>
            {sequestre && (
              <Text style={s.seqBalance}>
                {formatCurrency(sequestre.soldeCantonne, sequestre.devise)}
              </Text>
            )}
          </Card>
        </Animated.View>

        {/* Ledger */}
        <Animated.View entering={FadeInDown.delay(120).duration(360)} style={s.section}>
          <View style={s.sectionHeadRow}>
            <Text style={s.sectionTitle}>Mouvements</Text>
            <Badge variant="count" label={String(mouvements.length)} size="small" />
          </View>

          {mouvements.length === 0 ? (
            <EmptyState
              icon="history"
              title="Registre vide"
              description="Aucun mouvement enregistré pour le moment."
            />
          ) : (
            mouvements.map((m, i) => {
              const credit = m.sens === 'credit';
              const tone = credit ? colors.brand.emerald : colors.brand.terracotta;
              return (
                <Animated.View
                  key={m.id}
                  entering={FadeInDown.delay(140 + i * 24).duration(300)}>
                  <PressableScale
                    style={s.mvtRow}
                    onPress={() =>
                      navigation.navigate('Receipt', {
                        receipt: {
                          id: m.id, type: m.type, sens: m.sens, montant: m.montant,
                          round: m.round, seq: m.seq, hash: m.hash, prevHash: m.prevHash,
                          createdAt: m.createdAt, referenceExterne: m.referenceExterne,
                        },
                        devise,
                      })
                    }>
                    <View style={[s.mvtIcon, {backgroundColor: tone + '14'}]}>
                      {credit ? (
                        <ArrowDownIcon size={18} color={tone} />
                      ) : (
                        <ArrowUpIcon size={18} color={tone} />
                      )}
                    </View>
                    <View style={{flex: 1}}>
                      <View style={s.mvtTopRow}>
                        <Text style={s.mvtType} numberOfLines={1}>
                          {TYPE_LABELS[m.type]}
                          {m.round ? ` · tour ${m.round}` : ''}
                        </Text>
                        <Text style={[s.mvtAmount, {color: tone}]}>
                          {credit ? '+' : '−'}
                          {formatCurrency(m.montant, devise)}
                        </Text>
                      </View>
                      <Text style={s.mvtMeta}>
                        #{m.seq} · {formatDateTime(m.createdAt)}
                      </Text>
                      <Text style={s.mvtHash} numberOfLines={1}>
                        ⛓ {m.hash.slice(0, 24)}… · Voir le reçu
                      </Text>
                    </View>
                    <ChevronRightIcon size={18} color={colors.text.tertiary} />
                  </PressableScale>
                </Animated.View>
              );
            })
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg.base},
    bannerHead: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
    bannerIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bannerTitle: {...typography.bodyMedium, fontWeight: '800'},
    bannerSub: {...typography.caption, color: colors.text.secondary, marginTop: 2},
    conservation: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    consItem: {flex: 1},
    consDivider: {width: 1, height: 32, backgroundColor: colors.border.subtle},
    consLabel: {...typography.small, color: colors.text.secondary},
    consValue: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '800', marginTop: 2},
    section: {marginTop: spacing.xl},
    seqHead: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
    seqTitle: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700'},
    seqRef: {...typography.caption, color: colors.text.secondary, marginTop: 2},
    seqBalance: {...typography.h2, color: colors.brand.indigo, fontWeight: '800', marginTop: spacing.md},
    sectionHeadRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md},
    sectionTitle: {...typography.h3, color: colors.text.primary, fontWeight: '700'},
    mvtRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.sm,
      shadowColor: colors.shadowColor,
    },
    mvtIcon: {width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
    mvtTopRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm},
    mvtType: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700', flex: 1},
    mvtAmount: {...typography.bodyMedium, fontWeight: '800'},
    mvtMeta: {...typography.small, color: colors.text.secondary, marginTop: 2},
    mvtHash: {...typography.small, color: colors.text.tertiary, marginTop: 2, fontVariant: ['tabular-nums']},
  });

export default RegistreScreen;
