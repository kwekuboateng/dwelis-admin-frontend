import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api, useAuth } from '../context/AuthContext';
import { PrimaryButton } from '../components/ui';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

type ListingPhoto = {
  id: string;
  url: string;
  orderIndex: number;
  isCover: boolean;
};

type AdminListingDetail = {
  id: string;
  title: string;
  internalName?: string | null;
  description: string;
  city: string;
  area: string;
  addressLine: string;
  latitude?: number | null;
  longitude?: number | null;
  pricePerNight: string;
  discountPercent?: number | null;
  maxGuests: number;
  bedroomCount: number;
  bathroomCount: number;
  propertyType: string;
  bookingMode: string;
  minStayNights?: number | null;
  maxStayNights?: number | null;
  weekendPrice?: string | null;
  cleaningFee?: string | null;
  petFee?: string | null;
  extraGuestFee?: string | null;
  securityDeposit?: string | null;
  cancellationPolicy?: string | null;
  checkInTime?: string | null;
  checkInStartTime?: string | null;
  checkInEndTime?: string | null;
  checkOutTime?: string | null;
  houseRules?: string | null;
  propertyHighlights?: string[];
  photos?: ListingPhoto[];
  listingAmenities?: { id: string; amenity?: { id: string; name: string } }[];
  createdAt?: string;
  status: string;
  featured: boolean;
  featuredAt?: string | null;
  host?: { email?: string; fullName?: string };
};

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function humanize(value?: string | null): string {
  if (!value) return '—';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function money(value?: string | number | null): string {
  const amount = Number(value);
  return Number.isFinite(amount) ? `GHS ${amount.toLocaleString()}` : '—';
}

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value ?? '—'}</Text>
  </View>
);

