/**
 * Verify OTP Screen — 6-digit code verification (Supabase). Premium themed UI.
 */
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {View, Text, StyleSheet, Alert, AppState} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {useDispatch} from 'react-redux';
import {Button, OTPInput, PressableScale} from '@components/common';
import {GradientView} from '@components/common';
import {PatternBackground} from '@components/patterns';
import {ChevronLeftIcon, MailIcon, MessageIcon} from '@components/icons';
import {useTheme, useThemedStyles, typography, spacing, borderRadius, fontFamily, type ThemedTokens} from '@theme';
import {AuthStackScreenProps} from '@navigation/types';
import {verifyOtp, sendOtp} from '@store/slices/auth.slice';
import {AppDispatch} from '@store/store';
import {DEFAULTS, AUTH_CONFIG} from '@config';

type VerifyOTPScreenProps = AuthStackScreenProps<'VerifyOTP'>;

// Single source of truth — must match the Supabase "Email OTP Length" setting.
const OTP_LENGTH = DEFAULTS.OTP_LENGTH;
const RESEND_TIMEOUT = 60;

const VerifyOTPScreen: React.FC<VerifyOTPScreenProps> = ({route, navigation}) => {
  const {email, phone} = route.params;
  // Phone OTP when a phone number was passed, otherwise the e-mail flow.
  const channel: 'email' | 'phone' = phone ? 'phone' : 'email';
  const destination = phone ?? email ?? '';
  const channelLabel =
    channel === 'phone'
      ? AUTH_CONFIG.phoneOtpChannel === 'whatsapp'
        ? 'sur WhatsApp'
        : 'par SMS'
      : 'à';
  const dispatch = useDispatch<AppDispatch>();
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerify = async (value?: string) => {
    const c = value ?? code;
    if (c.length !== OTP_LENGTH) {
      Alert.alert('Code invalide', `Veuillez entrer les ${OTP_LENGTH} chiffres du code`);
      return;
    }
    setIsLoading(true);
    try {
      await dispatch(verifyOtp({channel, email, phone, token: c})).unwrap();
      // Auth state change in App.tsx handles navigation
    } catch (error: any) {
      Alert.alert('Code incorrect', error || 'Le code est invalide. Veuillez réessayer.');
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (v: string) => {
    setCode(v);
    if (v.length === OTP_LENGTH) handleVerify(v);
  };

  // Auto-fill from the clipboard. WhatsApp and e-mail codes can't be read by the
  // OS (only SMS can), so the practical zero-typing path is: the user copies the
  // code, returns to the app, and we detect + submit it automatically. Runs on
  // screen focus and whenever the app comes back to the foreground.
  const lastAutoFilled = useRef('');
  const checkClipboardForCode = useCallback(async () => {
    if (isLoading) return;
    try {
      const text = await Clipboard.getString();
      const digits = (text || '').replace(/\D/g, '');
      if (digits.length === OTP_LENGTH && digits !== lastAutoFilled.current) {
        lastAutoFilled.current = digits;
        setCode(digits);
        handleVerify(digits);
      }
    } catch {
      // Clipboard unavailable — ignore and let the user type the code.
    }
    // handleVerify/isLoading intentionally omitted: guarded by the ref + isLoading check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  useEffect(() => {
    checkClipboardForCode();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') checkClipboardForCode();
    });
    return () => sub.remove();
  }, [checkClipboardForCode]);

  useFocusEffect(
    useCallback(() => {
      checkClipboardForCode();
    }, [checkClipboardForCode]),
  );

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await dispatch(sendOtp({channel, email, phone})).unwrap();
      Alert.alert(
        'Code renvoyé',
        channel === 'phone'
          ? `Un nouveau code a été envoyé ${channelLabel}`
          : 'Un nouveau code a été envoyé à votre e-mail',
      );
      setResendTimer(RESEND_TIMEOUT);
      setCanResend(false);
      setCode('');
    } catch {
      Alert.alert('Erreur', 'Impossible de renvoyer le code.');
    }
  };

  const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;

  return (
    <View style={s.container}>
      <GradientView name="sunset" style={[s.hero, {paddingTop: insets.top + spacing.sm}]}>
        <PatternBackground motif="dots" opacity={0.14} />
        <View style={s.heroTop}>
          <PressableScale style={s.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeftIcon size={22} color="#FFFFFF" />
          </PressableScale>
          <Text style={s.brand}>WeDo</Text>
          <View style={{width: 44}} />
        </View>
        <View style={s.heroIcon}>
          {channel === 'phone' ? (
            <MessageIcon size={40} color="#FFFFFF" />
          ) : (
            <MailIcon size={40} color="#FFFFFF" />
          )}
        </View>
        <Text style={s.heroTitle}>Vérification</Text>
        <Text style={s.heroSubtitle}>
          Entrez le code à {OTP_LENGTH} chiffres envoyé {channelLabel}{'\n'}
          <Text style={s.phone}>{destination}</Text>
        </Text>
      </GradientView>

      <Animated.View entering={FadeInDown.duration(420)} style={s.card}>
        <OTPInput length={OTP_LENGTH} value={code} onChange={handleChange} />

        <Text style={s.autofillHint}>
          Astuce : copiez le code reçu, il se remplira automatiquement.
        </Text>

        <View style={s.resend}>
          {canResend ? (
            <PressableScale onPress={handleResend}>
              <Text style={s.resendLink}>Renvoyer le code</Text>
            </PressableScale>
          ) : (
            <Text style={s.resendTimer}>Renvoyer le code dans {formatTime(resendTimer)}</Text>
          )}
        </View>

        <Button
          title="Vérifier"
          onPress={() => handleVerify()}
          loading={isLoading}
          disabled={isLoading || code.length !== OTP_LENGTH}
          variant="gradient"
          fullWidth
          size="large"
          testID="verify-button"
        />

        <PressableScale style={s.change} onPress={() => navigation.goBack()}>
          <Text style={s.changeText}>Modifier l'e-mail</Text>
        </PressableScale>
      </Animated.View>
    </View>
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
    heroTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md},
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    brand: {fontFamily: fontFamily.brand, fontSize: 26, color: '#FFFFFF'},
    heroIcon: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    heroTitle: {...typography.h1, color: '#FFFFFF'},
    heroSubtitle: {...typography.body, color: 'rgba(255,255,255,0.9)', marginTop: 4, lineHeight: 22},
    phone: {...typography.bodyMedium, color: '#FFFFFF', fontWeight: '700'},
    card: {
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius['2xl'],
      padding: spacing.lg,
      marginHorizontal: spacing.lg,
      marginTop: -spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.md,
      shadowColor: colors.shadowColor,
    },
    autofillHint: {...typography.caption, color: colors.text.tertiary, textAlign: 'center', marginTop: spacing.md},
    resend: {alignItems: 'center', marginVertical: spacing.lg},
    resendLink: {...typography.bodyMedium, color: colors.accent.main, fontWeight: '700'},
    resendTimer: {...typography.body, color: colors.text.secondary},
    change: {alignSelf: 'center', marginTop: spacing.md, padding: spacing.xs},
    changeText: {...typography.caption, color: colors.text.tertiary, fontWeight: '600'},
  });

export default VerifyOTPScreen;
