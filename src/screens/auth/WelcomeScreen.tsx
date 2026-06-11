/**
 * Welcome / Onboarding — immersive, premium animated intro with WeDo branding.
 */
import React, {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeIn, FadeInDown, FadeInUp} from 'react-native-reanimated';
import {useDispatch} from 'react-redux';
import {Button, GradientView, PressableScale} from '@components/common';
import {KenteEmblem, KenteStripe, PatternBackground} from '@components/patterns';
import {WalletIcon, UsersIcon, TrendingUpIcon, StarIcon} from '@components/icons';
import {
  useTheme,
  useThemedStyles,
  typography,
  spacing,
  borderRadius,
  fontFamily,
  type ThemedTokens,
} from '@theme';
import {AuthStackScreenProps} from '@navigation/types';
import {demoLogin} from '@store/slices/auth.slice';
import {IS_SUPABASE_CONFIGURED} from '@config/appConfig';

type WelcomeScreenProps = AuthStackScreenProps<'Welcome'>;

const slides = [
  {
    Icon: WalletIcon,
    gradient: 'sunset' as const,
    eyebrow: 'BIENVENUE',
    title: 'Vos tontines,\nréinventées',
    subtitle: 'La façon moderne et sûre d’épargner en groupe — ensemble, en confiance.',
  },
  {
    Icon: UsersIcon,
    gradient: 'emerald' as const,
    eyebrow: 'COMMUNAUTÉ',
    title: 'Un cercle\nde confiance',
    subtitle: 'Réputation, transparence et respect des engagements entre membres.',
  },
  {
    Icon: TrendingUpIcon,
    gradient: 'indigo' as const,
    eyebrow: 'CLARTÉ',
    title: 'Suivi en\ntemps réel',
    subtitle: 'Contributions, tours et soldes, toujours à jour et limpides.',
  },
  {
    Icon: StarIcon,
    gradient: 'gold' as const,
    eyebrow: 'SIMPLICITÉ',
    title: 'Paiements\nen un geste',
    subtitle: 'Mobile Money intégré : cotisez en quelques secondes, sans friction.',
  },
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({navigation}) => {
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const [index, setIndex] = useState(0);

  const slide = slides[index];
  const isLast = index === slides.length - 1;
  const SlideIcon = slide.Icon;

  const next = () => (isLast ? navigation.navigate('Register') : setIndex(i => i + 1));

  return (
    <View style={s.container}>
      {/* Immersive hero */}
      <Animated.View key={`hero-${index}`} entering={FadeIn.duration(450)} style={s.heroWrap}>
        <GradientView name={slide.gradient} style={[s.hero, {paddingTop: insets.top + spacing.md}]}>
          <PatternBackground motif="diamonds" opacity={0.14} />
          <GradientView name="sheen" style={StyleSheet.absoluteFill as any} pointerEvents="none" />

          {/* Top bar */}
          <View style={s.topBar}>
            <View style={s.brandRow}>
              <View style={s.logoBadge}>
                <Text style={s.logoLetter}>W</Text>
              </View>
              <Text style={s.brand}>WeDo</Text>
            </View>
            <PressableScale onPress={() => navigation.navigate('Login')} style={s.skipBtn}>
              <Text style={s.skip}>Passer</Text>
            </PressableScale>
          </View>

          {/* Emblem */}
          <View style={s.emblemWrap}>
            {/* soft floating accents for depth */}
            <View style={[s.blob, {top: 14, left: 24, width: 60, height: 60}]} />
            <View style={[s.blob, {bottom: 18, right: 28, width: 44, height: 44}]} />
            <KenteEmblem size={150} color="rgba(255,255,255,0.95)" accent="rgba(255,255,255,0.5)" />
            <View style={s.heroIcon} pointerEvents="none">
              <View style={s.iconDisc}>
                <SlideIcon size={40} color="#FFFFFF" />
              </View>
            </View>
          </View>

          <View style={s.counter}>
            <Text style={s.counterNow}>{String(index + 1).padStart(2, '0')}</Text>
            <Text style={s.counterTotal}> / {String(slides.length).padStart(2, '0')}</Text>
          </View>
        </GradientView>
      </Animated.View>

      {/* Content */}
      <View style={s.content}>
        <Animated.View key={`copy-${index}`} entering={FadeInUp.duration(420)}>
          <Text style={[s.eyebrow, {color: colors.accent.main}]}>{slide.eyebrow}</Text>
          <Text style={s.title}>{slide.title}</Text>
          <Text style={s.subtitle}>{slide.subtitle}</Text>
        </Animated.View>

        <View style={{flex: 1}} />

        <View style={s.dots}>
          {slides.map((_, i) => (
            <PressableScale key={i} onPress={() => setIndex(i)}>
              <View
                style={[
                  s.dot,
                  i === index
                    ? {backgroundColor: colors.accent.main, width: 26}
                    : {backgroundColor: colors.border.strong},
                ]}
              />
            </PressableScale>
          ))}
        </View>

        <Animated.View entering={FadeInDown.duration(420)}>
          <KenteStripe height={6} style={{marginBottom: spacing.lg, opacity: 0.9}} />
          <Button title={isLast ? 'Créer mon compte' : 'Continuer'} onPress={next} variant="gradient" gradient="sunset" fullWidth size="large" />
          <View style={s.footerRow}>
            <Text style={s.footerText}>Déjà un compte ?</Text>
            <PressableScale onPress={() => navigation.navigate('Login')}>
              <Text style={s.link}>Se connecter</Text>
            </PressableScale>
          </View>
          {!IS_SUPABASE_CONFIGURED && (
            <PressableScale onPress={() => dispatch(demoLogin())} style={[s.demoBtn, {paddingBottom: spacing.sm}]}>
              <Text style={s.demoText}>Accès démo</Text>
            </PressableScale>
          )}
          <Text style={[s.credit, {paddingBottom: insets.bottom + spacing.sm}]}>
            une application <Text style={s.creditName}>Atlas Studio</Text>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const makeStyles = ({colors}: ThemedTokens) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg.base},
    heroWrap: {flex: 1.05},
    hero: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      borderBottomLeftRadius: 36,
      borderBottomRightRadius: 36,
      overflow: 'hidden',
    },
    topBar: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    brandRow: {flexDirection: 'row', alignItems: 'center'},
    logoBadge: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    logoLetter: {fontFamily: fontFamily.brand, fontSize: 22, color: '#FFFFFF'},
    brand: {fontFamily: fontFamily.brand, fontSize: 30, color: '#FFFFFF'},
    skipBtn: {paddingVertical: 6, paddingHorizontal: spacing.md, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.16)'},
    skip: {...typography.captionMedium, color: '#FFFFFF', fontWeight: '700'},
    emblemWrap: {flex: 1, alignItems: 'center', justifyContent: 'center'},
    blob: {position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)'},
    heroIcon: {...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center'},
    iconDisc: {
      width: 72,
      height: 72,
      borderRadius: 24,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.28)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    counter: {flexDirection: 'row', alignItems: 'baseline', alignSelf: 'flex-end', paddingBottom: spacing.md},
    counterNow: {...typography.h3, color: '#FFFFFF', fontWeight: '800'},
    counterTotal: {...typography.caption, color: 'rgba(255,255,255,0.8)'},
    content: {flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md},
    eyebrow: {...typography.overline, letterSpacing: 2, fontWeight: '800', marginBottom: 2},
    title: {
      fontFamily: fontFamily.bold,
      fontSize: 32,
      lineHeight: 35,
      fontWeight: '800',
      color: colors.text.primary,
      letterSpacing: -0.5,
    },
    subtitle: {...typography.body, color: colors.text.secondary, marginTop: spacing.sm, maxWidth: 340},
    dots: {flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: spacing.md},
    dot: {width: 9, height: 9, borderRadius: 5},
    footerRow: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.md, gap: 6},
    footerText: {...typography.body, color: colors.text.secondary},
    link: {...typography.bodyMedium, color: colors.accent.main, fontWeight: '800'},
    demoBtn: {alignSelf: 'center', marginTop: spacing.sm, paddingTop: spacing.xs, paddingHorizontal: spacing.lg},
    demoText: {...typography.caption, color: colors.text.tertiary, fontWeight: '700'},
    credit: {...typography.small, color: colors.text.tertiary, textAlign: 'center', marginTop: spacing.sm, letterSpacing: 0.4},
    creditName: {color: colors.text.secondary, fontWeight: '600'},
  });

export default WelcomeScreen;
