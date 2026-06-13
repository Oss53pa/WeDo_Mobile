/**
 * OrganizerDashboardScreen — the organizer's at-a-glance control panel:
 * current round, payments collected vs. expected, next due date, escrow balance,
 * members at risk, and a one-tap link to the infalsifiable registre.
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
  Avatar,
  LoadingSpinner,
  EmptyState,
  PressableScale,
  useToast,
} from '@components/common';
import {
  CalendarIcon,
  CheckIcon,
  AlertIcon,
  LockIcon,
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
import {formatCurrency, formatDate} from '@utils/formatting';

type Nav = StackNavigationProp<RootStackParamList, 'OrganizerDashboard'>;
type Route = RouteProp<RootStackParamList, 'OrganizerDashboard'>;

const OrganizerDashboardScreen: React.FC<{navigation: Nav; route: Route}> = ({
  navigation,
  route,
}) => {
  const {tontineId} = route.params;
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const {show} = useToast();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<trustApi.OrganizerOverview | null>(null);
  const [sequestre, setSequestre] = useState<trustApi.Sequestre | null>(null);
  const [check, setCheck] = useState<trustApi.RegistreVerification | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [ov, seq, vr] = await Promise.all([
        trustApi.getOrganizerOverview(tontineId),
        trustApi.getSequestre(tontineId),
        trustApi.verifierRegistre(tontineId).catch(() => null),
      ]);
      setOverview(ov);
      setSequestre(seq);
      setCheck(vr);
    } finally {
      setLoading(false);
    }
  }, [tontineId]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmPayment = useCallback(
    async (contributionId: string, name: string) => {
      setConfirmingId(contributionId);
      try {
        const res = await trustApi.confirmerPaiementMembre(contributionId);
        if (res.success) {
          show(
            res.distribution
              ? `Paiement de ${name} confirmé — le tour est complet, distribution effectuée !`
              : `Paiement de ${name} confirmé et versé au séquestre.`,
            {type: 'success'},
          );
          await load();
        } else {
          show(res.error ?? 'Confirmation impossible.', {type: 'error'});
        }
      } catch (e: any) {
        show(e?.message ?? 'Confirmation impossible.', {type: 'error'});
      } finally {
        setConfirmingId(null);
      }
    },
    [load, show],
  );

  if (loading) return <LoadingSpinner fullScreen text="Chargement du tableau de bord…" />;

  const o = overview!;
  const progress = o.activeCount > 0 ? o.paidCount / o.activeCount : 0;
  const remaining = Math.max(o.activeCount - o.paidCount, 0);
  const devise = sequestre?.devise ?? 'XOF';
  const registreOk = check?.valid && check?.conservationOk;

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Tableau de bord"
        subtitle={`Tour ${o.round}/${o.totalRounds}`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.lg,
          paddingTop: spacing.sm,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}>
        {/* Round progress */}
        <Animated.View entering={FadeInDown.duration(360)}>
          <Card variant="default" padding={spacing.lg}>
            <View style={s.rowBetween}>
              <Text style={s.cardTitle}>Cotisations du tour {o.round}</Text>
              <Badge
                variant="soft"
                tone={remaining === 0 ? colors.brand.emerald : colors.brand.gold}
                label={`${o.paidCount}/${o.activeCount}`}
                size="small"
              />
            </View>
            <View style={s.progressTrack}>
              <View
                style={[
                  s.progressFill,
                  {
                    width: `${Math.round(progress * 100)}%`,
                    backgroundColor: remaining === 0 ? colors.brand.emerald : colors.brand.gold,
                  },
                ]}
              />
            </View>
            <Text style={s.progressHint}>
              {remaining === 0
                ? 'Tous les membres ont cotisé — distribution automatique imminente.'
                : `${remaining} cotisation${remaining > 1 ? 's' : ''} en attente`}
            </Text>

            <View style={s.kpiRow}>
              <View style={s.kpiItem}>
                <View style={[s.kpiIcon, {backgroundColor: colors.brand.emeraldSoft}]}>
                  <CheckIcon size={16} color={colors.brand.emerald} />
                </View>
                <View>
                  <Text style={s.kpiLabel}>Payées</Text>
                  <Text style={s.kpiValue}>{o.paidCount}</Text>
                </View>
              </View>
              <View style={s.kpiItem}>
                <View style={[s.kpiIcon, {backgroundColor: colors.brand.goldSoft}]}>
                  <CalendarIcon size={16} color={colors.brand.gold} />
                </View>
                <View>
                  <Text style={s.kpiLabel}>Prochaine échéance</Text>
                  <Text style={s.kpiValue}>
                    {o.nextDueDate ? formatDate(o.nextDueDate) : '—'}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Escrow + registre integrity */}
        <Animated.View entering={FadeInDown.delay(60).duration(360)} style={s.section}>
          <Card variant="default" padding={spacing.lg}>
            <View style={s.rowBetween}>
              <View style={s.inlineIcon}>
                <View style={[s.kpiIcon, {backgroundColor: colors.brand.indigoSoft}]}>
                  <LockIcon size={16} color={colors.brand.indigo} />
                </View>
                <Text style={s.cardTitle}>Séquestre</Text>
              </View>
              {check && (
                <Badge
                  variant="soft"
                  tone={registreOk ? colors.brand.emerald : colors.error}
                  label={registreOk ? 'Registre vérifié' : 'Anomalie'}
                  size="small"
                />
              )}
            </View>
            <Text style={s.escrowBalance}>
              {sequestre ? formatCurrency(sequestre.soldeCantonne, devise) : 'Réservé P2'}
            </Text>
            <Button
              title="Voir le registre infalsifiable"
              variant="outline"
              size="medium"
              icon="format-list-bulleted"
              fullWidth
              onPress={() => navigation.navigate('Registre', {tontineId})}
              style={{marginTop: spacing.md}}
            />
          </Card>
        </Animated.View>

        {/* Pending contributions to confirm (cash / bank transfer) */}
        <Animated.View entering={FadeInDown.delay(90).duration(360)} style={s.section}>
          <View style={s.rowBetween}>
            <Text style={s.sectionTitle}>Cotisations à confirmer</Text>
            {o.pending.length > 0 && (
              <Badge variant="count" label={String(o.pending.length)} size="small" />
            )}
          </View>
          {o.pending.length === 0 ? (
            <EmptyState
              icon="check-circle"
              title="Tout est à jour"
              description="Aucune cotisation en attente de confirmation pour ce tour."
            />
          ) : (
            o.pending.map((p, i) => {
              const method =
                p.paymentMethod === 'Cash'
                  ? 'Espèces'
                  : p.paymentMethod === 'BankTransfer'
                    ? 'Virement'
                    : p.paymentMethod === 'MobileMoney'
                      ? 'Mobile Money'
                      : 'En attente';
              return (
                <Animated.View key={p.contributionId} entering={FadeInDown.delay(110 + i * 40).duration(300)}>
                  <View style={s.pendingRow}>
                    <Avatar name={p.fullName} size="md" />
                    <View style={{flex: 1, marginLeft: spacing.md}}>
                      <Text style={s.riskName} numberOfLines={1}>{p.fullName}</Text>
                      <Text style={s.pendingMeta}>
                        {formatCurrency(p.amount, devise)} · {method}
                      </Text>
                    </View>
                    <Button
                      title="Confirmer"
                      variant="gradient"
                      gradient="emerald"
                      size="small"
                      icon="check"
                      loading={confirmingId === p.contributionId}
                      disabled={confirmingId !== null}
                      onPress={() => confirmPayment(p.contributionId, p.fullName)}
                    />
                  </View>
                </Animated.View>
              );
            })
          )}
        </Animated.View>

        {/* Members at risk */}
        <Animated.View entering={FadeInDown.delay(120).duration(360)} style={s.section}>
          <View style={s.rowBetween}>
            <Text style={s.sectionTitle}>Membres à risque</Text>
            {o.membersAtRisk.length > 0 && (
              <Badge variant="count" label={String(o.membersAtRisk.length)} size="small" />
            )}
          </View>
          {o.membersAtRisk.length === 0 ? (
            <EmptyState
              icon="shield-check"
              title="Aucun membre à risque"
              description="Toutes les cotisations sont à jour."
            />
          ) : (
            o.membersAtRisk.map((m, i) => (
              <Animated.View key={m.userId + i} entering={FadeInDown.delay(140 + i * 40).duration(300)}>
                <PressableScale
                  style={s.riskRow}
                  onPress={() => navigation.navigate('MemberProfile', {userId: m.userId, tontineId})}>
                  <Avatar name={m.fullName} size="md" />
                  <View style={{flex: 1, marginLeft: spacing.md}}>
                    <Text style={s.riskName} numberOfLines={1}>{m.fullName}</Text>
                    <View style={s.riskMeta}>
                      <AlertIcon size={13} color={m.status === 'Failed' ? colors.error : colors.brand.gold} />
                      <Text style={s.riskStatus}>
                        {m.status === 'Failed' ? 'En défaut' : 'En retard'} · tour {m.round} · {formatDate(m.dueDate)}
                      </Text>
                    </View>
                  </View>
                  <ChevronRightIcon size={20} color={colors.text.tertiary} />
                </PressableScale>
              </Animated.View>
            ))
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg.base},
    rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm},
    inlineIcon: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
    cardTitle: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700'},
    progressTrack: {
      height: 10,
      borderRadius: 999,
      backgroundColor: colors.border.subtle,
      marginTop: spacing.md,
      overflow: 'hidden',
    },
    progressFill: {height: 10, borderRadius: 999},
    progressHint: {...typography.caption, color: colors.text.secondary, marginTop: spacing.sm},
    kpiRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    kpiItem: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
    kpiIcon: {width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
    kpiLabel: {...typography.small, color: colors.text.secondary},
    kpiValue: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '800'},
    section: {marginTop: spacing.xl},
    sectionTitle: {...typography.h3, color: colors.text.primary, fontWeight: '700', marginBottom: spacing.md},
    escrowBalance: {...typography.h2, color: colors.brand.indigo, fontWeight: '800', marginTop: spacing.sm},
    riskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.sm,
      shadowColor: colors.shadowColor,
    },
    riskName: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700'},
    riskMeta: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3},
    riskStatus: {...typography.small, color: colors.text.secondary},
    pendingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.sm,
      shadowColor: colors.shadowColor,
    },
    pendingMeta: {...typography.small, color: colors.text.secondary, marginTop: 3},
  });

export default OrganizerDashboardScreen;
