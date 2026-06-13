/**
 * ManageTontineScreen — admin management of a tontine: lifecycle actions
 * (start / end), a summary card, and member administration (view + remove).
 * Defensive about the data shape; demo-mode safe.
 */
import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {
  ScreenHeader,
  Card,
  Button,
  Avatar,
  Badge,
  LoadingSpinner,
  EmptyState,
  PressableScale,
} from '@components/common';
import {
  CashIcon,
  UsersIcon,
  TrashIcon,
  ChevronRightIcon,
  StarIcon,
} from '@components/icons';
import {
  useTheme,
  useThemedStyles,
  typography,
  spacing,
  borderRadius,
  type ThemedTokens,
} from '@theme';
import {RootStackParamList} from '@navigation/types';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '@store/store';
import {fetchTontineDetail} from '@store/slices/tontine.slice';
import * as tontineApi from '@services/api/tontine.api';
import {formatCurrency} from '@utils/formatting';
import {computeActivationFee} from '@utils/activationFee';
import {formatFcfa} from '@utils/money';

type Nav = StackNavigationProp<RootStackParamList, 'ManageTontine'>;
type Route = RouteProp<RootStackParamList, 'ManageTontine'>;

const ROLE_LABELS: Record<string, string> = {
  Admin: 'Administrateur',
  Treasurer: 'Trésorier',
  Secretary: 'Secrétaire',
  Member: 'Membre',
  Observer: 'Observateur',
};

const STATUS_LABELS: Record<string, string> = {
  Open: 'Ouvert',
  Active: 'Actif',
  Completed: 'Terminé',
  Cancelled: 'Annulé',
};

