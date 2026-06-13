/**
 * ContributionScreen — make a contribution with payment-method selection.
 * Premium themed UI; validation + submit logic preserved.
 */
import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Button,
  Input,
  LoadingSpinner,
  ScreenHeader,
  Chip,
  PressableScale,
  GradientCard,
} from '@components/common';
import {TAB_BAR_SPACE} from '@components/navigation/CustomTabBar';
import {CheckIcon, InfoIcon, PlusCircleIcon} from '@components/icons';
import {useTheme, useThemedStyles, typography, spacing, borderRadius, type ThemedTokens} from '@theme';
import {TontinesStackParamList} from '@navigation/types';
import {useSelector, useDispatch} from 'react-redux';
import {RootState, AppDispatch} from '@store/store';
import {formatCurrency, formatDate} from '@utils/formatting';
import {validate, contributionSchema, ContributionFormData} from '@utils/validation';
import paymentApi from '@services/api/payment.api';
import {fetchTontineDetail} from '@store/slices/tontine.slice';
import {IS_SUPABASE_CONFIGURED} from '@config/appConfig';

type Route = RouteProp<TontinesStackParamList, 'Contribution'>;
type Nav = StackNavigationProp<TontinesStackParamList, 'Contribution'>;
interface Props {
  route: Route;
  navigation: Nav;
}
type PaymentMethod = 'MobileMoney' | 'BankTransfer' | 'Cash';

const METHODS: {value: PaymentMethod; label: string; icon: string; tone: (c: any) => string; soft: (c: any) => string}[] = [
  {value: 'MobileMoney', label: 'Mobile Money', icon: 'cellphone', tone: c => c.brand.terracotta, soft: c => c.brand.terracottaSoft},
  {value: 'BankTransfer', label: 'Virement bancaire', icon: 'bank', tone: c => c.brand.indigo, soft: c => c.brand.indigoSoft},
  {value: 'Cash', label: 'Espèces', icon: 'cash', tone: c => c.brand.emerald, soft: c => c.brand.emeraldSoft},
];

