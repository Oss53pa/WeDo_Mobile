/**
 * OTPInput — boxed one-time-code field. A single hidden TextInput captures
 * input while individual boxes render each digit with an active highlight.
 */
import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native';
import {useTheme, useThemedStyles, typography, borderRadius, type ThemedTokens} from '@theme';

export interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  autoFocus = true,
  style,
}) => {
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const digits = value.split('').slice(0, length);
  const focusBox = focused ? digits.length : -1;

  return (
    <Pressable style={[s.row, style]} onPress={() => inputRef.current?.focus()}>
      {Array.from({length}).map((_, i) => {
        const active = i === focusBox;
        const filled = i < digits.length;
        return (
          <View
            key={i}
            style={[
              s.box,
              {
                borderColor: active
                  ? colors.accent.main
                  : filled
                  ? colors.border.strong
                  : colors.border.default,
                backgroundColor: active ? colors.accent.main + '12' : colors.surface.default,
              },
            ]}>
            <Text style={s.digit}>{digits[i] ?? ''}</Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={t => onChange(t.replace(/[^0-9]/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        // OS-level one-time-code autofill (SMS only): iOS shows the code as a
        // one-tap suggestion above the keyboard; Android can fill it via autofill.
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        importantForAutofill="yes"
        style={s.hidden}
        caretHidden
      />
    </Pressable>
  );
};

const makeStyles = ({colors}: ThemedTokens) =>
  StyleSheet.create({
    row: {flexDirection: 'row', justifyContent: 'space-between'},
    box: {
      flex: 1,
      aspectRatio: 0.82,
      maxWidth: 56,
      marginHorizontal: 4,
      borderRadius: borderRadius.lg,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    digit: {...typography.h1, color: colors.text.primary},
    hidden: {position: 'absolute', opacity: 0, width: 1, height: 1},
  });

export default OTPInput;
