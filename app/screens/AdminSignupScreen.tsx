import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { PrimaryButton } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

export const AdminSignupScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, signupAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  const handleSignup = async () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signupAdmin(
        email.trim(),
        password,
        fullName.trim() || undefined,
        undefined,
        isAdmin ? { persist: false } : undefined,
      );
      if (isAdmin) {
        navigation.goBack();
      } else {
        // First admin created - AuthContext updates user, AdminApp re-renders and shows AdminStack
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Sign up failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.card}>
        <Text style={styles.logo}>Create admin account</Text>
        <Text style={styles.subtitle}>
          {isAdmin
            ? 'Create a new administrator account. They will be able to approve hosts and manage the platform.'
            : 'First-time setup: create the first admin account. After that, only existing admins can create new ones.'}
        </Text>

        <Text style={styles.label}>Full name (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor={colors.textTertiary}
          value={fullName}
          onChangeText={setFullName}
        />
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="admin@example.com"
          placeholderTextColor={colors.textTertiary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.label}>Password (min 8 characters)</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, styles.inputWithIcon]}
            placeholder="••••••••"
            placeholderTextColor={colors.textTertiary}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={8}
          >
            <Icon
              name={showPassword ? 'eye-off' : 'eye'}
              size={22}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
        <PrimaryButton
          label={loading ? 'Creating admin account...' : 'Create admin account'}
          size="lg"
          onPress={handleSignup}
          loading={loading}
          disabled={!email.trim() || !password}
          style={styles.button}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={styles.backLink}
          onPress={() => (isAdmin ? navigation.goBack() : navigation.navigate('Login'))}
        >
          <Text style={styles.link}>{isAdmin ? 'Back' : 'Back to sign in'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    ...shadows.lg,
  },
  logo: {
    ...typography.h1,
    fontSize: 26,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceSubtle,
  },
  inputRow: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  inputWithIcon: {
    marginBottom: 0,
    paddingRight: 44,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  button: {
    width: '100%',
    marginTop: spacing.xs,
  },
  error: {
    ...typography.bodySm,
    marginTop: spacing.md,
    color: colors.error,
    textAlign: 'center',
  },
  backLink: {
    marginTop: spacing.lg,
    alignSelf: 'center',
  },
  link: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '600',
  },
});
