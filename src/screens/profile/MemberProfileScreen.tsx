/**
 * MemberProfileScreen — read-only view of another member's profile: a premium
 * gradient hero (avatar + reputation badge), a reputation progress ring and a
 * grid of available stats. Robust to partial data (demo + real users).
 */
import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {
  Avatar,
  Badge,
  ProgressRing,
  StatTile,
  LoadingSpinner,
  EmptyState,
  PressableScale,
  GradientView,
} from '@components/common';
import {PatternBackground} from '@components/patterns';
import {
  ChevronLeftIcon,
  StarIcon,
  CashIcon,
  UsersIcon,
  CheckIcon,
  ClockIcon,
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
import * as userApi from '@services/api/user.api';
import {formatCurrency} from '@utils/formatting';
import {ReputationLevel} from '@types';

type Nav = StackNavigationProp<RootStackParamList, 'MemberProfile'>;
type Route = RouteProp<RootStackParamList, 'MemberProfile'>;

const REP_GRADIENTS: Record<string, [string, string]> = {
  [ReputationLevel.BRONZE]: ['#D8B084', '#B08D57'],
  [ReputationLevel.SILVER]: ['#C9C7CF', '#A8A6B0'],
  [ReputationLevel.GOLD]: ['#FBD37A', '#F4B43C'],
  [ReputationLevel.PLATINUM]: ['#A8D6E2', '#7FB7C9'],
  [ReputationLevel.DIAMOND]: ['#9DA0F0', '#7A7EE6'],
};

const MemberProfileScreen: React.FC<{navigation: Nav; route: Route}> = ({
  navigation,
  route,
}) => {
  const {userId} = route.params;
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const data = await userApi.getUserProfile(userId);
        if (active) setUser(data);
      } catch (e) {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return <LoadingSpinner fullScreen text="Chargement du profil..." />;
  }

  if (!user) {
    return (
      <View style={s.container}>
        <View style={[s.fallbackHeader, {paddingTop: insets.top + spacing.sm}]}>
          <PressableScale style={s.softBtn} onPress={() => navigation.goBack()}>
            <ChevronLeftIcon size={22} color={colors.text.primary} />
          </PressableScale>
        </View>
        <EmptyState
          icon="account-off"
          title="Profil introuvable"
          description="Impossible de charger ce profil pour le moment."
        />
      </View>
    );
  }

  const name: string = user.fullName ?? 'Membre';
  const score: number = user.reputationScore ?? 0;
  const level: ReputationLevel | undefined = user.reputationLevel;
  const ringGradient = (level && REP_GRADIENTS[level]) || ['#FBD37A', '#F4B43C'];
  const ringProgress = Math.min(Math.max(score / 1000, 0), 1);

  // Collect the optional stats that are actually present on the user object.
  const tiles: Array<{
    key: string;
    icon: React.ReactNode;
    value: string | number;
    label: string;
    tone: string;
    toneSoft: string;
  }> = [];

  tiles.push({
    key: 'reputation',
    icon: <StarIcon size={20} color={colors.brand.gold} filled />,
    value: score,
    label: 'Réputation',
    tone: colors.brand.gold,
    toneSoft: colors.brand.goldSoft,
  });

  if (user.totalContributed != null) {
    tiles.push({
      key: 'contributed',
      icon: <CashIcon size={20} color={colors.brand.terracotta} />,
      value: formatCurrency(user.totalContributed, user.preferredCurrency ?? 'XOF'),
      label: 'Cotisé',
      tone: colors.brand.terracotta,
      toneSoft: colors.brand.terracottaSoft,
    });
  }

  if (user.activeTontines != null) {
    tiles.push({
      key: 'active',
      icon: <UsersIcon size={20} color={colors.brand.emerald} />,
      value: user.activeTontines,
      label: 'Tontines actives',
      tone: colors.brand.emerald,
      toneSoft: colors.brand.emeraldSoft,
    });
  }

  if (user.completedTontines != null) {
    tiles.push({
      key: 'completed',
      icon: <CheckIcon size={20} color={colors.brand.indigo} />,
      value: user.completedTontines,
      label: 'Tontines terminées',
      tone: colors.brand.indigo,
      toneSoft: colors.brand.indigoSoft,
    });
  }

  if (user.punctualityRate != null) {
    tiles.push({
      key: 'punctuality',
      icon: <ClockIcon size={20} color={colors.brand.crimson} />,
      value: `${user.punctualityRate}%`,
      label: 'Ponctualité',
      tone: colors.brand.crimson,
      toneSoft: colors.brand.crimsonSoft,
    });
  }

  // Group tiles into rows of two for a clean grid.
  const rows: (typeof tiles)[] = [];
  for (let i = 0; i < tiles.length; i += 2) {
    rows.push(tiles.slice(i, i + 2));
  }

  return (
    <View style={s.container}>
      <GradientView
        name="sunset"
        style={[s.hero, {paddingTop: insets.top + spacing.sm}]}>
        <PatternBackground motif="diamonds" opacity={0.12} />
        <View style={s.heroTop}>
          <PressableScale style={s.iconBtn} onPress={() => navigation.goBack()}>
            <ChevronLeftIcon size={22} color="#FFFFFF" />
          </PressableScale>
        </View>

        <View style={s.heroBody}>
          <Avatar name={name} imageUrl={user.profilePhotoUrl} size="xl" ring showVerified={!!user.isVerified} />
          <Text style={s.heroName} numberOfLines={2}>
            {name}
          </Text>
          {level && (
            <Badge
              variant="reputation"
              reputationLevel={level}
              reputationScore={score}
              backgroundColor="rgba(255,255,255,0.20)"
              color="#FFFFFF"
            />
          )}
          {(user.city || user.region) && (
            <Text style={s.heroLocation}>
              {[user.city, user.region].filter(Boolean).join(', ')}
            </Text>
          )}
        </View>
      </GradientView>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.lg,
          paddingTop: spacing.xl,
        }}
        showsVerticalScrollIndicator={false}>
        {/* Reputation ring */}
        <Animated.View entering={FadeInDown.duration(360)} style={s.ringCard}>
          <ProgressRing
            progress={ringProgress}
            size={132}
            strokeWidth={12}
            gradientColors={ringGradient as [string, string]}>
            <Text style={s.ringScore}>{score}</Text>
            <Text style={s.ringMax}>/ 1000</Text>
          </ProgressRing>
          <Text style={s.ringCaption}>Score de réputation</Text>
        </Animated.View>

        {/* Stats grid */}
        <Animated.View entering={FadeInDown.delay(80).duration(360)} style={s.section}>
          <Text style={s.sectionTitle}>Statistiques</Text>
          {rows.map((row, ri) => (
            <View key={ri} style={s.tileRow}>
              {row.map(tile => (
                <StatTile
                  key={tile.key}
                  icon={tile.icon}
                  value={tile.value}
                  label={tile.label}
                  tone={tile.tone}
                  toneSoft={tile.toneSoft}
                />
              ))}
              {row.length === 1 && <View style={{flex: 1}} />}
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg.base},
    fallbackHeader: {paddingHorizontal: spacing.lg, paddingBottom: spacing.sm},
    softBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.sunken,
    },
    hero: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      borderBottomLeftRadius: borderRadius['2xl'],
      borderBottomRightRadius: borderRadius['2xl'],
      overflow: 'hidden',
    },
    heroTop: {flexDirection: 'row', marginBottom: spacing.sm},
    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroBody: {alignItems: 'center', gap: spacing.sm},
    heroName: {...typography.h1, color: '#FFFFFF', textAlign: 'center'},
    heroLocation: {...typography.caption, color: 'rgba(255,255,255,0.85)'},
    ringCard: {
      alignItems: 'center',
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius.xl,
      paddingVertical: spacing.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.sm,
      shadowColor: colors.shadowColor,
    },
    ringScore: {...typography.amount, color: colors.text.primary, fontWeight: '800'},
    ringMax: {...typography.caption, color: colors.text.secondary, marginTop: -2},
    ringCaption: {...typography.bodyMedium, color: colors.text.secondary, marginTop: spacing.md, fontWeight: '600'},
    section: {marginTop: spacing.xl},
    sectionTitle: {...typography.h3, color: colors.text.primary, fontWeight: '700', marginBottom: spacing.md},
    tileRow: {flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md},
  });

export default MemberProfileScreen;
