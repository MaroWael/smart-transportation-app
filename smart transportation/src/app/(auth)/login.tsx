import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Link } from 'expo-router';

import { BrandHeader, Button, Screen, TextField } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { fontSize, spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+$/;

export default function LoginScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { login, error: apiErrorKey, fieldErrors: apiFieldErrors } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localFieldErrors, setLocalFieldErrors] = useState<Record<string, string>>({});

  const mainError = apiErrorKey ? (t(apiErrorKey as any) as string) : null;
  const emailError = localFieldErrors.email ?? apiFieldErrors?.email?.[0];
  const passwordError = localFieldErrors.password ?? apiFieldErrors?.password?.[0];

  const clearFieldError = (field: string) => {
    setLocalFieldErrors((prev) => {
      if (!prev[field]) return prev;
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
    if (!valid) return;

    setSubmitting(true);
    try {
      await login(email, password);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <BrandHeader style={styles.brandHeader} />
      <View style={styles.headerSpacer} />

      <Text style={[styles.title, { color: theme.textPrimary }]}>
        {t('auth.welcomeBack')}
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {t('auth.loginSubtitle')}
      </Text>

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
        autoComplete="current-password"
        autoCorrect={false}
        blurOnSubmit={false}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        secureTextEntry
        accessibilityLabel={t('auth.password')}
        error={passwordError}
      />

      {mainError && (
        <View style={styles.formErrorContainer}>
          <Text
            style={[styles.formError, { color: theme.error }]}
            accessibilityLabel={mainError}
          >
            {mainError}
          </Text>
        </View>
      )}

      <Button
        disabled={submitting}
        loading={submitting}
        onPress={handleSubmit}
        style={styles.button}
      >
        {t('auth.login')}
      </Button>

      <Link href="/register" asChild style={styles.linkContainer}>
        <Button variant="ghost" style={styles.secondaryButton}>
          {t('auth.noAccount')} {t('auth.createAccount')}
        </Button>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandHeader: {
    marginBottom: spacing.xs,
  },
  headerSpacer: {
    height: spacing.md,
  },
  title: {
    fontSize: fontSize.display,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.body,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  formErrorContainer: {
    marginBottom: spacing.md,
  },
  formError: {
    fontSize: fontSize.caption,
  },
  button: {
    width: '100%',
    marginTop: spacing.xs,
  },
  secondaryButton: {
    width: '100%',
    marginTop: spacing.sm,
  },
  linkContainer: {
    marginTop: spacing.md,
  },
});
