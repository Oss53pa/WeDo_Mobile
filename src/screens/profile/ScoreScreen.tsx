/**
 * ScoreScreen — le score-passeport de fiabilité, visible et explicable.
 *
 * Indexé sur la PERSONNE (portable d'une tontine à l'autre), il rend la réputation
 * lisible et motivante : valeur, badge, ce qui le fait monter/descendre, et
 * l'historique des événements. Le score est calculé en déterministe côté serveur
 * (reputation_events) — jamais dérivé d'une sortie IA. Réhabilitable après
 * régularisation d'une dette (brief défauts §8).
 */
import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, RefreshControl} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {ScreenHeader, Card, Badge, LoadingSpinner, EmptyState} from '@components/common';
import {ArrowUpIcon, ArrowDownIcon, CheckIcon} from '@components/icons';
import {
  useTheme,
  useThemedStyles,
  typography,
  spacing,
  borderRadius,
  type ThemedTokens,
} from '@theme';
import {RootStackParamList} from '@navigation/types';
import * as identityApi from '@services/api/identity.api';
import {formatDate} from '@utils/formatting';

type Nav = StackNavigationProp<RootStackParamList, 'Score'>;

interface Factor {
  label: string;
  delta: string;
  positive: boolean;
}

// Barème déterministe (aligné sur les RPC serveur : confirmer_cotisation, module défauts).
const FACTORS: Factor[] = [
  {label: 'Cotisation payée à l’heure', delta: '+2', positive: true},
  {label: 'Dette régularisée (réhabilitation)', delta: '+20', positive: true},
  {label: 'Cycle terminé sans incident', delta: '+5', positive: true},
  {label: 'Retard de paiement', delta: '−5', positive: false},
  {label: 'Désistement déclaré', delta: '−10', positive: false},
  {label: 'Défaut après avoir touché la cagnotte', delta: '−50', positive: false},
];

const tierOf = (v: number, colors: any): {label: string; color: string} => {
  if (v >= 80) return {label: 'Or — très fiable', color: colors.brand.gold};
  if (v >= 60) return {label: 'Argent — fiable', color: colors.brand.indigo};
  if (v >= 40) return {label: 'Bronze — en construction', color: colors.brand.terracotta};
  return {label: 'À renforcer', color: colors.error};
};

