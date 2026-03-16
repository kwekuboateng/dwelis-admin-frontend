import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, typography } from '../theme';

export const AdminSettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, roles } = useAuth();
  const isAdmin = !!user && (user.role?.startsWith('admin') || (roles && roles.includes('admin')));

  if (!isAdmin) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>Admin access required</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.lg }]}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Admin settings placeholder</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySm, color: colors.textSecondary },
  emptyText: { ...typography.body, color: colors.textSecondary },
});
