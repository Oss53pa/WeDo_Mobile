/**
 * Home Screen — premium dashboard.
 * Hero balance card (kente sunset gradient + motif + count-up), stat tiles,
 * quick actions, and the user's active tontines.
 */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown, FadeIn} from 'react-native-reanimated';
import {useDispatch, useSelector} from 'react-redux';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  GradientCard,
  StatTile,
  AnimatedNumber,
  PressableScale,
  ProgressBar,
  GradientView,
} from '@components/common';
import type {GradientName} from '@theme';
import {KenteStripe} from '@components/patterns';
import {TAB_BAR_SPACE} from '@components/navigation/CustomTabBar';
import {
  BellIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowUpIcon,
  WalletIcon,
  CheckIcon,
  ClockIcon,
  PlusCircleIcon,
  SearchIcon,
  UsersIcon,
  HistoryIcon,
  CashIcon,
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
import {MainTabScreenProps} from '@navigation/types';
import {RootState, AppDispatch} from '@store/store';
import {fetchUserProfile} from '@store/slices/user.slice';
import {fetchMyTontines} from '@store/slices/tontine.slice';

type HomeScreenProps = MainTabScreenProps<'Home'>;

const HomeScreen: React.FC<HomeScreenProps> = ({navigation}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {colors, gradients} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const [greeting, setGreeting] = useState('Bonjour');
  const [showBalance, setShowBalance] = useState(true);

  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.user.profile);
  const activeTontines = useSelector((state: RootState) => state.tontine.activeTontines);
  const isLoading = useSelector((state: RootState) => state.user.isLoading);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bonjour');
    else if (hour < 18) setGreeting('Bon après-midi');
    else setGreeting('Bonsoir');
  }, []);

  useEffect(() => {
    if (user?.id) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadData = () => {
    if (user?.id) {
      dispatch(fetchUserProfile());
      dispatch(fetchMyTontines());
    }
  };

  const u: any = user;
  const stats = profile?.statistics;
  const balance = stats?.totalContributed ?? u?.totalContributed ?? 450000;
  const statActive = stats?.activeTontines ?? u?.activeTontines ?? 0;
  const statCompleted = stats?.tontinesCompleted ?? u?.completedTontines ?? 0;
  const statPunctuality = stats?.onTimePaymentRate ?? u?.punctualityRate ?? 0;

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{paddingBottom: TAB_BAR_SPACE + spacing.lg}}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={loadData}
          tintColor={colors.accent.main}
        />
      }>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[s.header, {paddingTop: insets.top + spacing.sm}]}>
        <View>
          <Text style={s.greeting}>{greeting} 👋</Text>
          <Text style={s.userName} numberOfLines={1}>
            {user?.fullName || 'Utilisateur'}
          </Text>
        </View>
        <View style={s.headerRight}>
          <PressableScale
            style={s.bellBtn}
            onPress={() => navigation.navigate('Profile', {screen: 'Notifications'})}>
            <BellIcon size={22} color={colors.text.primary} />
            <View style={s.bellDot} />
          </PressableScale>
          <PressableScale onPress={() => navigation.navigate('Profile', {screen: 'ProfileMain'})}>
            <Avatar
              name={user?.fullName}
              imageUrl={user?.profilePhotoUrl}
              size="md"
              ring
            />
          </PressableScale>
        </View>
      </Animated.View>

      {/* Hero balance */}
      <Animated.View entering={FadeInDown.delay(80).duration(420)} style={s.heroWrap}>
        <GradientCard gradient="sunset" motif="diamonds" motifOpacity={0.12}>
          <View style={s.balanceTop}>
            <Text style={s.balanceLabel}>Solde total épargne</Text>
            <PressableScale style={s.eyeBtn} onPress={() => setShowBalance(v => !v)}>
              {showBalance ? (
                <EyeIcon size={18} color="#FFFFFF" />
              ) : (
                <EyeOffIcon size={18} color="#FFFFFF" />
              )}
            </PressableScale>
          </View>

          {showBalance ? (
            <View style={s.amountRow}>
              <AnimatedNumber value={balance} style={s.balanceAmount} />
              <Text style={s.currency}>FCFA</Text>
            </View>
          ) : (
            <Text style={s.balanceAmount}>•••••• FCFA</Text>
          )}

          <KenteStripe height={5} style={s.heroStripe} />
          <View style={s.heroMetrics}>
            <View style={s.metricPill}>
              <View style={s.metricTop}>
                <ArrowUpIcon size={13} color="#FFFFFF" />
                <Text style={s.metricValue}>+125 000</Text>
              </View>
              <Text style={s.metricLabel}>Entrées ce mois</Text>
            </View>
            <View style={s.metricDivider} />
            <View style={s.metricPill}>
              <Text style={s.metricValue}>3 jours</Text>
              <Text style={s.metricLabel}>Prochaine cotisation</Text>
            </View>
          </View>
        </GradientCard>
      </Animated.View>

      {/* Stats */}
      <Animated.View entering={FadeInDown.delay(160).duration(420)} style={s.statsRow}>
        <StatTile
          icon={<WalletIcon size={22} color={colors.brand.terracotta} />}
          value={statActive}
          label="Tontines actives"
          tone={colors.brand.terracotta}
          toneSoft={colors.brand.terracottaSoft}
        />
        <View style={{width: spacing.sm}} />
        <StatTile
          icon={<CheckIcon size={22} color={colors.brand.emerald} />}
          value={statCompleted}
          label="Complétées"
          tone={colors.brand.emerald}
          toneSoft={colors.brand.emeraldSoft}
        />
        <View style={{width: spacing.sm}} />
        <StatTile
          icon={<ClockIcon size={22} color={colors.brand.indigo} />}
          value={`${statPunctuality}%`}
          label="Ponctualité"
          tone={colors.brand.indigo}
          toneSoft={colors.brand.indigoSoft}
        />
      </Animated.View>

      {/* Quick actions */}
      <Animated.View entering={FadeInDown.delay(240).duration(420)} style={s.section}>
        <Text style={s.sectionTitle}>Actions rapides</Text>
        <View style={s.actionsGrid}>
          <ActionTile
            label={'Créer une\ntontine'}
            gradient="sunset"
            icon={<PlusCircleIcon size={24} color="#FFFFFF" />}
            onPress={() => navigation.navigate('Create')}
          />
          <ActionTile
            label="Explorer"
            gradient="indigo"
            icon={<SearchIcon size={24} color="#FFFFFF" />}
            onPress={() => navigation.navigate('Tontines', {screen: 'TontinesList'})}
          />
          <ActionTile
            label={'Inviter\ndes amis'}
            gradient="emerald"
            icon={<UsersIcon size={24} color="#FFFFFF" />}
            onPress={() => {
              const first = activeTontines[0];
              if (first) {
                (navigation as any).navigate('InviteTontine', {tontineId: first.id, tontineName: first.name});
              } else {
                navigation.navigate('Tontines', {screen: 'TontinesList'});
              }
            }}
          />
          <ActionTile
            label="Historique"
            gradient="gold"
            icon={<HistoryIcon size={24} color="#FFFFFF" />}
            onPress={() => navigation.navigate('Profile', {screen: 'Transactions'})}
          />
        </View>
      </Animated.View>

      {/* Active tontines */}
      <Animated.View entering={FadeInDown.delay(320).duration(420)} style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Mes tontines actives</Text>
          <PressableScale onPress={() => navigation.navigate('Tontines', {screen: 'TontinesList'})} style={s.seeAllBtn}>
            <Text style={s.seeAll}>Voir tout</Text>
            <ChevronRightIcon size={16} color={colors.accent.main} />
          </PressableScale>
        </View>

        {activeTontines.length === 0 ? (
          <EmptyState
            icon="wallet-plus"
            title="Aucune tontine active"
            description="Créez ou rejoignez une tontine pour commencer à épargner ensemble."
            actionLabel="Créer une tontine"
            onAction={() => navigation.navigate('Create')}
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.tontinesScroll}>
            {activeTontines.slice(0, 6).map((tontine, i) => {
              const progress =
                tontine.totalMembers > 0
                  ? (tontine.currentMembers / tontine.totalMembers) * 100
                  : 0;
              const tones = [
                colors.brand.terracotta,
                colors.brand.emerald,
                colors.brand.indigo,
                colors.brand.gold,
              ];
              const tone = tones[i % tones.length];
              return (
                <PressableScale
                  key={tontine.id}
                  style={s.tontineCard}
                  onPress={() =>
                    navigation.navigate('Tontines', {
                      screen: 'TontineDetail',
                      params: {tontineId: tontine.id},
                    })
                  }>
                  <View style={s.tontineCardTop}>
                    <View style={[s.tontineIcon, {backgroundColor: tone + '1A'}]}>
                      <CashIcon size={20} color={tone} />
                    </View>
                    <Badge variant="soft" tone={colors.success} label="Active" size="small" />
                  </View>
                  <Text style={s.tontineName} numberOfLines={1}>
                    {tontine.name}
                  </Text>
                  <Text style={s.tontineAmount}>
                    {tontine.contributionAmount.toLocaleString('fr-FR')} {tontine.currency}
                  </Text>
                  <View style={s.tontineMembers}>
                    <UsersIcon size={13} color={colors.text.tertiary} />
                    <Text style={s.tontineMembersText}>
                      {tontine.currentMembers}/{tontine.totalMembers} membres
                    </Text>
                  </View>
                  <ProgressBar progress={progress} height={6} gradientColors={[tone, tone]} />
                </PressableScale>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>
    </ScrollView>
  );
};

const ActionTile: React.FC<{
  label: string;
  icon: React.ReactNode;
  gradient: GradientName;
  onPress: () => void;
}> = ({label, icon, gradient, onPress}) => {
  const s = useThemedStyles(makeStyles);
  return (
    <PressableScale style={s.actionTile} onPress={onPress}>
      <GradientView name={gradient} style={s.actionIcon}>
        {icon}
      </GradientView>
      <Text style={s.actionText}>{label}</Text>
    </PressableScale>
  );
};

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg.base},
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    greeting: {...typography.caption, color: colors.text.secondary},
    userName: {...typography.h1, color: colors.text.primary, marginTop: 2},
    headerRight: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
    bellBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.surface.sunken,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bellDot: {
      position: 'absolute',
      top: 11,
      right: 11,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: colors.accent.main,
      borderWidth: 2,
      borderColor: colors.surface.sunken,
    },
    heroWrap: {paddingHorizontal: spacing.lg, marginTop: spacing.xs},
    balanceTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    balanceLabel: {...typography.captionMedium, color: 'rgba(255,255,255,0.9)'},
    eyeBtn: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    amountRow: {flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.sm},
    balanceAmount: {...typography.amount, color: '#FFFFFF', marginTop: spacing.sm},
    currency: {
      ...typography.h3,
      color: 'rgba(255,255,255,0.9)',
      fontWeight: '600',
      marginLeft: 8,
      marginBottom: 5,
    },
    heroStripe: {marginTop: spacing.lg, opacity: 0.9},
    heroMetrics: {flexDirection: 'row', alignItems: 'center', marginTop: spacing.md},
    metricPill: {flex: 1},
    metricTop: {flexDirection: 'row', alignItems: 'center', gap: 4},
    metricValue: {...typography.bodyMedium, color: '#FFFFFF', fontWeight: '800'},
    metricLabel: {...typography.small, color: 'rgba(255,255,255,0.82)', marginTop: 1},
    metricDivider: {
      width: 1,
      height: 34,
      backgroundColor: 'rgba(255,255,255,0.25)',
      marginHorizontal: spacing.md,
    },
    statsRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      marginTop: spacing.lg,
    },
    section: {marginTop: spacing.xl},
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.text.primary,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
      fontWeight: '700',
    },
    seeAllBtn: {flexDirection: 'row', alignItems: 'center', gap: 2},
    seeAll: {...typography.captionMedium, color: colors.accent.main, fontWeight: '700'},
    actionsGrid: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      justifyContent: 'space-between',
    },
    actionTile: {flex: 1, alignItems: 'center'},
    actionIcon: {
      width: 62,
      height: 62,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
      ...shadows.sm,
      shadowColor: colors.shadowColor,
    },
    actionText: {
      ...typography.small,
      color: colors.text.secondary,
      textAlign: 'center',
      fontWeight: '600',
      lineHeight: 15,
    },
    tontinesScroll: {paddingHorizontal: spacing.lg, gap: spacing.md},
    tontineCard: {
      width: 210,
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius.xl,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.sm,
      shadowColor: colors.shadowColor,
    },
    tontineCardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    tontineIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tontineName: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700'},
    tontineAmount: {...typography.h3, color: colors.text.primary, marginTop: 2, marginBottom: spacing.sm},
    tontineMembers: {flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: spacing.sm},
    tontineMembersText: {...typography.caption, color: colors.text.tertiary},
  });

export default HomeScreen;
