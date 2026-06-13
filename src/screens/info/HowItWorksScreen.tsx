/**
 * HowItWorksScreen — "La confiance WeDo" : explains the trust model in plain
 * language (chained registry, escrow, portable score, identity/KYC, fees).
 */
import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {ScreenHeader, Card, GradientCard} from '@components/common';
import {KenteStripe} from '@components/patterns';
import {
  useTheme,
  useThemedStyles,
  typography,
  spacing,
  borderRadius,
  type ThemedTokens,
} from '@theme';

interface Step {
  icon: string;
  tone: (c: any) => string;
  soft: (c: any) => string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: 'shield-lock',
    tone: c => c.brand.indigo,
    soft: c => c.brand.indigoSoft,
    title: 'Registre infalsifiable',
    body: "Chaque mouvement (cotisation, distribution) est horodaté et chaîné cryptographiquement (SHA-256). Personne ne peut modifier l'historique a posteriori — les litiges sont réduits au minimum.",
  },
  {
    icon: 'safe',
    tone: c => c.brand.emerald,
    soft: c => c.brand.emeraldSoft,
    title: 'Argent sous séquestre',
    body: "Les cotisations sont sécurisées dans un compte de cantonnement, pas dans la poche de l'organisateur. La distribution au bénéficiaire du tour est automatique dès que tout le monde a payé.",
  },
  {
    icon: 'chart-line',
    tone: c => c.brand.gold,
    soft: c => c.brand.goldSoft,
    title: 'Score de fiabilité portable',
    body: "Payer à l'heure améliore votre score. Il vous suit d'une tontine à l'autre et vous ouvre l'accès à des cercles plus exigeants.",
  },
  {
    icon: 'card-account-details',
    tone: c => c.brand.terracotta,
    soft: c => c.brand.terracottaSoft,
    title: 'Identité vérifiée',
    body: "Vérification d'identité (CNI + biométrie) via un prestataire certifié. Vos données sont traitées dans le respect de la réglementation (ARTCI, Côte d'Ivoire).",
  },
  {
    icon: 'cash-check',
    tone: c => c.brand.crimson,
    soft: c => c.brand.crimsonSoft,
    title: 'Frais transparents',
    body: "Un frais d'activation unique, payé une seule fois au lancement et identique pour tous les membres (organisateur compris). Aucun prélèvement sur la cagnotte distribuée.",
  },
];

const HowItWorksScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const {colors, copy} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  return (
    <View style={s.container}>
      <ScreenHeader title={copy.help} onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[s.content, {paddingBottom: insets.bottom + spacing.xl}]}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(360)}>
          <GradientCard gradient="sunset" motif="diamonds" motifOpacity={0.14} style={s.hero}>
            <Text style={s.heroTitle}>La confiance, par conception</Text>
            <KenteStripe height={5} style={{marginVertical: spacing.md, width: 130}} />
            <Text style={s.heroHint}>
              WeDo, c'est la tontine traditionnelle — la solidarité de toujours — avec la
              sécurité du numérique. Voici ce qui protège votre argent.
            </Text>
          </GradientCard>
        </Animated.View>

        {STEPS.map((step, i) => (
          <Animated.View key={step.title} entering={FadeInDown.duration(360).delay(60 + i * 60)}>
            <Card variant="default" padding={spacing.lg} style={s.card}>
              <View style={s.cardHeader}>
                <View style={[s.iconWrap, {backgroundColor: step.soft(colors)}]}>
                  <Icon name={step.icon} size={24} color={step.tone(colors)} />
                </View>
                <Text style={s.cardTitle}>{step.title}</Text>
              </View>
              <Text style={s.cardBody}>{step.body}</Text>
            </Card>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.duration(360).delay(60 + STEPS.length * 60)}>
          <Text style={s.footer}>
            Une question ? Un doute ? Écrivez-nous depuis « Votre avis compte » — nous lisons
            chaque message.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg.base},
    content: {paddingHorizontal: spacing.lg, paddingTop: spacing.sm},
    hero: {marginBottom: spacing.lg},
    heroTitle: {...typography.h2, color: '#FFFFFF', fontWeight: '800'},
    heroHint: {...typography.body, color: 'rgba(255,255,255,0.92)', lineHeight: 22},
    card: {marginBottom: spacing.md},
    cardHeader: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm},
    iconWrap: {width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
    cardTitle: {...typography.h3, color: colors.text.primary, fontWeight: '700', flex: 1},
    cardBody: {...typography.body, color: colors.text.secondary, lineHeight: 22},
    footer: {
      ...typography.caption,
      color: colors.text.tertiary,
      textAlign: 'center',
      marginTop: spacing.md,
      lineHeight: 18,
    },
  });

export default HowItWorksScreen;
