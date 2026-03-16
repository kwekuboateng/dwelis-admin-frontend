import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

type UserItem = { id: string; email?: string; fullName?: string; role: string; isSuspended: boolean; kycStatus: string; isVerified: boolean; createdAt: string };

function getReason(title: string, defaultReason: string): string {
  if (typeof window !== 'undefined' && typeof (window as any).prompt === 'function') {
    const r = (window as any).prompt(title, defaultReason);
    return (r != null && r.trim()) ? r.trim() : defaultReason;
  }
  return defaultReason;
}

export const AdminUsersScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, roles } = useAuth();
  const [data, setData] = useState<{ items: UserItem[]; total: number }>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);
  const isAdmin = !!user && (user.role?.startsWith('admin') || (roles && roles.includes('admin')));

  const load = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const params: Record<string, string> = { limit: '50' };
      if (q.trim()) params.q = q.trim();
      const res = await api.get<{ items: UserItem[]; total: number }>('/admin/users', { params });
      setData(res.data || { items: [], total: 0 });
    } catch { setData({ items: [], total: 0 }); } finally { setLoading(false); setRefreshing(false); }
  }, [isAdmin, q]);

  useEffect(() => { if (isAdmin) load(); else setLoading(false); }, [isAdmin, load]);

  const suspend = async (id: string) => {
    const reason = getReason('Reason for suspension?', 'Violation of policy');
    setActingId(id);
    try {
      await api.patch(`/admin/users/${id}/suspend`, { reason });
      await load();
    } catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Could not suspend'); } finally { setActingId(null); }
  };

  const unsuspend = async (id: string) => {
    setActingId(id);
    try {
      await api.patch(`/admin/users/${id}/unsuspend`);
      await load();
    } catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Could not unsuspend'); } finally { setActingId(null); }
  };

  const setKyc = async (id: string, kycStatus: string) => {
    setActingId(id);
    try {
      await api.patch(`/admin/users/${id}/kyc`, { kycStatus });
      await load();
    } catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Could not update KYC'); } finally { setActingId(null); }
  };

  const setVerified = async (id: string, isVerified: boolean) => {
    setActingId(id);
    try {
      await api.patch(`/admin/users/${id}/verified`, { isVerified });
      await load();
    } catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Could not update'); } finally { setActingId(null); }
  };

  if (!isAdmin) return (<View style={[styles.container, styles.centered, { paddingTop: insets.top }]}><Text style={styles.emptyText}>Admin access required</Text></View>);

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
      <Text style={styles.title}>Users</Text>
      <TextInput style={styles.search} placeholder="Search by email, name, phone" value={q} onChangeText={setQ} onSubmitEditing={load} />
      {loading && data.items.length === 0 ? <Text style={styles.muted}>Loading...</Text> : (
        <>
          <Text style={styles.subtitle}>{data.total} user(s)</Text>
          {data.items.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardName}>{item.fullName || item.email || item.id}</Text>
              {item.email ? <Text style={styles.cardEmail}>{item.email}</Text> : null}
              <View style={styles.row}><Text style={styles.label}>Role</Text><Text style={styles.value}>{item.role}</Text></View>
              <View style={styles.row}><Text style={styles.label}>KYC</Text><Text style={styles.value}>{item.kycStatus}</Text></View>
              {item.isSuspended ? <Text style={styles.suspended}>Suspended</Text> : null}
              <View style={styles.actions}>
                {item.isSuspended ? (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => unsuspend(item.id)} disabled={actingId !== null}><Text style={styles.actionText}>Unsuspend</Text></TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.actionBtn, styles.dangerBtn]} onPress={() => suspend(item.id)} disabled={actingId !== null}><Text style={styles.dangerText}>Suspend</Text></TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionBtn} onPress={() => setKyc(item.id, 'approved')} disabled={actingId !== null}><Text style={styles.actionText}>KYC Approve</Text></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setKyc(item.id, 'rejected')} disabled={actingId !== null}><Text style={styles.actionText}>KYC Reject</Text></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setVerified(item.id, !item.isVerified)} disabled={actingId !== null}><Text style={styles.actionText}>{item.isVerified ? 'Unverify' : 'Verify'}</Text></TouchableOpacity>
              </View>
              {actingId === item.id && <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: spacing.lg }, centered: { justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.sm }, search: { ...typography.body, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  subtitle: { ...typography.bodySm, color: colors.textSecondary, marginBottom: spacing.md }, muted: { ...typography.body, color: colors.textTertiary },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm }, cardName: { ...typography.h3, color: colors.textPrimary }, cardEmail: { ...typography.bodySm, color: colors.textSecondary },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }, label: { ...typography.caption, color: colors.textSecondary }, value: { ...typography.bodySm, color: colors.textPrimary }, suspended: { ...typography.caption, color: colors.error, marginTop: 4 }, emptyText: { ...typography.body, color: colors.textSecondary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm }, actionBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, backgroundColor: colors.primaryMuted, borderRadius: borderRadius.sm }, actionText: { ...typography.caption, color: colors.primary }, dangerBtn: { backgroundColor: 'rgba(193,53,21,0.1)' }, dangerText: { ...typography.caption, color: colors.error }, loader: { marginTop: spacing.xs },
});
