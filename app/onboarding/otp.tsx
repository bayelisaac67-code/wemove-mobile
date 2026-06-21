import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { OtpInput } from 'react-native-otp-entry';
import { colors, typography, spacing, radius } from '../../src/constants/theme';
import { api } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/authStore';

export default function OTPScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { setAuth } = useAuthStore();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    if (resendTimer === 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const verify = async (c: string) => {
    if (c.length < 6) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify-otp', { phone, code: c });
      await setAuth(data.token, data.user);
      if (data.isNew) {
        router.replace('/onboarding/profile');
      } else {
        router.replace(data.user.role_flags.includes('DRIVER') ? '/(driver)/home' : '/(passenger)/home');
      }
    } catch (e: any) {
      setError(e.response?.data?.error || 'Wrong code, try again');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    await api.post('/auth/send-otp', { phone });
    setResendTimer(60);
    setError('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter the code</Text>
      <Text style={styles.subtitle}>Sent to {phone}</Text>
      <TouchableOpacity onPress={() => router.back()} style={styles.changeNum}>
        <Text style={styles.changeNumText}>← Change number</Text>
      </TouchableOpacity>

      <OtpInput
        numberOfDigits={6}
        onFilled={verify}
        onTextChange={setCode}
        theme={{
          containerStyle: styles.otpContainer,
          inputsContainerStyle: styles.otpInputsContainer,
          pinCodeContainerStyle: styles.otpBox,
          pinCodeTextStyle: styles.otpText,
          focusedPinCodeContainerStyle: styles.otpBoxFocused,
        }}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.md }} />}

      <TouchableOpacity onPress={resend} disabled={resendTimer > 0} style={styles.resend}>
        <Text style={[styles.resendText, resendTimer > 0 && styles.resendDisabled]}>
          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navy, padding: spacing.lg, paddingTop: 80 },
  title: { ...typography.headline, color: colors.white, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecond, marginBottom: spacing.xl },
  otpContainer: { marginBottom: spacing.md },
  otpInputsContainer: { gap: spacing.sm },
  otpBox: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.navyLight,
    width: 50, height: 56,
  },
  otpBoxFocused: { borderColor: colors.gold },
  otpText: { ...typography.title, color: colors.white },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
  resend: { marginTop: spacing.lg, alignSelf: 'center' },
  resendText: { ...typography.bodyBold, color: colors.gold },
  resendDisabled: { color: colors.textHint },
  changeNum: { marginBottom: spacing.xl },
  changeNumText: { ...typography.caption, color: colors.gold },
});
