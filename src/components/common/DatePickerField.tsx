/**
 * DatePickerField — a themed field that opens a lightweight calendar modal.
 * No native dependency; value is an ISO 'YYYY-MM-DD' string.
 */
import React, {useMemo, useState} from 'react';
import {View, Text, Modal, StyleSheet, ViewStyle} from 'react-native';
import {useTheme, useThemedStyles, typography, spacing, borderRadius, type ThemedTokens} from '@theme';
import {CalendarIcon, ChevronLeftIcon, ChevronRightIcon} from '@components/icons';
import {PressableScale} from './PressableScale';
import Button from './Button';

export interface DatePickerFieldProps {
  label?: string;
  value: string; // 'YYYY-MM-DD' or ''
  onChange: (value: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  helperText?: string;
  containerStyle?: ViewStyle;
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};
const formatLong = (s: string): string => {
  const d = parse(s);
  if (!d) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Choisir une date',
  minimumDate,
  helperText,
  containerStyle,
}) => {
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const [open, setOpen] = useState(false);
  const selected = parse(value);
  const [cursor, setCursor] = useState(() => selected ?? new Date());

  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startDow = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const min = minimumDate ? new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate()) : null;
  const isDisabled = (d: Date) => (min ? d < min : false);
  const isSelected = (d: Date) => !!selected && toISO(d) === toISO(selected);

  const pick = (d: Date) => {
    onChange(toISO(d));
    setOpen(false);
  };

  return (
    <View style={[s.container, containerStyle]}>
      {label && <Text style={s.label}>{label}</Text>}
      <PressableScale style={s.field} onPress={() => setOpen(true)} scaleTo={0.98}>
        <CalendarIcon size={20} color={value ? colors.accent.main : colors.text.tertiary} />
        <Text style={[s.value, !value && {color: colors.text.hint}]}>
          {value ? formatLong(value) : placeholder}
        </Text>
      </PressableScale>
      {!!helperText && <Text style={s.helper}>{helperText}</Text>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <PressableScale style={s.backdrop} scaleTo={1} onPress={() => setOpen(false)}>
          <View />
        </PressableScale>
        <View style={s.sheetWrap} pointerEvents="box-none">
          <View style={s.sheet}>
            <View style={s.calHeader}>
              <PressableScale style={s.navBtn} onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
                <ChevronLeftIcon size={20} color={colors.text.primary} />
              </PressableScale>
              <Text style={s.calTitle}>
                {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
              </Text>
              <PressableScale style={s.navBtn} onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
                <ChevronRightIcon size={20} color={colors.text.primary} />
              </PressableScale>
            </View>

            <View style={s.weekRow}>
              {WEEKDAYS.map((w, i) => (
                <Text key={i} style={s.weekday}>
                  {w}
                </Text>
              ))}
            </View>

            <View style={s.daysGrid}>
              {grid.map((d, i) => {
                if (!d) return <View key={i} style={s.dayCell} />;
                const disabled = isDisabled(d);
                const sel = isSelected(d);
                return (
                  <PressableScale
                    key={i}
                    style={s.dayCell}
                    disabled={disabled}
                    onPress={() => pick(d)}
                    scaleTo={0.85}>
                    <View style={[s.dayInner, sel && {backgroundColor: colors.accent.main}]}>
                      <Text
                        style={[
                          s.dayText,
                          sel && {color: colors.accent.contrast, fontWeight: '800'},
                          disabled && {color: colors.text.disabled},
                        ]}>
                        {d.getDate()}
                      </Text>
                    </View>
                  </PressableScale>
                );
              })}
            </View>

            <Button title="Fermer" variant="ghost" onPress={() => setOpen(false)} fullWidth />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {marginBottom: spacing.md},
    label: {...typography.label, color: colors.text.secondary, marginBottom: spacing.xs, fontWeight: '600'},
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderWidth: 1.4,
      borderColor: colors.border.default,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
      minHeight: 54,
      backgroundColor: colors.surface.default,
    },
    value: {...typography.body, color: colors.text.primary, flex: 1},
    helper: {...typography.caption, color: colors.text.tertiary, marginTop: spacing.xs},
    backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay},
    sheetWrap: {flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg},
    sheet: {
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius['2xl'],
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.xl,
      shadowColor: colors.shadowColor,
    },
    calHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md},
    navBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.surface.sunken,
      alignItems: 'center',
      justifyContent: 'center',
    },
    calTitle: {...typography.h3, color: colors.text.primary, fontWeight: '700'},
    weekRow: {flexDirection: 'row', marginBottom: spacing.xs},
    weekday: {flex: 1, textAlign: 'center', ...typography.small, color: colors.text.tertiary, fontWeight: '700'},
    daysGrid: {flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm},
    dayCell: {width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center'},
    dayInner: {width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center'},
    dayText: {...typography.body, color: colors.text.primary},
  });

export default DatePickerField;