const ScoreScreen: React.FC<{navigation: Nav}> = ({navigation}) => {
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<identityApi.ReliabilityScore | null>(null);
  const [history, setHistory] = useState<identityApi.ScoreEvent[]>([]);

  const load = useCallback(async () => {
    try {
      const [sc, hist] = await Promise.all([
        identityApi.getMyScore().catch(() => null),
        identityApi.getScoreHistory().catch(() => []),
      ]);
      setScore(sc);
      setHistory(hist);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingSpinner fullScreen text="Chargement de votre score…" />;

  const valeur = score?.valeur ?? 0;
  const tier = tierOf(valeur, colors);
  const pct = Math.max(0, Math.min(100, valeur));

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Score de fiabilité"
        subtitle="Votre passeport de confiance"
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
        {/* Score principal */}
        <Animated.View entering={FadeInDown.duration(360)}>
          <Card variant="default" padding={spacing.lg}>
            <View style={s.scoreHead}>
              <View>
                <Text style={s.scoreValue}>{valeur}<Text style={s.scoreMax}> / 100</Text></Text>
                <Badge variant="soft" tone={tier.color} label={tier.label} size="small" />
              </View>
            </View>
            <View style={s.gaugeTrack}>
              <View style={[s.gaugeFill, {width: `${pct}%`, backgroundColor: tier.color}]} />
            </View>
            <Text style={s.scoreHint}>
              Votre score vous suit d'une tontine à l'autre. Un bon historique vous ouvre les
              tontines plus importantes ; un défaut le dégrade fortement.
            </Text>

            {score && (
              <View style={s.statsRow}>
                <Stat label="Cotisations" value={String(score.totalCotisations)} s={s} />
                <Stat label="À l’heure" value={String(score.cotisationsHeure)} s={s} />
                <Stat label="Retards" value={String(score.retards)} s={s} />
                <Stat label="Défauts" value={String(score.defauts)} s={s} />
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Facteurs */}
        <Animated.View entering={FadeInDown.delay(60).duration(360)} style={s.section}>
          <Text style={s.sectionTitle}>Ce qui fait bouger votre score</Text>
          <Card variant="default" padding={spacing.md}>
            {FACTORS.map((f, i) => (
              <View
                key={f.label}
                style={[s.factorRow, i < FACTORS.length - 1 && s.factorBorder]}>
                <View
                  style={[
                    s.factorIcon,
                    {backgroundColor: (f.positive ? colors.brand.emerald : colors.brand.terracotta) + '14'},
                  ]}>
                  {f.positive ? (
                    <ArrowUpIcon size={15} color={colors.brand.emerald} />
                  ) : (
                    <ArrowDownIcon size={15} color={colors.brand.terracotta} />
                  )}
                </View>
                <Text style={s.factorLabel}>{f.label}</Text>
                <Text
                  style={[
                    s.factorDelta,
                    {color: f.positive ? colors.brand.emerald : colors.brand.terracotta},
                  ]}>
                  {f.delta}
                </Text>
              </View>
            ))}
          </Card>
          <Text style={s.rehabNote}>
            Un membre en défaut peut redresser son score en régularisant sa dette : la réputation
            n'est pas une condamnation à vie.
          </Text>
        </Animated.View>

        {/* Historique */}
        <Animated.View entering={FadeInDown.delay(120).duration(360)} style={s.section}>
          <Text style={s.sectionTitle}>Historique</Text>
          {history.length === 0 ? (
            <EmptyState
              icon="history"
              title="Pas encore d’historique"
              description="Vos cotisations et événements apparaîtront ici au fil de vos tontines."
            />
          ) : (
            history.map((e, i) => {
              const positive = e.delta >= 0;
              const tone = positive ? colors.brand.emerald : colors.brand.terracotta;
              return (
                <Animated.View key={e.id} entering={FadeInDown.delay(140 + i * 24).duration(280)}>
                  <View style={s.histRow}>
                    <View style={[s.factorIcon, {backgroundColor: tone + '14'}]}>
                      <CheckIcon size={14} color={tone} />
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={s.histRaison} numberOfLines={1}>{e.raison}</Text>
                      <Text style={s.histDate}>{formatDate(e.createdAt)}</Text>
                    </View>
                    <Text style={[s.factorDelta, {color: tone}]}>
                      {positive ? '+' : ''}{e.delta}
                    </Text>
                  </View>
                </Animated.View>
              );
            })
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const Stat: React.FC<{label: string; value: string; s: any}> = ({label, value, s}) => (
  <View style={s.statItem}>
    <Text style={s.statValue}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg.base},
    scoreHead: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    scoreValue: {...typography.h1, color: colors.text.primary, fontWeight: '800', fontVariant: ['tabular-nums']},
    scoreMax: {...typography.h3, color: colors.text.tertiary, fontWeight: '700'},
    gaugeTrack: {height: 12, borderRadius: 999, backgroundColor: colors.border.subtle, marginTop: spacing.md, overflow: 'hidden'},
    gaugeFill: {height: 12, borderRadius: 999},
    scoreHint: {...typography.caption, color: colors.text.secondary, marginTop: spacing.md},
    statsRow: {
      flexDirection: 'row',
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    statItem: {flex: 1, alignItems: 'center'},
    statValue: {...typography.h3, color: colors.text.primary, fontWeight: '800', fontVariant: ['tabular-nums']},
    statLabel: {...typography.small, color: colors.text.secondary, marginTop: 2},
    section: {marginTop: spacing.xl},
    sectionTitle: {...typography.h3, color: colors.text.primary, fontWeight: '700', marginBottom: spacing.md},
    factorRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm},
    factorBorder: {borderBottomWidth: 1, borderBottomColor: colors.border.subtle},
    factorIcon: {width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center'},
    factorLabel: {...typography.bodyMedium, color: colors.text.primary, flex: 1},
    factorDelta: {...typography.bodyMedium, fontWeight: '800', fontVariant: ['tabular-nums']},
    rehabNote: {...typography.caption, color: colors.text.secondary, marginTop: spacing.md, fontStyle: 'italic'},
    histRow: {
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
    histRaison: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '600'},
    histDate: {...typography.small, color: colors.text.secondary, marginTop: 2},
  });

export default ScoreScreen;
