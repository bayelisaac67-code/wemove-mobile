import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { api } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (!fullName.trim()) { setError('Full name is required'); return; }
    setLoading(true);
    try {
      await api.put('/users/profile', { full_name: fullName.trim(), preferred_name: preferredName.trim(), email: email.trim() || undefined });
      router.push('/onboarding/ghana-card');
    } catch {
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Your profile</Text>
        <Text style={styles.subtitle}>Use your name exactly as it appears on your Ghana Card.</Text>

        <Text style={styles.label}>Full legal name *</Text>
        <TextInput style={styles.input} placeholder="e.g. Kwame Mensah" placeholderTextColor={COLORS.textMuted} value={fullName} onChangeText={t => { setFullName(t); setError(''); }} autoCapitalize="words" />

        <Text style={styles.label}>Preferred name</Text>
        <TextInput style={styles.input} placeholder="What should drivers call you?" placeholderTextColor={COLORS.textMuted} value={preferredName} onChangeText={setPreferredName} autoCapitalize="words" />

        <Text style={styles.label}>Email (optional)</Text>
        <TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor={COLORS.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleContinue} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Saving…' : 'Continue'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xxl },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.white, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.xl },
  label: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.xs, marginTop: SPACING.md },
  input: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, color: COLORS.white, fontSize: FONTS.sizes.base },
  error: { color: COLORS.error, fontSize: FONTS.sizes.sm, marginTop: SPACING.sm },
  btn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.xl },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: COLORS.navy, fontSize: FONTS.sizes.base, fontWeight: '700' },
});
