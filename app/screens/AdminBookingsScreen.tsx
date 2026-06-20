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
  paymentMethod?: string | null;
  paymentVerificationStatus?: string | null;
  paymentProofUrl?: string | null;
  paymentReference?: string | null;
  guest?: { fullName?: string; email?: string };
  listing?: { title?: string };
};

function showError(message: string) {
  if (typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(message);
    return;
  }
  Alert.alert('Error', message);
}

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
    } catch (e: any) { showError(e.response?.data?.message || 'Could not cancel'); } finally { setActingId(null); }
  };

  const adminRevertCancellation = async (id: string) => {
    const note = getReason('Optional note for audit log?', 'Restored after mistaken cancellation');
    let restoreAs: string | undefined;
    if (typeof window !== 'undefined' && typeof (window as any).prompt === 'function') {
      const picked = (window as any).prompt(
        'Restore as status (leave blank to auto-detect): confirmed | pending_payment | pending_payment_verification',
        'confirmed',
      );
      if (picked === null) return;
      const normalized = picked.trim().toLowerCase();
      if (normalized) restoreAs = normalized;
    }
    setActingId(id);
    try {
      await api.post(`/admin/bookings/${id}/revert-cancellation`, {
        note,
        ...(restoreAs ? { restoreAs } : {}),
      });
      await load();
    } catch (e: any) {
      const message =
        e.response?.data?.message ||
        (Array.isArray(e.response?.data?.message)
          ? e.response.data.message.join(', ')
          : null) ||
        'Could not restore booking';
      showError(message);
    } finally {
      setActingId(null);
    }
  };

  const canRevertCancellation = (b: BookingItem) =>
    b.status === 'cancelled_by_admin';

  const canCancel = (b: BookingItem) =>
    b.status === 'pending_payment' ||
    b.status === 'confirmed' ||
    b.status === 'pending_payment_verification';

  const canVerifyPayment = (b: BookingItem) =>
    b.status === 'pending_payment_verification' && b.paymentVerificationStatus === 'submitted';

  const approvePayment = async (id: string) => {
    setActingId(id);
    try {
      await api.post(`/admin/bookings/${id}/approve-payment`);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Could not approve payment');
    } finally {
      setActingId(null);
    }
  };

  const rejectPayment = async (id: string) => {
    const reason = getReason('Reason for rejection (optional)?', 'Payment could not be verified');
    setActingId(id);
    try {
      await api.post(`/admin/bookings/${id}/reject-payment`, { reason });
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Could not reject payment');
    } finally {
      setActingId(null);
    }
  };

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
          {b.paymentMethod === 'bank_transfer' && (
            <Text style={styles.cardMeta}>
              Bank transfer · {b.paymentVerificationStatus ?? 'pending'}
              {b.paymentReference ? ` · ref ${b.paymentReference}` : ''}
            </Text>
          )}
          {b.paymentProofUrl ? (
            <Text style={styles.proofLink} onPress={() => {
              if (typeof window !== 'undefined') window.open(b.paymentProofUrl!, '_blank');
            }}>
              View payment proof
            </Text>
          ) : null}
          {canVerifyPayment(b) && (
            <View style={styles.verifyRow}>
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => approvePayment(b.id)}
                disabled={actingId !== null}
              >
                <Text style={styles.approveBtnText}>Approve payment</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => rejectPayment(b.id)}
                disabled={actingId !== null}
              >
                <Text style={styles.rejectBtnText}>Reject payment</Text>
              </TouchableOpacity>
            </View>
          )}
          {canCancel(b) && (
            <TouchableOpacity style={styles.cancelBtn} onPress={() => adminCancel(b.id)} disabled={actingId !== null}>
              <Text style={styles.cancelBtnText}>Cancel (admin)</Text>
            </TouchableOpacity>
          )}
          {canRevertCancellation(b) && (
            <TouchableOpacity
              style={styles.restoreBtn}
              onPress={() => adminRevertCancellation(b.id)}
              disabled={actingId !== null}
            >
              <Text style={styles.restoreBtnText}>Restore booking</Text>
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
  verifyRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  approveBtn: { flex: 1, backgroundColor: colors.primary, paddingVertical: spacing.xs, borderRadius: 8, alignItems: 'center' },
  approveBtnText: { ...typography.caption, color: colors.white, fontWeight: '600' },
  rejectBtn: { flex: 1, borderWidth: 1, borderColor: colors.error, paddingVertical: spacing.xs, borderRadius: 8, alignItems: 'center' },
  rejectBtnText: { ...typography.caption, color: colors.error, fontWeight: '600' },
  proofLink: { ...typography.caption, color: colors.primary, marginTop: 4, textDecorationLine: 'underline' },
  cancelBtn: { marginTop: spacing.sm, paddingVertical: spacing.xs }, cancelBtnText: { ...typography.caption, color: colors.error },
  restoreBtn: { marginTop: spacing.xs, paddingVertical: spacing.xs },
  restoreBtnText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  emptyText: { ...typography.body, color: colors.textSecondary },
});
