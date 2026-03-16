import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, useAuth } from '../context/AuthContext';
import { colors, spacing, typography, shadows } from '../theme';

type AuditLogItem = {
  id: string;
  actionType: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  admin?: { id: string; email?: string } | null;
};

export const AdminAuditLogsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, roles } = useAuth();
  const [list, setList] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isAdmin = !!user && (user.role?.startsWith('admin') || (roles && roles.includes('admin')));

  const load = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get<AuditLogItem[]>('/admin/audit-logs', { params: { limit: 100 } });
      setList(Array.isArray(res.data) ? res.data : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) load();
    else setLoading(false);
  }, [isAdmin, load]);

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
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>Audit logs</Text>
      <Text style={styles.subtitle}>Recent admin actions</Text>
      {loading && list.length === 0 ? (
        <Text style={styles.muted}>Loading...</Text>
      ) : list.length === 0 ? (
        <Text style={styles.muted}>No audit logs</Text>
      ) : (
        list.map((log) => (
          <View key={log.id} style={styles.card}>
            <Text style={styles.action}>{log.actionType}</Text>
            <Text style={styles.meta}>{log.entityType}{log.entityId ? ` · ${log.entityId}` : ''}</Text>
            <Text style={styles.date}>{new Date(log.createdAt).toLocaleString()}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySm, color: colors.textSecondary, marginBottom: spacing.lg },
  muted: { ...typography.body, color: colors.textTertiary },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
  action: { ...typography.label, color: colors.textPrimary },
  meta: { ...typography.bodySm, color: colors.textSecondary, marginTop: 2 },
  date: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
  emptyText: { ...typography.body, color: colors.textSecondary },
});
