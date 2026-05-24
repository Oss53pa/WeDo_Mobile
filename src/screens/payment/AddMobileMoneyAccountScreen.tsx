/**
 * AddMobileMoneyAccountScreen — register a mobile-money payout account.
 * Operator picker, holder details and a default toggle. Premium themed UI.
 */
import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Switch, Alert} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {
  Button,
  Input,
  ScreenHeader,
  PressableScale,
} from '@components/common';
import {CheckIcon, InfoIcon} from '@components/icons';
import {
  useTheme,
  useThemedStyles,
  typography,
  spacing,
  borderRadius,
  type ThemedTokens,
} from '@theme';
import {RootStackParamList} from '@navigation/types';
import {useDispatch} from 'react-redux';
import {AppDispatch} from '@store/store';
import {addMobileMoneyAccount} from '@store/slices/user.slice';
import {MobileMoneyOperator} from '@types';

type Nav = StackNavigationProp<RootStackParamList, 'AddMobileMoneyAccount'>;

const OPERATORS: {value: MobileMoneyOperator; dot: (c: any) => string}[] = [
  {value: MobileMoneyOperator.ORANGE_MONEY, dot: c => c.brand.terracotta},
  {value: MobileMoneyOperator.WAVE, dot: c => c.brand.indigo},
  {value: MobileMoneyOperator.MTN_MONEY, dot: c => c.brand.gold},
  {value: MobileMoneyOperator.MOOV_MONEY, dot: c => c.brand.crimson},
  {value: MobileMoneyOperator.M_PESA, dot: c => c.brand.emerald},
  {value: MobileMoneyOperator.AIRTEL_MONEY, dot: c => c.error},
];

const AddMobileMoneyAccountScreen: React.FC<{navigation: Nav}> = ({
  navigation,
}) => {
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const dispatch = useDispatch<AppDispatch>();

  const [operator, setOperator] = useState<MobileMoneyOperator | null>(null);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const phoneValid = phone.replace(/\D/g, '').length >= 8;
  const canSubmit = !!operator && phoneValid;

  const handleSubmit = async () => {
    if (!operator) {
      Alert.alert('Erreur', 'Veuillez sélectionner un opérateur.');
      return;
    }
    if (!phoneValid) {
      Alert.alert('Erreur', 'Le numéro doit comporter au moins 8 chiffres.');
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(
        addMobileMoneyAccount({
          operator,
          accountNumber: phone,
          accountName: name,
          isDefault,
          isVerified: false,
        }),
      ).unwrap();
      Alert.alert('Compte ajouté', 'Votre compte Mobile Money a été enregistré.', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error: any) {
      Alert.alert(
        'Erreur',
        typeof error === 'string'
          ? error
          : error?.message || "Échec de l'ajout du compte.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={s.container}>
      <ScreenHeader title="Ajouter un compte" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Text style={s.section}>Opérateur</Text>
        <View style={s.grid}>
          {OPERATORS.map(op => {
            const active = operator === op.value;
            const dot = op.dot(colors);
            return (
              <PressableScale
                key={op.value}
                onPress={() => setOperator(op.value)}
                style={[
                  s.opCard,
                  active && {borderColor: dot, backgroundColor: dot + '12'},
                ]}>
                <View style={[s.dot, {backgroundColor: dot}]} />
                <Text
                  style={[s.opLabel, active && {color: colors.text.primary, fontWeight: '700'}]}
                  numberOfLines={1}>
                  {op.value}
                </Text>
                {active && <CheckIcon size={16} color={dot} />}
              </PressableScale>
            );
          })}
        </View>

        <Text style={s.section}>Détails du compte</Text>
        <Input
          label="Numéro du compte"
          value={phone}
          onChangeText={setPhone}
          type="phone"
          placeholder="07 00 00 00 00"
          leftIcon="cellphone"
        />
        <Input
          label="Nom du titulaire"
          value={name}
          onChangeText={setName}
          type="text"
          placeholder="Nom complet"
          leftIcon="account-outline"
        />

        <View style={s.switchRow}>
          <View style={s.switchText}>
            <Text style={s.switchTitle}>Définir par défaut</Text>
            <Text style={s.switchHint}>
              Utiliser ce compte pour vos contributions et retraits.
            </Text>
          </View>
          <Switch
            value={isDefault}
            onValueChange={setIsDefault}
            trackColor={{false: colors.border.default, true: colors.accent.main}}
            thumbColor={'#FFFFFF'}
          />
        </View>

        <View style={s.infoBox}>
          <InfoIcon size={20} color={colors.brand.indigo} />
          <Text style={s.infoText}>
            Vérifiez le numéro avant de l'enregistrer. Le compte sera vérifié
            lors de votre première transaction.
          </Text>
        </View>

        <Button
          title="Ajouter le compte"
          variant="gradient"
          gradient="sunset"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!canSubmit}
          fullWidth
          size="large"
          icon="check"
          style={{marginTop: spacing.lg}}
        />
      </ScrollView>
    </View>
  );
};

const makeStyles = ({colors}: ThemedTokens) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg.base},
    content: {paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl},
    section: {
      ...typography.h3,
      color: colors.text.primary,
      fontWeight: '700',
      marginTop: spacing.md,
      marginBottom: spacing.md,
    },
    grid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
    opCard: {
      width: '48%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      borderColor: colors.border.default,
      backgroundColor: colors.surface.default,
    },
    dot: {width: 12, height: 12, borderRadius: 6},
    opLabel: {...typography.bodyMedium, color: colors.text.secondary, flex: 1},
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
      marginTop: spacing.xs,
    },
    switchText: {flex: 1},
    switchTitle: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '600'},
    switchHint: {...typography.caption, color: colors.text.secondary, marginTop: 2, lineHeight: 17},
    infoBox: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'flex-start',
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.brand.indigoSoft,
      marginTop: spacing.md,
    },
    infoText: {...typography.caption, color: colors.text.secondary, flex: 1, lineHeight: 18},
  });

export default AddMobileMoneyAccountScreen;
