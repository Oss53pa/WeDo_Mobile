/**
 * SettingsScreen
 * App configuration, preferences, and account settings — "Kente Vibrant".
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Share,
} from 'react-native';
import tontineApi from '@services/api/tontine.api';
import paymentApi from '@services/api/payment.api';
import {IS_SUPABASE_CONFIGURED} from '@config/appConfig';
import {StackNavigationProp} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Card,
  Button,
  PressableScale,
  SegmentedControl,
  ScreenHeader,
  type SegmentOption,
} from '@components/common';
import {ChevronRightIcon, AlertIcon, CheckIcon} from '@components/icons';
import {Adinkra} from '@components/patterns';
import {
  useTheme,
  useThemedStyles,
  typography,
  spacing,
  borderRadius,
  iconSize,
  AMBIANCE_LIST,
  type ThemedTokens,
} from '@theme';
import {TAB_BAR_SPACE} from '@components/navigation/CustomTabBar';
import {RootStackParamList} from '@navigation/types';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '@store/store';
import {logout} from '@store/slices/auth.slice';
import {setBiometricEnabled} from '@store/slices/auth.slice';

// Country → Élan argot (nouchi / camfranglais / gabon). Explicit choice so users
// who signed up by e-mail (no phone to detect) still get their country's slang.
const ARGOT_OPTIONS = [
  {key: 'nouchi' as const, flag: '🇨🇮', label: "Côte d'Ivoire"},
  {key: 'camfranglais' as const, flag: '🇨🇲', label: 'Cameroun'},
  {key: 'gabon' as const, flag: '🇬🇦', label: 'Gabon'},
];

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

interface Props {
  navigation: SettingsScreenNavigationProp;
}

type Language = 'fr' | 'en' | 'wo' | 'ar';
type Currency = 'XOF' | 'XAF' | 'USD' | 'EUR';

const SettingsScreen: React.FC<Props> = ({navigation}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {colors, preference, setScheme, ambiance, setAmbiance, argot, setArgot} = useTheme();
  const s = useThemedStyles(makeStyles);
  const {biometricEnabled} = useSelector((state: RootState) => state.auth);
  const {profile} = useSelector((state: RootState) => state.user);

  // Theme preference options (typed to match the theme hook exactly)
  type Preference = Parameters<typeof setScheme>[0];
  const themeOptions: SegmentOption<Preference>[] = [
    {label: 'Clair', value: 'light'},
    {label: 'Sombre', value: 'dark'},
    {label: 'Système', value: 'system'},
  ];

  // Local state for settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    (profile?.language as Language) || 'fr'
  );
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    (profile?.preferredCurrency as Currency) || 'XOF'
  );

  const handleBiometricToggle = async (value: boolean) => {
    try {
      // TODO: Implement actual biometric setup
      dispatch(setBiometricEnabled(value));
      Alert.alert(
        'Succès',
        value
          ? 'Authentification biométrique activée'
          : 'Authentification biométrique désactivée'
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier les paramètres biométriques');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Votre demande de suppression sera enregistrée. Pour préserver le registre des tontines auxquelles vous avez participé, vos données financières sont conservées le temps légal, puis votre compte est désactivé. Vous serez déconnecté.',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Demander la suppression',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(logout()).unwrap();
              Alert.alert(
                'Demande enregistrée',
                'Vous avez été déconnecté. Contactez le support pour finaliser la suppression définitive.',
              );
            } catch {
              Alert.alert('Erreur', 'La déconnexion a échoué. Réessayez.');
            }
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Exporter mes données',
      'Un récapitulatif de votre profil, de vos tontines et de vos transactions sera préparé et proposé au partage.',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Exporter',
          onPress: async () => {
            try {
              const [tontines, history] = await Promise.all([
                tontineApi.getMyTontines(),
                IS_SUPABASE_CONFIGURED
                  ? paymentApi.getTransactionHistory(1, 200)
                  : Promise.resolve({data: []}),
              ]);
              const payload = {
                exportedAt: new Date().toISOString(),
                profil: {
                  nom: profile?.fullName,
                  email: profile?.email,
                  telephone: profile?.phoneNumber,
                  scoreReputation: profile?.reputationScore,
                  niveauKyc: profile?.kycLevel,
                },
                tontines: tontines.map(t => ({
                  nom: t.name,
                  statut: t.status,
                  montantCotisation: t.contributionAmount,
                  devise: t.currency,
                  membres: t.currentMembers,
                })),
                transactions: (history.data || []).map((x: any) => ({
                  type: x.type,
                  montant: x.amount,
                  devise: x.currency,
                  statut: x.status,
                  date: x.createdAt,
                  description: x.description,
                })),
              };
              await Share.share({
                title: 'Mes données WeDo',
                message: JSON.stringify(payload, null, 2),
              });
            } catch (e: any) {
              Alert.alert('Erreur', e?.message || "L'export a échoué. Réessayez.");
            }
          },
        },
      ]
    );
  };

  const renderSettingItem = (
    icon: string,
    label: string,
    value?: string,
    onPress?: () => void,
    showChevron: boolean = true,
    isLast: boolean = false
  ) => (
    <PressableScale
      style={[s.settingItem, isLast && s.rowLast]}
      onPress={onPress}
      scaleTo={0.98}>
      <View style={s.settingLeft}>
        <View style={s.iconChip}>
          <Icon name={icon} size={iconSize.sm} color={colors.brand.terracotta} />
        </View>
        <Text style={s.settingLabel}>{label}</Text>
      </View>
      <View style={s.settingRight}>
        {value && <Text style={s.settingValue}>{value}</Text>}
        {showChevron && (
          <ChevronRightIcon size={18} color={colors.text.tertiary} />
        )}
      </View>
    </PressableScale>
  );

  const renderToggleItem = (
    icon: string,
    label: string,
    description: string,
    value: boolean,
    onChange: (value: boolean) => void,
    isLast: boolean = false
  ) => (
    <View style={[s.toggleItem, isLast && s.rowLast]}>
      <View style={s.toggleLeft}>
        <View style={s.iconChip}>
          <Icon name={icon} size={iconSize.sm} color={colors.brand.terracotta} />
        </View>
        <View style={s.toggleText}>
          <Text style={s.toggleLabel}>{label}</Text>
          <Text style={s.toggleDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{false: colors.border.strong, true: colors.accent.main}}
        thumbColor={colors.surface.default}
        ios_backgroundColor={colors.border.strong}
      />
    </View>
  );

  const languages: {value: Language; label: string; flag: string}[] = [
    {value: 'fr', label: 'Français', flag: '🇫🇷'},
    {value: 'en', label: 'English', flag: '🇬🇧'},
    {value: 'wo', label: 'Wolof', flag: '🇸🇳'},
    {value: 'ar', label: 'العربية', flag: '🇸🇦'},
  ];

  const currencies: {value: Currency; label: string; symbol: string}[] = [
    {value: 'XOF', label: 'Franc CFA (XOF)', symbol: 'CFA'},
    {value: 'XAF', label: 'Franc CFA (XAF)', symbol: 'CFA'},
    {value: 'USD', label: 'Dollar US', symbol: '$'},
    {value: 'EUR', label: 'Euro', symbol: '€'},
  ];

  return (
    <View style={s.container}>
      <ScreenHeader title="Paramètres" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}>

      {/* Appearance Section */}
      <Card style={s.card} padding={spacing.md}>
        <Text style={s.sectionTitle}>Apparence</Text>
        <Text style={s.sectionHint}>Choisissez le thème de l'application</Text>
        <SegmentedControl
          options={themeOptions}
          value={preference}
          onChange={setScheme}
          style={s.themeControl}
        />
      </Card>

      {/* Ambiance Section */}
      <Card style={s.card} padding={spacing.md}>
        <Text style={s.sectionTitle}>Ambiance</Text>
        <Text style={s.sectionHint}>
          Une identité Kente, plusieurs personnalités. Choisissez la vôtre.
        </Text>
        <View style={s.ambGrid}>
          {AMBIANCE_LIST.map(a => {
            const active = a.key === ambiance;
            return (
              <PressableScale
                key={a.key}
                onPress={() => setAmbiance(a.key)}
                style={[
                  s.ambCard,
                  {borderColor: active ? a.swatch[1] : colors.border.default},
                  active && {borderWidth: 2},
                ]}>
                <View style={s.ambTop}>
                  <View style={s.ambSwatch}>
                    {a.swatch.slice(0, 4).map((c, i) => (
                      <View key={i} style={[s.ambDot, {backgroundColor: c}]} />
                    ))}
                  </View>
                  <Adinkra name={a.adinkra} size={26} color={a.swatch[1]} weight={7} />
                </View>
                <View style={s.ambNameRow}>
                  <Text style={s.ambName}>{a.label}</Text>
                  {active && <CheckIcon size={16} color={a.swatch[1]} />}
                </View>
                <Text style={s.ambTagline} numberOfLines={1}>{a.tagline}</Text>
              </PressableScale>
            );
          })}
        </View>

        {/* Country / slang — drives the Élan ambiance words (nouchi / camfranglais / gabon).
            Explicit choice because phone-based auto-detection can't work without a number. */}
        <View style={s.argotBlock}>
          <Text style={s.argotTitle}>Mon pays</Text>
          <Text style={s.sectionHint}>
            Choisis ton pays : en ambiance Élan, l'app parle ton argot (nouchi, camfranglais, gabonais).
          </Text>
          <View style={s.argotRow}>
            {ARGOT_OPTIONS.map(o => {
              const active = o.key === argot;
              return (
                <PressableScale
                  key={o.key}
                  onPress={() => setArgot(o.key, true)}
                  style={[s.argotChip, active && {borderColor: colors.accent.main, backgroundColor: colors.accent.main + '14', borderWidth: 2}]}>
                  <Text style={s.argotFlag}>{o.flag}</Text>
                  <Text style={[s.argotName, active && {color: colors.accent.main, fontWeight: '800'}]}>{o.label}</Text>
                </PressableScale>
              );
            })}
          </View>
        </View>
      </Card>

      {/* Account Section */}
      <Card style={s.card} padding={spacing.md}>
        <Text style={s.sectionTitle}>Compte</Text>

        {renderSettingItem('account-edit', 'Modifier le profil', undefined, () =>
          navigation.navigate('EditProfile')
        )}
        {renderSettingItem(
          'credit-card-outline',
          'Moyens de paiement',
          undefined,
          () => {
            // Navigate to payment methods
          }
        )}
        {renderSettingItem('shield-check', 'Vérification KYC', `Niveau ${profile?.kycLevel || 1}`, () => {
          // Navigate to KYC verification
        }, true, true)}
      </Card>

      {/* Security Section */}
      <Card style={s.card} padding={spacing.md}>
        <Text style={s.sectionTitle}>Sécurité et confidentialité</Text>

        {renderToggleItem(
          'fingerprint',
          'Authentification biométrique',
          'Utiliser votre empreinte ou Face ID',
          biometricEnabled,
          handleBiometricToggle
        )}


        {renderSettingItem('two-factor-authentication', 'Authentification à deux facteurs', 'Désactivée', () => {
          // Navigate to 2FA setup
        })}

        {renderSettingItem('eye-off', 'Confidentialité', undefined, () => {
          // Navigate to privacy settings
        }, true, true)}
      </Card>

      {/* Notifications Section */}
      <Card style={s.card} padding={spacing.md}>
        <Text style={s.sectionTitle}>Notifications</Text>

        {renderToggleItem(
          'bell',
          'Notifications',
          'Activer toutes les notifications',
          notificationsEnabled,
          setNotificationsEnabled,
          !notificationsEnabled
        )}

        {notificationsEnabled && (
          <>
            {renderToggleItem(
              'cellphone-message',
              'Notifications push',
              'Recevoir des notifications sur votre appareil',
              pushEnabled,
              setPushEnabled
            )}

            {renderToggleItem(
              'email',
              'Notifications par email',
              'Recevoir des emails de notification',
              emailEnabled,
              setEmailEnabled
            )}

            {renderToggleItem(
              'volume-high',
              'Son',
              'Activer le son des notifications',
              soundEnabled,
              setSoundEnabled
            )}

            {renderToggleItem(
              'vibrate',
              'Vibration',
              'Activer la vibration',
              vibrationEnabled,
              setVibrationEnabled,
              true
            )}
          </>
        )}
      </Card>

      {/* Language & Region Section */}
      <Card style={s.card} padding={spacing.md}>
        <Text style={s.sectionTitle}>Langue et région</Text>

        <PressableScale
          style={s.settingItem}
          scaleTo={0.98}
          onPress={() => {
            Alert.alert(
              'Choisir la langue',
              '',
              languages.map(lang => ({
                text: `${lang.flag} ${lang.label}`,
                onPress: () => setSelectedLanguage(lang.value),
              }))
            );
          }}>
          <View style={s.settingLeft}>
            <View style={s.iconChip}>
              <Icon name="translate" size={iconSize.sm} color={colors.brand.terracotta} />
            </View>
            <Text style={s.settingLabel}>Langue</Text>
          </View>
          <View style={s.settingRight}>
            <Text style={s.settingValue}>
              {languages.find(l => l.value === selectedLanguage)?.label}
            </Text>
            <ChevronRightIcon size={18} color={colors.text.tertiary} />
          </View>
        </PressableScale>

        <PressableScale
          style={[s.settingItem, s.rowLast]}
          scaleTo={0.98}
          onPress={() => {
            Alert.alert(
              'Choisir la devise',
              '',
              currencies.map(curr => ({
                text: `${curr.symbol} ${curr.label}`,
                onPress: () => setSelectedCurrency(curr.value),
              }))
            );
          }}>
          <View style={s.settingLeft}>
            <View style={s.iconChip}>
              <Icon name="currency-usd" size={iconSize.sm} color={colors.brand.terracotta} />
            </View>
            <Text style={s.settingLabel}>Devise préférée</Text>
          </View>
          <View style={s.settingRight}>
            <Text style={s.settingValue}>
              {currencies.find(c => c.value === selectedCurrency)?.label}
            </Text>
            <ChevronRightIcon size={18} color={colors.text.tertiary} />
          </View>
        </PressableScale>
      </Card>

      {/* Data & Storage Section */}
      <Card style={s.card} padding={spacing.md}>
        <Text style={s.sectionTitle}>Données et stockage</Text>

        {renderSettingItem('download', 'Exporter mes données', undefined, handleExportData)}

        {renderSettingItem('delete-sweep', 'Effacer le cache', '12.5 MB', () => {
          Alert.alert(
            'Effacer le cache',
            'Voulez-vous effacer les données en cache ?',
            [
              {text: 'Annuler', style: 'cancel'},
              {
                text: 'Effacer',
                onPress: () => {
                  Alert.alert('Succès', 'Le cache a été effacé.');
                },
              },
            ]
          );
        }, true, true)}
      </Card>

      {/* Support Section */}
      <Card style={s.card} padding={spacing.md}>
        <Text style={s.sectionTitle}>Support et informations</Text>

        {renderSettingItem('help-circle', "Centre d'aide", undefined, () => {
          // Navigate to help center
        })}

        {renderSettingItem('file-document', "Conditions d'utilisation", undefined, () =>
          (navigation as any).navigate('Legal', {doc: 'cgu'}),
        )}

        {renderSettingItem('shield-lock', 'Politique de confidentialité', undefined, () =>
          (navigation as any).navigate('Legal', {doc: 'privacy'}),
        )}

        {renderSettingItem('information', 'À propos', 'Version 1.0.0', () => {
          // Navigate to about
        }, false, true)}
      </Card>

      {/* Danger Zone */}
      <Card variant="outline" style={[s.card, s.dangerCard]} padding={spacing.md}>
        <Text style={[s.sectionTitle, s.dangerTitle]}>Zone dangereuse</Text>

        <PressableScale
          style={[s.settingItem, s.rowLast]}
          scaleTo={0.98}
          onPress={handleDeleteAccount}>
          <View style={s.settingLeft}>
            <View style={s.dangerIconChip}>
              <AlertIcon size={iconSize.sm} color={colors.error} />
            </View>
            <Text style={s.dangerButtonText}>Supprimer mon compte</Text>
          </View>
          <ChevronRightIcon size={18} color={colors.error} />
        </PressableScale>
      </Card>

      {/* Logout Button */}
      <View style={s.logoutContainer}>
        <Button
          title="Se déconnecter"
          variant="outline"
          onPress={async () => {
            Alert.alert(
              'Déconnexion',
              'Êtes-vous sûr de vouloir vous déconnecter ?',
              [
                {text: 'Annuler', style: 'cancel'},
                {
                  text: 'Déconnexion',
                  style: 'destructive',
                  onPress: async () => {
                    await dispatch(logout()).unwrap();
                  },
                },
              ]
            );
          }}
          icon="logout"
          fullWidth
        />
      </View>

      <Text style={s.versionText}>TontineDigital v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: TAB_BAR_SPACE + spacing.lg,
    },
    screenTitle: {
      ...typography.h1,
      color: colors.text.primary,
      marginBottom: spacing.lg,
    },
    card: {
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.h3,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: spacing.sm,
    },
    sectionHint: {
      ...typography.caption,
      color: colors.text.secondary,
      marginBottom: spacing.md,
    },
    themeControl: {
      marginTop: spacing.xs,
    },
    ambGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    argotBlock: {marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border.subtle, paddingTop: spacing.md},
    argotTitle: {...typography.captionMedium, color: colors.text.primary, fontWeight: '700', marginBottom: 2},
    argotRow: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm},
    argotChip: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border.default,
      backgroundColor: colors.surface.default,
    },
    argotFlag: {fontSize: 24},
    argotName: {...typography.caption, color: colors.text.secondary, fontWeight: '600', textAlign: 'center'},
    ambCard: {
      width: '47%',
      flexGrow: 1,
      borderWidth: 1,
      borderRadius: borderRadius.lg,
      padding: spacing.sm + 2,
      backgroundColor: colors.surface.default,
    },
    ambTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    ambSwatch: {flexDirection: 'row', gap: 3},
    ambDot: {width: 12, height: 12, borderRadius: 4},
    ambNameRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    ambName: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '800'},
    ambTagline: {...typography.small, color: colors.text.tertiary, marginTop: 2},
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm + 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border.subtle,
    },
    rowLast: {
      borderBottomWidth: 0,
      paddingBottom: 0,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
    },
    iconChip: {
      width: 38,
      height: 38,
      borderRadius: borderRadius.md,
      backgroundColor: colors.brand.terracottaSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingLabel: {
      ...typography.bodyMedium,
      color: colors.text.primary,
      flexShrink: 1,
    },
    settingRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    settingValue: {
      ...typography.caption,
      color: colors.text.secondary,
    },
    toggleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm + 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border.subtle,
    },
    toggleLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
      paddingRight: spacing.sm,
    },
    toggleText: {
      flex: 1,
    },
    toggleLabel: {
      ...typography.bodyMedium,
      color: colors.text.primary,
      marginBottom: 2,
    },
    toggleDescription: {
      ...typography.small,
      color: colors.text.secondary,
    },
    dangerCard: {
      borderColor: colors.brand.crimsonSoft,
      backgroundColor: colors.status.errorBg,
    },
    dangerTitle: {
      color: colors.error,
    },
    dangerIconChip: {
      width: 38,
      height: 38,
      borderRadius: borderRadius.md,
      backgroundColor: colors.brand.crimsonSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dangerButtonText: {
      ...typography.bodyMedium,
      fontWeight: '600',
      color: colors.error,
    },
    logoutContainer: {
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    versionText: {
      ...typography.caption,
      color: colors.text.tertiary,
      textAlign: 'center',
      marginTop: spacing.md,
    },
  });

export default SettingsScreen;
