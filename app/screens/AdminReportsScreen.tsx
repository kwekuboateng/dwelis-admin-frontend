import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, useAuth } from '../context/AuthContext';
import { colors, spacing, typography, shadows } from '../theme';

function getReason(title: string, defaultReason: string): string {
  if (typeof window !== 'undefined' && typeof (window as any).prompt === 'function') {
    const r = (window as any).prompt(title, defaultReason);
    return (r != null && r.trim()) ? r.trim() : defaultReason;
  }
  return defaultReason;
}

type ReportItem = { id: string; entityType: string; entityId: string; reason: string | null; status: string; createdAt: string; reporter?: { email?: string } };

export const AdminReportsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, roles } = useAuth();
  const [data, setData] = useState<{ items: ReportItem[]; total: number }>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const isAdmin = !!user && (user.role?.startsWith('admin') || (roles && roles.includes('admin')));

  const resolve = async (id: string) => {
    const adminNotes = getReason('Admin notes (optional)?', 'Resolved');
    setActingId(id);
    try {
      await api.patch(`/admin/reports/${id}/resolve`, { adminNotes });
      await load();
    } catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Could not resolve'); } finally { setActingId(null); }
  };

  const suspendUser = async (id: string) => {
    const reason = getReason('Reason for suspension?', 'Suspended from report');
    setActingId(id);
    try {
      await api.post(`/admin/reports/${id}/suspend-user`, { reason });
      await load();
    } catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Could not suspend'); } finally { setActingId(null); }
  };

  const load = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get<{ items: ReportItem[]; total: number }>('/admin/reports');
      setData(res.data || { items: [], total: 0 });
    } catch { setData({ items: [], total: 0 }); } finally { setLoading(false); setRefreshing(false); }
  }, [isAdmin]);

  useEffect(() => { if (isAdmin) load(); else setLoading(false); }, [isAdmin, load]);

  if (!isAdmin) return (<View style={[styles.container, styles.centered, { paddingTop: insets.top }]}><Text style={styles.emptyText}>Admin access required</Text></View>);

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
      <Text style={styles.title}>Reports</Text>
      <Text style={styles.subtitle}>{data.total} report(s)</Text>
      {loading && data.items.length === 0 ? <Text style={styles.muted}>Loading...</Text> : data.items.length === 0 ? <Text style={styles.muted}>No reports</Text> : data.items.map((r) => (
        <View key={r.id} style={styles.card}>
          <Text style={styles.cardType}>{r.entityType} · {r.entityId}</Text>
          {r.reason ? <Text style={styles.cardReason}>{r.reason}</Text> : null}
          <Text style={styles.cardMeta}>Status: {r.status} · {new Date(r.createdAt).toLocaleDateString()}</Text>
          <View style={styles.actions}>
            {r.status === 'pending' && (
              <>
                <TouchableOpacity style={styles.resolveBtn} onPress={() => resolve(r.id)} disabled={actingId !== null}><Text style={styles.resolveBtnText}>Resolve</Text></TouchableOpacity>
                {r.entityType === 'user' && (
                  <TouchableOpacity style={styles.suspendBtn} onPress={() => suspendUser(r.id)} disabled={actingId !== null}><Text style={styles.suspendBtnText}>Suspend user</Text></TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: spacing.lg }, centered: { justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.xs }, subtitle: { ...typography.bodySm, color: colors.textSecondary, marginBottom: spacing.lg }, muted: { ...typography.body, color: colors.textTertiary },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm }, cardType: { ...typography.h3, color: colors.textPrimary }, cardReason: { ...typography.body, color: colors.textSecondary, marginTop: 4 }, cardMeta: { ...typography.caption, color: colors.textTertiary, marginTop: 4 }, emptyText: { ...typography.body, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }, resolveBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm }, resolveBtnText: { ...typography.caption, color: colors.primary }, suspendBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm }, suspendBtnText: { ...typography.caption, color: colors.error },
});
