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

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

import { useAuth } from '@/context/auth-context';

const ROLE_LABELS: Record<string, string> = {
  PASSENGER: 'profile.rolePassenger',
  STATION_EMPLOYEE: 'profile.roleStationEmployee',
  ADMIN: 'profile.roleAdmin',
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user, logout, updateProfile, status } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error' | null>(
    null
  );
  const [editFullName, setEditFullName] = useState(user?.fullName ?? '');
  const [localFieldErrors, setLocalFieldErrors] = useState<Record<string, string>>(
    {}
  );

  const isLoading = status === 'loading';

  const roleKey = user?.role ? ROLE_LABELS[user.role] : null;
  const roleLabel = (roleKey ? t(roleKey as any) : t('profile.role')) as string;

  const memberSince = user?.createdAt
    ? new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(user.createdAt))
    : null;

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

  const handleSave = async () => {
    setLocalFieldErrors({});
    setSaveStatus(null);

    if (!editFullName) {
      setFieldError('fullName', t('validation.required'));
      return;
    }
    if (editFullName.length < 2) {
      setFieldError('fullName', t('validation.fullNameTooShort'));
      return;
    }
    if (editFullName.length > 100) {
      setFieldError('fullName', t('validation.fullNameTooLong'));
      return;
    }

    setSubmitting(true);
    try {
      await updateProfile(editFullName);
      setSaveStatus('success');
    } catch {
      setSaveStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    backgroundColor: theme.surfaceAlt,
    color: theme.textPrimary,
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
              <ThemedText type="title" style={styles.title} accessibilityLabel={t('profile.title')}>
                {t('profile.title')}
              </ThemedText>

              {isLoading && (
                <ThemedText type="small" style={styles.subdued} accessibilityLabel={t('common.loading')}>
                  {t('common.loading')}
                </ThemedText>
              )}

              {!user && !isLoading ? (
                <ThemedText type="small" style={styles.subdued} accessibilityLabel={t('errors.somethingWentWrong')}>
                  {t('errors.somethingWentWrong')}
                </ThemedText>
              ) : (
                <>
                  <ThemedText
                    type="smallBold"
                    style={[styles.label, styles.marginTop]}
                    accessibilityLabel={t('profile.fullName')}
                  >
                    {t('profile.fullName')}
                  </ThemedText>
                  <TextInput
                    accessibilityLabel={t('profile.fullName')}
                    accessibilityRole="text"
                    autoCapitalize="words"
                    autoCorrect={false}
                    blurOnSubmit={false}
                    value={editFullName}
                    onChangeText={(text) => {
                      setEditFullName(text);
                      clearFieldError('fullName');
                    }}
                    style={[styles.input, inputStyle]}
                  />
                  {localFieldErrors.fullName && (
                    <ThemedText
                      type="small"
                      style={styles.fieldError}
                      accessibilityLabel={localFieldErrors.fullName}
                    >
                      {localFieldErrors.fullName}
                    </ThemedText>
                  )}

                  <ThemedText
                    type="smallBold"
                    style={[styles.label, styles.marginTop]}
                    accessibilityLabel={t('profile.email')}
                  >
                    {t('profile.email')}
                  </ThemedText>
                  <ThemedText type="default" style={styles.value} accessibilityLabel={user?.email ?? ''}>
                    {user?.email ?? ''}
                  </ThemedText>

                  <ThemedText
                    type="smallBold"
                    style={[styles.label, styles.marginTop]}
                    accessibilityLabel={t('profile.role')}
                  >
                    {t('profile.role')}
                  </ThemedText>
                  <ThemedText type="default" style={styles.value} accessibilityLabel={roleLabel}>
                    {roleLabel}
                  </ThemedText>

                  <ThemedText
                    type="smallBold"
                    style={[styles.label, styles.marginTop]}
                    accessibilityLabel={t('profile.memberSince')}
                  >
                    {t('profile.memberSince')}
                  </ThemedText>
                  <ThemedText type="default" style={styles.value} accessibilityLabel={memberSince ?? ''}>
                    {memberSince ?? ''}
                  </ThemedText>

                  {saveStatus === 'success' && (
                    <ThemedText
                      type="small"
                      style={styles.successText}
                      accessibilityLabel={t('profile.updateSuccess')}
                    >
                      {t('profile.updateSuccess')}
                    </ThemedText>
                  )}
                  {saveStatus === 'error' && (
                    <ThemedText
                      type="small"
                      style={styles.errorText}
                      accessibilityLabel={t('errors.somethingWentWrong')}
                    >
                      {t('errors.somethingWentWrong')}
                    </ThemedText>
                  )}

                  <Pressable
                    accessibilityLabel={
                      submitting ? t('common.loading') : t('profile.saveChanges')
                    }
                    accessibilityRole="button"
                    disabled={submitting || saveStatus === 'success'}
                    onPress={handleSave}
                    style={[styles.button, submitting && styles.buttonDisabled]}
                  >
                    <ThemedText type="smallBold" style={styles.buttonText}>
                      {submitting ? t('common.loading') : t('profile.saveChanges')}
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    accessibilityLabel={t('common.logout')}
                    accessibilityRole="button"
                    style={styles.logoutButton}
                    onPress={logout}
                  >
                    <ThemedText type="smallBold" style={styles.logoutText}>
                      {t('common.logout')}
                    </ThemedText>
                  </Pressable>
                </>
              )}
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
  successText: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  value: {
    width: '100%',
    textAlign: 'center',
    marginBottom: 8,
  },
  subdued: {
    textAlign: 'center',
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
  logoutButton: {
    marginTop: 20,
  },
  logoutText: {
    textAlign: 'center',
  },
});
