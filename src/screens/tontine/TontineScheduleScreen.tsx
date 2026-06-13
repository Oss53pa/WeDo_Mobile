/**
 * TontineScheduleScreen — "qui touche quoi, et quand".
 * Three views of the rotation: Agenda (liste datée), Gantt (frise par membre),
 * Kanban (Passés / En cours / À venir). Projectable avant activation.
 */
import React, {useMemo, useState} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import {ScreenHeader, SegmentedControl, Card, EmptyState} from '@components/common';
import {Icon} from '@components/common';
import {useTheme, useThemedStyles, typography, spacing, borderRadius, type ThemedTokens} from '@theme';
import {RootState} from '@store/store';
import {buildSchedule, type ScheduleRound} from '@utils/tontineSchedule';

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const fmtDate = (d: Date | null): string =>
  d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : '—';
const fmtMoney = (n: number, cur: string) => `${n.toLocaleString('fr-FR')} ${cur}`;

type Mode = 'agenda' | 'gantt' | 'kanban';

const TontineScheduleScreen: React.FC<any> = ({navigation}) => {
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('agenda');
  const t = useSelector((st: RootState) => st.tontine.currentTontine);

  const cur = t?.currency ?? 'XOF';
  const schedule = useMemo(() => {
    if (!t) return [];
    return buildSchedule({
      members: (t.members ?? []).map(m => ({
        userId: m.userId,
        name: m.user?.fullName ?? (m as any).fullName ?? 'Membre',
        receptionOrder: m.receptionOrder,
        nbTetes: (m as any).nbTetes ?? 1,
      })),
      contributionAmount: t.contributionAmount,
      frequency: t.frequency,
      startDate: t.startDate,
      beneficiairesParTour: (t as any).beneficiairesParTour ?? 1,
      currentRound: (t as any).currentRound ?? 0,
      status: t.status,
    });
  }, [t]);

  const statusColor = (st: ScheduleRound['status']) =>
    st === 'past' ? colors.text.tertiary : st === 'current' ? colors.accent.main : colors.brand.emerald;
  const statusLabel = (st: ScheduleRound['status']) =>
    st === 'past' ? 'Passé' : st === 'current' ? 'En cours' : 'À venir';

  return (
    <View style={s.container}>
      <ScreenHeader title="Calendrier des tours" onBack={() => navigation.goBack()} />

      <View style={s.controlWrap}>
        <SegmentedControl<Mode>
          options={[
            {label: 'Agenda', value: 'agenda'},
            {label: 'Gantt', value: 'gantt'},
            {label: 'Kanban', value: 'kanban'},
          ]}
          value={mode}
          onChange={setMode}
        />
      </View>

      {schedule.length === 0 ? (
        <EmptyState
          icon="calendar-blank"
          title="Pas encore de calendrier"
          description="Ajoutez des membres : le calendrier des tours s'affiche dès qu'il y a au moins un participant."
        />
      ) : mode === 'agenda' ? (
        <ScrollView contentContainerStyle={[s.content, {paddingBottom: insets.bottom + spacing.xl}]}>
          <Text style={s.caption}>
            {schedule.length} tour{schedule.length > 1 ? 's' : ''} · qui reçoit, quand, et combien
          </Text>
          {schedule.map(r => (
            <Card key={r.round} variant="default" padding={spacing.md} style={[s.card, r.status === 'current' && s.cardCurrent]}>
              <View style={s.rowHead}>
                <View style={[s.roundChip, {backgroundColor: statusColor(r.status) + '22'}]}>
                  <Text style={[s.roundChipTxt, {color: statusColor(r.status)}]}>Tour {r.round}</Text>
                </View>
                <Text style={s.date}>{fmtDate(r.date)}</Text>
                <View style={[s.statusDot, {backgroundColor: statusColor(r.status)}]} />
                <Text style={[s.statusTxt, {color: statusColor(r.status)}]}>{statusLabel(r.status)}</Text>
              </View>
              {r.beneficiaries.map(b => (
                <View key={b.userId} style={s.benRow}>
                  <Icon name="hand-coin" size={16} color={colors.brand.gold} />
                  <Text style={s.benName} numberOfLines={1}>
                    {b.name}{b.tetes > 1 ? `  ×${b.tetes} têtes` : ''}
                  </Text>
                  <Text style={s.benAmount}>{fmtMoney(b.amount, cur)}</Text>
                </View>
              ))}
            </Card>
          ))}
        </ScrollView>
      ) : mode === 'gantt' ? (
        <ScrollView contentContainerStyle={[s.content, {paddingBottom: insets.bottom + spacing.xl}]}>
          <Text style={s.caption}>Frise : chaque ligne = un membre, chaque colonne = un tour</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={s.ganttHeadRow}>
                <View style={s.ganttNameCol}><Text style={s.ganttHeadTxt}>Membre</Text></View>
                {schedule.map(r => (
                  <View key={r.round} style={s.ganttCell}>
                    <Text style={[s.ganttHeadTxt, r.status === 'current' && {color: colors.accent.main}]}>T{r.round}</Text>
                  </View>
                ))}
              </View>
              {ganttRows(schedule).map(row => (
                <View key={row.userId} style={s.ganttRow}>
                  <View style={s.ganttNameCol}><Text style={s.ganttName} numberOfLines={1}>{row.name}</Text></View>
                  {schedule.map(r => {
                    const hit = row.rounds[r.round];
                    return (
                      <View key={r.round} style={s.ganttCell}>
                        {hit ? (
                          <View style={[s.ganttBar, {backgroundColor: statusColor(r.status)}]}>
                            <Text style={s.ganttBarTxt}>{hit > 1 ? `×${hit}` : '●'}</Text>
                          </View>
                        ) : (
                          <View style={s.ganttEmpty} />
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={[s.content, {paddingBottom: insets.bottom + spacing.xl}]}>
          {(['current', 'upcoming', 'past'] as const).map(col => {
            const items = schedule.filter(r => r.status === col);
            if (items.length === 0) return null;
            return (
              <View key={col} style={s.kanbanCol}>
                <View style={s.kanbanHead}>
                  <View style={[s.statusDot, {backgroundColor: statusColor(col)}]} />
                  <Text style={s.kanbanTitle}>
                    {col === 'current' ? 'En cours' : col === 'upcoming' ? 'À venir' : 'Passés'} ({items.length})
                  </Text>
                </View>
                {items.map(r => (
                  <Card key={r.round} variant="default" padding={spacing.md} style={s.kanbanCard}>
                    <Text style={s.kanbanRound}>Tour {r.round} · {fmtDate(r.date)}</Text>
                    {r.beneficiaries.map(b => (
                      <Text key={b.userId} style={s.kanbanBen} numberOfLines={1}>
                        • {b.name}{b.tetes > 1 ? ` ×${b.tetes}` : ''} — {fmtMoney(b.amount, cur)}
                      </Text>
                    ))}
                  </Card>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

// For the Gantt: per member, which rounds they receive (round → têtes count).
const ganttRows = (schedule: ScheduleRound[]) => {
  const map = new Map<string, {userId: string; name: string; rounds: Record<number, number>}>();
  schedule.forEach(r =>
    r.beneficiaries.forEach(b => {
      if (!map.has(b.userId)) map.set(b.userId, {userId: b.userId, name: b.name, rounds: {}});
      map.get(b.userId)!.rounds[r.round] = b.tetes;
    }),
  );
  return [...map.values()];
};

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg.base},
    controlWrap: {paddingHorizontal: spacing.lg, paddingVertical: spacing.md},
    content: {paddingHorizontal: spacing.lg},
    caption: {...typography.caption, color: colors.text.secondary, marginBottom: spacing.md},
    card: {marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border.subtle, borderRadius: borderRadius.xl},
    cardCurrent: {borderColor: colors.accent.main, borderWidth: 2},
    rowHead: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm},
    roundChip: {paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm},
    roundChipTxt: {...typography.captionMedium, fontWeight: '800'},
    date: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700', flex: 1},
    statusDot: {width: 8, height: 8, borderRadius: 4},
    statusTxt: {...typography.caption, fontWeight: '700'},
    benRow: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5},
    benName: {...typography.body, color: colors.text.primary, flex: 1},
    benAmount: {...typography.bodyMedium, color: colors.brand.gold, fontWeight: '800'},
    // Gantt
    ganttHeadRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 6},
    ganttRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 6},
    ganttNameCol: {width: 110, paddingRight: spacing.sm},
    ganttHeadTxt: {...typography.caption, color: colors.text.secondary, fontWeight: '700', textAlign: 'center'},
    ganttName: {...typography.caption, color: colors.text.primary, fontWeight: '600'},
    ganttCell: {width: 40, alignItems: 'center', justifyContent: 'center'},
    ganttBar: {width: 30, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center'},
    ganttBarTxt: {...typography.caption, color: '#FFFFFF', fontWeight: '800', fontSize: 11},
    ganttEmpty: {width: 30, height: 3, borderRadius: 2, backgroundColor: colors.border.subtle},
    // Kanban
    kanbanCol: {marginBottom: spacing.lg},
    kanbanHead: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm},
    kanbanTitle: {...typography.h3, color: colors.text.primary, fontWeight: '800'},
    kanbanCard: {marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border.subtle, borderRadius: borderRadius.lg},
    kanbanRound: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700', marginBottom: 4},
    kanbanBen: {...typography.caption, color: colors.text.secondary, paddingVertical: 1},
  });

export default TontineScheduleScreen;
