/**
 * CountryCodePicker — a flag + dial-code button that opens a searchable list of
 * countries. Picking a country sets the dial code (indicatif), so the phone field
 * defaults to the right country code. West/Central Africa first, then others.
 */
import React, {useMemo, useState} from 'react';
import {Modal, View, Text, TextInput, FlatList, StyleSheet} from 'react-native';
import {useTheme, useThemedStyles, typography, spacing, borderRadius, type ThemedTokens} from '@theme';
import {COUNTRY_LIST, findCountryByCode, DEFAULT_COUNTRY_CODE, type CountryInfo} from '@utils/phoneCountry';
import {PressableScale} from './PressableScale';
import {Icon} from './SimpleIcon';

export interface CountryCodePickerProps {
  /** Selected dial code (without "+"). */
  value: string;
  onChange: (code: string) => void;
}

export const CountryCodePicker: React.FC<CountryCodePickerProps> = ({value, onChange}) => {
  const s = useThemedStyles(makeStyles);
  const {colors} = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = findCountryByCode(value) ?? findCountryByCode(DEFAULT_COUNTRY_CODE)!;

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRY_LIST;
    return COUNTRY_LIST.filter(
      c => c.name.toLowerCase().includes(q) || c.code.includes(q.replace('+', '')),
    );
  }, [query]);

  const pick = (c: CountryInfo) => {
    onChange(c.code);
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <PressableScale
        style={s.trigger}
        onPress={() => setOpen(true)}
        accessibilityLabel={`Indicatif ${selected.name}`}>
        <Text style={s.flag}>{selected.flag}</Text>
        <Text style={s.code}>+{selected.code}</Text>
        <Icon name="chevron-down" size={16} color={colors.text.tertiary} />
      </PressableScale>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={s.backdrop}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Choisir le pays</Text>
              <PressableScale onPress={() => setOpen(false)} style={s.closeBtn}>
                <Icon name="close" size={20} color={colors.text.secondary} />
              </PressableScale>
            </View>
            <View style={s.search}>
              <Icon name="magnify" size={18} color={colors.text.tertiary} />
              <TextInput
                style={s.searchInput}
                placeholder="Rechercher un pays ou un indicatif"
                placeholderTextColor={colors.text.tertiary}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
              />
            </View>
            <FlatList
              data={data}
              keyExtractor={c => c.code + c.name}
              keyboardShouldPersistTaps="handled"
              renderItem={({item}) => {
                const active = item.code === value;
                return (
                  <PressableScale style={[s.row, active && s.rowActive]} onPress={() => pick(item)}>
                    <Text style={s.rowFlag}>{item.flag}</Text>
                    <Text style={s.rowName} numberOfLines={1}>{item.name}</Text>
                    <Text style={s.rowCode}>+{item.code}</Text>
                  </PressableScale>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const makeStyles = ({colors}: ThemedTokens) =>
  StyleSheet.create({
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.md,
      height: 52,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border.default,
      backgroundColor: colors.surface.default,
    },
    flag: {fontSize: 20},
    code: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700'},
    backdrop: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)'},
    sheet: {
      maxHeight: '80%',
      backgroundColor: colors.bg.base,
      borderTopLeftRadius: borderRadius['2xl'],
      borderTopRightRadius: borderRadius['2xl'],
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
    },
    sheetTitle: {...typography.h3, color: colors.text.primary, fontWeight: '700'},
    closeBtn: {padding: spacing.xs},
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      height: 46,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surface.sunken,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    searchInput: {flex: 1, ...typography.body, color: colors.text.primary, padding: 0},
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    rowActive: {backgroundColor: colors.accent[50]},
    rowFlag: {fontSize: 22},
    rowName: {...typography.body, color: colors.text.primary, flex: 1},
    rowCode: {...typography.bodyMedium, color: colors.text.secondary, fontWeight: '600'},
  });

export default CountryCodePicker;
