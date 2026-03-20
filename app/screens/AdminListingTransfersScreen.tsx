import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { api, useAuth } from '../context/AuthContext';
import { PrimaryButton } from '../components/ui';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

type ListingTransferRow = {
  id: string;
  listingId: string;
  status: string;
  toHostEmail: string;
  reason: string | null;
  effectiveDate: string | null;
  createdAt: string;
  listing?: { id: string; title?: string; city?: string };
  fromHost?: { id?: string; fullName?: string; email?: string };
  toHost?: { id?: string; fullName?: string; email?: string } | null;
};

function statusLabel(s: string): string {
  switch (s) {
    case 'pending':
      return 'Pending (invitee)';
    case 'under_review':
      return 'Pending admin approval';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'accepted':
      return 'Accepted';
    default:
      return s.replace(/_/g, ' ');
  }
}

export const AdminListingTransfersScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, roles } = useAuth();
  const [list, setList] = useState<ListingTransferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'under_review' | 'all'>('under_review');
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const isAdmin = !!user && (user.role?.startsWith('admin') || (roles && roles.includes('admin')));

  const load = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const params =
        filter === 'under_review' ? { status: 'under_review' } : undefined;
      const res = await api.get<ListingTransferRow[]>('/transfers/admin/list', { params });
      setList(Array.isArray(res.data) ? res.data : []);
    } catch {
      setList([]);
      setMessage({ text: 'Could not load transfers.', error: true });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, filter]);

  useEffect(() => {
    if (isAdmin) {
      setLoading(true);
      load();
    } else {
      setLoading(false);
    }
  }, [isAdmin, load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const adminRespond = async (id: string, approved: boolean) => {
    setActingId(id);
    setMessage(null);
    try {
      await api.post(`/transfers/${id}/admin-approve`, { approved });
      setMessage({
        text: approved ? 'Transfer approved. Ownership updated.' : 'Transfer rejected.',
        error: false,
      });
      await load();
    } catch (e: any) {
      setMessage({
        text: e.response?.data?.message || e.message || 'Action failed',
        error: true,
      });
    } finally {
      setActingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Icon name="lock-closed" size={48} color={colors.textTertiary} />
        <Text style={styles.emptyText}>Admin access required</Text>
        <Text style={styles.emptySubtext}>
          Only administrators can approve listing transfers.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
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
      <Text style={styles.title}>Listing transfers</Text>
      <Text style={styles.subtitle}>
        When a host accepts a transfer, approve here to move the listing to the new owner.
      </Text>

      {message ? (
        <View
          style={[
            styles.banner,
            message.error ? styles.bannerError : styles.bannerSuccess,
          ]}
        >
          <Text style={styles.bannerText}>{message.text}</Text>
        </View>
      ) : null}

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'under_review' && styles.filterChipActive]}
          onPress={() => setFilter('under_review')}
        >
          <Text
            style={[styles.filterChipText, filter === 'under_review' && styles.filterChipTextActive]}
          >
            Needs approval
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
            All statuses
          </Text>
        </TouchableOpacity>
      </View>

      {list.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="swap" size={56} color={colors.textTertiary} />
          <Text style={styles.emptyText}>
            {filter === 'under_review' ? 'No transfers awaiting approval' : 'No transfers yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {filter === 'under_review'
              ? 'Invited hosts must accept first; then you can approve.'
              : 'Transfers will appear here when hosts initiate them.'}
          </Text>
        </View>
      ) : (
        list.map((item) => {
          const needsAction = item.status === 'under_review';
          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>{statusLabel(item.status)}</Text>
              </View>
              <Text style={styles.listingTitle}>{item.listing?.title ?? 'Listing'}</Text>
              {item.listing?.city ? (
                <Text style={styles.listingCity}>{item.listing.city}</Text>
              ) : null}
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>From</Text>
                <Text style={styles.cardValue} numberOfLines={2}>
                  {item.fromHost?.fullName || item.fromHost?.email || '—'}
                </Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>To (invited)</Text>
                <Text style={styles.cardValue} numberOfLines={2}>
                  {item.toHostEmail}
                </Text>
              </View>
              {item.toHost ? (
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>New host account</Text>
                  <Text style={styles.cardValue} numberOfLines={2}>
                    {item.toHost.fullName || item.toHost.email || item.toHost.id}
                  </Text>
                </View>
              ) : null}
              {item.reason ? (
                <View style={styles.reasonBlock}>
                  <Text style={styles.cardLabel}>Reason</Text>
                  <Text style={styles.reasonText}>{item.reason}</Text>
                </View>
              ) : null}
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Requested</Text>
                <Text style={styles.cardValue}>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : '—'}
                </Text>
              </View>

              {needsAction ? (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => adminRespond(item.id, false)}
                    disabled={actingId === item.id}
                  >
                    {actingId === item.id ? (
                      <ActivityIndicator size="small" color={colors.error} />
                    ) : (
                      <>
                        <Icon name="close" size={18} color={colors.error} />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <PrimaryButton
                    label={actingId === item.id ? '…' : 'Approve transfer'}
                    onPress={() => adminRespond(item.id, true)}
                    disabled={actingId !== null && actingId !== item.id}
                    loading={actingId === item.id}
                    style={styles.approveBtn}
                  />
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  banner: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  bannerSuccess: {
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerError: {
    backgroundColor: 'rgba(193, 53, 21, 0.1)',
    borderWidth: 1,
    borderColor: colors.error,
  },
  bannerText: {
    ...typography.bodySm,
    color: colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.primary,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceSubtle,
    marginBottom: spacing.sm,
  },
  statusPillText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  listingTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  listingCity: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  cardLabel: {
    ...typography.bodySm,
    color: colors.textSecondary,
    width: 120,
    flexShrink: 0,
  },
  cardValue: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  reasonBlock: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  reasonText: {
    ...typography.bodySm,
    color: colors.textPrimary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 90,
  },
  rejectBtn: {
    backgroundColor: 'rgba(193, 53, 21, 0.1)',
    borderWidth: 1,
    borderColor: colors.error,
  },
  rejectBtnText: {
    ...typography.label,
    color: colors.error,
  },
  approveBtn: {
    minWidth: 140,
  },
});
