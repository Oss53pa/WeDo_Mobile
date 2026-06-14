/**
 * KycScreen — identity verification overview: current status and the ladder of
 * KYC levels with transaction limits and required documents. Premium themed UI.
 */
import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert, Image} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {
  Button,
  ScreenHeader,
  GradientCard,
  Card,
  Badge,
  Chip,
  Input,
  PressableScale,
  useToast,
} from '@components/common';
import {LockIcon, CheckIcon, InfoIcon} from '@components/icons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as identityApi from '@services/api/identity.api';
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

  const {show} = useToast();
  const [recto, setRecto] = useState<string | null>(null);
  const [verso, setVerso] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [cniNumber, setCniNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [kyc, setKyc] = useState<identityApi.KycSubmission | null>(null);

  useEffect(() => {
    identityApi.getMyKyc().then(setKyc).catch(() => {});
  }, []);

  const pick = async (kind: identityApi.KycDocKind, setUri: (u: string) => void) => {
    const useCamera = kind === 'selfie';
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      show("Autorisation refusée (caméra/galerie).", {type: 'error'});
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: kind === 'selfie',
      aspect: kind === 'selfie' ? [1, 1] : undefined,
      quality: 0.6,
    };
    const res = useCamera
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled && res.assets?.[0]) setUri(res.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!cniNumber.trim()) return show('Indiquez votre numéro de pièce.', {type: 'error'});
    if (!recto || !verso || !selfie) return show('Ajoutez le recto, le verso et un selfie.', {type: 'error'});
    setSubmitting(true);
    try {
      await identityApi.submitKyc({cniNumber: cniNumber.trim(), rectoUri: recto, versoUri: verso, selfieUri: selfie});
      setKyc({status: 'pending'});
      show('Dossier envoyé ! Vérification sous 24-48 h.', {type: 'success'});
    } catch (e: any) {
      show(e?.message ?? "Échec de l'envoi.", {type: 'error'});
    } finally {
      setSubmitting(false);
    }
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

        {currentLevel < 2 && (
          <Animated.View entering={FadeInDown.duration(360).delay(40)}>
            <Card variant="default" padding={spacing.lg} style={s.verifyCard}>
              <Text style={s.section}>Vérifier mon identité (Niveau 2)</Text>
              {kyc?.status === 'pending' ? (
                <View style={s.statusBox}>
                  <Icon name="clock-outline" size={20} color={colors.brand.gold} />
                  <Text style={s.statusText}>Dossier reçu — vérification sous 24-48 h.</Text>
                </View>
              ) : (
                <>
                  {kyc?.status === 'rejected' && (
                    <View style={[s.statusBox, {backgroundColor: colors.brand.crimsonSoft}]}>
                      <Icon name="alert-circle-outline" size={20} color={colors.brand.crimson} />
                      <Text style={[s.statusText, {color: colors.brand.crimson}]}>
                        Dossier refusé{kyc.reason ? ` : ${kyc.reason}` : ''}. Vous pouvez renvoyer.
                      </Text>
                    </View>
                  )}
                  <Text style={s.verifyHint}>
                    Photographiez votre pièce d'identité (recto et verso) et prenez un selfie.
                    Un membre de l'équipe vérifie sous 24-48 h.
                  </Text>
                  <Input label="Numéro de la pièce" placeholder="Ex : CI0012345678" value={cniNumber} onChangeText={setCniNumber} />
                  <View style={s.captureRow}>
                    {([['recto', recto, setRecto, 'CNI recto'], ['verso', verso, setVerso, 'CNI verso'], ['selfie', selfie, setSelfie, 'Selfie']] as const).map(
                      ([kind, uri, setter, label]) => (
                        <PressableScale key={kind} style={s.captureTile} onPress={() => pick(kind, setter)}>
                          {uri ? (
                            <Image source={{uri}} style={s.capturePreview} />
                          ) : (
                            <Icon name={kind === 'selfie' ? 'camera-account' : 'card-account-details-outline'} size={26} color={colors.text.tertiary} />
                          )}
                          <Text style={s.captureLabel}>{uri ? '✓ ' : ''}{label}</Text>
                        </PressableScale>
                      ),
                    )}
                  </View>
                  <Button title="Envoyer pour vérification" variant="gradient" gradient="sunset" fullWidth
                    icon="shield-check" loading={submitting} disabled={submitting} onPress={handleSubmit}
                    style={{marginTop: spacing.md}} />
                </>
              )}
            </Card>
          </Animated.View>
        )}

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

                {!isUnlocked && lvl.level === 2 && (
                  <Text style={s.levelHintP2}>↑ Utilisez « Vérifier mon identité » ci-dessus pour atteindre ce niveau.</Text>
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
    verifyCard: {marginBottom: spacing.lg, borderColor: colors.accent.main, borderWidth: 1.5},
    verifyHint: {...typography.caption, color: colors.text.secondary, lineHeight: 18, marginBottom: spacing.md},
    captureRow: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md},
    captureTile: {
      flex: 1, height: 92, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border.default,
      backgroundColor: colors.surface.sunken, alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden',
    },
    capturePreview: {width: '100%', height: 62, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg},
    captureLabel: {...typography.small, color: colors.text.secondary, fontWeight: '600', textAlign: 'center'},
    statusBox: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.accent[50], borderRadius: borderRadius.lg, padding: spacing.md, marginVertical: spacing.sm},
    statusText: {...typography.caption, color: colors.text.primary, flex: 1, lineHeight: 18},
    levelHintP2: {...typography.caption, color: colors.accent.main, marginTop: spacing.md},
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
