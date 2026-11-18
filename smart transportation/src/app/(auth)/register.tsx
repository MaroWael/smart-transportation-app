import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Link } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

import { useAuth } from '@/context/auth-context';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { register, error: apiErrorKey, fieldErrors: apiFieldErrors } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localFieldErrors, setLocalFieldErrors] = useState<Record<string, string>>({});

  const mainError = apiErrorKey ? t(apiErrorKey) : null;
  const fullNameError = localFieldErrors.fullName ?? apiFieldErrors?.fullName?.[0];
  const emailError = localFieldErrors.email ?? apiFieldErrors?.email?.[0];
  const passwordError = localFieldErrors.password ?? apiFieldErrors?.password?.[0];
  const confirmPasswordError =
    localFieldErrors.confirmPassword ?? apiFieldErrors?.confirmPassword?.[0];

  const clearFieldError = (field: string) => {
    setLocalFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const setFieldError = (field: string, message: string) => {
    setLocalFieldErrors((prev) => ({ ...prev, [field]: message }));
  };

  const handleSubmit = async () => {
    setLocalFieldErrors({});

    let valid = true;
    if (!fullName) {
      setFieldError('fullName', t('validation.required'));
      valid = false;
    } else if (fullName.length < 2) {
      setFieldError('fullName', t('validation.fullNameTooShort'));
      valid = false;
    } else if (fullName.length > 100) {
      setFieldError('fullName', t('validation.fullNameTooLong'));
      valid = false;
    }
    if (!email) {
      setFieldError('email', t('validation.required'));
      valid = false;
    } else if (!EMAIL_REGEX.test(email)) {
      setFieldError('email', t('validation.invalidEmail'));
      valid = false;
    }
    if (!password) {
      setFieldError('password', t('validation.required'));
      valid = false;
    } else if (password.length < 8) {
      setFieldError('password', t('validation.passwordTooShort'));
      valid = false;
    } else if (password.length > 72) {
      setFieldError('password', t('validation.passwordTooLong'));
      valid = false;
    }
    if (!confirmPassword) {
      setFieldError('confirmPassword', t('validation.required'));
      valid = false;
    } else if (password !== confirmPassword) {
      setFieldError('confirmPassword', t('validation.passwordsDoNotMatch'));
      valid = false;
    }
    if (!valid) return;

    setSubmitting(true);
    try {
      await register(fullName, email, password);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    backgroundColor: theme.backgroundElement,
    color: theme.text,
  };
  const buttonStyle = {
    backgroundColor: theme.backgroundSelected,
  };

  return (
    <ThemedView type="background" style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoiding}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedView style={styles.card}>
              <ThemedText
                type="title"
                style={styles.title}
                accessibilityLabel={t('auth.registerTitle')}
              >
                {t('auth.registerTitle')}
              </ThemedText>

              {mainError && (
                <ThemedText
                  type="small"
                  style={styles.errorText}
                  accessibilityLabel={mainError}
                >
                  {mainError}
                </ThemedText>
              )}

              <ThemedText
                type="smallBold"
                style={styles.label}
                accessibilityLabel={t('auth.fullName')}
              >
                {t('auth.fullName')}
              </ThemedText>
              <TextInput
                accessibilityLabel={t('auth.fullNamePlaceholder')}
                accessibilityRole="text"
                autoCapitalize="words"
                autoComplete="name"
                autoCorrect={false}
                blurOnSubmit={false}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  clearFieldError('fullName');
                }}
                returnKeyType="next"
                style={[styles.input, inputStyle]}
              />
              {fullNameError && (
                <ThemedText
                  type="small"
                  style={styles.fieldError}
                  accessibilityLabel={fullNameError}
                >
                  {fullNameError}
                </ThemedText>
              )}

              <ThemedText
                type="smallBold"
                style={[styles.label, styles.marginTop]}
                accessibilityLabel={t('auth.email')}
              >
                {t('auth.email')}
              </ThemedText>
              <TextInput
                accessibilityLabel={t('auth.emailPlaceholder')}
                accessibilityRole="text"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                blurOnSubmit={false}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  clearFieldError('email');
                }}
                keyboardType="email-address"
                returnKeyType="next"
                style={[styles.input, inputStyle]}
              />
              {emailError && (
                <ThemedText
                  type="small"
                  style={styles.fieldError}
                  accessibilityLabel={emailError}
                >
                  {emailError}
                </ThemedText>
              )}

              <ThemedText
                type="smallBold"
                style={[styles.label, styles.marginTop]}
                accessibilityLabel={t('auth.password')}
              >
                {t('auth.password')}
              </ThemedText>
              <TextInput
                accessibilityLabel={t('auth.passwordPlaceholder')}
                accessibilityRole="text"
                autoComplete="new-password"
                autoCorrect={false}
                blurOnSubmit={false}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  clearFieldError('password');
                }}
                returnKeyType="next"
                secureTextEntry
                style={[styles.input, inputStyle]}
              />
              {passwordError && (
                <ThemedText
                  type="small"
                  style={styles.fieldError}
                  accessibilityLabel={passwordError}
                >
                  {passwordError}
                </ThemedText>
              )}

              <ThemedText
                type="smallBold"
                style={[styles.label, styles.marginTop]}
                accessibilityLabel={t('auth.confirmPassword')}
              >
                {t('auth.confirmPassword')}
              </ThemedText>
              <TextInput
                accessibilityLabel={t('auth.confirmPasswordPlaceholder')}
                accessibilityRole="text"
                autoComplete="new-password"
                autoCorrect={false}
                blurOnSubmit={false}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  clearFieldError('confirmPassword');
                }}
                onSubmitEditing={handleSubmit}
                returnKeyType="done"
                secureTextEntry
                style={[styles.input, inputStyle]}
              />
              {confirmPasswordError && (
                <ThemedText
                  type="small"
                  style={styles.fieldError}
                  accessibilityLabel={confirmPasswordError}
                >
                  {confirmPasswordError}
                </ThemedText>
              )}

              <Pressable
                accessibilityLabel={
                  submitting ? t('common.loading') : t('auth.createAccount')
                }
                accessibilityRole="button"
                disabled={submitting}
                onPress={handleSubmit}
                style={[styles.button, buttonStyle, submitting && styles.buttonDisabled]}
              >
                <ThemedText type="smallBold" style={styles.buttonText}>
                  {submitting ? t('common.loading') : t('auth.createAccount')}
                </ThemedText>
              </Pressable>

              <Link href="/login" asChild style={styles.linkContainer}>
                <Pressable accessibilityLabel={t('auth.haveAccount')} accessibilityRole="link">
                  <ThemedText type="small" style={styles.linkText}>
                    {t('auth.haveAccount')} 
                    <ThemedText type="smallBold">{t('auth.signIn')}</ThemedText>
                  </ThemedText>
                </Pressable>
              </Link>
            </ThemedView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    alignItems: 'center',
  },
  title: {
    marginBottom: 32,
    textAlign: 'center',
  },
  label: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  marginTop: {
    marginTop: 24,
  },
  input: {
    width: '100%',
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
    textAlignVertical: 'center',
  },
  fieldError: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  errorText: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  button: {
    width: '100%',
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    textAlign: 'center',
  },
  linkContainer: {
    marginTop: 20,
  },
  linkText: {
    textAlign: 'center',
  },
});
