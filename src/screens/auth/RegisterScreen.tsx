/**
 * Register Screen — new user info → OTP (Supabase). Premium themed UI.
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {useDispatch} from 'react-redux';
import {Button, Input, ProgressBar, PressableScale, SegmentedControl} from '@components/common';
import {GradientView} from '@components/common';
import {PatternBackground} from '@components/patterns';
import {ChevronLeftIcon} from '@components/icons';
import {useTheme, useThemedStyles, typography, spacing, borderRadius, fontFamily, type ThemedTokens} from '@theme';
import {AuthStackScreenProps} from '@navigation/types';
import {sendOtp} from '@store/slices/auth.slice';
import {AppDispatch} from '@store/store';
import {VALIDATION} from '@constants';
import {AUTH_CONFIG} from '@config';

type RegisterScreenProps = AuthStackScreenProps<'Register'>;

type Method = 'email' | 'phone';

const RegisterScreen: React.FC<RegisterScreenProps> = ({navigation}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  // Primary identifier for the account: e-mail or phone. The other field stays
  // optional, so a user without an e-mail can register with their phone only.
  const [method, setMethod] = useState<Method>('email');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateName = (name: string) => {
    setNameError('');
    if (!name) return setNameError('Le nom complet est requis'), false;
    if (name.length < VALIDATION.NAME_MIN_LENGTH)
      return setNameError(`Au moins ${VALIDATION.NAME_MIN_LENGTH} caractères`), false;
    return true;
  };
  const validatePhone = (phone: string, required: boolean) => {
    setPhoneError('');
    const v = phone.replace(/[^\d+]/g, '');
    if (!v) {
      if (required) return setPhoneError('Le numéro de téléphone est requis'), false;
      return true;
    }
    // E.164: leading "+" then country code + number (8 to 15 digits).
    if (!/^\+[1-9]\d{7,14}$/.test(v))
      return setPhoneError('Format international requis, ex. +225 07 12 34 56 78'), false;
    return true;
  };
  const validateEmail = (v: string, required: boolean) => {
    setEmailError('');
    if (!v) {
      if (required) return setEmailError("L'adresse e-mail est requise"), false;
      return true;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return setEmailError('Adresse e-mail invalide'), false;
    return true;
  };

  const handleRegister = async () => {
    const ok = [
      validateName(fullName),
      validateEmail(email, method === 'email'),
      validatePhone(phoneNumber, method === 'phone'),
    ].every(Boolean);
    if (!ok) return;
    setIsLoading(true);
    try {
      if (method === 'phone') {
        await dispatch(
          sendOtp({channel: 'phone', phone: phoneNumber, fullName, email: email || undefined}),
        ).unwrap();
        navigation.navigate('VerifyOTP', {phone: phoneNumber});
      } else {
        await dispatch(sendOtp({email, fullName, phone: phoneNumber || undefined})).unwrap();
        navigation.navigate('VerifyOTP', {email});
      }
    } catch (error: any) {
      Alert.alert("Erreur d'inscription", error || 'Impossible de créer le compte. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <GradientView name="sunset" style={[s.hero, {paddingTop: insets.top + spacing.sm}]}>
        <PatternBackground motif="zigzag" opacity={0.14} />
        <View style={s.heroTop}>
          <PressableScale style={s.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeftIcon size={22} color="#FFFFFF" />
          </PressableScale>
          <Text style={s.brand}>WeDo</Text>
          <View style={{width: 44}} />
        </View>
        <Text style={s.heroTitle}>Créer un compte</Text>
        <Text style={s.heroSubtitle}>Rejoignez WeDo en quelques étapes</Text>
      </GradientView>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(420)} style={s.card}>
          <View style={s.progressRow}>
            <ProgressBar progress={50} height={6} />
            <Text style={s.step}>Étape 1 sur 2</Text>
          </View>

          <Text style={s.methodLabel}>Méthode de vérification</Text>
          <SegmentedControl<Method>
            options={[
              {label: 'E-mail', value: 'email'},
              {label: 'Téléphone', value: 'phone'},
            ]}
            value={method}
            onChange={m => {
              setMethod(m);
              setEmailError('');
              setPhoneError('');
            }}
            style={{marginBottom: spacing.md}}
          />

          <Input
            label="Nom complet"
            placeholder="Jean Kouassi"
            value={fullName}
            onChangeText={t => {
              setFullName(t);
              setNameError('');
            }}
            leftIcon="account"
            error={nameError}
            maxLength={VALIDATION.NAME_MAX_LENGTH}
            required
            autoFocus
            testID="fullname-input"
          />

          {method === 'phone' ? (
            <>
              <Input
                label="Numéro de téléphone"
                placeholder="+225 07 12 34 56 78"
                value={phoneNumber}
                onChangeText={t => {
                  setPhoneNumber(t);
                  setPhoneError('');
                }}
                type="phone"
                leftIcon="phone"
                error={phoneError}
                helperText={`Un code de vérification vous sera envoyé ${
                  AUTH_CONFIG.phoneOtpChannel === 'whatsapp' ? 'sur WhatsApp' : 'par SMS'
                }. Indiquez l'indicatif pays (ex. +225).`}
                maxLength={20}
                required
                testID="phone-input"
              />
              <Input
                label="Adresse e-mail (optionnel)"
                placeholder="jean.kouassi@example.com"
                value={email}
                onChangeText={t => {
                  setEmail(t);
                  setEmailError('');
                }}
                type="email"
                leftIcon="email"
                error={emailError}
                maxLength={120}
                testID="email-input"
              />
            </>
          ) : (
            <>
              <Input
                label="Adresse e-mail"
                placeholder="jean.kouassi@example.com"
                value={email}
                onChangeText={t => {
                  setEmail(t);
                  setEmailError('');
                }}
                type="email"
                leftIcon="email"
                error={emailError}
                helperText="Un code de vérification vous sera envoyé par e-mail"
                maxLength={120}
                required
                testID="email-input"
              />
              <Input
                label="Numéro de téléphone (optionnel)"
                placeholder="+225 07 12 34 56 78"
                value={phoneNumber}
                onChangeText={t => {
                  setPhoneNumber(t);
                  setPhoneError('');
                }}
                type="phone"
                leftIcon="phone"
                error={phoneError}
                maxLength={20}
                testID="phone-input"
              />
            </>
          )}

          <Button
            title="Continuer"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            variant="gradient"
            fullWidth
            size="large"
            icon="arrow-right"
            iconPosition="right"
            style={{marginTop: spacing.xs}}
            testID="register-button"
          />

          <Text style={s.terms}>
            En continuant, vous acceptez nos{' '}
            <Text style={s.termsLink}>Conditions</Text> et notre{' '}
            <Text style={s.termsLink}>Politique de confidentialité</Text>.
          </Text>
        </Animated.View>

        <View style={s.footer}>
          <Text style={s.footerText}>Vous avez déjà un compte ?</Text>
          <PressableScale onPress={() => navigation.navigate('Login')}>
            <Text style={s.link}>Se connecter</Text>
          </PressableScale>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

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
    heroTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg},
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    brand: {fontFamily: fontFamily.brand, fontSize: 26, color: '#FFFFFF'},
    heroTitle: {...typography.h1, color: '#FFFFFF'},
    heroSubtitle: {...typography.body, color: 'rgba(255,255,255,0.9)', marginTop: 4},
    scroll: {flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing['2xl']},
    card: {
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius['2xl'],
      padding: spacing.lg,
      marginTop: -spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.md,
      shadowColor: colors.shadowColor,
    },
    progressRow: {marginBottom: spacing.lg},
    step: {...typography.caption, color: colors.text.secondary, marginTop: spacing.xs, textAlign: 'right'},
    methodLabel: {...typography.captionMedium, color: colors.text.secondary, marginBottom: spacing.xs, fontWeight: '600'},
    terms: {...typography.caption, color: colors.text.tertiary, textAlign: 'center', marginTop: spacing.md, lineHeight: 18},
    termsLink: {color: colors.accent.main, fontWeight: '600'},
    footer: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg, gap: 6},
    footerText: {...typography.body, color: colors.text.secondary},
    link: {...typography.bodyMedium, color: colors.accent.main, fontWeight: '700'},
  });

export default RegisterScreen;
