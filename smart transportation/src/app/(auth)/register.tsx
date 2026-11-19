import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Link } from 'expo-router';

import { Button, Screen, TextField, Wordmark } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

import { useAuth } from '@/context/auth-context';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+$/;

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

  const mainError = apiErrorKey ? (t(apiErrorKey as any) as string) : null;
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

  return (
    <Screen>
      <Wordmark />
      <View style={styles.headerSpacer} />
      <Text style={[styles.title, { color: theme.textPrimary }]}>{t('auth.registerTitle')}</Text>

      <TextField
        label={t('auth.fullName')}
        value={fullName}
        onChangeText={(text) => {
          setFullName(text);
          clearFieldError('fullName');
        }}
        placeholder={t('auth.fullNamePlaceholder')}
        autoCapitalize="words"
        autoComplete="name"
        autoCorrect={false}
        blurOnSubmit={false}
        returnKeyType="next"
        accessibilityLabel={t('auth.fullName')}
        error={fullNameError}
      />

      <TextField
        label={t('auth.email')}
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          clearFieldError('email');
        }}
        placeholder={t('auth.emailPlaceholder')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        blurOnSubmit={false}
        returnKeyType="next"
        accessibilityLabel={t('auth.email')}
        error={emailError}
      />

      <TextField
        label={t('auth.password')}
        helper={t('validation.passwordTooShort')}
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          clearFieldError('password');
        }}
        placeholder={t('auth.passwordPlaceholder')}
        autoComplete="new-password"
        autoCorrect={false}
        blurOnSubmit={false}
        returnKeyType="next"
        secureTextEntry
        accessibilityLabel={t('auth.password')}
        error={passwordError}
      />

      <TextField
        label={t('auth.confirmPassword')}
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          clearFieldError('confirmPassword');
        }}
        placeholder={t('auth.confirmPasswordPlaceholder')}
        autoComplete="new-password"
        autoCorrect={false}
        blurOnSubmit={false}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
        secureTextEntry
        accessibilityLabel={t('auth.confirmPassword')}
        error={confirmPasswordError}
      />

      {mainError && (
        <Text style={[styles.formError, { color: theme.error }]} accessibilityLabel={mainError}>
          {mainError}
        </Text>
      )}

      <Button disabled={submitting} onPress={handleSubmit} style={styles.button}>
        {submitting ? t('common.loading') : t('auth.register')}
      </Button>

      <Link href="/login" asChild style={styles.linkContainer}>
        <Button variant="ghost" style={styles.secondaryButton}>
          {t('auth.alreadyRegistered')} {t('auth.login')}
        </Button>
      </Link>

      <Text style={[styles.legalLine, { color: theme.textSecondary }]}>
        {t('auth.legalLine')}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerSpacer: {
    height: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 600,
    marginBottom: 24,
  },
  formError: {
    fontSize: 12,
    marginBottom: 20,
    marginTop: 8,
  },
  button: {
    width: '100%',
    marginTop: 8,
  },
  secondaryButton: {
    width: '100%',
    marginTop: 12,
  },
  linkContainer: {
    marginTop: 20,
  },
  legalLine: {
    fontSize: 12,
    marginTop: 24,
    lineHeight: 16,
    textAlign: 'center',
  },
});
