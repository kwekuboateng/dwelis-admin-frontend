import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Icon } from '../components/Icon';
import { api, useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

type DashboardMetrics = {
  totalGmv: number;
  totalPlatformRevenue: number;
  activeHosts: number;
  activeListings: number;
  monthlyBookings: number;
  cancellationRate: number;
  topCities: { city: string; count: number }[];
};

export const AdminDashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, roles } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = !!user && (user.role?.startsWith('admin') || (roles && roles.includes('admin')));

  const load = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get<DashboardMetrics>('/admin/dashboard');
      setMetrics(res.data);
    } catch {
      setMetrics(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) load();
    else setLoading(false);
  }, [isAdmin, load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const links = [
    { name: 'Users', route: 'AdminUsers', icon: 'people' as const },
    { name: 'Listings', route: 'AdminListings', icon: 'home' as const },
    { name: 'Guest Favorites', route: 'AdminGuestFavorites', icon: 'heart' as const },
    { name: 'Pending listings', route: 'AdminListingsPending', icon: 'home' as const },
    { name: 'Host verifications', route: 'AdminHostVerifications', icon: 'checkmark-circle' as const },
    { name: 'Listing transfers', route: 'AdminListingTransfers', icon: 'swap' as const },
    { name: 'Bookings', route: 'AdminBookings', icon: 'calendar' as const },
    { name: 'Operations tasks', route: 'AdminOperationsTasks', icon: 'checkmark-circle' as const },
    { name: 'Finance', route: 'AdminFinance', icon: 'cash' as const },
    { name: 'Reports', route: 'AdminReports', icon: 'flag' as const },
    { name: 'Audit logs', route: 'AdminAuditLogs', icon: 'eye' as const },
    { name: 'Settings', route: 'AdminSettings', icon: 'settings' as const },
  ];

  if (loading && !metrics) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {!isAdmin && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Admin access required for data. You can still open the pages below.</Text>
        </View>
      )}
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Overview and quick links</Text>

      {/* Links first so they are visible without scrolling */}
      <View style={styles.linksSection}>
        <Text style={styles.linksTitle}>Manage</Text>
        {links.map((link) => (
          <Pressable
            key={link.route}
            style={({ pressed }) => [styles.linkCard, pressed && styles.linkCardPressed]}
            onPress={() => navigation.navigate(link.route)}
            accessibilityRole="button"
            accessibilityLabel={`Go to ${link.name}`}
          >
            <Icon name={link.icon} size={24} color={colors.primary} />
            <Text style={styles.linkLabel}>{link.name}</Text>
            <Icon name="chevron-forward" size={20} color={colors.textTertiary} />
          </Pressable>
        ))}
      </View>

      {metrics ? (
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total GMV</Text>
            <Text style={styles.metricValue}>GHS {metrics.totalGmv.toLocaleString()}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Platform revenue</Text>
            <Text style={styles.metricValue}>GHS {metrics.totalPlatformRevenue.toLocaleString()}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Active hosts</Text>
            <Text style={styles.metricValue}>{metrics.activeHosts}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Active listings</Text>
            <Text style={styles.metricValue}>{metrics.activeListings}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Bookings (month)</Text>
            <Text style={styles.metricValue}>{metrics.monthlyBookings}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Cancellation rate</Text>
            <Text style={styles.metricValue}>{(metrics.cancellationRate * 100).toFixed(1)}%</Text>
          </View>
        </View>
      ) : !isAdmin ? (
        <Text style={styles.muted}>Log in with an admin account to see metrics.</Text>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.textSecondary },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySm, color: colors.textSecondary, marginBottom: spacing.lg },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  metricCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minWidth: 140,
    flex: 1,
    ...shadows.sm,
  },
  metricLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  metricValue: { ...typography.h3, color: colors.textPrimary },
  linksSection: { marginBottom: spacing.xl },
  linksTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadows.sm,
      },
  linkCardPressed: { opacity: 0.8 },
  linkLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
  banner: { backgroundColor: colors.primaryMuted, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md },
  bannerText: { ...typography.bodySm, color: colors.textPrimary },
  muted: { ...typography.body, color: colors.textTertiary, marginTop: spacing.md },
  emptyText: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.md },
});
