import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

import { useTheme } from '@/hooks/use-theme';
import { fontSize, radius, spacing } from '@/constants/theme';

export type TextFieldProps = {
  label: string;
  helper?: string;
  error?: string;
  secureTextEntry?: boolean;
} & Omit<TextInputProps, 'value' | 'onChangeText' | 'secureTextEntry'> & {
  value: string;
  onChangeText: (text: string) => void;
};

/**
 * Modern labeled text input: label above, helper/error text below, 48px high,
 * rounded container with focus state, error state with red border.
 * Optional secure-text show/hide eye toggle with translated accessibility label.
 */
export function TextField({
  label,
  helper,
  error,
  value,
  onChangeText,
  secureTextEntry = false,
  ...rest
}: TextFieldProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const hasError = !!error;
  const borderColor = hasError
    ? theme.error
    : focused
      ? theme.primary
      : theme.border;
  const toggleLabel = isSecure ? t('auth.showPassword') : t('auth.hidePassword');

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.textPrimary }]}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          {...rest}
          accessibilityRole="text"
          autoCorrect={false}
          blurOnSubmit={false}
          onBlur={() => setFocused(false)}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          secureTextEntry={isSecure}
          style={[
            styles.input,
            {
              borderColor,
              backgroundColor: theme.surfaceAlt,
              color: theme.textPrimary,
              paddingEnd: secureTextEntry ? 46 : 14,
              ...(focused && !hasError && { borderWidth: 1.5, borderColor: theme.primary }),
            },
          ]}
          value={value}
        />
        {secureTextEntry && (
          <EyeToggle
            onPress={() => setIsSecure((current) => !current)}
            accessibilityLabel={toggleLabel}
            isSecure={isSecure}
          />
        )}
      </View>
      {hasError ? (
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
      ) : helper ? (
        <Text style={[styles.helperText, { color: theme.textSecondary }]}>{helper}</Text>
      ) : null}
    </View>
  );
}

function EyeToggle({
  onPress,
  accessibilityLabel,
  isSecure,
}: {
  onPress: () => void;
  accessibilityLabel: string;
  isSecure: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.eyeToggle,
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Ionicons
        name={isSecure ? 'eye-off-outline' : 'eye-outline'}
        size={22}
        color={theme.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: 600,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    position: 'relative',
    height: 48,
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    height: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: radius.sm,
    textAlignVertical: 'center',
  },
  eyeToggle: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
