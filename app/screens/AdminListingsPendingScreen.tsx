import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { api, useAuth } from '../context/AuthContext';
import { PrimaryButton } from '../components/ui';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

type PendingListing = { id: string; title: string; city: string; status: string; createdAt: string; host?: { id: string; fullName?: string; email?: string } };

export const AdminListingsPendingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, roles } = useAuth();
  const [list, setList] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isAdmin = !!user && (user.role?.startsWith('admin') || (roles && roles.includes('admin')));

  const load = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get<PendingListing[]>('/admin/listings/pending');
      setList(Array.isArray(res.data) ? res.data : []);
    } catch { setList([]); } finally { setLoading(false); setRefreshing(false); }
  }, [isAdmin]);

  useFocusEffect(
    useCallback(() => {
      if (isAdmin) void load();
      else setLoading(false);
    }, [isAdmin, load]),
  );

  if (!isAdmin) return (<View style={[styles.container, styles.centered, { paddingTop: insets.top }]}><Text style={styles.emptyText}>Admin access required</Text></View>);
  if (loading && list.length === 0) return (<View style={[styles.container, styles.centered, { paddingTop: insets.top }]}><ActivityIndicator size="large" color={colors.primary} /></View>);

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
      <Text style={styles.title}>Pending listings</Text>
      <Text style={styles.subtitle}>Review every listing’s details and photos before deciding.</Text>
      {list.length === 0 ? (<View style={styles.empty}><Text style={styles.emptyText}>No pending listings</Text></View>) : list.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMeta}>{item.city} · {item.host?.email || item.host?.fullName || '—'}</Text>
          <Text style={styles.cardMeta}>Submitted {new Date(item.createdAt).toLocaleDateString()}</Text>
          <View style={styles.actions}>
            <PrimaryButton
              label="Review details"
              onPress={() => navigation.navigate('AdminListingDetail', { id: item.id })}
            />
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: spacing.lg }, centered: { justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.xs }, subtitle: { ...typography.bodySm, color: colors.textSecondary, marginBottom: spacing.lg },
  empty: { paddingVertical: spacing.xxl, alignItems: 'center' }, emptyText: { ...typography.body, color: colors.textSecondary },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadows.sm },
  cardTitle: { ...typography.h3, color: colors.textPrimary }, cardMeta: { ...typography.bodySm, color: colors.textSecondary, marginTop: 4 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
});