export const AdminListingDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user, roles } = useAuth();
  const listingId = route.params?.id as string;
  const [listing, setListing] = useState<AdminListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [moderating, setModerating] = useState<'approve' | 'reject' | null>(null);
  const isAdmin = !!user && (user.role?.startsWith('admin') || (roles && roles.includes('admin')));

  const load = useCallback(async () => {
    if (!isAdmin || !listingId) return;
    try {
      const res = await api.get<AdminListingDetail>(`/admin/listings/${listingId}`);
      setListing(res.data);
    } catch {
      setListing(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, listingId]);

  useEffect(() => {
    if (isAdmin) load();
    else setLoading(false);
  }, [isAdmin, load]);

  const applyFeatured = async (featured: boolean) => {
    if (!listingId) return;
    setSaving(true);
    try {
      const res = await api.patch<AdminListingDetail>(`/admin/listings/${listingId}/featured`, {
        featured,
      });
      setListing(res.data);
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Could not update featured status';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const onToggleFeatured = (next: boolean) => {
    const title = next ? 'Feature this listing?' : 'Remove from Featured?';
    const message = next
      ? 'This listing will appear on the homepage and featured collections.'
      : 'This listing will no longer appear in featured sections.';

    // Alert.alert button callbacks do not run on web — use window.confirm.
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) {
        void applyFeatured(next);
      }
      return;
    }

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: next ? 'Feature Listing' : 'Remove',
        style: next ? 'default' : 'destructive',
        onPress: () => {
          void applyFeatured(next);
        },
      },
    ]);
  };

  const moderateListing = async (action: 'approve' | 'reject') => {
    if (!listingId || moderating) return;
    setModerating(action);
    try {
      await api.patch(`/admin/listings/${listingId}/${action}`);
      navigation.goBack();
    } catch (e: any) {
      const message =
        e.response?.data?.message ||
        `Could not ${action === 'approve' ? 'approve' : 'reject'} listing`;
      if (Platform.OS === 'web') window.alert(message);
      else Alert.alert('Error', message);
    } finally {
      setModerating(null);
    }
  };

  const confirmModeration = (action: 'approve' | 'reject') => {
    const approving = action === 'approve';
    const title = approving ? 'Approve this listing?' : 'Reject this listing?';
    const message = approving
      ? 'The listing will become visible to guests immediately.'
      : 'The listing will not be visible to guests.';

    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) void moderateListing(action);
      return;
    }

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: approving ? 'Approve' : 'Reject',
        style: approving ? 'default' : 'destructive',
        onPress: () => void moderateListing(action),
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

  if (loading && !listing) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>Listing not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
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
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>LISTING REVIEW</Text>
            <Text style={styles.listingTitle}>{listing.title}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              listing.status === 'approved'
                ? styles.statusApproved
                : listing.status === 'pending_review'
                  ? styles.statusPending
                  : styles.statusRejected,
            ]}
          >
            <Text style={styles.statusText}>{humanize(listing.status)}</Text>
          </View>
        </View>
        <Text style={styles.listingMeta}>
          {listing.addressLine}, {listing.area}, {listing.city}
        </Text>
        <Text style={styles.listingMeta}>
          Host: {listing.host?.email || listing.host?.fullName || '—'}
        </Text>
        <Text style={styles.listingMeta}>Submitted: {formatDate(listing.createdAt)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Photos ({listing.photos?.length ?? 0})</Text>
        {listing.photos?.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoRow}
          >
            {listing.photos.map((photo, index) => (
              <View key={photo.id || `${photo.url}-${index}`} style={styles.photoWrap}>
                <Image source={{ uri: photo.url }} style={styles.photo} resizeMode="cover" />
                {(photo.isCover || index === 0) && (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>Cover</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.warningText}>No listing photos were submitted.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Description</Text>
        <Text style={styles.cardBody}>{listing.description || 'No description provided.'}</Text>
        {listing.internalName ? (
          <InfoRow label="Internal name" value={listing.internalName} />
        ) : null}
      </View>

      <View style={styles.detailGrid}>
        <View style={[styles.card, styles.detailCard]}>
          <Text style={styles.cardTitle}>Property details</Text>
          <InfoRow label="Property type" value={humanize(listing.propertyType)} />
          <InfoRow label="Booking mode" value={humanize(listing.bookingMode)} />
          <InfoRow label="Maximum guests" value={listing.maxGuests} />
          <InfoRow label="Bedrooms" value={listing.bedroomCount} />
          <InfoRow label="Bathrooms" value={listing.bathroomCount} />
          <InfoRow label="Minimum stay" value={listing.minStayNights ? `${listing.minStayNights} nights` : 'None'} />
          <InfoRow label="Maximum stay" value={listing.maxStayNights ? `${listing.maxStayNights} nights` : 'None'} />
        </View>

        <View style={[styles.card, styles.detailCard]}>
          <Text style={styles.cardTitle}>Pricing</Text>
          <InfoRow label="Nightly price" value={money(listing.pricePerNight)} />
          <InfoRow label="Discount" value={listing.discountPercent ? `${listing.discountPercent}%` : 'None'} />
          <InfoRow label="Weekend price" value={money(listing.weekendPrice)} />
          <InfoRow label="Cleaning fee" value={money(listing.cleaningFee)} />
          <InfoRow label="Pet fee" value={money(listing.petFee)} />
          <InfoRow label="Extra guest fee" value={money(listing.extraGuestFee)} />
          <InfoRow label="Security deposit" value={money(listing.securityDeposit)} />
          <InfoRow label="Cancellation policy" value={humanize(listing.cancellationPolicy)} />
        </View>
      </View>

      <View style={styles.detailGrid}>
        <View style={[styles.card, styles.detailCard]}>
          <Text style={styles.cardTitle}>Arrival and house rules</Text>
          <InfoRow
            label="Check-in"
            value={
              listing.checkInStartTime && listing.checkInEndTime
                ? `${listing.checkInStartTime} – ${listing.checkInEndTime}`
                : listing.checkInTime || '—'
            }
          />
          <InfoRow label="Check-out" value={listing.checkOutTime || '—'} />
          <Text style={styles.sectionLabel}>House rules</Text>
          <Text style={styles.cardBody}>{listing.houseRules || 'No house rules provided.'}</Text>
        </View>

        <View style={[styles.card, styles.detailCard]}>
          <Text style={styles.cardTitle}>Amenities and highlights</Text>
          <View style={styles.chipRow}>
            {(listing.listingAmenities ?? []).map((item) =>
              item.amenity?.name ? (
                <View key={item.id} style={styles.chip}>
                  <Text style={styles.chipText}>{item.amenity.name}</Text>
                </View>
              ) : null,
            )}
            {!listing.listingAmenities?.length ? (
              <Text style={styles.cardBody}>No amenities provided.</Text>
            ) : null}
          </View>
          {!!listing.propertyHighlights?.length && (
            <>
              <Text style={styles.sectionLabel}>Highlights</Text>
              <View style={styles.chipRow}>
                {listing.propertyHighlights.map((highlight) => (
                  <View key={highlight} style={styles.highlightChip}>
                    <Text style={styles.highlightChipText}>{humanize(highlight)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </View>

      {listing.status === 'pending_review' ? (
        <View style={styles.moderationCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Moderation decision</Text>
            <Text style={styles.cardBody}>
              Review all details and photos before approving this listing.
            </Text>
          </View>
          <View style={styles.moderationActions}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => confirmModeration('reject')}
              disabled={moderating !== null}
            >
              <Text style={styles.rejectButtonText}>
                {moderating === 'reject' ? 'Rejecting…' : 'Reject'}
              </Text>
            </TouchableOpacity>
            <PrimaryButton
              label={moderating === 'approve' ? 'Approving…' : 'Approve listing'}
              onPress={() => confirmModeration('approve')}
              disabled={moderating !== null}
              loading={moderating === 'approve'}
            />
          </View>
        </View>
      ) : null}

      {listing.status === 'approved' ? (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Featured by Dwelis</Text>
        <Text style={styles.cardBody}>
          Featured listings appear on the homepage and curated collections.
        </Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{listing.featured ? 'ON' : 'OFF'}</Text>
          <Switch
            value={listing.featured}
            onValueChange={onToggleFeatured}
            disabled={saving || listing.status !== 'approved'}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
        {listing.status !== 'approved' ? (
          <Text style={styles.hint}>Only approved listings can be featured.</Text>
        ) : null}
        {listing.featured && listing.featuredAt ? (
          <Text style={styles.featuredSince}>⭐ Featured since {formatDate(listing.featuredAt)}</Text>
        ) : null}
        {saving ? <ActivityIndicator size="small" color={colors.primary} style={styles.loader} /> : null}
      </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  centered: { justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.textSecondary },
  headerCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.primaryHover,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  listingTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.xs },
  listingMeta: { ...typography.bodySm, color: colors.textSecondary, marginTop: 2 },
  statusBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusApproved: { backgroundColor: 'rgba(0, 166, 153, 0.12)' },
  statusPending: { backgroundColor: '#FFF4E5' },
  statusRejected: { backgroundColor: '#FCE8E4' },
  statusText: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
    gap: spacing.sm,
  },
  cardTitle: { ...typography.h3, color: colors.textPrimary },
  cardBody: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  warningText: { ...typography.bodySm, color: colors.warning },
  photoRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  photoWrap: {
    position: 'relative',
    width: 280,
    height: 190,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSubtle,
  },
  photo: { width: '100%', height: '100%' },
  coverBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: 'rgba(34,34,34,0.78)',
  },
  coverBadgeText: { ...typography.caption, color: colors.white, fontWeight: '700' },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  detailCard: {
    flex: 1,
    minWidth: 300,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: { ...typography.bodySm, color: colors.textSecondary, flex: 1 },
  infoValue: {
    ...typography.bodySm,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceSubtle,
  },
  chipText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  highlightChip: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primaryMuted,
  },
  highlightChipText: { ...typography.caption, color: colors.primaryHover, fontWeight: '700' },
  moderationCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.lg,
    ...shadows.md,
  },
  moderationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rejectButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  rejectButtonText: { ...typography.label, color: colors.error, fontWeight: '700' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  switchLabel: { ...typography.label, fontWeight: '700', color: colors.textPrimary },
  hint: { ...typography.caption, color: colors.textSecondary },
  featuredSince: { ...typography.bodySm, color: colors.textPrimary, marginTop: spacing.xs },
  loader: { marginTop: spacing.sm },
});
