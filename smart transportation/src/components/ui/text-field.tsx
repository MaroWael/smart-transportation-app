import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

import { useTheme } from '@/hooks/use-theme';
import { fontSize, spacing } from '@/constants/theme';

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
 * 2026 Modern Text Input:
 * - Floating feel with clear label above
 * - Soft surfaceAlt fill, radius 14, 52px tall
 * - 1.5px consistent accent border + focus background lift
 * - Clean vertical centering with zero-padding to eliminate Android line-height shifts
 * - Facebook-style clean vector eye toggle
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
      <View
        style={[
          styles.inputContainer,
          {
            borderRadius: theme.radius.input,
            backgroundColor: focused ? theme.surface : theme.surfaceAlt,
            borderColor,
          },
        ]}
      >
        <TextInput
          {...rest}
          accessibilityRole="text"
          autoCorrect={false}
          onBlur={() => setFocused(false)}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          secureTextEntry={isSecure}
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            {
              color: theme.textPrimary,
              paddingStart: spacing.md,
              paddingEnd: secureTextEntry ? 48 : spacing.md,
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
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    fontSize: fontSize.label,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  inputContainer: {
    position: 'relative',
    height: 52,
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  input: {
    width: '100%',
    height: '100%',
    fontSize: fontSize.body,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  eyeToggle: {
    position: 'absolute',
    end: 14,
    top: 0,
    bottom: 0,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperText: {
    fontSize: fontSize.caption,
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: fontSize.caption,
    marginTop: spacing.xs,
  },
});
