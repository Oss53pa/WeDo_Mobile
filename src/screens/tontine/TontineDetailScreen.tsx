/**
 * TontineDetailScreen — premium detail view with hero, progress ring,
 * key stats, members and activity. Defensive about the data shape.
 */
import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, RefreshControl} from 'react-native';
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
import {useTheme, useThemedStyles, typography, spacing, borderRadius, type ThemedTokens} from '@theme';
import {TontinesStackParamList, RootStackParamList} from '@navigation/types';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '@store/store';
import {fetchTontineDetail} from '@store/slices/tontine.slice';
import * as tontineApi from '@services/api/tontine.api';
import {formatCurrency, formatDate, formatRelativeTime} from '@utils/formatting';

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
  const {colors, gradients} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const {show} = useToast();
  const rootNav = navigation as unknown as StackNavigationProp<RootStackParamList>;

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState(false);

  const {currentTontine, isLoading} = useSelector((state: RootState) => state.tontine);
  const {user} = useSelector((state: RootState) => state.auth);
  const t: any = currentTontine;

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tontineId]);

  const load = async () => {
    try {
      await dispatch(fetchTontineDetail(tontineId)).unwrap();
    } catch (e) {
      /* handled in slice */
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
      const res = await tontineApi.rejoindreTontine(tontineId);
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

            {t.status === 'Active' && (t.nextBeneficiary || t.currentBalance != null) && (
              <View style={s.block}>
                <Text style={s.blockTitle}>Prochain tour</Text>
                {t.nextBeneficiary && (
                  <View style={s.beneficiary}>
                    <Avatar
                      name={t.nextBeneficiary.user?.fullName ?? t.nextBeneficiary.fullName}
                      imageUrl={t.nextBeneficiary.user?.profilePhotoUrl ?? t.nextBeneficiary.avatar}
                      size="lg"
                      ring
                    />
                    <View style={{flex: 1, marginLeft: spacing.md}}>
                      <Text style={s.benName}>{t.nextBeneficiary.user?.fullName ?? t.nextBeneficiary.fullName}</Text>
                      {t.nextDistributionDate && <Text style={s.hint}>Distribution: {formatDate(t.nextDistributionDate)}</Text>}
                    </View>
                  </View>
                )}
              </View>
            )}

            <View style={s.actions}>
              {t.status === 'Open' && !t.isMember && (
                <Button
                  title="Rejoindre la tontine"
                  variant="gradient"
                  fullWidth
                  size="large"
                  icon="account-plus"
                  loading={joining}
                  onPress={handleJoin}
                />
              )}
              {t.status === 'Active' && (
                <Button
                  title="Contribuer maintenant"
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
                  onPress={() => rootNav.navigate('InviteTontine', {tontineId, tontineName: t.name})}
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
                const paid = m.hasPaid ?? m.hasReceived;
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
                        {m.phoneNumber ?? (m.totalContributed != null ? `Cotisé: ${formatCurrency(m.totalContributed, t.currency)}` : '')}
                      </Text>
                    </View>
                    {paid ? <CheckIcon size={20} color={colors.success} /> : <ClockIcon size={20} color={colors.warning} />}
                    <ChevronRightIcon size={18} color={colors.text.tertiary} />
                    </PressableScale>
                  </Animated.View>
                );
              })}
            </View>
          ))}

        {activeTab === 'calendar' &&
          (members.length === 0 ? (
            <EmptyState icon="calendar" title="Calendrier indisponible" description="L'ordre de distribution apparaîtra une fois les membres réunis." />
          ) : (
            <View style={{paddingTop: spacing.md}}>
              <Text style={s.blockTitle}>Ordre de distribution</Text>
              {[...members]
                .sort((a: any, b: any) => (a.receptionOrder ?? 0) - (b.receptionOrder ?? 0))
                .map((m: any, i: number) => {
                  const order = m.receptionOrder ?? i + 1;
                  const received = m.hasReceived;
                  const current = m.isCurrentBeneficiary || order === t.currentRound;
                  const label = received ? 'Reçu' : current ? 'En cours' : 'À venir';
                  const tone = received ? colors.success : current ? colors.brand.terracotta : colors.text.tertiary;
                  return (
                    <Animated.View
                      key={m.id ?? m.userId ?? i}
                      entering={FadeInDown.delay(i * 40).duration(320)}
                      style={s.roundRow}>
                      <View style={[s.roundBadge, {backgroundColor: tone + '1A'}]}>
                        <Text style={[s.roundNum, {color: tone}]}>{order}</Text>
                      </View>
                      <View style={{flex: 1}}>
                        <Text style={s.memberName} numberOfLines={1}>
                          {m.user?.fullName ?? m.fullName ?? 'Membre'}
                        </Text>
                        <Text style={s.hint}>
                          Tour {order}/{t.totalRounds ?? members.length}
                          {current && t.nextDistributionDate ? ` · ${formatDate(t.nextDistributionDate)}` : ''}
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
    beneficiary: {flexDirection: 'row', alignItems: 'center'},
    benName: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700'},
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
