import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { PrimaryButton } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

export const AdminLoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { login, resendVerificationEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const needsVerification = error?.toLowerCase().includes('verify your email') ?? false;

  const handleResendVerification = async () => {
    if (!email.trim()) return;
    setResendLoading(true);
    setResendSuccess(null);
    setError(null);
    try {
      await resendVerificationEmail(email.trim());
      setResendSuccess('Verification email sent. Check your inbox.');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    setResendSuccess(null);
    try {
      await login(email.trim(), password);
      // If in AdminStack (re-login), navigate to AdminHome; LoginStack will unmount and show AdminStack
      try {
        navigation.reset({ index: 0, routes: [{ name: 'AdminHome' }] });
      } catch {
        /* LoginStack has no AdminHome - AdminApp will switch to AdminStack */
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Invalid email or password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.card}>
        <Text style={styles.logo}>Dwelis Admin</Text>
        <Text style={styles.subtitle}>Sign in to manage host verifications and the platform.</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={colors.textTertiary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.label}>Password</Text>
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
          label={loading ? 'Signing in...' : 'Sign in'}
          size="lg"
          onPress={handleLogin}
          loading={loading}
          disabled={!email.trim() || !password}
          style={styles.button}
        />

        {error && <Text style={styles.error}>{error}</Text>}
        {resendSuccess && <Text style={styles.success}>{resendSuccess}</Text>}

        {needsVerification && (
          <>
            <TouchableOpacity
              style={styles.verifyLink}
              onPress={() => navigation.navigate('VerifyEmail', { email: email.trim() })}
              disabled={!email.trim()}
            >
              <Text style={styles.link}>Enter verification code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resendLink}
              onPress={handleResendVerification}
              disabled={resendLoading || !email.trim()}
            >
              <Text style={styles.link}>
                {resendLoading ? 'Sending...' : 'Resend verification email'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.createLink}
          onPress={() => navigation.navigate('AdminSignup')}
        >
          <Text style={styles.link}>First time? Create admin account</Text>
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
  success: {
    ...typography.bodySm,
    marginTop: spacing.md,
    color: colors.success,
    textAlign: 'center',
  },
  verifyLink: {
    marginTop: spacing.md,
    alignSelf: 'center',
  },
  resendLink: {
    marginTop: spacing.xs,
    alignSelf: 'center',
  },
  createLink: {
    marginTop: spacing.lg,
    alignSelf: 'center',
  },
  link: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '600',
  },
});
