import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { BrandHeader, Button, Card, Screen, TextField, type TextInputRef } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { fontSize, spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+$/;

export default function LoginScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { login, error: apiErrorKey, fieldErrors: apiFieldErrors } = useAuth();

  const passwordRef = useRef<TextInputRef>(null);

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
    <Screen contentContainerStyle={styles.screenContent}>
      {/* Top Bar: Brand Header + Transit Emblem (matches Home header layout) */}
      <View style={styles.topHeader}>
        <BrandHeader />
        <View
          style={[
            styles.emblemCircle,
            { backgroundColor: theme.accentSoft },
          ]}
        >
          <Ionicons name="subway-outline" size={22} color={theme.primary} />
        </View>
      </View>

      {/* Hero Greeting */}
      <View style={styles.heroSection}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {t('auth.welcomeBack')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t('auth.loginSubtitle')}
        </Text>
      </View>

      {/* Elevated Form Card (matches Home & Profile card depth) */}
      <Card style={styles.formCard} contentStyle={styles.formCardContent}>
        <TextField
          label={t('auth.email')}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            clearFieldError('email');
          }}
          placeholder={t('auth.emailPlaceholder')}
          leadingIcon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          accessibilityLabel={t('auth.email')}
          error={emailError}
        />

        <TextField
          label={t('auth.password')}
          inputRef={passwordRef}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            clearFieldError('password');
          }}
          placeholder={t('auth.passwordPlaceholder')}
          leadingIcon="lock-closed-outline"
          autoComplete="current-password"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          secureTextEntry
          accessibilityLabel={t('auth.password')}
          error={passwordError}
        />

        {mainError ? (
          <View
            style={[
              styles.formErrorBanner,
              {
                backgroundColor: theme.errorSoft,
                borderRadius: theme.radius.input,
              },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={theme.error}
              style={styles.errorIcon}
            />
            <Text
              style={[styles.formError, { color: theme.error }]}
              accessibilityLabel={mainError}
            >
              {mainError}
            </Text>
          </View>
        ) : null}

        <Button
          disabled={submitting}
          loading={submitting}
          onPress={handleSubmit}
          style={styles.submitButton}
        >
          {t('auth.login')}
        </Button>
      </Card>

      {/* Account Switch Footer */}
      <View style={styles.footerSection}>
        <Text style={[styles.footerPrompt, { color: theme.textSecondary }]}>
          {t('auth.noAccount')}
        </Text>
        <Link href="/register" asChild>
          <Button
            variant="secondary"
            accessibilityLabel={t('auth.createAccount')}
            style={styles.switchButton}
          >
            {t('auth.createAccount')}
          </Button>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  emblemCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.display,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.body,
    lineHeight: 22,
  },
  formCard: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  formCardContent: {
    padding: spacing.lg,
  },
  formErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  errorIcon: {
    marginEnd: spacing.sm,
  },
  formError: {
    flex: 1,
    fontSize: fontSize.caption,
    fontWeight: '500',
  },
  submitButton: {
    width: '100%',
    marginTop: spacing.xs,
  },
  footerSection: {
    width: '100%',
    alignItems: 'center',
  },
  footerPrompt: {
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  switchButton: {
    width: '100%',
  },
});
