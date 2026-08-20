import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { api, useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

type AdminListingRow = {
  id: string;
  title: string;
  city: string;
  status: string;
  featured: boolean;
  featuredAt?: string | null;
  host?: { email?: string; fullName?: string };
};

function statusLabel(status: string): string {
  if (status === 'approved') return 'Active';
  return status.replace(/_/g, ' ');
}

export const AdminListingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, roles } = useAuth();
  const [data, setData] = useState<{ items: AdminListingRow[]; total: number }>({
    items: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const isAdmin = !!user && (user.role?.startsWith('admin') || (roles && roles.includes('admin')));

  const load = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get<{ items: AdminListingRow[]; total: number }>('/admin/listings', {
        params: { limit: 100, status: 'approved' },
      });
      setData(res.data ?? { items: [], total: 0 });
    } catch {
      setData({ items: [], total: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) load();
    else setLoading(false);
  }, [isAdmin, load]);

  const applyFeatured = async (item: AdminListingRow, featured: boolean) => {
    setActingId(item.id);
    try {
      await api.patch(`/admin/listings/${item.id}/featured`, { featured });
      await load();
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Could not update featured status';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setActingId(null);
    }
  };

  const toggleFeatured = (item: AdminListingRow) => {
    const next = !item.featured;
    const title = next ? 'Feature this listing?' : 'Remove from Featured?';
    const message = next
      ? 'This listing will appear on the homepage and featured collections.'
      : 'This listing will no longer appear in featured sections.';

    // Alert.alert button callbacks do not run on web — use window.confirm.
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) {
        void applyFeatured(item, next);
      }
      return;
    }

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: next ? 'Feature Listing' : 'Remove',
        onPress: () => {
          void applyFeatured(item, next);
        },
      },
    ]);
  };

  if (!isAdmin) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>Admin access required</Text>
      </View>
    );
  }

  if (loading && data.items.length === 0) {
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
      <Text style={styles.title}>Listings</Text>
      <Text style={styles.subtitle}>Curate featured stays for the homepage</Text>

      {data.items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No active listings</Text>
        </View>
      ) : (
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.colTitle]}>Listing</Text>
            <Text style={[styles.th, styles.colStatus]}>Status</Text>
            <Text style={[styles.th, styles.colFeatured]}>Featured</Text>
          </View>
          {data.items.map((item) => (
            <Pressable
              key={item.id}
              style={styles.row}
              onPress={() => navigation.navigate('AdminListingDetail', { id: item.id })}
            >
              <View style={styles.colTitle}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {item.city} · {item.host?.email || item.host?.fullName || '—'}
                </Text>
              </View>
              <Text style={[styles.colStatus, styles.statusText]}>{statusLabel(item.status)}</Text>
              <TouchableOpacity
                style={styles.colFeatured}
                onPress={(e) => {
                  if (Platform.OS === 'web') {
                    (e as unknown as { stopPropagation?: () => void }).stopPropagation?.();
                  }
                  toggleFeatured(item);
                }}
                disabled={actingId !== null}
              >
                {actingId === item.id ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : item.featured ? (
                  <Text style={styles.featuredOn}>⭐ Featured</Text>
                ) : (
                  <Text style={styles.featuredOff}>—</Text>
                )}
              </TouchableOpacity>
            </Pressable>
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
  th: { ...typography.caption, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  colTitle: { flex: 2, minWidth: 0 },
  colStatus: { flex: 0.7, ...typography.bodySm, color: colors.textSecondary },
  colFeatured: { flex: 0.9, alignItems: 'flex-end' },
  rowTitle: { ...typography.label, fontWeight: '600', color: colors.textPrimary },
  rowMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  statusText: { textTransform: 'capitalize' },
  featuredOn: { ...typography.label, fontWeight: '600', color: colors.textPrimary },
  featuredOff: { ...typography.body, color: colors.textSecondary },
});
