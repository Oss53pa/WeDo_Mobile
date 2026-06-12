/**
 * JoinByCodeScreen — join a tontine with its 8-char invitation code.
 * Goes through the same trust gate as the public join (score + KYC P2).
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {Button, ScreenHeader, GradientCard, useToast} from '@components/common';
import {KenteStripe} from '@components/patterns';
import {
  useTheme,
  useThemedStyles,
  typography,
  spacing,
  borderRadius,
  type ThemedTokens,
} from '@theme';
import {RootStackScreenProps} from '@navigation/types';
import tontineApi from '@services/api/tontine.api';

const CODE_LENGTH = 8;

type Props = RootStackScreenProps<'JoinByCode'>;

const JoinByCodeScreen: React.FC<Props> = ({navigation}) => {
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const {show} = useToast();

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const cleaned = code.toUpperCase().replace(/[^A-Z0-9]/g, '');

  const handleJoin = async () => {
    if (cleaned.length !== CODE_LENGTH) {
      show(`Le code d'invitation fait ${CODE_LENGTH} caractères.`, {type: 'error'});
      return;
    }
    setIsLoading(true);
    try {
      const res = await tontineApi.rejoindreTontineParCode(cleaned);
      if (res?.success) {
        show(
          res.already
            ? 'Vous êtes déjà membre de cette tontine.'
            : `Bienvenue dans « ${res.tontineName ?? 'la tontine'} » !`,
          {type: 'success'},
        );
        if (res.tontineId) {
          navigation.navigate('Main', {
            screen: 'Tontines',
            params: {
              screen: 'TontineDetail',
              params: {tontineId: res.tontineId},
            },
          });
        } else {
          navigation.goBack();
        }
      } else if (res?.need === 'P2') {
        show(res.error ?? 'Vérification P2 requise.', {type: 'error'});
        navigation.navigate('KycP2');
      } else {
        show(res?.error ?? 'Impossible de rejoindre la tontine.', {type: 'error'});
      }
    } catch (e: any) {
      show(e?.message ?? 'Impossible de rejoindre la tontine.', {type: 'error'});
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <ScreenHeader title="Rejoindre par code" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(360)}>
            <GradientCard gradient="sunset" motif="diamonds" motifOpacity={0.14} style={s.hero}>
              <Text style={s.heroTitle}>Vous avez reçu un code ?</Text>
              <KenteStripe height={5} style={s.heroStripe} />
              <Text style={s.heroHint}>
                Saisissez le code d'invitation à {CODE_LENGTH} caractères partagé par
                l'organisateur pour rejoindre sa tontine.
              </Text>
            </GradientCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(360).delay(80)} style={s.card}>
            <Text style={s.label}>Code d'invitation</Text>
            <TextInput
              style={s.codeInput}
              value={code}
              onChangeText={t => setCode(t.toUpperCase())}
              placeholder="ABCD1234"
              placeholderTextColor={colors.text.hint}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={CODE_LENGTH}
              autoFocus
              testID="invite-code-input"
            />
            <Text style={s.counter}>
              {cleaned.length}/{CODE_LENGTH}
            </Text>
            <Button
              title="Rejoindre la tontine"
              onPress={handleJoin}
              loading={isLoading}
              disabled={isLoading || cleaned.length !== CODE_LENGTH}
              variant="gradient"
              gradient="sunset"
              fullWidth
              size="large"
              testID="join-button"
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg.base},
    content: {paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing['2xl']},
    hero: {marginBottom: spacing.lg, alignItems: 'center'},
    heroTitle: {...typography.h2, color: '#FFFFFF', fontWeight: '700', textAlign: 'center'},
    heroStripe: {width: 120, marginVertical: spacing.md},
    heroHint: {
      ...typography.caption,
      color: 'rgba(255,255,255,0.9)',
      textAlign: 'center',
      lineHeight: 18,
    },
    card: {
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius['2xl'],
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.md,
      shadowColor: colors.shadowColor,
    },
    label: {...typography.h3, color: colors.text.primary, fontWeight: '700'},
    codeInput: {
      ...typography.displaySmall,
      color: colors.text.primary,
      backgroundColor: colors.bg.subtle,
      borderWidth: 1,
      borderColor: colors.border.default,
      borderRadius: borderRadius.xl,
      textAlign: 'center',
      letterSpacing: 8,
      paddingVertical: spacing.md,
      marginTop: spacing.md,
    },
    counter: {
      ...typography.caption,
      color: colors.text.tertiary,
      textAlign: 'center',
      marginTop: spacing.xs,
      marginBottom: spacing.md,
    },
  });

export default JoinByCodeScreen;
