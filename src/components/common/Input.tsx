/**
 * Input — themed text field with focus highlight, icons and validation states.
 * API preserved (label, type, error, helperText, leftIcon, rightIcon, ...).
 */
import React, {useState} from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme, typography, borderRadius, spacing, iconSize} from '@theme';

export type InputType = 'text' | 'email' | 'phone' | 'password' | 'number' | 'pin';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  type?: InputType;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  leftIcon?: string;
  leftNode?: React.ReactNode;
  rightIcon?: string;
  onRightIconPress?: () => void;
  required?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
  containerStyle?: ViewStyle;
  testID?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  type = 'text',
  error,
  helperText,
  disabled = false,
  leftIcon,
  leftNode,
  rightIcon,
  onRightIconPress,
  required = false,
  maxLength,
  showCharCount = false,
  containerStyle,
  testID,
  ...textInputProps
}) => {
  const {colors} = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const keyboardType =
    type === 'email' ? 'email-address' : type === 'phone' ? 'phone-pad' : type === 'number' || type === 'pin' ? 'number-pad' : 'default';
  const autoCapitalize = type === 'email' || type === 'password' || type === 'pin' ? 'none' : 'sentences';
  const isSecure = type === 'password' ? !isVisible : type === 'pin' && !isVisible;

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.accent.main
    : colors.border.default;

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {label && (
        <Text style={[styles.label, {color: colors.text.secondary}]}>
          {label}
          {required && <Text style={{color: colors.error}}> *</Text>}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor,
            borderWidth: isFocused ? 1.8 : 1.4,
            backgroundColor: disabled ? colors.surface.sunken : colors.surface.default,
          },
        ]}>
        {leftNode}
        {leftIcon && !leftNode && (
          <Icon name={leftIcon} size={iconSize.md} color={isFocused ? colors.accent.main : colors.text.tertiary} style={styles.leftIcon} />
        )}

        <TextInput
          style={[styles.input, {color: colors.text.primary}]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.hint}
          editable={!disabled}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={isSecure}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...textInputProps}
        />

        {(type === 'password' || type === 'pin') ? (
          <TouchableOpacity onPress={() => setIsVisible(v => !v)} style={styles.iconBtn}>
            <Icon name={isVisible ? 'eye-off' : 'eye'} size={iconSize.md} color={colors.text.tertiary} />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity onPress={onRightIconPress} style={styles.iconBtn} disabled={!onRightIconPress}>
            <Icon name={rightIcon} size={iconSize.md} color={colors.text.tertiary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {(error || helperText || (showCharCount && maxLength)) && (
        <View style={styles.footer}>
          <Text style={[styles.helper, {color: error ? colors.error : colors.text.tertiary}]}>
            {error || helperText || ''}
          </Text>
          {showCharCount && maxLength && (
            <Text style={[styles.count, {color: colors.text.hint}]}>
              {value.length}/{maxLength}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {marginBottom: spacing.md},
  label: {...typography.label, marginBottom: spacing.xs, fontWeight: '600'},
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    minHeight: 54,
  },
  input: {flex: 1, ...typography.body, paddingVertical: spacing.sm},
  leftIcon: {marginRight: spacing.sm},
  iconBtn: {padding: spacing.xs},
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  helper: {...typography.caption, flex: 1},
  count: {...typography.caption, marginLeft: spacing.sm},
});

export default Input;
