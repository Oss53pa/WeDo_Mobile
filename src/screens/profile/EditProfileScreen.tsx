/**
 * EditProfileScreen
 * Edit user profile information (name, email, avatar, etc.) — "Kente Vibrant".
 */

import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Button,
  Input,
  Card,
  Avatar,
  Badge,
  PressableScale,
} from '@components/common';
import {
  CameraIcon,
  PhoneIcon,
  InfoIcon,
  ChevronRightIcon,
} from '@components/icons';
import {
  useTheme,
  useThemedStyles,
  typography,
  spacing,
  borderRadius,
  iconSize,
  type ThemedTokens,
} from '@theme';
import {TAB_BAR_SPACE} from '@components/navigation/CustomTabBar';
import {RootStackParamList} from '@navigation/types';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '@store/store';
import {updateUserProfile} from '@store/slices/user.slice';
import {validate, updateProfileSchema, UpdateProfileFormData} from '@utils/validation';

type EditProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'EditProfile'
>;

interface Props {
  navigation: EditProfileScreenNavigationProp;
}

const EditProfileScreen: React.FC<Props> = ({navigation}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const {user} = useSelector((state: RootState) => state.auth);
  const {profile, isLoading} = useSelector((state: RootState) => state.user);

  const userData = profile || user;

  const [fullName, setFullName] = useState(userData?.fullName || '');
  const [email, setEmail] = useState(userData?.email || '');
  const [avatar, setAvatar] = useState(userData?.avatar || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Check if there are changes
    const changed =
      fullName !== (userData?.fullName || '') ||
      email !== (userData?.email || '') ||
      avatar !== (userData?.avatar || '');

    setHasChanges(changed);
  }, [fullName, email, avatar, userData]);

  const handleChangeAvatar = () => {
    Alert.alert(
      'Changer la photo de profil',
      'Choisissez une option',
      [
        {
          text: 'Prendre une photo',
          onPress: () => {
            // TODO: Open camera
            Alert.alert('Info', 'Fonctionnalité caméra à venir');
          },
        },
        {
          text: 'Choisir depuis la galerie',
          onPress: () => {
            // TODO: Open image picker
            Alert.alert('Info', 'Fonctionnalité galerie à venir');
          },
        },
        {
          text: 'Supprimer la photo',
          style: 'destructive',
          onPress: () => {
            setAvatar('');
          },
        },
        {text: 'Annuler', style: 'cancel'},
      ]
    );
  };

  const handleSave = async () => {
    // Validate
    const formData: UpdateProfileFormData = {
      fullName: fullName || undefined,
      email: email || undefined,
      avatar: avatar || undefined,
    };

    const result = validate(updateProfileSchema, formData);

    if (!result.success) {
      setErrors(result.errors || {});
      Alert.alert('Erreur', 'Veuillez corriger les erreurs avant de continuer');
      return;
    }

    try {
      await dispatch(updateUserProfile(formData)).unwrap();

      Alert.alert('Succès', 'Votre profil a été mis à jour avec succès', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Annuler les modifications',
        'Vous avez des modifications non enregistrées. Voulez-vous vraiment annuler ?',
        [
          {text: 'Non', style: 'cancel'},
          {text: 'Oui', onPress: () => navigation.goBack()},
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <Text style={s.screenTitle}>Modifier le profil</Text>

      {/* Avatar Section */}
      <Card style={s.avatarCard} padding={spacing.xl}>
        <View style={s.avatarContainer}>
          <Avatar
            name={fullName || userData?.fullName || ''}
            imageUrl={avatar || undefined}
            size="2xl"
            ring
            gradient="sunset"
          />

          <PressableScale
            style={s.changeAvatarButton}
            scaleTo={0.9}
            onPress={handleChangeAvatar}>
            <CameraIcon size={20} color="#FFFFFF" />
          </PressableScale>
        </View>

        <Text style={s.avatarHint}>Touchez pour changer la photo</Text>
      </Card>

      {/* Personal Information */}
      <Card style={s.card} padding={spacing.md}>
        <Text style={s.sectionTitle}>Informations personnelles</Text>

        <Input
          label="Nom complet"
          required
          placeholder="Mamadou Diallo"
          value={fullName}
          onChangeText={setFullName}
          error={errors.fullName}
          leftIcon="account"
        />

        <Input
          label="Email"
          placeholder="mamadou@example.com"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          type="email"
          leftIcon="email"
        />

        <View style={s.infoBox}>
          <InfoIcon size={iconSize.sm} color={colors.brand.indigo} />
          <Text style={s.infoText}>
            Votre numéro de téléphone ne peut pas être modifié ici. Contactez le support
            pour changer votre numéro.
          </Text>
        </View>
      </Card>

      {/* Phone Number (Read-only) */}
      <Card style={s.card} padding={spacing.md}>
        <Text style={s.sectionTitle}>Numéro de téléphone</Text>

        <View style={s.phoneContainer}>
          <View style={s.iconChip}>
            <PhoneIcon size={iconSize.sm} color={colors.brand.terracotta} />
          </View>
          <Text style={s.phoneText}>{userData?.phoneNumber}</Text>
          {userData?.verified && (
            <Badge
              variant="soft"
              tone={colors.success}
              icon="check-decagram"
              label="Vérifié"
              size="small"
            />
          )}
        </View>

        <PressableScale
          style={s.changePhoneButton}
          scaleTo={0.98}
          onPress={() => {
            Alert.alert(
              'Changer de numéro',
              'Pour changer votre numéro de téléphone, veuillez contacter le support client.',
              [
                {text: 'OK'},
                {
                  text: 'Contacter le support',
                  onPress: () => {
                    // Navigate to support
                  },
                },
              ]
            );
          }}>
          <Icon name="phone-sync" size={iconSize.sm} color={colors.accent.main} />
          <Text style={s.changePhoneText}>Changer de numéro</Text>
        </PressableScale>
      </Card>

      {/* Preferences */}
      <Card style={s.card} padding={spacing.md}>
        <Text style={s.sectionTitle}>Préférences</Text>

        <View style={s.preferenceItem}>
          <View style={s.preferenceLeft}>
            <View style={s.iconChip}>
              <Icon name="translate" size={iconSize.sm} color={colors.brand.terracotta} />
            </View>
            <Text style={s.preferenceLabel}>Langue</Text>
          </View>
          <PressableScale style={s.preferenceRight} scaleTo={0.98}>
            <Text style={s.preferenceValue}>
              {userData?.language || 'Français'}
            </Text>
            <ChevronRightIcon size={18} color={colors.text.tertiary} />
          </PressableScale>
        </View>

        <View style={[s.preferenceItem, s.rowLast]}>
          <View style={s.preferenceLeft}>
            <View style={s.iconChip}>
              <Icon name="currency-usd" size={iconSize.sm} color={colors.brand.terracotta} />
            </View>
            <Text style={s.preferenceLabel}>Devise</Text>
          </View>
          <PressableScale style={s.preferenceRight} scaleTo={0.98}>
            <Text style={s.preferenceValue}>
              {userData?.preferredCurrency || 'XOF'}
            </Text>
            <ChevronRightIcon size={18} color={colors.text.tertiary} />
          </PressableScale>
        </View>
      </Card>

      {/* Account Stats (Read-only) */}
      <Card style={s.card} padding={spacing.md}>
        <Text style={s.sectionTitle}>Informations du compte</Text>

        <View style={s.statRow}>
          <Text style={s.statLabel}>Membre depuis</Text>
          <Text style={s.statValue}>
            {userData?.createdAt
              ? new Date(userData.createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                })
              : '-'}
          </Text>
        </View>

        <View style={s.statRow}>
          <Text style={s.statLabel}>Niveau KYC</Text>
          <Text style={s.statValue}>Niveau {userData?.kycLevel || 1}</Text>
        </View>

        <View style={[s.statRow, s.rowLast]}>
          <Text style={s.statLabel}>Score de réputation</Text>
          <Text style={[s.statValue, s.reputationValue]}>
            {userData?.reputationScore || 0} pts
          </Text>
        </View>

        <PressableScale
          style={s.upgradeButton}
          scaleTo={0.98}
          onPress={() => {
            Alert.alert(
              'Améliorer le niveau KYC',
              'Un niveau KYC plus élevé vous donne accès à plus de fonctionnalités et augmente votre limite de contribution.',
              [
                {text: 'Plus tard'},
                {
                  text: 'Commencer',
                  onPress: () => {
                    // Navigate to KYC upgrade
                  },
                },
              ]
            );
          }}>
          <Icon name="shield-star" size={iconSize.sm} color={colors.brand.gold} />
          <Text style={s.upgradeButtonText}>Améliorer mon niveau KYC</Text>
        </PressableScale>
      </Card>

      {/* Action Buttons */}
      <View style={s.actions}>
        <Button
          title="Enregistrer les modifications"
          variant="gradient"
          gradient="sunset"
          onPress={handleSave}
          loading={isLoading}
          disabled={!hasChanges || isLoading}
          fullWidth
          icon="content-save"
          style={s.saveButton}
        />

        <Button
          title="Annuler"
          variant="ghost"
          onPress={handleCancel}
          disabled={isLoading}
          fullWidth
        />
      </View>
    </ScrollView>
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
    avatarCard: {
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: spacing.md,
    },
    changeAvatarButton: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accent.main,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: colors.surface.default,
      ...shadows.sm,
      shadowColor: colors.shadowColor,
    },
    avatarHint: {
      ...typography.caption,
      color: colors.text.secondary,
    },
    card: {
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.h3,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: spacing.md,
    },
    iconChip: {
      width: 38,
      height: 38,
      borderRadius: borderRadius.md,
      backgroundColor: colors.brand.terracottaSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.brand.indigoSoft,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginTop: spacing.xs,
      gap: spacing.sm,
    },
    infoText: {
      ...typography.caption,
      color: colors.text.secondary,
      flex: 1,
    },
    phoneContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.sm,
      backgroundColor: colors.surface.sunken,
      borderRadius: borderRadius.md,
      gap: spacing.sm,
    },
    phoneText: {
      ...typography.bodyMedium,
      color: colors.text.primary,
      flex: 1,
    },
    changePhoneButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.md,
      padding: spacing.sm,
      gap: spacing.xs,
    },
    changePhoneText: {
      ...typography.captionMedium,
      color: colors.accent.main,
      fontWeight: '600',
    },
    preferenceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm + 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border.subtle,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    preferenceLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    preferenceLabel: {
      ...typography.bodyMedium,
      color: colors.text.primary,
    },
    preferenceRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    preferenceValue: {
      ...typography.caption,
      color: colors.text.secondary,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border.subtle,
    },
    statLabel: {
      ...typography.body,
      color: colors.text.secondary,
    },
    statValue: {
      ...typography.bodyMedium,
      color: colors.text.primary,
    },
    reputationValue: {
      color: colors.brand.gold,
      fontWeight: '700',
    },
    upgradeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: borderRadius.md,
      backgroundColor: colors.brand.goldSoft,
      gap: spacing.xs,
    },
    upgradeButtonText: {
      ...typography.bodyMedium,
      fontWeight: '600',
      color: colors.brand.gold,
    },
    actions: {
      marginTop: spacing.sm,
      gap: spacing.sm,
    },
    saveButton: {
      marginBottom: spacing.xs,
    },
  });

export default EditProfileScreen;