const ContributionScreen: React.FC<Props> = ({route, navigation}) => {
  const {contributionId} = (route.params ?? {}) as any;
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);

  const dispatch = useDispatch<AppDispatch>();
  const {profile} = useSelector((state: RootState) => state.user);
  const {currentTontine} = useSelector((state: RootState) => state.tontine);

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MobileMoney');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentTontine) setAmount(String(currentTontine.contributionAmount));
    const def = profile?.mobileMoneyAccounts?.find(a => a.isDefault);
    if (def) setSelectedAccountId(def.id);
  }, [currentTontine, profile]);

  const handleSubmit = async () => {
    if (!currentTontine) return;
    const formData: ContributionFormData = {
      amount: parseFloat(amount),
      paymentMethod,
      mobileMoneyAccountId: paymentMethod === 'MobileMoney' ? selectedAccountId : undefined,
    };
    const result = validate(contributionSchema, formData);
    if (!result.success) {
      setErrors(result.errors || {});
      Alert.alert('Erreur', 'Veuillez corriger les erreurs avant de continuer');
      return;
    }
    if (paymentMethod === 'MobileMoney' && !selectedAccountId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un compte Mobile Money');
      return;
    }
    setIsProcessing(true);
    try {
      // Demo mode (no Supabase): keep the simulated success so the flow stays explorable.
      if (!IS_SUPABASE_CONFIGURED) {
        await new Promise(r => setTimeout(r, 1200));
        Alert.alert('Succès', 'Votre contribution a été enregistrée (démo).', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
        return;
      }

      // 1) Create the pending contribution + transaction (Edge Function).
      const {transaction} = await paymentApi.makeContribution({
        tontineId: currentTontine.id,
        amount: parseFloat(amount),
        paymentMethod,
        mobileMoneyAccountId:
          paymentMethod === 'MobileMoney' ? selectedAccountId : undefined,
      });

      // 2) Mobile Money settles immediately (sandbox PSP → escrow + ledger + score).
      //    Cash / bank transfer stay Pending until the treasurer confirms receipt.
      if (paymentMethod === 'MobileMoney') {
        const {status} = await paymentApi.verifyPayment(transaction.id);
        if (status !== 'Completed') {
          Alert.alert(
            'Paiement en attente',
            "Le paiement n'a pas encore été confirmé par l'opérateur. Vous serez notifié dès sa validation.",
            [{text: 'OK', onPress: () => navigation.goBack()}],
          );
          return;
        }
        await dispatch(fetchTontineDetail(currentTontine.id));
        Alert.alert(
          'Cotisation sécurisée ✅',
          'Votre cotisation est versée au compte de cantonnement (séquestre) et inscrite au registre. Votre score de fiabilité est mis à jour.',
          [{text: 'Parfait', onPress: () => navigation.goBack()}],
        );
      } else {
        const label =
          paymentMethod === 'Cash' ? 'au trésorier' : 'par virement';
        Alert.alert(
          'Contribution enregistrée',
          `Votre cotisation ${label} est enregistrée. Elle sera confirmée dès réception des fonds par l'organisateur.`,
          [{text: 'OK', onPress: () => navigation.goBack()}],
        );
      }
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Une erreur est survenue lors du paiement');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!currentTontine) return <LoadingSpinner fullScreen text="Chargement..." />;

  const required = currentTontine.contributionAmount;

  return (
    <View style={s.container}>
      <ScreenHeader title="Contribution" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Hero summary */}
        <GradientCard gradient="sunset" motif="diamonds" motifOpacity={0.12} style={s.hero}>
          <Text style={s.heroLabel}>Vous contribuez à</Text>
          <Text style={s.heroName} numberOfLines={1}>
            {currentTontine.name}
          </Text>
          <Text style={s.heroAmount}>{formatCurrency(required, currentTontine.currency)}</Text>
          <Text style={s.heroDate}>Échéance du {formatDate(new Date().toISOString())}</Text>
        </GradientCard>

        {/* Amount */}
        <Text style={s.section}>Montant</Text>
        <Input
          placeholder="10000"
          value={amount}
          onChangeText={setAmount}
          type="number"
          error={errors.amount}
          rightIcon="currency-usd"
        />
        <View style={s.quickRow}>
          <Chip label={`Requis · ${required.toLocaleString('fr-FR')}`} selected={amount === String(required)} onPress={() => setAmount(String(required))} />
          <Chip label={`x2 · ${(required * 2).toLocaleString('fr-FR')}`} selected={amount === String(required * 2)} onPress={() => setAmount(String(required * 2))} />
        </View>

        {/* Payment methods */}
        <Text style={s.section}>Moyen de paiement</Text>
        <View style={{gap: spacing.sm}}>
          {METHODS.map(m => {
            const active = paymentMethod === m.value;
            const tone = m.tone(colors);
            return (
              <PressableScale
                key={m.value}
                onPress={() => {
                  setPaymentMethod(m.value);
                  setErrors({});
                }}
                style={[s.methodCard, active && {borderColor: tone, backgroundColor: tone + '10'}]}>
                <View style={[s.methodIcon, {backgroundColor: m.soft(colors)}]}>
                  <Icon name={m.icon} size={22} color={tone} />
                </View>
                <Text style={[s.methodLabel, active && {color: colors.text.primary, fontWeight: '700'}]}>{m.label}</Text>
                {active && <CheckIcon size={20} color={tone} />}
              </PressableScale>
            );
          })}
        </View>

        {/* Mobile money accounts */}
        {paymentMethod === 'MobileMoney' && profile?.mobileMoneyAccounts && (
          <>
            <Text style={s.section}>Compte Mobile Money</Text>
            <View style={{gap: spacing.sm}}>
              {profile.mobileMoneyAccounts.map(acc => {
                const active = selectedAccountId === acc.id;
                return (
                  <PressableScale
                    key={acc.id}
                    onPress={() => setSelectedAccountId(acc.id)}
                    style={[s.accountCard, active && {borderColor: colors.accent.main}]}>
                    <View style={[s.methodIcon, {backgroundColor: colors.brand.terracottaSoft}]}>
                      <Icon name="cellphone" size={20} color={colors.brand.terracotta} />
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={s.accountProvider}>{acc.provider}</Text>
                      <Text style={s.accountNumber}>{acc.phoneNumber}</Text>
                    </View>
                    {active && <CheckIcon size={22} color={colors.accent.main} />}
                  </PressableScale>
                );
              })}
              <PressableScale
                style={s.addAccount}
                onPress={() => (navigation as any).navigate('AddMobileMoneyAccount')}>
                <PlusCircleIcon size={20} color={colors.accent.main} />
                <Text style={s.addAccountText}>Ajouter un compte</Text>
              </PressableScale>
            </View>
          </>
        )}

        {paymentMethod === 'BankTransfer' && (
          <View style={[s.infoBox, {backgroundColor: colors.brand.indigoSoft}]}>
            <InfoIcon size={20} color={colors.brand.indigo} />
            <Text style={s.infoText}>Effectuez un virement vers le compte de la tontine. Les coordonnées s'afficheront après confirmation.</Text>
          </View>
        )}
        {paymentMethod === 'Cash' && (
          <View style={[s.infoBox, {backgroundColor: colors.brand.goldSoft}]}>
            <InfoIcon size={20} color={colors.brand.gold} />
            <Text style={s.infoText}>Remettez le montant au trésorier de la tontine. Un reçu vous sera fourni.</Text>
          </View>
        )}

        {/* Summary */}
        <View style={s.summary}>
          <Text style={s.summaryTitle}>Récapitulatif</Text>
          <Row label="Montant" value={amount ? formatCurrency(parseFloat(amount), currentTontine.currency) : '—'} s={s} />
          <Row label="Moyen" value={METHODS.find(m => m.value === paymentMethod)!.label} s={s} />
          <View style={s.divider} />
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total à payer</Text>
            <Text style={s.totalValue}>{amount ? formatCurrency(parseFloat(amount), currentTontine.currency) : '—'}</Text>
          </View>
        </View>

        <Button
          title={paymentMethod === 'MobileMoney' ? 'Confirmer et payer' : 'Confirmer la contribution'}
          variant="gradient"
          onPress={handleSubmit}
          loading={isProcessing}
          disabled={!amount || parseFloat(amount) <= 0}
          fullWidth
          size="large"
          icon={paymentMethod === 'MobileMoney' ? 'cellphone-check' : 'check'}
          style={{marginTop: spacing.lg}}
        />
        <PressableScale style={s.cancel} onPress={() => navigation.goBack()}>
          <Text style={s.cancelText}>Annuler</Text>
        </PressableScale>
      </ScrollView>
    </View>
  );
};

const Row: React.FC<{label: string; value: string; s: any}> = ({label, value, s}) => (
  <View style={s.summaryRow}>
    <Text style={s.summaryLabel}>{label}</Text>
    <Text style={s.summaryValue}>{value}</Text>
  </View>
);

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg.base},
    content: {paddingHorizontal: spacing.lg, paddingBottom: TAB_BAR_SPACE + spacing.lg},
    hero: {marginBottom: spacing.lg},
    heroLabel: {...typography.captionMedium, color: 'rgba(255,255,255,0.9)'},
    heroName: {...typography.h3, color: '#FFFFFF', marginTop: 2, fontWeight: '700'},
    heroAmount: {...typography.amount, color: '#FFFFFF', marginTop: spacing.sm},
    heroDate: {...typography.caption, color: 'rgba(255,255,255,0.85)', marginTop: spacing.xs},
    section: {...typography.h3, color: colors.text.primary, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.md},
    quickRow: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs},
    methodCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      borderColor: colors.border.default,
      backgroundColor: colors.surface.default,
    },
    methodIcon: {width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center'},
    methodLabel: {...typography.bodyMedium, color: colors.text.secondary, flex: 1},
    accountCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      borderColor: colors.border.default,
      backgroundColor: colors.surface.default,
    },
    accountProvider: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '600'},
    accountNumber: {...typography.caption, color: colors.text.secondary},
    addAccount: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.accent.main,
    },
    addAccountText: {...typography.bodyMedium, color: colors.accent.main, fontWeight: '600'},
    infoBox: {flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', padding: spacing.md, borderRadius: borderRadius.lg, marginTop: spacing.md},
    infoText: {...typography.caption, color: colors.text.secondary, flex: 1, lineHeight: 18},
    summary: {
      marginTop: spacing.lg,
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.sm,
      shadowColor: colors.shadowColor,
    },
    summaryTitle: {...typography.h3, color: colors.text.primary, marginBottom: spacing.sm, fontWeight: '700'},
    summaryRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm},
    summaryLabel: {...typography.body, color: colors.text.secondary},
    summaryValue: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '600'},
    divider: {height: 1, backgroundColor: colors.border.subtle, marginVertical: spacing.xs},
    totalRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.sm},
    totalLabel: {...typography.h3, color: colors.text.primary},
    totalValue: {...typography.h2, color: colors.accent.main, fontWeight: '800'},
    cancel: {alignItems: 'center', paddingVertical: spacing.md},
    cancelText: {...typography.body, color: colors.text.secondary},
  });

export default ContributionScreen;
