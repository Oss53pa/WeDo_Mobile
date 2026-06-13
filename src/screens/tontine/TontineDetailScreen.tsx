/**
 * TontineDetailScreen — premium detail view with hero, progress ring,
 * key stats, members and activity. Defensive about the data shape.
 */
import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, RefreshControl, Linking} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {
  Badge,
  Button,
  Avatar,
  ProgressRing,
  ProgressBar,
  LoadingSpinner,
  EmptyState,
  SegmentedControl,
  GradientView,
  PressableScale,
  useToast,
} from '@components/common';
import {PatternBackground} from '@components/patterns';
import {TAB_BAR_SPACE} from '@components/navigation/CustomTabBar';
import {ChevronLeftIcon, ShareIcon, CashIcon, CalendarIcon, UsersIcon, CheckIcon, ClockIcon, ChevronRightIcon} from '@components/icons';
import {useTheme, useThemedStyles, typography, spacing, borderRadius, tabularNums, type ThemedTokens} from '@theme';
import {TontinesStackParamList, RootStackParamList} from '@navigation/types';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '@store/store';
import {fetchTontineDetail} from '@store/slices/tontine.slice';
import * as tontineApi from '@services/api/tontine.api';
import paymentApi from '@services/api/payment.api';
import {IS_SUPABASE_CONFIGURED} from '@config/appConfig';
import {formatCurrency, formatDate, formatRelativeTime} from '@utils/formatting';
import {buildSchedule, nextBeneficiaries} from '@utils/tontineSchedule';
import {formatFcfa} from '@utils/money';

const SCHED_MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const fmtSchedDate = (d: Date | null): string =>
  d ? `${d.getDate()} ${SCHED_MONTHS[d.getMonth()]} ${d.getFullYear()}` : 'date à définir';
const frequencyLabel = (f: string): string =>
  ({Daily: 'chaque jour', Weekly: 'chaque semaine', BiWeekly: 'tous les 15 jours', Monthly: 'chaque mois'} as any)[f] ??
  'selon la fréquence';

/** Per-member status pill for the Members tab: place confirmation + round payment. */
const memberPayBadge = (
  m: any,
  payStatus: string | undefined,
  tontineStatus: string,
  colors: any,
): {label: string; tone: string} | null => {
  if (m.status === 'Pending') return {label: 'Place à confirmer', tone: colors.warning};
  if (tontineStatus === 'Active') {
    if (payStatus === 'Paid') return {label: 'A payé', tone: colors.success};
    if (payStatus === 'Late' || payStatus === 'Failed') return {label: 'En retard', tone: colors.brand.crimson};
    return {label: 'En attente', tone: colors.warning};
  }
  if (tontineStatus === 'Open') return {label: 'Place OK', tone: colors.success};
  return null;
};

type DetailRoute = RouteProp<TontinesStackParamList, 'TontineDetail'>;
type DetailNav = StackNavigationProp<TontinesStackParamList, 'TontineDetail'>;
interface Props {
  route: DetailRoute;
  navigation: DetailNav;
}
type TabType = 'overview' | 'members' | 'calendar' | 'activity';

