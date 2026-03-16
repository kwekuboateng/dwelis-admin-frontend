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

type BookingItem = {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  totalPrice: string;
  guest?: { fullName?: string; email?: string };
  listing?: { title?: string };
};

export const AdminBookingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, roles } = useAuth();
  const [list, setList] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const isAdmin = !!user && (user.role?.startsWith('admin') || (roles && roles.includes('admin')));

  const load = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get<BookingItem[]>('/admin/bookings');
      setList(Array.isArray(res.data) ? res.data : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  const adminCancel = async (id: string) => {
    const reason = getReason('Reason for cancellation?', 'Cancelled by admin');
    setActingId(id);
    try {
      await api.post(`/admin/bookings/${id}/cancel`, { reason });
      await load();
    } catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Could not cancel'); } finally { setActingId(null); }
  };

  const canCancel = (b: BookingItem) => b.status === 'pending_payment' || b.status === 'confirmed';

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
      <Text style={styles.title}>Bookings</Text>
      <Text style={styles.subtitle}>All reservations</Text>
      {loading && list.length === 0 ? <Text style={styles.muted}>Loading...</Text> : list.length === 0 ? <Text style={styles.muted}>No bookings</Text> : list.map((b) => (
        <View key={b.id} style={styles.card}>
          <Text style={styles.cardTitle}>{b.listing?.title || '-'}</Text>
          <Text style={styles.cardMeta}>{b.checkInDate} to {b.checkOutDate} - {b.status}</Text>
          <Text style={styles.cardMeta}>Guest: {b.guest?.email || b.guest?.fullName || '-'}</Text>
          <Text style={styles.cardPrice}>GHS {b.totalPrice}</Text>
          {canCancel(b) && (
            <TouchableOpacity style={styles.cancelBtn} onPress={() => adminCancel(b.id)} disabled={actingId !== null}>
              <Text style={styles.cancelBtnText}>Cancel (admin)</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
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
  cardTitle: { ...typography.h3, color: colors.textPrimary },
  cardMeta: { ...typography.bodySm, color: colors.textSecondary, marginTop: 4 },
  cardPrice: { ...typography.label, color: colors.primary, marginTop: 4 },
  cancelBtn: { marginTop: spacing.sm, paddingVertical: spacing.xs }, cancelBtnText: { ...typography.caption, color: colors.error },
  emptyText: { ...typography.body, color: colors.textSecondary },
});
