import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import {
  Avatar,
  Badge,
  Button,
  Card,
  ListRow,
  Screen,
  Skeleton,
  TextField,
} from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { fontSize, spacing } from '@/constants/theme';
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [localFieldErrors, setLocalFieldErrors] = useState<Record<string, string>>({});

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

    const trimmed = editFullName.trim();
    if (!trimmed) {
      setFieldError('fullName', t('validation.required'));
      return;
    }
    if (trimmed.length < 2) {
      setFieldError('fullName', t('validation.fullNameTooShort'));
      return;
    }
    if (trimmed.length > 100) {
      setFieldError('fullName', t('validation.fullNameTooLong'));
      return;
    }

    setSubmitting(true);
    try {
      await updateProfile(trimmed);
      setSaveStatus('success');
      setIsEditingName(false);
    } catch {
      setSaveStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
        {t('profile.title')}
      </Text>

      {/* Loading Skeleton State */}
      {isLoading ? (
        <View style={styles.contentGroup}>
          <Card style={styles.headerCard} contentStyle={styles.headerCardContent}>
            <Skeleton width={72} height={72} borderRadius={36} />
            <Skeleton width={180} height={24} style={styles.skeletonMargin} />
            <Skeleton width={220} height={16} style={styles.skeletonMarginSmall} />
            <Skeleton width={100} height={28} borderRadius={14} style={styles.skeletonMargin} />
          </Card>
          <Card style={styles.settingsCard} contentStyle={styles.cardPadding}>
            <Skeleton width="100%" height={48} style={styles.skeletonMarginSmall} />
            <Skeleton width="100%" height={48} />
          </Card>
        </View>
      ) : !user ? (
        /* Error fallback state */
        <Card style={styles.headerCard} contentStyle={styles.headerCardContent}>
          <Text style={[styles.errorSubdued, { color: theme.textSecondary }]}>
            {t('errors.somethingWentWrong')}
          </Text>
        </Card>
      ) : (
        /* Authenticated Profile Content */
        <View style={styles.contentGroup}>
          {/* Header Card: Initials Avatar, Name, Email, Role, Member Since */}
          <Card style={styles.headerCard} contentStyle={styles.headerCardContent}>
            <Avatar name={user.fullName ?? user.email} size={72} />

            <Text style={[styles.nameText, { color: theme.textPrimary }]}>
              {user.fullName || t('profile.fullName')}
            </Text>

            <Text style={[styles.emailText, { color: theme.textSecondary }]}>
              {user.email}
            </Text>

            <View style={styles.badgeRow}>
              <Badge label={roleLabel} variant="accent" size="sm" />
            </View>

            {memberSince ? (
              <Text style={[styles.memberSinceText, { color: theme.textSecondary }]}>
                {t('profile.memberSince')}: {memberSince}
              </Text>
            ) : null}
          </Card>

          {/* Settings Section: Edit name, Language, Logout */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {t('profile.settings')}
            </Text>

            <Card style={styles.settingsCard} contentStyle={styles.cardPadding}>
              {/* Row 1: Edit Name */}
              <ListRow
                title={t('profile.editName')}
                subtitle={user.fullName}
                leading={
                  <Ionicons name="person-outline" size={20} color={theme.primary} />
                }
                onPress={() => {
                  setIsEditingName((prev) => !prev);
                  setEditFullName(user.fullName ?? '');
                  setSaveStatus(null);
                }}
              />

              {/* Inline Edit Name Form Drawer */}
              {isEditingName ? (
                <View
                  style={[
                    styles.editDrawer,
                    {
                      borderTopColor: theme.surfaceAlt,
                      backgroundColor: theme.surface,
                    },
                  ]}
                >
                  <TextField
                    label={t('profile.editFullName')}
                    value={editFullName}
                    onChangeText={(text) => {
                      setEditFullName(text);
                      clearFieldError('fullName');
                    }}
                    placeholder={t('auth.fullNamePlaceholder')}
                    error={localFieldErrors.fullName}
                    autoCapitalize="words"
                    accessibilityLabel={t('profile.editFullName')}
                  />

                  {saveStatus === 'error' ? (
                    <Text
                      style={[styles.statusError, { color: theme.error }]}
                      accessibilityLabel={t('errors.somethingWentWrong')}
                    >
                      {t('errors.somethingWentWrong')}
                    </Text>
                  ) : null}

                  <View style={styles.editActionsRow}>
                    <Button
                      variant="ghost"
                      onPress={() => {
                        setIsEditingName(false);
                        setEditFullName(user.fullName ?? '');
                        setLocalFieldErrors({});
                      }}
                      style={styles.cancelBtn}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      loading={submitting}
                      disabled={submitting}
                      onPress={handleSave}
                      style={styles.saveBtn}
                    >
                      {t('common.save')}
                    </Button>
                  </View>
                </View>
              ) : null}

              {saveStatus === 'success' && !isEditingName ? (
                <View style={styles.statusSuccessWrapper}>
                  <Text style={[styles.statusSuccess, { color: theme.success }]}>
                    {t('profile.updateSuccess')}
                  </Text>
                </View>
              ) : null}

              <View style={[styles.rowDivider, { backgroundColor: theme.surfaceAlt }]} />

              {/* Row 2: Language (Disabled) */}
              <ListRow
                title={t('profile.language')}
                leading={
                  <Ionicons name="globe-outline" size={20} color={theme.primary} />
                }
                trailing={
                  <Badge
                    label={t('profile.languageEnglish')}
                    variant="neutral"
                    size="sm"
                  />
                }
                disabled
              />
            </Card>
          </View>

          {/* Account Actions: Logout */}
          <View style={styles.section}>
            <Card style={styles.settingsCard} contentStyle={styles.cardPadding}>
              <ListRow
                title={t('profile.logoutDestructive')}
                leading={
                  <Ionicons name="log-out-outline" size={20} color={theme.error} />
                }
                destructive
                onPress={logout}
                accessibilityLabel={t('common.logout')}
              />
            </Card>
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    fontSize: fontSize.display,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginBottom: spacing.lg,
  },
  contentGroup: {
    width: '100%',
  },
  headerCard: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  headerCardContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  nameText: {
    fontSize: fontSize.title,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emailText: {
    fontSize: fontSize.body,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  badgeRow: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  memberSinceText: {
    fontSize: fontSize.caption,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.label,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsCard: {
    width: '100%',
  },
  cardPadding: {
    paddingVertical: spacing.xs,
    paddingHorizontal: 0,
  },
  rowDivider: {
    height: 1,
    marginHorizontal: spacing.md,
  },
  editDrawer: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  editActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cancelBtn: {
    height: 48,
    paddingHorizontal: spacing.md,
  },
  saveBtn: {
    height: 48,
    minWidth: 100,
  },
  statusError: {
    fontSize: fontSize.caption,
    marginBottom: spacing.sm,
  },
  statusSuccessWrapper: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusSuccess: {
    fontSize: fontSize.caption,
    fontWeight: '600',
  },
  skeletonMargin: {
    marginTop: spacing.md,
  },
  skeletonMarginSmall: {
    marginTop: spacing.xs,
  },
  errorSubdued: {
    fontSize: fontSize.body,
    textAlign: 'center',
  },
});
