import {
  Tabs,
  TabList,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import React from 'react';
import { Pressable, View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/use-theme';
import { fontSize, spacing } from '@/constants/theme';

export default function AppTabs() {
  const { t } = useTranslation();

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton icon="home-outline" activeIcon="home">
              {t('common.home')}
            </TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton icon="person-outline" activeIcon="person">
              {t('common.profile')}
            </TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  icon?: keyof typeof Ionicons.glyphMap;
  activeIcon?: keyof typeof Ionicons.glyphMap;
};

export const TabButton = React.forwardRef<any, TabButtonProps>(
  ({ children, isFocused, icon, activeIcon, ...props }, ref) => {
    const theme = useTheme();
    const iconName = isFocused && activeIcon ? activeIcon : icon;

    return (
      <Pressable
        ref={ref}
        {...props}
        style={({ pressed }) => [
          styles.tabButton,
          {
            backgroundColor: isFocused ? theme.accentSoft : 'transparent',
            borderRadius: theme.radius.full,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        {iconName ? (
          <Ionicons
            name={iconName}
            size={18}
            color={isFocused ? theme.primary : theme.textSecondary}
            style={styles.tabIcon}
          />
        ) : null}
        <Text
          style={[
            styles.tabText,
            {
              color: isFocused ? theme.primary : theme.textSecondary,
              fontWeight: isFocused ? '600' : '500',
              fontSize: fontSize.sm,
            },
          ]}
        >
          {children}
        </Text>
      </Pressable>
    );
  }
);
TabButton.displayName = 'TabButton';

export function CustomTabList(props: TabListProps) {
  const theme = useTheme();

  return (
    <View style={styles.floatingContainer}>
      <View
        {...props}
        style={[
          styles.pillBar,
          {
            backgroundColor: theme.surface,
            borderRadius: theme.radius.lg,
            ...theme.elevation.floating,
          },
        ]}
      >
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  pillBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
    gap: spacing.xs,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  tabIcon: {
    marginEnd: spacing.xs,
  },
  tabText: {
    letterSpacing: -0.2,
  },
});
