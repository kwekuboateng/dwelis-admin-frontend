import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

type RankingRow = {
  listingId: string;
  title: string;
  city: string;
  status: string;
  confirmedBookings: number;
  completedBookings: number;
  rank: number;
  guestFavorite: boolean;
};

/** Read-only analytics: Guest Favorite rankings from booking performance. */
export const AdminGuestFavoritesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, roles } = useAuth();
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isAdmin = !!user && (user.role?.startsWith('admin') || (roles && roles.includes('admin')));

  const load = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get<RankingRow[]>('/admin/guest-favorites/rankings');
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRows([]);
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

  if (loading && rows.length === 0) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
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
      <Text style={styles.title}>Guest Favorite Rankings</Text>
      <Text style={styles.subtitle}>
        Automatic ranking from confirmed bookings. Top 20% with at least 3 confirmed bookings earn
        Guest Favorite. Read-only — cannot be assigned manually.
      </Text>

      {rows.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No ranking data yet</Text>
        </View>
      ) : (
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.colRank]}>Rank</Text>
            <Text style={[styles.th, styles.colTitle]}>Listing</Text>
            <Text style={[styles.th, styles.colNum]}>Confirmed</Text>
            <Text style={[styles.th, styles.colNum]}>Completed</Text>
            <Text style={[styles.th, styles.colBadge]}>Guest Favorite</Text>
          </View>
          {rows.map((row) => (
            <View key={row.listingId} style={styles.row}>
              <Text style={[styles.colRank, styles.cell]}>{row.rank}</Text>
              <View style={styles.colTitle}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {row.title}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {row.city} · {row.status}
                </Text>
              </View>
              <Text style={[styles.colNum, styles.cell]}>{row.confirmedBookings}</Text>
              <Text style={[styles.colNum, styles.cell]}>{row.completedBookings}</Text>
              <Text style={[styles.colBadge, styles.cell]}>
                {row.guestFavorite ? '♥ Yes' : '—'}
              </Text>
            </View>
          ))}
        </View>
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
  empty: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.textSecondary },
  table: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  th: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  colRank: { width: 48 },
  colTitle: { flex: 2, minWidth: 0 },
  colNum: { width: 88, textAlign: 'right' },
  colBadge: { width: 110, textAlign: 'right' },
  cell: { ...typography.bodySm, color: colors.textPrimary },
  rowTitle: { ...typography.label, fontWeight: '600', color: colors.textPrimary },
  rowMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
