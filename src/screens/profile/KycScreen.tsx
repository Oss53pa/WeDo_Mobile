/**
 * KycScreen — identity verification overview: current status and the ladder of
 * KYC levels with transaction limits and required documents. Premium themed UI.
 */
import React from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {
  Button,
  ScreenHeader,
  GradientCard,
  Card,
  Badge,
  Chip,
} from '@components/common';
import {LockIcon, CheckIcon, InfoIcon} from '@components/icons';
import {
  useTheme,
  useThemedStyles,
  typography,
  spacing,
  borderRadius,
  type ThemedTokens,
} from '@theme';
import {RootStackParamList} from '@navigation/types';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {KYC_CONFIG} from '@config';
import {formatCurrency} from '@utils/formatting';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

type Nav = StackNavigationProp<RootStackParamList, 'Kyc'>;

const docName = (id: string): string =>
  KYC_CONFIG.documentTypes.find(d => d.id === id)?.name ?? id;

const formatLimit = (amount: number): string =>
  amount === Infinity || !isFinite(amount) ? 'Illimité' : formatCurrency(amount);

const KycScreen: React.FC<{navigation: Nav}> = ({navigation}) => {
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const {profile} = useSelector((st: RootState) => st.user);
  const currentLevel = (profile?.kycLevel as number | undefined) ?? 0;

  const levels = KYC_CONFIG.levels;
  const currentConfig =
    levels.find(l => l.level === currentLevel) ?? levels[0];

  const handleVerify = () => {
    Alert.alert(
      'Vérification',
      'Téléversement de documents — bientôt disponible.',
    );
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Vérification d'identité"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={[
          s.content,
          {paddingBottom: insets.bottom + spacing.lg},
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Hero — current status */}
        <Animated.View entering={FadeInDown.duration(360)}>
          <GradientCard
            gradient="indigo"
            motif="weave"
            motifOpacity={0.12}
            style={s.hero}>
            <View style={s.heroIcon}>
              <LockIcon size={28} color="#FFFFFF" />
            </View>
            <Text style={s.heroLabel}>Niveau de vérification</Text>
            <Text style={s.heroLevel}>{currentConfig.name}</Text>
            <Badge
              variant="soft"
              tone="#FFFFFF"
              label={`Plafond ${formatLimit(currentConfig.maxTransactionAmount)}`}
              backgroundColor="rgba(255,255,255,0.18)"
              style={s.heroBadge}
            />
            <Text style={s.heroHint}>
              Augmentez votre niveau pour relever vos plafonds de transaction et
              débloquer toutes les fonctionnalités.
            </Text>
          </GradientCard>
        </Animated.View>

        <Text style={s.section}>Niveaux de vérification</Text>

        {levels.map((lvl, i) => {
          const isCurrent = lvl.level === currentLevel;
          const isUnlocked = lvl.level <= currentLevel;
          const docs = Array.isArray(lvl.requiresDocuments)
            ? lvl.requiresDocuments
            : [];
          return (
            <Animated.View
              key={lvl.level}
              entering={FadeInDown.duration(360).delay(80 + i * 60)}>
              <Card
                variant={isCurrent ? 'default' : 'outline'}
                padding={spacing.lg}
                style={[s.levelCard, isCurrent && {borderColor: colors.accent.main, borderWidth: 1.5}]}>
                <View style={s.levelHead}>
                  <View style={s.levelTitleWrap}>
                    <View
                      style={[
                        s.levelDot,
                        {backgroundColor: isUnlocked ? colors.brand.emerald : colors.surface.sunken},
                      ]}>
                      {isUnlocked ? (
                        <CheckIcon size={14} color="#FFFFFF" />
                      ) : (
                        <LockIcon size={13} color={colors.text.tertiary} />
                      )}
                    </View>
                    <Text style={s.levelName}>{lvl.name}</Text>
                  </View>
                  {isCurrent && (
                    <Badge
                      variant="soft"
                      tone={colors.accent.main}
                      label="Niveau actuel"
                    />
                  )}
                </View>

                <View style={s.limits}>
                  <View style={s.limitRow}>
                    <Text style={s.limitLabel}>Par transaction</Text>
                    <Text style={s.limitValue}>
                      {formatLimit(lvl.maxTransactionAmount)}
                    </Text>
                  </View>
                  <View style={s.limitRow}>
                    <Text style={s.limitLabel}>Par jour</Text>
                    <Text style={s.limitValue}>
                      {formatLimit(lvl.maxDailyAmount)}
                    </Text>
                  </View>
                </View>

                {docs.length > 0 ? (
                  <>
                    <Text style={s.docTitle}>Documents requis</Text>
                    <View style={s.docList}>
                      {docs.map(d => (
                        <Chip key={d} label={docName(d)} selected={isUnlocked} />
                      ))}
                    </View>
                  </>
                ) : (
                  <View style={s.noDoc}>
                    <InfoIcon size={16} color={colors.text.tertiary} />
                    <Text style={s.noDocText}>Aucun document requis</Text>
                  </View>
                )}

                {!isUnlocked && lvl.level > currentLevel && (
                  <Button
                    title="Vérifier"
                    variant="gradient"
                    gradient="sunset"
                    onPress={handleVerify}
                    fullWidth
                    icon="shield-check"
                    style={{marginTop: spacing.md}}
                  />
                )}
              </Card>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg.base},
    content: {paddingHorizontal: spacing.lg, paddingTop: spacing.sm},
    hero: {marginBottom: spacing.lg, alignItems: 'center'},
    heroIcon: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.16)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    heroLabel: {
      ...typography.captionMedium,
      color: 'rgba(255,255,255,0.9)',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    heroLevel: {
      ...typography.h1,
      color: '#FFFFFF',
      fontWeight: '800',
      marginTop: 2,
    },
    heroBadge: {marginTop: spacing.sm},
    heroHint: {
      ...typography.caption,
      color: 'rgba(255,255,255,0.85)',
      textAlign: 'center',
      marginTop: spacing.md,
      lineHeight: 18,
    },
    section: {
      ...typography.h3,
      color: colors.text.primary,
      fontWeight: '700',
      marginBottom: spacing.md,
    },
    levelCard: {marginBottom: spacing.md},
    levelHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    levelTitleWrap: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1},
    levelDot: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    levelName: {...typography.bodyLarge, color: colors.text.primary, fontWeight: '700'},
    limits: {
      marginTop: spacing.md,
      backgroundColor: colors.surface.sunken,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      gap: spacing.xs,
    },
    limitRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
    limitLabel: {...typography.caption, color: colors.text.secondary},
    limitValue: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700'},
    docTitle: {
      ...typography.captionMedium,
      color: colors.text.tertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    docList: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
    noDoc: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md},
    noDocText: {...typography.caption, color: colors.text.tertiary},
  });

export default KycScreen;
