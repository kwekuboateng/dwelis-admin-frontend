import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { Icon } from './Icon';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, typography } from '../theme';

type AdminNavBarProps = {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
};

export function AdminNavBar({ title = 'Admin', showBackButton, onBack }: AdminNavBarProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const doLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigation.dispatch?.(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
  };

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 12, paddingBottom: spacing.sm }]}>
      <View style={styles.leftRow}>
        {showBackButton && onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={12} activeOpacity={0.7}>
            <Icon name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.logoWrap}
          onPress={() => navigation.navigate(user ? 'AdminHome' : 'Login')}
          activeOpacity={0.8}
        >
          <Text style={styles.logo}>Dwelis Admin</Text>
        </TouchableOpacity>
        {title ? <Text style={styles.title} numberOfLines={1}>{title}</Text> : null}
      </View>

      <View style={styles.right}>
        {!user ? (
          <TouchableOpacity
            style={[styles.linkButton, styles.linkButtonPrimary]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.linkTextPrimary}>Log in</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <TouchableOpacity
              style={styles.avatarButton}
              onPress={() => setMenuOpen(true)}
              activeOpacity={0.8}
            >
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} resizeMode="cover" />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Icon name="person" size={20} color={colors.textTertiary} />
                </View>
              )}
            </TouchableOpacity>

            <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />
              <View style={[styles.menuDropdown, { top: 56 + insets.top }]}>
                <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={doLogout} activeOpacity={0.7}>
                  <Icon name="log-out-outline" size={20} color={colors.error} />
                  <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Log out</Text>
                </TouchableOpacity>
              </View>
            </Modal>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    minHeight: 56,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  backButton: {
    marginRight: spacing.xs,
    padding: spacing.xxs,
  },
  logoWrap: {
    paddingVertical: spacing.xxs,
    paddingRight: spacing.sm,
  },
  logo: {
    ...typography.h2,
    color: colors.primary,
    fontSize: 18,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginLeft: spacing.xs,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  linkButtonPrimary: {
    backgroundColor: colors.primary,
  },
  linkTextPrimary: {
    ...typography.label,
    color: colors.white,
    fontWeight: '600',
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDropdown: {
    position: 'absolute',
    right: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 8,
    minWidth: 160,
    paddingVertical: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  menuItemDanger: {},
  menuItemText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  menuItemTextDanger: {
    color: colors.error,
  },
});
