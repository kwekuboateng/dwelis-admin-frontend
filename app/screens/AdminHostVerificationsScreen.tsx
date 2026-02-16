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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Icon } from '../components/Icon';
import { api, useAuth } from '../context/AuthContext';
import { PrimaryButton } from '../components/ui';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

type PendingVerification = {
  id: string;
  ghanaCardNumber: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    email?: string;
    fullName?: string;
    phoneNumber?: string;
    role: string;
  };
};

export const AdminHostVerificationsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [list, setList] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  const load = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get<PendingVerification[]>('/admin/host-verifications/pending');
      setList(Array.isArray(res.data) ? res.data : []);
    } catch {
      setList([]);
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

  const approve = async (id: string) => {
    setActingId(id);
    try {
      await api.patch(`/admin/host-verifications/${id}/verify`);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Could not approve host');
    } finally {
      setActingId(null);
    }
  };

  const reject = async (id: string) => {
    Alert.alert(
      'Reject host',
      'Are you sure you want to reject this host verification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActingId(id);
            try {
              await api.patch(`/admin/host-verifications/${id}/reject`);
              await load();
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.message || 'Could not reject');
            } finally {
              setActingId(null);
            }
          },
        },
      ],
    );
  };

  if (!isAdmin) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Icon name="lock-closed" size={48} color={colors.textTertiary} />
        <Text style={styles.emptyText}>Admin access required</Text>
        <Text style={styles.emptySubtext}>
          Only administrators can view and approve host verifications.
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
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Pending host verifications</Text>
          <Text style={styles.subtitle}>
            Approve or reject hosts so they can list properties.
          </Text>
        </View>
        <PrimaryButton
          label="Create admin"
          size="md"
          variant="outline"
          onPress={() => navigation.navigate('AdminSignup')}
        />
      </View>

      {list.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="checkmark-circle-outline" size={56} color={colors.textTertiary} />
          <Text style={styles.emptyText}>No pending verifications</Text>
          <Text style={styles.emptySubtext}>
            New host requests will appear here.
          </Text>
        </View>
      ) : (
        list.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardName}>
                {item.user?.fullName || item.user?.email || 'Unknown'}
              </Text>
              {item.user?.email ? (
                <Text style={styles.cardEmail}>{item.user.email}</Text>
              ) : null}
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Ghana Card</Text>
              <Text style={styles.cardValue}>{item.ghanaCardNumber || '—'}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Submitted</Text>
              <Text style={styles.cardValue}>
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })
                  : '—'}
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => reject(item.id)}
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
                label={actingId === item.id ? '…' : 'Approve'}
                onPress={() => approve(item.id)}
                disabled={actingId !== null && actingId !== item.id}
                loading={actingId === item.id}
                style={styles.approveBtn}
              />
            </View>
          </View>
        ))
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
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
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    marginBottom: spacing.sm,
  },
  cardName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  cardEmail: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardLabel: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  cardValue: {
    ...typography.body,
    color: colors.textPrimary,
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
    minWidth: 100,
  },
});
