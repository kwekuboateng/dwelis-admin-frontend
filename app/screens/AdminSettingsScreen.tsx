import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { api, useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

export const AdminSettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, roles, logout, refreshUser, refreshAuth } = useAuth();
  const [acting, setActing] = useState(false);
  const isAdmin = !!user && (user.role?.startsWith('admin') || (roles && roles.includes('admin')));

  const apiBase =
    (api.defaults.baseURL as string | undefined)?.replace(/\/$/, '') || 'https://api.dwelis.com';

  const refreshSession = useCallback(async () => {
    setActing(true);
    try {
      const ok = await refreshAuth();
      if (ok) await refreshUser();
      Alert.alert(
        ok ? 'Session refreshed' : 'Refresh failed',
        ok
          ? 'Your admin session is up to date.'
          : 'Could not refresh right now. Check your connection, or sign in again if this keeps happening.',
      );
    } catch {
      Alert.alert('Refresh failed', 'Please sign in again.');
    } finally {
      setActing(false);
    }
  }, [refreshAuth, refreshUser]);

  const signOut = useCallback(async () => {
    const confirm =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.confirm('Sign out of the admin console?')
        : await new Promise<boolean>((resolve) => {
            Alert.alert('Sign out', 'Sign out of the admin console?', [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Sign out', style: 'destructive', onPress: () => resolve(true) },
            ]);
          });
    if (!confirm) return;
    setActing(true);
    try {
      await logout();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } finally {
      setActing(false);
    }
  }, [logout, navigation]);

  if (!isAdmin) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>Admin access required</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
      ]}
    >
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Account and session controls for this admin console.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Signed in as</Text>
        <Text style={styles.value}>{user?.fullName?.trim() || 'Admin'}</Text>
        <Text style={styles.meta}>{user?.email || user?.phoneNumber || user?.id}</Text>
        <Text style={styles.meta}>Role: {user?.role || 'admin'}</Text>
        {user?.emailVerified != null ? (
          <Text style={styles.meta}>
            Email: {user.emailVerified ? 'Verified' : 'Not verified'}
          </Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>API</Text>
        <Text style={styles.meta}>{apiBase}</Text>
        <Pressable
          style={[styles.btn, styles.btnSecondary, acting && styles.btnDisabled]}
          onPress={() => void refreshSession()}
          disabled={acting}
        >
          {acting ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.btnSecondaryText}>Refresh session</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Session</Text>
        <Pressable
          style={[styles.btn, styles.btnDanger, acting && styles.btnDisabled]}
          onPress={() => void signOut()}
          disabled={acting}
        >
          <Text style={styles.btnDangerText}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  centered: { justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { ...typography.bodySm, color: colors.textSecondary, marginBottom: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: spacing.xs,
  },
  cardTitle: { ...typography.bodySm, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  value: { ...typography.h3, color: colors.textPrimary },
  meta: { ...typography.bodySm, color: colors.textSecondary },
  btn: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: colors.primaryMuted,
  },
  btnSecondaryText: { color: colors.primaryHover, fontWeight: '700' },
  btnDanger: { backgroundColor: 'rgba(193, 53, 21, 0.1)' },
  btnDangerText: { color: colors.error, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
