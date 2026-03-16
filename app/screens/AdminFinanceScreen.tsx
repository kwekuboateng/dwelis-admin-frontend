import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, useAuth } from '../context/AuthContext';
import { colors, spacing, typography, shadows } from '../theme';

type TransactionRow = {
  intent: { id: string; amount: string; status: string };
  amount: number;
  commissionRate: number;
  commission: number;
  hostAmount: number;
};

export const AdminFinanceScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, roles } = useAuth();
  const [data, setData] = useState<{ items: TransactionRow[] }>({ items: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const isAdmin = !!user && (user.role?.startsWith('admin') || (roles && roles.includes('admin')));

  const releasePayout = async (intentId: string) => {
    setActingId(intentId);
    try {
      await api.post(`/admin/finance/payouts/${intentId}/release`);
      await load();
    } catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Could not release'); } finally { setActingId(null); }
  };

  const load = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get<{ items: TransactionRow[] }>('/admin/finance/transactions');
      setData(res.data || { items: [] });
    } catch {
      setData({ items: [] });
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
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={styles.title}>Finance</Text>
      <Text style={styles.subtitle}>Transactions and commission</Text>
      {loading && data.items.length === 0 ? (
        <Text style={styles.muted}>Loading...</Text>
      ) : data.items.length === 0 ? (
        <Text style={styles.muted}>No transactions</Text>
      ) : (
        data.items.slice(0, 50).map((row) => (
          <View key={row.intent.id} style={styles.card}>
            <Text style={styles.cardAmount}>GHS {row.amount.toFixed(2)}</Text>
            <Text style={styles.cardMeta}>
              Commission: GHS {row.commission.toFixed(2)} ({(row.commissionRate * 100).toFixed(0)}%)
            </Text>
            <Text style={styles.cardMeta}>Status: {row.intent.status}</Text>
            <TouchableOpacity style={styles.releaseBtn} onPress={() => releasePayout(row.intent.id)} disabled={actingId !== null}>
              <Text style={styles.releaseBtnText}>Release payout</Text>
            </TouchableOpacity>
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
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cardAmount: { ...typography.h3, color: colors.textPrimary },
  cardMeta: { ...typography.bodySm, color: colors.textSecondary, marginTop: 4 },
  releaseBtn: { marginTop: spacing.sm }, releaseBtnText: { ...typography.caption, color: colors.primary },
  emptyText: { ...typography.body, color: colors.textSecondary },
});
