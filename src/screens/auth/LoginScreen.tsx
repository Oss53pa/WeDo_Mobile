/**
 * Login Screen — phone number → OTP (Supabase). Premium themed UI.
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
import {Button, Input, PressableScale} from '@components/common';
import {GradientView} from '@components/common';
import {PatternBackground} from '@components/patterns';
import {ChevronLeftIcon, MailIcon} from '@components/icons';
import {useTheme, useThemedStyles, typography, spacing, borderRadius, fontFamily, type ThemedTokens} from '@theme';
import {AuthStackScreenProps} from '@navigation/types';
import {sendOtp} from '@store/slices/auth.slice';
import {AppDispatch} from '@store/store';

type LoginScreenProps = AuthStackScreenProps<'Login'>;

const LoginScreen: React.FC<LoginScreenProps> = ({navigation}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validate = (value: string): boolean => {
    setEmailError('');
    const v = value.trim();
    if (!v) {
      setEmailError("L'adresse e-mail est requise");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setEmailError('Adresse e-mail invalide');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validate(email)) return;
    setIsLoading(true);
    try {
      await dispatch(sendOtp({email})).unwrap();
      navigation.navigate('VerifyOTP', {email});
    } catch (error: any) {
      Alert.alert('Erreur', error || "Impossible d'envoyer le code. Veuillez réessayer.");
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
          <Text style={s.label}>Entrez votre e-mail</Text>
          <Text style={s.hint}>Nous vous enverrons un code de vérification par e-mail.</Text>
          <Input
            placeholder="vous@example.com"
            value={email}
            onChangeText={t => {
              setEmail(t);
              setEmailError('');
            }}
            type="email"
            leftNode={<MailIcon size={20} color={colors.text.tertiary} />}
            error={emailError}
            autoCapitalize="none"
            maxLength={120}
            autoFocus
            containerStyle={{marginTop: spacing.md}}
            testID="email-input"
          />
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
    footer: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl, gap: 6},
    footerText: {...typography.body, color: colors.text.secondary},
    link: {...typography.bodyMedium, color: colors.accent.main, fontWeight: '700'},
  });

export default LoginScreen;