const TontineDetailScreen: React.FC<Props> = ({route, navigation}) => {
  const {tontineId} = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const {colors, gradients, copy} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const {show} = useToast();
  const rootNav = navigation as unknown as StackNavigationProp<RootStackParamList>;

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinTetes, setJoinTetes] = useState(1);
  const [fee, setFee] = useState<tontineApi.MyActivationFee | null>(null);
  const [payingFee, setPayingFee] = useState(false);
  const [roundPayments, setRoundPayments] = useState<Record<string, string>>({});

  const {currentTontine, isLoading} = useSelector((state: RootState) => state.tontine);
  const {user} = useSelector((state: RootState) => state.auth);
  const t: any = currentTontine;

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tontineId]);

  const load = async () => {
    let detail: any = null;
    try {
      detail = await dispatch(fetchTontineDetail(tontineId)).unwrap();
    } catch (e) {
      /* handled in slice */
    }
    try {
      setFee(await tontineApi.getMyActivationFee(tontineId));
    } catch {
      /* non-blocking */
    }
    // Who has paid this round (visible to any member via RLS).
    try {
      if (detail?.status === 'Active' && detail?.currentRound > 0) {
        setRoundPayments(await tontineApi.getRoundContributions(tontineId, detail.currentRound));
      } else {
        setRoundPayments({});
      }
    } catch {
      /* non-blocking */
    }
  };

  const handlePayFee = async () => {
    setPayingFee(true);
    try {
      const {transaction, paymentUrl} = await paymentApi.payActivationFee(tontineId);
      if (paymentUrl) {
        await Linking.openURL(paymentUrl);
        show('Terminez le paiement des frais dans la page qui vient de s’ouvrir.', {type: 'info'});
      } else if (IS_SUPABASE_CONFIGURED) {
        const {status} = await paymentApi.verifyPayment(transaction.id);
        show(
          status === 'Completed'
            ? "Frais d'activation réglés. Vous pouvez cotiser."
            : 'Paiement en attente de confirmation.',
          {type: status === 'Completed' ? 'success' : 'info'},
        );
      } else {
        show("Frais d'activation réglés (démo).", {type: 'success'});
      }
      await load();
    } catch (e: any) {
      show(e?.message ?? "Impossible de régler les frais.", {type: 'error'});
    } finally {
      setPayingFee(false);
    }
  };
  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      // Gated join: enforces the reliability score_minimum + KYC P2 (séquestre).
      const res = await tontineApi.rejoindreTontine(tontineId, undefined, joinTetes);
      if (res?.success) {
        show(
          res.already
            ? 'Vous êtes déjà membre de cette tontine.'
            : 'Demande envoyée ! Vous rejoindrez la tontine dès validation.',
          {type: 'success'},
        );
        await load();
      } else if (res?.need === 'P2') {
        show(res.error ?? 'Vérification P2 requise.', {type: 'error'});
        rootNav.navigate('KycP2');
      } else {
        show(res?.error ?? 'Impossible de rejoindre la tontine.', {type: 'error'});
      }
    } catch (e: any) {
      show(typeof e === 'string' ? e : 'Impossible de rejoindre la tontine.', {type: 'error'});
    } finally {
      setJoining(false);
    }
  };

  if (isLoading && !currentTontine) return <LoadingSpinner fullScreen text="Chargement..." />;
  if (!t) return null;

  const statusLabel = ({Active: 'Actif', Open: 'Ouvert', Completed: 'Terminé', Cancelled: 'Annulé'} as any)[t.status] ?? t.status;
  const membersProgress = t.totalMembers ? t.currentMembers / t.totalMembers : 0;
  const roundsProgress = t.totalRounds ? (t.currentRound ?? 0) / t.totalRounds : membersProgress;
  const isAdmin = t.adminId === user?.id || t.creatorId === user?.id;
  const members = t.members ?? [];
  const activities = t.activities ?? [];

  // Projected rotation schedule (who receives what & when) — works before activation.
  const schedule = buildSchedule({
    members: members.map((m: any) => ({
      userId: m.userId,
      name: m.user?.fullName ?? m.fullName ?? 'Membre',
      receptionOrder: m.receptionOrder,
      nbTetes: m.nbTetes ?? 1,
    })),
    contributionAmount: t.contributionAmount,
    frequency: t.frequency,
    startDate: t.startDate,
    beneficiairesParTour: t.beneficiairesParTour ?? 1,
    currentRound: t.currentRound ?? 0,
    status: t.status,
  });
  const nextRound = nextBeneficiaries(schedule);

  const Stat: React.FC<{icon: React.ReactNode; label: string; value: string}> = ({icon, label, value}) => (
    <View style={s.statItem}>
      <View style={s.statIcon}>{icon}</View>
      <View style={{flex: 1}}>
        <Text style={s.statLabel}>{label}</Text>
        <Text style={s.statValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      {/* Hero */}
      <GradientView name="sunset" style={[s.hero, {paddingTop: insets.top + spacing.sm}]}>
        <PatternBackground motif="diamonds" opacity={0.12} />
        <View style={s.heroTop}>
          <PressableScale style={s.iconBtn} onPress={() => navigation.goBack()}>
            <ChevronLeftIcon size={22} color="#FFFFFF" />
          </PressableScale>
          <PressableScale style={s.iconBtn}>
            <ShareIcon size={20} color="#FFFFFF" />
          </PressableScale>
        </View>

        <View style={s.heroBody}>
          <ProgressRing
            progress={t.status === 'Open' ? membersProgress : roundsProgress}
            size={92}
            strokeWidth={9}
            color="#FFFFFF"
            trackColor="rgba(255,255,255,0.28)">
            <Text style={s.ringValue}>
              {Math.round((t.status === 'Open' ? membersProgress : roundsProgress) * 100)}%
            </Text>
          </ProgressRing>
          <View style={s.heroInfo}>
            <Badge variant="soft" tone="#FFFFFF" backgroundColor="rgba(255,255,255,0.22)" label={statusLabel} size="small" />
            <Text style={s.heroName} numberOfLines={2}>
              {t.name}
            </Text>
            <Text style={s.heroAmount}>{formatCurrency(t.contributionAmount, t.currency)}</Text>
          </View>
        </View>
      </GradientView>

      <View style={s.tabsWrap}>
        <SegmentedControl
          options={[
            {label: 'Aperçu', value: 'overview'},
            {label: 'Membres', value: 'members'},
            {label: 'Calendrier', value: 'calendar'},
            {label: 'Activité', value: 'activity'},
          ]}
          value={activeTab}
          onChange={v => setActiveTab(v as TabType)}
        />
      </View>

      <ScrollView
        contentContainerStyle={{paddingHorizontal: spacing.lg, paddingBottom: TAB_BAR_SPACE + spacing.lg}}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.main} />}>
        {activeTab === 'overview' && (
          <Animated.View entering={FadeInDown.duration(360)}>
            {!!t.description && <Text style={s.description}>{t.description}</Text>}

            <View style={s.statsCard}>
              <Stat icon={<CashIcon size={20} color={colors.brand.terracotta} />} label="Contribution" value={formatCurrency(t.contributionAmount, t.currency)} />
              <View style={s.statDivider} />
              <Stat icon={<CalendarIcon size={20} color={colors.brand.indigo} />} label="Fréquence" value={String(t.frequency)} />
              <View style={s.statDivider} />
              <Stat icon={<UsersIcon size={20} color={colors.brand.emerald} />} label="Membres" value={`${t.currentMembers}/${t.totalMembers}`} />
              {t.startDate && (
                <>
                  <View style={s.statDivider} />
                  <Stat icon={<CalendarIcon size={20} color={colors.brand.gold} />} label="Début" value={formatDate(t.startDate)} />
                </>
              )}
            </View>

            {t.status === 'Open' && (
              <View style={s.block}>
                <Text style={s.blockTitle}>Recrutement</Text>
                <ProgressBar progress={membersProgress * 100} height={10} showPercentage showLabel label="Membres recrutés" />
                <Text style={s.hint}>{Math.max(t.totalMembers - t.currentMembers, 0)} membres manquants</Text>
              </View>
            )}

            {nextRound && t.status !== 'Completed' && t.status !== 'Cancelled' && (
              <View style={s.block}>
                <Text style={s.blockTitle}>{copy.nextBeneficiary}</Text>
                {(t.beneficiairesParTour ?? 1) > 1 && (
                  <View style={s.multiBenefChip}>
                    <Icon name="account-multiple" size={15} color={colors.accent.main} />
                    <Text style={s.multiBenefText}>
                      {t.beneficiairesParTour} bénéficiaires se partagent la cagnotte à chaque tour
                    </Text>
                  </View>
                )}
                {t.status === 'Open' && (
                  <Text style={[s.hint, {marginBottom: spacing.sm}]}>
                    Prévisionnel (tour {nextRound.round}) — se confirme au lancement.
                  </Text>
                )}
                {nextRound.beneficiaries.map(b => (
                  <View key={b.userId} style={[s.beneficiary, {marginBottom: spacing.sm}]}>
                    <Avatar name={b.name} size="lg" ring />
                    <View style={{flex: 1, marginLeft: spacing.md}}>
                      <Text style={s.benName} numberOfLines={1}>
                        {b.name}{b.tetes > 1 ? `  ×${b.tetes} têtes` : ''}
                      </Text>
                      <Text style={s.hint}>
                        {fmtSchedDate(nextRound.date)} · {formatCurrency(b.amount, t.currency)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {t.isMember && t.status === 'Active' && fee && !fee.fraisPaye && fee.fraisDu > 0 && (
              <View style={s.feeBanner}>
                <View style={s.feeBannerIcon}>
                  <CashIcon size={20} color={colors.brand.gold} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={s.feeBannerTitle}>Frais d'activation à régler</Text>
                  <Text style={s.feeBannerAmount}>{formatFcfa(BigInt(fee.fraisDu))}</Text>
                  <Text style={s.feeBannerHint}>Payé une seule fois, au lancement. Requis avant de cotiser.</Text>
                </View>
                <Button
                  title="Régler"
                  variant="gradient"
                  gradient="gold"
                  size="small"
                  loading={payingFee}
                  disabled={payingFee}
                  onPress={handlePayFee}
                />
              </View>
            )}

            <View style={s.actions}>
              {t.status === 'Open' && !t.isMember && (
                <>
                  <View style={s.tetesPicker}>
                    <View style={{flex: 1}}>
                      <Text style={s.tetesLabel}>Mes têtes (parts)</Text>
                      <Text style={s.tetesHint}>
                        1 tête = 1 cotisation/tour et 1 place. Prenez-en plusieurs pour recevoir davantage.
                      </Text>
                    </View>
                    <View style={s.stepper}>
                      <PressableScale
                        style={s.stepBtn}
                        onPress={() => setJoinTetes(v => Math.max(1, v - 1))}>
                        <Icon name="minus" size={18} color={colors.text.primary} />
                      </PressableScale>
                      <Text style={s.stepVal}>{joinTetes}</Text>
                      <PressableScale
                        style={s.stepBtn}
                        onPress={() => setJoinTetes(v => Math.min(20, v + 1))}>
                        <Icon name="plus" size={18} color={colors.text.primary} />
                      </PressableScale>
                    </View>
                  </View>
                  <Button
                    title={copy.join}
                    variant="gradient"
                    fullWidth
                    size="large"
                    icon="account-plus"
                    loading={joining}
                    onPress={handleJoin}
                  />
                </>
              )}
              {t.status === 'Active' && (
                <Button
                  title={copy.pay}
                  variant="gradient"
                  fullWidth
                  size="large"
                  icon="cash-plus"
                  onPress={() => navigation.navigate('Contribution', {tontineId})}
                />
              )}
              {(isAdmin || t.status === 'Open') && (
                <Button
                  title="Inviter des membres"
                  variant="secondary"
                  fullWidth
                  icon="account-multiple-plus"
                  onPress={() => rootNav.navigate('InviteTontine', {tontineId, tontineName: t.name, inviteCode: t.inviteCode})}
                  style={{marginTop: spacing.sm}}
                />
              )}
              {isAdmin && t.status !== 'Open' && (
                <Button
                  title="Tableau de bord organisateur"
                  variant="secondary"
                  fullWidth
                  icon="view-dashboard"
                  onPress={() => rootNav.navigate('OrganizerDashboard', {tontineId})}
                  style={{marginTop: spacing.sm}}
                />
              )}
              {isAdmin && (
                <Button
                  title="Gérer la tontine"
                  variant="outline"
                  fullWidth
                  icon="cog"
                  onPress={() => rootNav.navigate('ManageTontine', {tontineId})}
                  style={{marginTop: spacing.sm}}
                />
              )}
              {(t.isMember || isAdmin) && t.status !== 'Open' && (
                <Button
                  title="Registre infalsifiable"
                  variant="ghost"
                  fullWidth
                  icon="shield-check"
                  onPress={() => rootNav.navigate('Registre', {tontineId})}
                  style={{marginTop: spacing.sm}}
                />
              )}
            </View>
          </Animated.View>
        )}

        {activeTab === 'members' &&
          (members.length === 0 ? (
            <EmptyState icon="account-group" title="Aucun membre" description="Cette tontine n'a pas encore de membres." />
          ) : (
            <View style={{paddingTop: spacing.md}}>
              {members.map((m: any, i: number) => {
                const name = m.user?.fullName ?? m.fullName ?? 'Membre';
                const pay = memberPayBadge(m, roundPayments[m.userId], t.status, colors);
                return (
                  <Animated.View key={m.id ?? m.userId ?? i} entering={FadeInDown.delay(i * 40).duration(320)}>
                    <PressableScale
                      style={s.memberRow}
                      onPress={() => rootNav.navigate('MemberProfile', {userId: m.userId, tontineId})}>
                    <Avatar name={name} imageUrl={m.user?.profilePhotoUrl ?? m.avatar} size="md" />
                    <View style={{flex: 1, marginLeft: spacing.md}}>
                      <View style={s.memberHead}>
                        <Text style={s.memberName} numberOfLines={1}>
                          {name}
                        </Text>
                        {(m.isAdmin || m.role === 'Admin') && <Badge variant="soft" tone={colors.brand.indigo} label="Admin" size="small" />}
                      </View>
                      <Text style={s.hint} numberOfLines={1}>
                        {m.totalContributed != null ? `Cotisé: ${formatCurrency(m.totalContributed, t.currency)}` : ''}
                      </Text>
                    </View>
                    {pay && <Badge variant="soft" tone={pay.tone} label={pay.label} size="small" />}
                    <ChevronRightIcon size={18} color={colors.text.tertiary} />
                    </PressableScale>
                  </Animated.View>
                );
              })}
            </View>
          ))}

        {activeTab === 'calendar' &&
          (schedule.length === 0 ? (
            <EmptyState icon="calendar" title="Calendrier indisponible" description="Le calendrier des tours apparaîtra dès qu'il y a au moins un membre." />
          ) : (
            <View style={{paddingTop: spacing.md}}>
              <View style={s.calHeadRow}>
                <Text style={s.blockTitle}>Qui reçoit, quand</Text>
                <PressableScale
                  style={s.calViewsBtn}
                  onPress={() => rootNav.navigate('TontineSchedule', {tontineId})}>
                  <Icon name="view-dashboard-outline" size={15} color={colors.accent.main} />
                  <Text style={s.calViewsTxt}>Vues Gantt / Kanban</Text>
                </PressableScale>
              </View>
              {t.status === 'Open' && (
                <Text style={s.calProjNote}>
                  Dates prévisionnelles (à partir du {formatDate(t.startDate)}, {frequencyLabel(t.frequency)}).
                  Elles se confirment au lancement de la tontine.
                </Text>
              )}
              {schedule.map((r, i) => {
                const tone =
                  r.status === 'past' ? colors.success : r.status === 'current' ? colors.brand.terracotta : colors.text.tertiary;
                const label = r.status === 'past' ? 'Passé' : r.status === 'current' ? 'En cours' : 'À venir';
                return (
                  <Animated.View
                    key={r.round}
                    entering={FadeInDown.delay(i * 40).duration(320)}
                    style={s.roundRow}>
                    <View style={[s.roundBadge, {backgroundColor: tone + '1A'}]}>
                      <Text style={[s.roundNum, {color: tone}]}>{r.round}</Text>
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={s.memberName} numberOfLines={1}>
                        {r.beneficiaries.map(b => b.name + (b.tetes > 1 ? ` ×${b.tetes}` : '')).join(', ')}
                      </Text>
                      <Text style={s.hint}>
                        {fmtSchedDate(r.date)} · {formatCurrency(r.beneficiaries[0]?.amount ?? 0, t.currency)}
                        {r.beneficiaries.length > 1 ? ' / pers.' : ''}
                      </Text>
                    </View>
                    <Badge variant="soft" tone={tone} label={label} size="small" />
                  </Animated.View>
                );
              })}
            </View>
          ))}

        {activeTab === 'activity' &&
          (activities.length === 0 ? (
            <EmptyState icon="history" title="Aucune activité" description="Les activités de cette tontine apparaîtront ici." />
          ) : (
            <View style={{paddingTop: spacing.md}}>
              {activities.map((a: any, i: number) => (
                <View key={i} style={s.activityRow}>
                  <View style={[s.activityIcon, {backgroundColor: colors.brand.terracottaSoft}]}>
                    <Icon name={activityIcon(a.type)} size={18} color={colors.brand.terracotta} />
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={s.memberName}>{a.title}</Text>
                    {!!a.description && <Text style={s.hint}>{a.description}</Text>}
                    {!!a.timestamp && <Text style={s.timeText}>{formatRelativeTime(a.timestamp)}</Text>}
                  </View>
                </View>
              ))}
            </View>
          ))}
      </ScrollView>
    </View>
  );
};

const activityIcon = (type: string): string =>
  (({contribution: 'cash-plus', distribution: 'cash-minus', join: 'account-plus', leave: 'account-minus', vote: 'vote', message: 'message'} as any)[
    type
  ] ?? 'circle-small');

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg.base},
    hero: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      borderBottomLeftRadius: borderRadius['2xl'],
      borderBottomRightRadius: borderRadius['2xl'],
      overflow: 'hidden',
    },
    roundRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    roundBadge: {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
    roundNum: {...typography.bodyMedium, fontWeight: '800'},
    heroTop: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md},
    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroBody: {flexDirection: 'row', alignItems: 'center', gap: spacing.lg},
    ringValue: {...typography.bodyMedium, color: '#FFFFFF', fontWeight: '800'},
    heroInfo: {flex: 1, gap: 6},
    heroName: {...typography.h2, color: '#FFFFFF'},
    heroAmount: {...typography.h3, color: 'rgba(255,255,255,0.95)', fontWeight: '700'},
    tabsWrap: {paddingHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.md},
    description: {...typography.body, color: colors.text.secondary, marginBottom: spacing.lg},
    statsCard: {
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius.xl,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.sm,
      shadowColor: colors.shadowColor,
    },
    statItem: {flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.md},
    statIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.surface.sunken,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statLabel: {...typography.caption, color: colors.text.secondary},
    statValue: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700'},
    statDivider: {height: 1, backgroundColor: colors.border.subtle},
    block: {
      marginTop: spacing.lg,
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    blockTitle: {...typography.h3, color: colors.text.primary, marginBottom: spacing.md, fontWeight: '700'},
    hint: {...typography.caption, color: colors.text.secondary},
    calHeadRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm},
    calViewsBtn: {flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: spacing.sm,
      backgroundColor: colors.accent[50], borderRadius: borderRadius.md},
    calViewsTxt: {...typography.caption, color: colors.accent.main, fontWeight: '700'},
    calProjNote: {...typography.caption, color: colors.text.secondary, marginBottom: spacing.md, lineHeight: 18},
    multiBenefChip: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md,
      backgroundColor: colors.accent[50], borderRadius: borderRadius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md},
    multiBenefText: {...typography.caption, color: colors.accent.main, fontWeight: '600', flex: 1},
    tetesPicker: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md,
      backgroundColor: colors.surface.sunken, borderRadius: borderRadius.lg, padding: spacing.md,
      borderWidth: 1, borderColor: colors.border.subtle},
    tetesLabel: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700'},
    tetesHint: {...typography.caption, color: colors.text.secondary, marginTop: 2},
    stepper: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
    stepBtn: {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.surface.default, borderWidth: 1, borderColor: colors.border.default},
    stepVal: {...typography.h3, color: colors.text.primary, fontWeight: '800', minWidth: 24, textAlign: 'center'},
    beneficiary: {flexDirection: 'row', alignItems: 'center'},
    benName: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700'},
    feeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.brand.goldSoft,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.brand.gold,
      padding: spacing.md,
      marginTop: spacing.lg,
    },
    feeBannerIcon: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: colors.surface.default,
      alignItems: 'center', justifyContent: 'center',
    },
    feeBannerTitle: {...typography.captionMedium, color: colors.text.primary, fontWeight: '700'},
    feeBannerAmount: {...typography.h3, color: colors.text.primary, fontWeight: '800', ...tabularNums},
    feeBannerHint: {...typography.small, color: colors.text.secondary, marginTop: 2},
    actions: {marginTop: spacing.xl},
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    memberHead: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
    memberName: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700'},
    activityRow: {flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md},
    activityIcon: {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
    timeText: {...typography.small, color: colors.text.tertiary, marginTop: 2},
  });

export default TontineDetailScreen;