const ManageTontineScreen: React.FC<{navigation: Nav; route: Route}> = ({
  navigation,
  route,
}) => {
  const {tontineId} = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const {currentTontine, isLoading} = useSelector((st: RootState) => st.tontine);
  const t: any = currentTontine;

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tontineId]);

  const load = async () => {
    try {
      await dispatch(fetchTontineDetail(tontineId)).unwrap();
    } catch (e) {
      /* handled in slice */
    }
  };

  const statusTone = (status: string): string =>
    status === 'Active'
      ? colors.brand.emerald
      : status === 'Open'
      ? colors.brand.gold
      : status === 'Completed'
      ? colors.brand.indigo
      : colors.text.tertiary;

  const roleTone = (role: string): string =>
    role === 'Admin'
      ? colors.brand.indigo
      : role === 'Treasurer'
      ? colors.brand.emerald
      : role === 'Secretary'
      ? colors.brand.terracotta
      : colors.text.tertiary;

  const startTontine = () => {
    // Activation-fee preview (result in clear language — never the formula).
    const nbParticipants = Number(t?.currentMembers ?? t?.members?.length ?? 0);
    const nbTours = Number(t?.totalRounds || t?.totalMembers || nbParticipants);
    const fee = computeActivationFee(
      Number(t?.contributionAmount ?? 0),
      nbParticipants,
      nbTours,
      Number(t?.tauxServiceBps ?? 80),
    );
    const preview =
      nbParticipants > 0
        ? `Vous sécurisez ${formatFcfa(fee.mts)} sur ${nbTours} tours.\n` +
          `Frais d'activation : ${formatFcfa(fee.base)} par membre, payé une seule fois au lancement (vous y compris).\n\n` +
          'Une fois démarrée, plus aucun membre ne pourra rejoindre. Continuer ?'
        : 'Une fois démarrée, plus aucun membre ne pourra rejoindre. Continuer ?';

    Alert.alert('Démarrer la tontine', preview, [
      {text: 'Annuler', style: 'cancel'},
      {
        text: 'Démarrer',
        style: 'default',
        onPress: async () => {
          try {
            setBusy(true);
            const res = await tontineApi.startTontine(tontineId);
            await load();
            Alert.alert(
              'Tontine démarrée',
              res?.fraisTotal
                ? `La tontine est active. Frais d'activation dus : ${formatFcfa(BigInt(res.fraisTotal))} au total. Chaque membre règle sa part une fois.`
                : 'La tontine est maintenant active.',
            );
          } catch (e: any) {
            Alert.alert('Erreur', e?.message ?? "Impossible de démarrer la tontine.");
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const endTontine = () => {
    Alert.alert(
      'Clôturer la tontine',
      'Cette action est définitive et clôt tous les tours en cours. Continuer ?',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Clôturer',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusy(true);
              await tontineApi.endTontine(tontineId);
              await load();
              Alert.alert('Tontine clôturée', 'La tontine est terminée.');
            } catch (e: any) {
              Alert.alert('Erreur', e?.message ?? "Impossible de clôturer la tontine.");
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const removeMember = (member: any) => {
    const name = member.user?.fullName ?? 'ce membre';
    Alert.alert(
      'Retirer le membre',
      `Voulez-vous retirer ${name} de la tontine ?`,
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusy(true);
              await tontineApi.removeMember(tontineId, member.userId);
              await load();
              Alert.alert('Membre retiré', `${name} a été retiré de la tontine.`);
            } catch (e: any) {
              Alert.alert('Erreur', e?.message ?? 'Impossible de retirer le membre.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  if (isLoading && !currentTontine) {
    return <LoadingSpinner fullScreen text="Chargement..." />;
  }

  if (!t) {
    return (
      <View style={s.container}>
        <ScreenHeader title="Gérer la tontine" onBack={() => navigation.goBack()} />
        <EmptyState
          icon="cog"
          title="Indisponible"
          description="Impossible de charger cette tontine."
        />
      </View>
    );
  }

  const members: any[] = t.members ?? [];

  return (
    <View style={s.container}>
      <ScreenHeader title="Gérer la tontine" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.lg,
          paddingTop: spacing.sm,
        }}
        showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <Animated.View entering={FadeInDown.duration(360)}>
          <Card variant="default" padding={spacing.lg}>
            <View style={s.summaryHead}>
              <Text style={s.summaryName} numberOfLines={2}>
                {t.name}
              </Text>
              <Badge
                variant="soft"
                tone={statusTone(t.status)}
                label={STATUS_LABELS[t.status] ?? t.status}
                size="small"
              />
            </View>

            <View style={s.summaryRow}>
              <View style={s.summaryItem}>
                <View style={[s.summaryIcon, {backgroundColor: colors.brand.emeraldSoft}]}>
                  <UsersIcon size={18} color={colors.brand.emerald} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={s.summaryLabel}>Membres</Text>
                  <Text style={s.summaryValue}>
                    {t.currentMembers}/{t.totalMembers}
                  </Text>
                </View>
              </View>

              <View style={s.summaryItem}>
                <View style={[s.summaryIcon, {backgroundColor: colors.brand.terracottaSoft}]}>
                  <CashIcon size={18} color={colors.brand.terracotta} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={s.summaryLabel}>Contribution</Text>
                  <Text style={s.summaryValue} numberOfLines={1}>
                    {formatCurrency(t.contributionAmount, t.currency)}
                  </Text>
                </View>
              </View>
            </View>

            {t.currentBalance != null && (
              <View style={s.balanceRow}>
                <Text style={s.summaryLabel}>Solde de la caisse</Text>
                <Text style={s.balanceValue}>
                  {formatCurrency(t.currentBalance, t.currency)}
                </Text>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Trust layer quick actions */}
        <Animated.View entering={FadeInDown.delay(40).duration(360)} style={s.section}>
          <Text style={s.sectionTitle}>Confiance & transparence</Text>
          <Button
            title="Tableau de bord organisateur"
            variant="gradient"
            gradient="indigo"
            fullWidth
            size="large"
            icon="view-dashboard"
            onPress={() => navigation.navigate('OrganizerDashboard', {tontineId})}
          />
          <Button
            title="Registre infalsifiable"
            variant="outline"
            fullWidth
            size="large"
            icon="shield-check"
            onPress={() => navigation.navigate('Registre', {tontineId})}
            style={{marginTop: spacing.sm}}
          />
        </Animated.View>

        {/* Lifecycle actions */}
        {(t.status === 'Open' || t.status === 'Active') && (
          <Animated.View entering={FadeInDown.delay(60).duration(360)} style={s.section}>
            <Text style={s.sectionTitle}>Actions</Text>
            {t.status === 'Open' && (
              <Button
                title="Démarrer la tontine"
                variant="gradient"
                gradient="emerald"
                fullWidth
                size="large"
                icon="play-circle"
                loading={busy}
                disabled={busy}
                onPress={startTontine}
              />
            )}
            {t.status === 'Active' && (
              <Button
                title="Clôturer la tontine"
                variant="danger"
                fullWidth
                size="large"
                icon="flag-checkered"
                loading={busy}
                disabled={busy}
                onPress={endTontine}
              />
            )}
          </Animated.View>
        )}

        {/* Members */}
        <Animated.View entering={FadeInDown.delay(120).duration(360)} style={s.section}>
          <View style={s.sectionHeadRow}>
            <Text style={s.sectionTitle}>Membres</Text>
            {members.length > 0 && (
              <Badge variant="count" label={String(members.length)} size="small" />
            )}
          </View>

          {members.length === 0 ? (
            <EmptyState
              icon="account-group"
              title="Aucun membre"
              description="Cette tontine n'a pas encore de membres."
            />
          ) : (
            members.map((m: any, i: number) => {
              const name = m.user?.fullName ?? 'Membre';
              const role = m.role ?? 'Member';
              const score = m.user?.reputationScore;
              const canRemove =
                role !== 'Admin' && (t.status === 'Open' || t.status === 'Active');
              return (
                <Animated.View
                  key={m.id ?? m.userId ?? i}
                  entering={FadeInDown.delay(140 + i * 40).duration(320)}>
                  <PressableScale
                    style={s.memberRow}
                    onPress={() =>
                      navigation.navigate('MemberProfile', {
                        userId: m.userId,
                        tontineId,
                      })
                    }>
                    <Avatar
                      name={name}
                      imageUrl={m.user?.profilePhotoUrl}
                      size="md"
                    />
                    <View style={{flex: 1, marginLeft: spacing.md}}>
                      <Text style={s.memberName} numberOfLines={1}>
                        {name}
                      </Text>
                      <View style={s.memberMeta}>
                        <Badge
                          variant="soft"
                          tone={roleTone(role)}
                          label={ROLE_LABELS[role] ?? role}
                          size="small"
                        />
                        {score != null && (
                          <View style={s.repChip}>
                            <StarIcon size={12} color={colors.brand.gold} filled />
                            <Text style={s.repText}>{score}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {canRemove ? (
                      <PressableScale
                        style={s.removeBtn}
                        onPress={() => removeMember(m)}
                        hitSlop={8}>
                        <TrashIcon size={18} color={colors.error} />
                      </PressableScale>
                    ) : (
                      <ChevronRightIcon size={20} color={colors.text.tertiary} />
                    )}
                  </PressableScale>
                </Animated.View>
              );
            })
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg.base},
    summaryHead: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    summaryName: {...typography.h2, color: colors.text.primary, flex: 1},
    summaryRow: {flexDirection: 'row', gap: spacing.md},
    summaryItem: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
    summaryIcon: {
      width: 36,
      height: 36,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryLabel: {...typography.caption, color: colors.text.secondary},
    summaryValue: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700'},
    balanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    balanceValue: {...typography.h3, color: colors.brand.emerald, fontWeight: '800'},
    section: {marginTop: spacing.xl},
    sectionHeadRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    sectionTitle: {...typography.h3, color: colors.text.primary, fontWeight: '700', marginBottom: spacing.md},
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.sm,
      shadowColor: colors.shadowColor,
    },
    memberName: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700'},
    memberMeta: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4},
    repChip: {flexDirection: 'row', alignItems: 'center', gap: 3},
    repText: {...typography.small, color: colors.text.secondary, fontWeight: '700'},
    removeBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.error + '14',
    },
  });

export default ManageTontineScreen;
