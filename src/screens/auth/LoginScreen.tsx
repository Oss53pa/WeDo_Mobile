/**
 * Login Screen — e-mail or phone → OTP (Supabase). Premium themed UI.
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
import {Button, Input, PressableScale, SegmentedControl, CountryCodePicker} from '@components/common';
import {GradientView} from '@components/common';
import {PatternBackground} from '@components/patterns';
import {ChevronLeftIcon, MailIcon} from '@components/icons';
import {useTheme, useThemedStyles, typography, spacing, borderRadius, fontFamily, type ThemedTokens} from '@theme';
import {AuthStackScreenProps} from '@navigation/types';
import {sendOtp} from '@store/slices/auth.slice';
import {AppDispatch} from '@store/store';
import {findCountryByCode, DEFAULT_COUNTRY_CODE} from '@utils/phoneCountry';

type LoginScreenProps = AuthStackScreenProps<'Login'>;

type Method = 'email' | 'phone';

const LoginScreen: React.FC<LoginScreenProps> = ({navigation}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const [method, setMethod] = useState<Method>('email');
  const [email, setEmail] = useState('');
  const [dialCode, setDialCode] = useState(DEFAULT_COUNTRY_CODE);
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const phoneCountry = method === 'phone' ? findCountryByCode(dialCode) : null;
  const fullPhone = `+${dialCode}${phone.replace(/\D/g, '')}`;

  const validateEmail = (value: string): boolean => {
    setError('');
    const v = value.trim();
    if (!v) return setError("L'adresse e-mail est requise"), false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return setError('Adresse e-mail invalide'), false;
    return true;
  };

  const validatePhone = (): boolean => {
    setError('');
    const national = phone.replace(/\D/g, '');
    if (!national) return setError('Le numéro de téléphone est requis'), false;
    // E.164: dial code + national number, 8 to 15 digits total.
    if (!/^\+[1-9]\d{7,14}$/.test(fullPhone))
      return setError('Numéro invalide pour ce pays. Vérifiez l’indicatif et le numéro.'), false;
    return true;
  };

  const handleLogin = async () => {
    const ok = method === 'email' ? validateEmail(email) : validatePhone();
    if (!ok) return;
    setIsLoading(true);
    try {
      if (method === 'phone') {
        await dispatch(sendOtp({channel: 'phone', phone: fullPhone})).unwrap();
        navigation.navigate('VerifyOTP', {phone: fullPhone});
      } else {
        await dispatch(sendOtp({email})).unwrap();
        navigation.navigate('VerifyOTP', {email});
      }
    } catch (err: any) {
      Alert.alert('Erreur', err || "Impossible d'envoyer le code. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Hero band */}
      <GradientView name="sunset" style={[s.hero, {paddingTop: insets.top + spacing.sm}]}>
        <PatternBackground motif="diamonds" opacity={0.14} />
        <View style={s.heroTop}>
          <PressableScale style={s.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeftIcon size={22} color="#FFFFFF" />
          </PressableScale>
          <Text style={s.brand}>WeDo</Text>
          <View style={{width: 44}} />
        </View>
        <Text style={s.heroTitle}>Bon retour 👋</Text>
        <Text style={s.heroSubtitle}>Connectez-vous pour retrouver vos tontines</Text>
      </GradientView>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(420)} style={s.card}>
          <SegmentedControl<Method>
            options={[
              {label: 'E-mail', value: 'email'},
              {label: 'Téléphone', value: 'phone'},
            ]}
            value={method}
            onChange={m => {
              setMethod(m);
              setError('');
            }}
            style={{marginBottom: spacing.md}}
          />

          {method === 'email' ? (
            <>
              <Text style={s.label}>Entrez votre e-mail</Text>
              <Text style={s.hint}>Nous vous enverrons un code de vérification par e-mail.</Text>
              <Input
                placeholder="vous@example.com"
                value={email}
                onChangeText={t => {
                  setEmail(t);
                  setError('');
                }}
                type="email"
                leftNode={<MailIcon size={20} color={colors.text.tertiary} />}
                error={error}
                autoCapitalize="none"
                maxLength={120}
                autoFocus
                containerStyle={{marginTop: spacing.md}}
                testID="email-input"
              />
            </>
          ) : (
            <>
              <Text style={s.label}>Entrez votre numéro</Text>
              <Text style={s.hint}>
                Choisissez votre pays, puis saisissez votre numéro local.
              </Text>
              <View style={s.phoneRow}>
                <CountryCodePicker value={dialCode} onChange={c => {
                  setDialCode(c);
                  setError('');
                }} />
                <View style={{flex: 1}}>
                  <Input
                    placeholder="07 12 34 56 78"
                    value={phone}
                    onChangeText={t => {
                      setPhone(t);
                      setError('');
                    }}
                    type="phone"
                    error={error}
                    maxLength={16}
                    autoFocus
                    testID="phone-input"
                  />
                </View>
              </View>
              {phoneCountry && (
                <View style={s.countryRow}>
                  <Text style={s.countryFlag}>{phoneCountry.flag}</Text>
                  <Text style={s.countryName}>{phoneCountry.name}</Text>
                  {phoneCountry.region !== 'autre' && (
                    <Text style={s.countryRegion}>
                      · Afrique {phoneCountry.region === 'ouest' ? 'de l’Ouest' : 'Centrale'}
                    </Text>
                  )}
                </View>
              )}
            </>
          )}

          <Button
            title="Envoyer le code"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            variant="gradient"
            fullWidth
            size="large"
            style={{marginTop: spacing.sm}}
            testID="login-button"
          />
        </Animated.View>

        <View style={s.footer}>
          <Text style={s.footerText}>Vous n'avez pas de compte ?</Text>
          <PressableScale onPress={() => navigation.navigate('Register')}>
            <Text style={s.link}>Créer un compte</Text>
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
    label: {...typography.h3, color: colors.text.primary, fontWeight: '700'},
    hint: {...typography.caption, color: colors.text.secondary, marginTop: 4},
    phoneRow: {flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.md},
    countryRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm, paddingHorizontal: 2},
    countryFlag: {fontSize: 18},
    countryName: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700'},
    countryRegion: {...typography.caption, color: colors.text.secondary},
    footer: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl, gap: 6},
    footerText: {...typography.body, color: colors.text.secondary},
    link: {...typography.bodyMedium, color: colors.accent.main, fontWeight: '700'},
  });

export default LoginScreen;
