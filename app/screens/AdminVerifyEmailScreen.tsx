import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { PrimaryButton } from '../components/ui';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

export const AdminVerifyEmailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email = route.params?.email ?? '';
  const { verifyEmailWithCode, resendVerificationEmail } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!email.trim() || !code.trim()) return;
    setLoading(true);
    setError(null);
    setResendSuccess(null);
    try {
      await verifyEmailWithCode(email.trim(), code.trim());
      // AuthContext persists auth and updates user - AdminApp will show AdminStack
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) return;
    setResendLoading(true);
    setError(null);
    setResendSuccess(null);
    try {
      await resendVerificationEmail(email.trim());
      setResendSuccess('Verification email sent. Check your inbox.');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.card}>
        <Text style={styles.logo}>Verify your email</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code we sent to {email || 'your email'}.
        </Text>

        <Text style={styles.label}>Verification code</Text>
        <TextInput
          style={styles.input}
          placeholder="000000"
          placeholderTextColor={colors.textTertiary}
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
        />

        <PrimaryButton
          label={loading ? 'Verifying...' : 'Verify'}
          size="lg"
          onPress={handleVerify}
          loading={loading}
          disabled={!code || code.length !== 6}
          style={styles.button}
        />

        {error && <Text style={styles.error}>{error}</Text>}
        {resendSuccess && <Text style={styles.success}>{resendSuccess}</Text>}

        <TouchableOpacity
          style={styles.resendLink}
          onPress={handleResend}
          disabled={resendLoading || !email.trim()}
        >
          <Text style={styles.link}>
            {resendLoading ? 'Sending...' : "Didn't receive it? Resend verification email"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backLink}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.link}>Back to sign in</Text>
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
  resendLink: {
    marginTop: spacing.lg,
    alignSelf: 'center',
  },
  backLink: {
    marginTop: spacing.md,
    alignSelf: 'center',
  },
  link: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '600',
  },
});
