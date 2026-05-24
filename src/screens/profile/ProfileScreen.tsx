/**
 * ProfileScreen — premium profile with gradient hero, reputation ring,
 * stats and settings. Logic (fetch profile, logout, navigation) preserved.
 */
import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert, RefreshControl} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {
  Avatar,
  Badge,
  Button,
  StatTile,
  ProgressRing,
  LoadingSpinner,
  GradientView,
  PressableScale,
} from '@components/common';
import {PatternBackground} from '@components/patterns';
import {TAB_BAR_SPACE} from '@components/navigation/CustomTabBar';
import {
  BellIcon,
  HistoryIcon,
  LockIcon,
  CashIcon,
  HelpIcon,
  ChevronRightIcon,
  EditIcon,
  WalletIcon,
  CheckIcon,
  UsersIcon,
  StarIcon,
  PlusCircleIcon,
} from '@components/icons';
import {useTheme, useThemedStyles, typography, spacing, borderRadius, fontFamily, type ThemedTokens} from '@theme';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '@store/store';
import {fetchUserProfile} from '@store/slices/user.slice';
import {logout} from '@store/slices/auth.slice';
import {formatCurrency, formatPhoneNumber} from '@utils/formatting';

interface Props {
  navigation: any;
}

const ProfileScreen: React.FC<Props> = ({navigation}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const {user: authUser} = useSelector((state: RootState) => state.auth);
  const {profile, isLoading} = useSelector((state: RootState) => state.user);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    if (authUser?.id) {
      try {
        await dispatch(fetchUserProfile()).unwrap();
      } catch (e) {
        /* handled */
      }
    }
  };
  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      {text: 'Annuler', style: 'cancel'},
      {text: 'Déconnexion', style: 'destructive', onPress: async () => {
        try {
          await dispatch(logout()).unwrap();
        } catch (e) {
          /* ignore */
        }
      }},
    ]);
  };

  const reputationProgress = (score: number): number => {
    if (score <= 200) return (score / 200) * 100;
    if (score <= 400) return ((score - 200) / 200) * 100;
    if (score <= 650) return ((score - 400) / 250) * 100;
    if (score <= 850) return ((score - 650) / 200) * 100;
    if (score <= 1000) return ((score - 850) / 150) * 100;
    return 100;
  };
  const nextLevel = (score: number): {level: string; points: number} => {
    if (score < 200) return {level: 'Argent', points: 200 - score};
    if (score < 400) return {level: 'Or', points: 400 - score};
    if (score < 650) return {level: 'Platine', points: 650 - score};
    if (score < 850) return {level: 'Diamant', points: 850 - score};
    if (score < 1000) return {level: 'Diamant Max', points: 1000 - score};
    return {level: 'Max', points: 0};
  };

  if (isLoading && !profile) return <LoadingSpinner fullScreen text="Chargement..." />;

  const u: any = profile || authUser;
  if (!u) return null;

  const score = u.reputationScore ?? 680;
  const progress = reputationProgress(score);
  const next = nextLevel(score);
  const currency = u.preferredCurrency || 'XOF';

  const SettingRow: React.FC<{icon: React.ReactNode; bg: string; label: string; onPress?: () => void}> = ({icon, bg, label, onPress}) => (
    <PressableScale style={s.settingRow} onPress={onPress}>
      <View style={[s.settingIcon, {backgroundColor: bg}]}>{icon}</View>
      <Text style={s.settingLabel}>{label}</Text>
      <ChevronRightIcon size={20} color={colors.text.tertiary} />
    </PressableScale>
  );

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{paddingBottom: TAB_BAR_SPACE + spacing.lg}}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.main} />}>
      {/* Hero */}
      <GradientView name="sunset" style={[s.hero, {paddingTop: insets.top + spacing.xl}]}>
        <PatternBackground motif="diamonds" opacity={0.12} />
        <View style={s.heroTop}>
          <Text style={s.heroTitle}>Mon profil</Text>
          <PressableScale style={s.editBtn} onPress={() => navigation.navigate('EditProfile')}>
            <EditIcon size={18} color="#FFFFFF" />
          </PressableScale>
        </View>
        <View style={s.profileRow}>
          <Avatar name={u.fullName} imageUrl={u.profilePhotoUrl || u.avatar} size="xl" showVerified={u.verified || u.isVerified} />
          <View style={s.profileInfo}>
            <Text style={s.name} numberOfLines={1}>
              {u.fullName}
            </Text>
            <Text style={s.phone}>{formatPhoneNumber(u.phoneNumber)}</Text>
            {!!u.email && <Text style={s.email}>{u.email}</Text>}
          </View>
        </View>
      </GradientView>

      {/* Reputation card overlapping hero */}
      <Animated.View entering={FadeInDown.duration(420)} style={s.repCard}>
        <View style={s.repRow}>
          <ProgressRing
            progress={progress / 100}
            size={104}
            strokeWidth={10}
            gradientColors={[colors.brand.gold, colors.brand.terracotta]}>
            <Text style={s.repScore}>{score}</Text>
            <Text style={s.repScoreLabel}>points</Text>
          </ProgressRing>
          <View style={s.repInfo}>
            <Badge variant="reputation" reputationLevel={u.reputationLevel} size="medium" />
            {next.points > 0 ? (
              <Text style={s.repNext}>
                <Text style={{fontWeight: '800', color: colors.text.primary}}>{next.points} pts</Text> pour {next.level}
              </Text>
            ) : (
              <Text style={s.repNext}>Niveau maximum atteint 🎉</Text>
            )}
            <View style={s.repMini}>
              <View style={s.repMiniItem}>
                <Text style={s.repMiniValue}>{u.punctualityRate ?? 0}%</Text>
                <Text style={s.repMiniLabel}>Ponctualité</Text>
              </View>
              <View style={s.repMiniDivider} />
              <View style={s.repMiniItem}>
                <Text style={s.repMiniValue}>{u.totalContributions ?? 0}</Text>
                <Text style={s.repMiniLabel}>Contributions</Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Stats */}
      <Animated.View entering={FadeInDown.delay(80).duration(420)} style={s.body}>
        <View style={s.statsRow}>
          <StatTile icon={<WalletIcon size={22} color={colors.brand.terracotta} />} value={formatCurrency(u.totalContributed || 0, currency)} label="Total contribué" tone={colors.brand.terracotta} toneSoft={colors.brand.terracottaSoft} />
          <View style={{width: spacing.sm}} />
          <StatTile icon={<CashIcon size={22} color={colors.brand.emerald} />} value={formatCurrency(u.totalReceived || 0, currency)} label="Total reçu" tone={colors.brand.emerald} toneSoft={colors.brand.emeraldSoft} />
        </View>
        <View style={[s.statsRow, {marginTop: spacing.sm}]}>
          <StatTile icon={<UsersIcon size={22} color={colors.brand.indigo} />} value={u.activeTontines ?? 0} label="Tontines actives" tone={colors.brand.indigo} toneSoft={colors.brand.indigoSoft} />
          <View style={{width: spacing.sm}} />
          <StatTile icon={<StarIcon size={22} color={colors.brand.gold} />} value={u.completedTontines ?? 0} label="Tontines terminées" tone={colors.brand.gold} toneSoft={colors.brand.goldSoft} />
        </View>

        {/* Badges */}
        {profile?.badges && profile.badges.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Badges</Text>
            <View style={s.badgeWrap}>
              {profile.badges.map((b: any) => (
                <View key={b.id} style={s.badgeChip}>
                  <View style={s.badgeIcon}>
                    <StarIcon size={18} color={colors.brand.gold} filled />
                  </View>
                  <Text style={s.badgeName} numberOfLines={1}>{b.name}</Text>
                  <Text style={s.badgeDesc} numberOfLines={2}>{b.description}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Ratings */}
        {profile?.ratings && profile.ratings.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Évaluations reçues</Text>
            {profile.ratings.map((r: any, i: number) => (
              <View key={r.id ?? i} style={[s.ratingRow, i > 0 && {borderTopWidth: 1, borderTopColor: colors.border.subtle}]}>
                <View style={s.starsRow}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <StarIcon key={n} size={14} color={n <= r.rating ? colors.brand.gold : colors.border.strong} filled={n <= r.rating} />
                  ))}
                </View>
                {!!r.comment && <Text style={s.ratingComment}>« {r.comment} »</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Mobile money */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Comptes Mobile Money</Text>
          {(profile?.mobileMoneyAccounts ?? []).map((acc: any, i: number) => (
            <View key={i} style={[s.mmRow, i > 0 && {borderTopWidth: 1, borderTopColor: colors.border.subtle}]}>
              <View style={[s.settingIcon, {backgroundColor: colors.brand.terracottaSoft}]}>
                <Icon name="cellphone" size={20} color={colors.brand.terracotta} />
              </View>
              <View style={{flex: 1}}>
                <Text style={s.mmProvider}>{acc.provider ?? acc.operator}</Text>
                <Text style={s.mmNumber}>{formatPhoneNumber(acc.phoneNumber ?? acc.accountNumber ?? '')}</Text>
              </View>
              {acc.isDefault && <Badge variant="soft" tone={colors.brand.emerald} label="Par défaut" size="small" />}
            </View>
          ))}
          <PressableScale
            style={s.mmAdd}
            onPress={() => navigation.navigate('AddMobileMoneyAccount')}>
            <PlusCircleIcon size={18} color={colors.accent.main} />
            <Text style={s.mmAddText}>Ajouter un compte</Text>
          </PressableScale>
        </View>

        {/* Settings */}
        <Text style={s.sectionTitle}>Paramètres</Text>
        <View style={s.card}>
          <SettingRow icon={<BellIcon size={20} color={colors.brand.terracotta} />} bg={colors.brand.terracottaSoft} label="Notifications" onPress={() => navigation.navigate('Notifications')} />
          <SettingRow icon={<HistoryIcon size={20} color={colors.brand.indigo} />} bg={colors.brand.indigoSoft} label="Historique des transactions" onPress={() => navigation.navigate('Transactions')} />
          <SettingRow icon={<Icon name="shield-check" size={20} color={colors.brand.emerald} />} bg={colors.brand.emeraldSoft} label="Vérification d'identité" onPress={() => navigation.navigate('Kyc')} />
          <SettingRow icon={<LockIcon size={20} color={colors.brand.indigo} />} bg={colors.brand.indigoSoft} label="Sécurité & confidentialité" onPress={() => navigation.navigate('Settings')} />
          <SettingRow icon={<HelpIcon size={20} color={colors.brand.gold} />} bg={colors.brand.goldSoft} label="Aide & support" />
        </View>

        <Button title="Se déconnecter" variant="outline" onPress={handleLogout} icon="logout" fullWidth style={{marginTop: spacing.lg}} />
        <Text style={s.brandMark}>WeDo</Text>
        <Text style={s.version}>Version 1.0.0</Text>
      </Animated.View>
    </ScrollView>
  );
};

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg.base},
    hero: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing['3xl'] + spacing.xl,
      borderBottomLeftRadius: borderRadius['2xl'],
      borderBottomRightRadius: borderRadius['2xl'],
      overflow: 'hidden',
    },
    heroTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg},
    heroTitle: {...typography.h2, color: '#FFFFFF'},
    editBtn: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
    profileInfo: {flex: 1},
    name: {...typography.h2, color: '#FFFFFF'},
    phone: {...typography.body, color: 'rgba(255,255,255,0.92)', marginTop: 2},
    email: {...typography.caption, color: 'rgba(255,255,255,0.8)', marginTop: 1},
    repCard: {
      marginHorizontal: spacing.lg,
      marginTop: -spacing['3xl'],
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius['2xl'],
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.md,
      shadowColor: colors.shadowColor,
    },
    repRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.lg},
    repScore: {...typography.h2, color: colors.text.primary, fontWeight: '800'},
    repScoreLabel: {...typography.small, color: colors.text.secondary},
    repInfo: {flex: 1, gap: spacing.sm},
    repNext: {...typography.caption, color: colors.text.secondary},
    repMini: {flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs},
    repMiniItem: {flex: 1},
    repMiniValue: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700'},
    repMiniLabel: {...typography.small, color: colors.text.secondary},
    repMiniDivider: {width: 1, height: 30, backgroundColor: colors.border.default, marginHorizontal: spacing.md},
    body: {paddingHorizontal: spacing.lg, marginTop: spacing.lg},
    statsRow: {flexDirection: 'row'},
    card: {
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius.xl,
      padding: spacing.md,
      marginTop: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    cardTitle: {...typography.h3, color: colors.text.primary, fontWeight: '700', marginBottom: spacing.sm},
    mmRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm},
    mmProvider: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '600'},
    mmNumber: {...typography.caption, color: colors.text.secondary},
    mmAdd: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm + 2,
      marginTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    mmAddText: {...typography.bodyMedium, color: colors.accent.main, fontWeight: '700'},
    badgeWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
    badgeChip: {
      width: '31%',
      flexGrow: 1,
      alignItems: 'center',
      backgroundColor: colors.surface.sunken,
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
    },
    badgeIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.brand.goldSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    badgeName: {...typography.captionMedium, color: colors.text.primary, fontWeight: '700', textAlign: 'center'},
    badgeDesc: {...typography.small, color: colors.text.secondary, textAlign: 'center', marginTop: 2},
    ratingRow: {paddingVertical: spacing.sm},
    starsRow: {flexDirection: 'row', gap: 3, marginBottom: 4},
    ratingComment: {...typography.body, color: colors.text.secondary, fontStyle: 'italic'},
    sectionTitle: {...typography.h3, color: colors.text.primary, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.xs},
    settingRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm + 2},
    settingIcon: {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
    settingLabel: {...typography.body, color: colors.text.primary, flex: 1, fontWeight: '500'},
    brandMark: {fontFamily: fontFamily.brand, fontSize: 26, color: colors.text.tertiary, textAlign: 'center', marginTop: spacing.xl},
    version: {...typography.small, color: colors.text.tertiary, textAlign: 'center', marginTop: spacing.xs},
  });

export default ProfileScreen;
