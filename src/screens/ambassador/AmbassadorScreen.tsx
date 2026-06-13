/**
 * AmbassadorScreen (WEDO-AMB-08) — programme Ambassadrices côté app.
 * Onboarding/charte, code + partage WhatsApp, gains du mois + palier + progression,
 * mes filleules, historique des versements. Lecture des données réelles (RLS).
 */
import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Linking, Share, RefreshControl} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Button, Card, Badge, PressableScale, ScreenHeader, EmptyState, LoadingSpinner, Icon, useToast} from '@components/common';
import {useTheme, useThemedStyles, typography, spacing, borderRadius, type ThemedTokens} from '@theme';
import {formatFcfa} from '@utils/money';
import ambassadorApi, {type AmbassadorState} from '@services/api/ambassador.api';

const TIER_LABEL: Record<string, string> = {bronze: 'Bronze', argent: 'Argent', or: 'Or'};
const nextTierInfo = (count: number): {label: string; target: number} | null =>
  count >= 10 ? null : count >= 4 ? {label: 'Or', target: 10} : {label: 'Argent', target: 4};

const SHARE_URL = 'https://wedo.atlas-studio.org';

const AmbassadorScreen: React.FC<any> = ({navigation}) => {
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const {show} = useToast();
  const [state, setState] = useState<AmbassadorState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setState(await ambassadorApi.getAmbassadorState());
    } catch (e: any) {
      show(e?.message ?? 'Impossible de charger le programme.', {type: 'error'});
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => {
    load();
  }, [load]);

  const becomeAmbassador = async () => {
    setBusy(true);
    try {
      await ambassadorApi.acceptCharter();
      const r = await ambassadorApi.generateCode();
      if (!r.success) {
        show(r.error ?? 'Action impossible.', {type: r.need === 'ELIGIBILITY' ? 'info' : 'error'});
      } else {
        show('Bienvenue dans le programme Ambassadrices !', {type: 'success'});
      }
      await load();
    } catch (e: any) {
      show(e?.message ?? 'Erreur.', {type: 'error'});
    } finally {
      setBusy(false);
    }
  };

  const shareCode = async () => {
    if (!state?.code) return;
    const msg =
      `Rejoins-moi sur WeDo, la tontine sécurisée 💛\n` +
      `Utilise mon code *${state.code}* à l'inscription.\n` +
      `Télécharge l'appli : ${SHARE_URL}`;
    const wa = `whatsapp://send?text=${encodeURIComponent(msg)}`;
    try {
      const ok = await Linking.canOpenURL(wa);
      if (ok) await Linking.openURL(wa);
      else await Share.share({message: msg});
    } catch {
      await Share.share({message: msg});
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Chargement…" />;

  const isAmb = state?.isAmbassador && state?.code;
  const next = nextTierInfo(state?.monthCount ?? 0);
  const progress = next ? Math.min(100, ((state?.monthCount ?? 0) / next.target) * 100) : 100;

  return (
    <View style={s.container}>
      <ScreenHeader title="Programme Ambassadrices" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[s.content, {paddingBottom: insets.bottom + spacing.xl}]}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.accent.main} />}>

        {!isAmb ? (
          <Card variant="default" padding={spacing.lg} style={s.card}>
            <Text style={s.heroTitle}>Devenez Ambassadrice 💛</Text>
            <Text style={s.p}>
              Parrainez de nouvelles organisatrices : quand une tontine que vous amenez tourne
              vraiment, vous gagnez <Text style={s.bold}>10 % de ses frais d'activation</Text>,
              payés par mobile money.
            </Text>
            <View style={s.charterBox}>
              <Text style={s.charterTitle}>La charte, en bref</Text>
              <Text style={s.charterLine}>• Pas de fausse tontine, pas d'auto-parrainage.</Text>
              <Text style={s.charterLine}>• Récompense au résultat (tontine qualifiée : ≥8 membres, 1er tour versé).</Text>
              <Text style={s.charterLine}>• Éligible après avoir mené au moins une tontine jusqu'au bout.</Text>
            </View>
            <Button title="Accepter la charte & activer mon code" variant="gradient" fullWidth
              loading={busy} disabled={busy} onPress={becomeAmbassador} style={{marginTop: spacing.md}} />
            {state && !state.charterAccepted && (
              <Text style={s.hint}>En activant, vous acceptez la charte ambassadrice.</Text>
            )}
          </Card>
        ) : (
          <>
            {/* Code + partage */}
            <Card variant="default" padding={spacing.lg} style={s.card}>
              <Text style={s.sectionTitle}>Mon code de parrainage</Text>
              <View style={s.codeBox}>
                <Text style={s.code}>{state!.code}</Text>
              </View>
              <Button title="Partager sur WhatsApp" variant="gradient" gradient="sunset" fullWidth
                icon="whatsapp" onPress={shareCode} style={{marginTop: spacing.md}} />
            </Card>

            {/* Gains du mois + palier */}
            <Card variant="default" padding={spacing.lg} style={s.card}>
              <View style={s.rowBetween}>
                <Text style={s.sectionTitle}>Mes gains du mois</Text>
                {state!.tier && <Badge variant="soft" tone={colors.brand.gold} label={`Palier ${TIER_LABEL[state!.tier]}`} size="small" />}
              </View>
              <Text style={s.gain}>{formatFcfa(BigInt(state!.monthBaseFcfa))}</Text>
              <Text style={s.hint}>{state!.monthCount} tontine{state!.monthCount > 1 ? 's' : ''} qualifiée{state!.monthCount > 1 ? 's' : ''} ce mois</Text>
              {next ? (
                <View style={{marginTop: spacing.md}}>
                  <View style={s.progressTrack}>
                    <View style={[s.progressFill, {width: `${progress}%`}]} />
                  </View>
                  <Text style={s.hint}>
                    Plus que {Math.max(0, next.target - state!.monthCount)} pour atteindre le palier {next.label}.
                  </Text>
                </View>
              ) : (
                <Text style={[s.hint, {marginTop: spacing.sm, color: colors.brand.gold}]}>Palier Or atteint — bonus 25 000 FCFA 🥇</Text>
              )}
            </Card>

            {/* Filleules */}
            <Text style={s.h2}>Mes filleules</Text>
            {state!.filleules.length === 0 ? (
              <EmptyState icon="account-heart" title="Pas encore de filleule" description="Partagez votre code pour commencer." />
            ) : (
              state!.filleules.map(f => (
                <Card key={f.referralId} variant="default" padding={spacing.md} style={s.rowCard}>
                  <Icon name="account" size={20} color={colors.text.secondary} />
                  <Text style={s.rowName} numberOfLines={1}>{f.name}</Text>
                  <Badge variant="soft" size="small"
                    tone={f.qualified ? colors.success : colors.warning}
                    label={f.qualified ? 'Qualifiée' : 'Inscrite'} />
                </Card>
              ))
            )}

            {/* Historique versements */}
            <Text style={s.h2}>Historique des versements</Text>
            {state!.payouts.length === 0 ? (
              <EmptyState icon="cash-multiple" title="Aucun versement" description="Vos gains seront versés chaque mois par mobile money." />
            ) : (
              state!.payouts.map(p => (
                <Card key={p.id} variant="default" padding={spacing.md} style={s.rowCard}>
                  <View style={{flex: 1}}>
                    <Text style={s.rowName}>{formatFcfa(BigInt(p.totalFcfa))}</Text>
                    <Text style={s.hint}>{p.periodMonth?.slice(0, 7)} · {TIER_LABEL[p.tier] ?? p.tier}{p.momoRef ? ` · ${p.momoRef}` : ''}</Text>
                  </View>
                  <Badge variant="soft" size="small"
                    tone={p.status === 'sent' ? colors.success : p.status === 'failed' ? colors.brand.crimson : colors.warning}
                    label={p.status === 'sent' ? 'Envoyé' : p.status === 'failed' ? 'Échec' : 'En attente'} />
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg.base},
    content: {paddingHorizontal: spacing.lg, paddingTop: spacing.sm},
    card: {marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border.subtle, borderRadius: borderRadius.xl},
    heroTitle: {...typography.h2, color: colors.text.primary, fontWeight: '800', marginBottom: spacing.sm},
    sectionTitle: {...typography.h3, color: colors.text.primary, fontWeight: '700'},
    h2: {...typography.h3, color: colors.text.primary, fontWeight: '800', marginTop: spacing.md, marginBottom: spacing.sm},
    p: {...typography.body, color: colors.text.secondary, lineHeight: 22},
    bold: {fontWeight: '800', color: colors.text.primary},
    hint: {...typography.caption, color: colors.text.secondary, marginTop: 4},
    charterBox: {marginTop: spacing.md, backgroundColor: colors.surface.sunken, borderRadius: borderRadius.lg, padding: spacing.md},
    charterTitle: {...typography.captionMedium, color: colors.text.primary, fontWeight: '700', marginBottom: 6},
    charterLine: {...typography.caption, color: colors.text.secondary, lineHeight: 20},
    codeBox: {marginTop: spacing.sm, backgroundColor: colors.accent[50], borderRadius: borderRadius.lg, paddingVertical: spacing.md, alignItems: 'center'},
    code: {...typography.displaySmall, color: colors.accent.main, fontWeight: '800', letterSpacing: 6},
    rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    gain: {...typography.h1, color: colors.text.primary, fontWeight: '800', marginTop: spacing.xs},
    progressTrack: {height: 8, borderRadius: 4, backgroundColor: colors.border.subtle, overflow: 'hidden'},
    progressFill: {height: 8, borderRadius: 4, backgroundColor: colors.brand.gold},
    rowCard: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border.subtle, borderRadius: borderRadius.lg},
    rowName: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700', flex: 1},
  });

export default AmbassadorScreen;
