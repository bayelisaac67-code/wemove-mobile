import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, radius } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

export default function PhoneScreen() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState('233');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const code = countryCode.replace(/\D/g, '');
  const national = phone.replace(/\D/g, '').replace(/^0/, '');
  const e164 = `+${code}${national}`;
  const valid = /^\+[1-9]\d{7,14}$/.test(e164);

  const sendOTP = async () => {
    if (!valid) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/send-otp', { phone: e164 });
      router.push({ pathname: '/onboarding/otp', params: { phone: e164 } });
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>
      <View style={styles.inner}>
        <Text style={styles.title}>Enter your number</Text>
        <Text style={styles.subtitle}>We'll send a verification code to your number.</Text>

        <View style={styles.inputRow}>
          <View style={styles.dialCode}>
            <Text style={styles.dialPlus}>+</Text>
            <TextInput
              style={styles.dialInput}
              keyboardType="phone-pad"
              value={countryCode}
              onChangeText={setCountryCode}
              maxLength={4}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="024 123 4567"
            placeholderTextColor={colors.textHint}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            maxLength={10}
            autoFocus
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, !valid && styles.btnDisabled]}
          onPress={sendOTP}
          disabled={!valid || loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color={colors.navy} /> : <Text style={styles.btnText}>Send Code</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navy },
  backBtn: { paddingTop: 60, paddingLeft: spacing.lg },
  backText: { fontSize: 24, color: colors.white },
  inner: { flex: 1, padding: spacing.lg, paddingTop: 80, justifyContent: 'flex-start', gap: spacing.md },
  title: { ...typography.headline, color: colors.white },
  subtitle: { ...typography.body, color: colors.textSecond, marginBottom: spacing.sm },
  inputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  dialCode: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 88,
    backgroundColor: colors.navyLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
  },
  dialPlus: { ...typography.bodyBold, color: colors.white },
  dialInput: { ...typography.bodyBold, color: colors.white, flex: 1, marginLeft: 2, padding: 0 },
  input: {
    flex: 1,
    backgroundColor: colors.navyLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    ...typography.body,
    color: colors.white,
  },
  error: { ...typography.caption, color: colors.danger },
  btn: {
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { ...typography.subtitle, color: colors.navy, fontWeight: '700' },
});
