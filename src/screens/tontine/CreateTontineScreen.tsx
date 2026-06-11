/**
 * CreateTontineScreen — premium 5-step wizard.
 * Steps: 1. Infos, 2. Finances, 3. Règles, 4. Membres, 5. Récap.
 */
import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert, Switch} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {FadeIn} from 'react-native-reanimated';
import {Button, Input, ProgressBar, PressableScale, DatePickerField} from '@components/common';
import {TAB_BAR_SPACE} from '@components/navigation/CustomTabBar';
import {ChevronLeftIcon, CheckIcon, InfoIcon, UsersIcon} from '@components/icons';
import {useTheme, useThemedStyles, typography, spacing, borderRadius, type ThemedTokens} from '@theme';
import {RootStackParamList} from '@navigation/types';
import {useDispatch} from 'react-redux';
import {AppDispatch} from '@store/store';
import {createTontine} from '@store/slices/tontine.slice';
import {CreateTontineData, TontineType, TontineCategory, Frequency} from '@types';

type Nav = StackNavigationProp<RootStackParamList, 'CreateTontine'>;
interface Props {
  navigation: Nav;
}
const TOTAL_STEPS = 5;

const CreateTontineScreen: React.FC<Props> = ({navigation}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({
    name: '',
    description: '',
    category: 'Family',
    type: 'ROSCA',
    contributionAmount: 0,
    currency: 'XOF',
    frequency: 'Monthly',
    totalMembers: 5,
    startDate: '',
    distributionOrder: 'Sequential',
    latePenaltyPercent: 5,
    gracePeriodDays: 3,
    minReputationRequired: 0,
    scoreMinimum: 0,
    sequestreActive: true,
    isPublic: false,
    depositAmount: 0,
    chatEnabled: true,
    votingEnabled: false,
  });

  const update = (field: string, value: any) => setFormData(prev => ({...prev, [field]: value}));

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!formData.name || formData.name.trim().length < 3) {
        Alert.alert('Erreur', 'Le nom doit contenir au moins 3 caractères');
        return false;
      }
      if (!formData.category) {
        Alert.alert('Erreur', 'Veuillez sélectionner une catégorie');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.contributionAmount || formData.contributionAmount <= 0) {
        Alert.alert('Erreur', 'Le montant de contribution doit être supérieur à 0');
        return false;
      }
      if (!formData.totalMembers || formData.totalMembers < 3) {
        Alert.alert('Erreur', 'Le nombre de membres doit être au moins 3');
        return false;
      }
      if (!formData.startDate) {
        Alert.alert('Erreur', 'Veuillez indiquer une date de début');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < TOTAL_STEPS) setCurrentStep(p => p + 1);
  };
  const handleBack = () => (currentStep > 1 ? setCurrentStep(p => p - 1) : navigation.goBack());

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await dispatch(createTontine(formData as CreateTontineData)).unwrap();
      Alert.alert('Succès', 'Votre tontine a été créée avec succès !', [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate('Main', {
              screen: 'Tontines',
              params: {screen: 'TontinesList'},
            }),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  // --- reusable selectors ---
  const OptionCard = ({selected, icon, label, onPress}: any) => (
    <PressableScale
      onPress={onPress}
      style={[s.optionCard, selected && {borderColor: colors.accent.main, backgroundColor: colors.accent.main + '12'}]}>
      <Icon name={icon} size={24} color={selected ? colors.accent.main : colors.text.secondary} />
      <Text style={[s.optionLabel, selected && {color: colors.accent.main, fontWeight: '700'}]}>{label}</Text>
    </PressableScale>
  );

  const RadioRow = ({selected, label, description, onPress}: any) => (
    <PressableScale
      onPress={onPress}
      style={[s.radioRow, selected && {borderColor: colors.accent.main, backgroundColor: colors.accent.main + '0E'}]}>
      <View style={[s.radio, {borderColor: selected ? colors.accent.main : colors.border.strong}]}>
        {selected && <View style={[s.radioDot, {backgroundColor: colors.accent.main}]} />}
      </View>
      <View style={{flex: 1}}>
        <Text style={s.radioLabel}>{label}</Text>
        <Text style={s.radioDesc}>{description}</Text>
      </View>
    </PressableScale>
  );

  const ToggleRow = ({label, description, value, onChange}: any) => (
    <View style={s.toggleRow}>
      <View style={{flex: 1, marginRight: spacing.md}}>
        <Text style={s.toggleLabel}>{label}</Text>
        <Text style={s.toggleDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{false: colors.border.strong, true: colors.accent.main}}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  const Review = ({label, value}: {label: string; value: string}) => (
    <View style={s.reviewItem}>
      <Text style={s.reviewLabel}>{label}</Text>
      <Text style={s.reviewValue}>{value}</Text>
    </View>
  );

  const Section = ({title}: {title: string}) => <Text style={s.sectionLabel}>{title}</Text>;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <Text style={s.stepTitle}>Informations de base</Text>
            <Text style={s.stepDesc}>Donnez un nom et décrivez votre tontine.</Text>
            <Input label="Nom de la tontine *" placeholder="Ex: Tontine Famille Diallo" value={formData.name} onChangeText={v => update('name', v)} helperText="Visible par tous les membres" />
            <Input label="Description" placeholder="Objectif de cette tontine" value={formData.description} onChangeText={v => update('description', v)} multiline numberOfLines={3} />
            <Section title="Catégorie *" />
            <View style={s.grid}>
              <OptionCard selected={formData.category === 'Family'} icon="account-group" label="Famille" onPress={() => update('category', 'Family')} />
              <OptionCard selected={formData.category === 'Friends'} icon="account-multiple" label="Amis" onPress={() => update('category', 'Friends')} />
              <OptionCard selected={formData.category === 'Professional'} icon="briefcase" label="Pro" onPress={() => update('category', 'Professional')} />
              <OptionCard selected={formData.category === 'Community'} icon="town-hall" label="Communauté" onPress={() => update('category', 'Community')} />
            </View>
            <Section title="Type de tontine *" />
            <RadioRow selected={formData.type === 'ROSCA'} label="Tontine tournante" description="Chaque membre reçoit à tour de rôle" onPress={() => update('type', 'ROSCA')} />
            <RadioRow selected={formData.type === 'ASCA'} label="Tontine accumulative" description="Accumulation avec intérêts" onPress={() => update('type', 'ASCA')} />
            <RadioRow selected={formData.type === 'Hybrid'} label="Tontine hybride" description="Combinaison des deux approches" onPress={() => update('type', 'Hybrid')} />
          </>
        );
      case 2:
        return (
          <>
            <Text style={s.stepTitle}>Détails financiers</Text>
            <Text style={s.stepDesc}>Montant et fréquence des contributions.</Text>
            <View style={s.amountRow}>
              <View style={{flex: 1}}>
                <Input label="Montant *" placeholder="10000" value={formData.contributionAmount ? String(formData.contributionAmount) : ''} onChangeText={v => update('contributionAmount', parseFloat(v) || 0)} type="number" />
              </View>
              <View style={s.currencyBox}>
                <Text style={s.currencyText}>{formData.currency}</Text>
              </View>
            </View>
            <Section title="Fréquence *" />
            <View style={s.grid}>
              <OptionCard selected={formData.frequency === 'Daily'} icon="calendar-today" label="Quotidien" onPress={() => update('frequency', 'Daily')} />
              <OptionCard selected={formData.frequency === 'Weekly'} icon="calendar-week" label="Hebdo" onPress={() => update('frequency', 'Weekly')} />
              <OptionCard selected={formData.frequency === 'BiWeekly'} icon="calendar-range" label="Bimensuel" onPress={() => update('frequency', 'BiWeekly')} />
              <OptionCard selected={formData.frequency === 'Monthly'} icon="calendar-month" label="Mensuel" onPress={() => update('frequency', 'Monthly')} />
            </View>
            <Input label="Nombre de membres *" placeholder="5" value={formData.totalMembers ? String(formData.totalMembers) : ''} onChangeText={v => update('totalMembers', parseInt(v, 10) || 0)} type="number" helperText="Minimum 3 participants" />
            <DatePickerField label="Date de début *" value={formData.startDate} onChange={v => update('startDate', v)} minimumDate={new Date()} helperText="Date du premier tour" />
            <Input label="Caution (optionnel)" placeholder="0" value={formData.depositAmount ? String(formData.depositAmount) : ''} onChangeText={v => update('depositAmount', parseFloat(v) || 0)} type="number" helperText="Garantie remboursable en fin de tontine" />
          </>
        );
      case 3:
        return (
          <>
            <Text style={s.stepTitle}>Règles et paramètres</Text>
            <Text style={s.stepDesc}>Configurez le fonctionnement.</Text>
            <Section title="Ordre de distribution *" />
            <RadioRow selected={formData.distributionOrder === 'Sequential'} label="Liste séquentielle" description="Ordre prédéfini à la création" onPress={() => update('distributionOrder', 'Sequential')} />
            <RadioRow selected={formData.distributionOrder === 'Random'} label="Tirage au sort" description="Ordre aléatoire à chaque tour" onPress={() => update('distributionOrder', 'Random')} />
            <RadioRow selected={formData.distributionOrder === 'Vote'} label="Vote collectif" description="Les membres votent" onPress={() => update('distributionOrder', 'Vote')} />
            <RadioRow selected={formData.distributionOrder === 'NeedBased'} label="Basé sur les besoins" description="Priorité aux urgences" onPress={() => update('distributionOrder', 'NeedBased')} />
            <Input label="Pénalité de retard (%)" placeholder="5" value={formData.latePenaltyPercent != null ? String(formData.latePenaltyPercent) : ''} onChangeText={v => update('latePenaltyPercent', parseFloat(v) || 0)} type="number" />
            <Input label="Période de grâce (jours)" placeholder="3" value={formData.gracePeriodDays != null ? String(formData.gracePeriodDays) : ''} onChangeText={v => update('gracePeriodDays', parseInt(v, 10) || 0)} type="number" />
            <Input label="Réputation minimale" placeholder="0" value={formData.minReputationRequired != null ? String(formData.minReputationRequired) : ''} onChangeText={v => update('minReputationRequired', parseInt(v, 10) || 0)} type="number" helperText="0 = aucun minimum" />
            <Input label="Score de fiabilité minimum (0–100)" placeholder="0" value={formData.scoreMinimum != null ? String(formData.scoreMinimum) : ''} onChangeText={v => update('scoreMinimum', Math.max(0, Math.min(100, parseInt(v, 10) || 0)))} type="number" helperText="Filtre d'entrée basé sur le score portable" />
            <View style={s.toggles}>
              <ToggleRow label="Séquestre (cantonnement EME)" description="Fonds sécurisés hors de nos comptes · KYC P2 requis" value={formData.sequestreActive !== false} onChange={(v: boolean) => update('sequestreActive', v)} />
              <ToggleRow label="Tontine publique" description="Visible dans la recherche" value={!!formData.isPublic} onChange={(v: boolean) => update('isPublic', v)} />
              <ToggleRow label="Chat activé" description="Discussions de groupe" value={!!formData.chatEnabled} onChange={(v: boolean) => update('chatEnabled', v)} />
              <ToggleRow label="Votes activés" description="Décisions par vote" value={!!formData.votingEnabled} onChange={(v: boolean) => update('votingEnabled', v)} />
            </View>
          </>
        );
      case 4:
        return (
          <>
            <Text style={s.stepTitle}>Inviter des membres</Text>
            <Text style={s.stepDesc}>Vous pourrez inviter maintenant ou plus tard.</Text>
            <View style={s.inviteCard}>
              <View style={s.inviteIcon}>
                <UsersIcon size={34} color={colors.accent.main} />
              </View>
              <Text style={s.inviteTitle}>Invitations à venir</Text>
              <Text style={s.inviteText}>Après la création, invitez des membres par téléphone, email ou lien d'invitation.</Text>
            </View>
            <View style={s.infoBox}>
              <InfoIcon size={20} color={colors.brand.indigo} />
              <Text style={s.infoText}>En tant que créateur, vous serez automatiquement administrateur de cette tontine.</Text>
            </View>
          </>
        );
      case 5: {
        const totalCycle = (formData.totalMembers || 0) * (formData.contributionAmount || 0);
        return (
          <>
            <Text style={s.stepTitle}>Récapitulatif</Text>
            <Text style={s.stepDesc}>Vérifiez avant de créer.</Text>
            <View style={s.reviewCard}>
              <Text style={s.reviewSection}>Informations</Text>
              <Review label="Nom" value={formData.name || ''} />
              <Review label="Catégorie" value={String(formData.category || '')} />
              <Review label="Type" value={String(formData.type || '')} />
              {!!formData.description && <Review label="Description" value={formData.description} />}
            </View>
            <View style={s.reviewCard}>
              <Text style={s.reviewSection}>Finances</Text>
              <Review label="Contribution" value={`${formData.contributionAmount} ${formData.currency}`} />
              <Review label="Fréquence" value={String(formData.frequency || '')} />
              <Review label="Membres" value={String(formData.totalMembers || '')} />
              <Review label="Date de début" value={formData.startDate || ''} />
            </View>
            <View style={[s.reviewCard, s.summaryCard]}>
              <Text style={[s.reviewSection, {color: colors.accent.main}]}>Résumé financier</Text>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Montant total par cycle</Text>
                <Text style={s.summaryValue}>
                  {totalCycle.toLocaleString('fr-FR')} {formData.currency}
                </Text>
              </View>
            </View>
          </>
        );
      }
      default:
        return null;
    }
  };

  return (
    <View style={s.container}>
      <View style={[s.header, {paddingTop: insets.top + spacing.sm}]}>
        <PressableScale onPress={handleBack} style={s.backBtn}>
          <ChevronLeftIcon size={22} color={colors.text.primary} />
        </PressableScale>
        <View style={{flex: 1, alignItems: 'center'}}>
          <Text style={s.headerTitle}>Créer une tontine</Text>
          <Text style={s.headerSub}>Étape {currentStep} sur {TOTAL_STEPS}</Text>
        </View>
        <View style={{width: 44}} />
      </View>
      <View style={{paddingHorizontal: spacing.lg}}>
        <ProgressBar progress={(currentStep / TOTAL_STEPS) * 100} height={6} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Animated.View key={currentStep} entering={FadeIn.duration(280)}>
          {renderStep()}
        </Animated.View>
      </ScrollView>

      <View style={[s.footer, {paddingBottom: insets.bottom + spacing.md}]}>
        {currentStep > 1 && (
          <Button title="Précédent" variant="outline" onPress={handleBack} style={{flex: 1}} />
        )}
        {currentStep < TOTAL_STEPS ? (
          <Button title="Suivant" variant="gradient" onPress={handleNext} style={{flex: 1}} />
        ) : (
          <Button title="Créer la tontine" variant="gradient" onPress={handleSubmit} loading={isLoading} style={{flex: 1}} />
        )}
      </View>
    </View>
  );
};

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg.base},
    header: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md},
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.surface.sunken,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {...typography.h3, color: colors.text.primary, fontWeight: '700'},
    headerSub: {...typography.caption, color: colors.text.secondary},
    content: {paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: TAB_BAR_SPACE + spacing['2xl']},
    stepTitle: {...typography.h2, color: colors.text.primary, marginBottom: spacing.xs},
    stepDesc: {...typography.body, color: colors.text.secondary, marginBottom: spacing.lg},
    sectionLabel: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm},
    grid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm},
    optionCard: {
      flexGrow: 1,
      minWidth: '46%',
      backgroundColor: colors.surface.default,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      borderColor: colors.border.default,
      alignItems: 'center',
      gap: spacing.xs,
    },
    optionLabel: {...typography.caption, color: colors.text.secondary, fontWeight: '600'},
    radioRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.default,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      borderColor: colors.border.default,
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    radio: {width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center'},
    radioDot: {width: 11, height: 11, borderRadius: 6},
    radioLabel: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '600'},
    radioDesc: {...typography.caption, color: colors.text.secondary, marginTop: 1},
    amountRow: {flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end'},
    currencyBox: {
      height: 54,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface.sunken,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    currencyText: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700'},
    toggles: {marginTop: spacing.sm, gap: spacing.sm},
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.default,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    toggleLabel: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '600'},
    toggleDesc: {...typography.caption, color: colors.text.secondary, marginTop: 1},
    inviteCard: {
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius.xl,
      padding: spacing.xl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border.subtle,
      marginBottom: spacing.md,
    },
    inviteIcon: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: colors.accent.main + '14',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    inviteTitle: {...typography.h3, color: colors.text.primary, marginBottom: spacing.xs},
    inviteText: {...typography.body, color: colors.text.secondary, textAlign: 'center'},
    infoBox: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'flex-start',
      backgroundColor: colors.brand.indigoSoft,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
    },
    infoText: {...typography.caption, color: colors.text.secondary, flex: 1},
    reviewCard: {
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius.xl,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    reviewSection: {...typography.h3, color: colors.text.primary, marginBottom: spacing.sm, fontWeight: '700'},
    reviewItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    reviewLabel: {...typography.body, color: colors.text.secondary},
    reviewValue: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: spacing.md},
    summaryCard: {backgroundColor: colors.accent.main + '0E', borderColor: colors.accent.main + '40'},
    summaryRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs},
    summaryLabel: {...typography.body, color: colors.text.primary},
    summaryValue: {...typography.h3, color: colors.accent.main, fontWeight: '800'},
    footer: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      backgroundColor: colors.surface.default,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
  });

export default CreateTontineScreen;
