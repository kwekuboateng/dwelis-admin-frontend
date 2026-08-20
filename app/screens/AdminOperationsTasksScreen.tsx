import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, useAuth } from '../context/AuthContext';
import { colors, spacing, typography, shadows } from '../theme';

type AdminTaskItem = {
  id: string;
  title: string;
  category: string;
  status: string;
  listing?: { id: string; title: string } | null;
  host?: { id: string; fullName?: string | null; email?: string | null } | null;
};

type ListResponse = {
  items: AdminTaskItem[];
  total: number;
  page: number;
  limit: number;
};

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
];

function categoryLabel(c: string): string {
  return c.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export const AdminOperationsTasksScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, roles } = useAuth();
  const [list, setList] = useState<AdminTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const isAdmin = !!user && (user.role?.startsWith('admin') || (roles && roles.includes('admin')));

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const params: Record<string, string | number> = { page: 1, limit: 100 };
      if (debouncedQ) params.q = debouncedQ;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<ListResponse>('/admin/operations/tasks', { params });
      setList(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, debouncedQ, statusFilter]);

  useEffect(() => {
    if (isAdmin) {
      setLoading(true);
      load();
    } else {
      setLoading(false);
    }
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
      <Text style={styles.title}>Operations tasks</Text>
      <Text style={styles.subtitle}>All host operational tasks across the platform</Text>

      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder="Search title, listing, or host..."
        placeholderTextColor={colors.textTertiary}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {STATUS_FILTERS.map((f) => {
          const on = statusFilter === f.value;
          return (
            <Pressable
              key={f.value || 'all'}
              style={[styles.filterChip, on && styles.filterChipOn]}
              onPress={() => setStatusFilter(f.value)}
            >
              <Text style={[styles.filterChipText, on && styles.filterChipTextOn]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading && list.length === 0 ? (
        <Text style={styles.muted}>Loading...</Text>
      ) : list.length === 0 ? (
        <Text style={styles.muted}>No tasks found</Text>
      ) : (
        list.map((t) => (
          <View key={t.id} style={styles.card}>
            <Text style={styles.cardTitle}>{t.title}</Text>
            <Text style={styles.cardMeta}>
              {categoryLabel(t.category)} · {t.status.replace(/_/g, ' ')}
            </Text>
            <Text style={styles.cardMeta}>Listing: {t.listing?.title || '—'}</Text>
            <Text style={styles.cardMeta}>
              Host: {t.host?.fullName || t.host?.email || '—'}
            </Text>
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
  search: {
    ...typography.body,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  filters: { gap: spacing.xs, marginBottom: spacing.lg },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipOn: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  filterChipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  filterChipTextOn: { color: colors.primary },
  muted: { ...typography.body, color: colors.textTertiary },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cardTitle: { ...typography.h3, color: colors.textPrimary },
  cardMeta: { ...typography.bodySm, color: colors.textSecondary, marginTop: 4 },
  emptyText: { ...typography.body, color: colors.textSecondary },
});

export default AdminOperationsTasksScreen;
