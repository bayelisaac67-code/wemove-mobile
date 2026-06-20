import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

type Status = 'PENDING' | 'VERIFIED' | 'REJECTED';

export default function VerificationStatusScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('PENDING');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await api.get('/users/profile');
        setStatus(res.data.verification_status);
        setReason(res.data.rejection_reason || '');
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center' }]}>
      <ActivityIndicator color={COLORS.gold} size="large" />
    </View>
  );

  const config = {
    PENDING: { emoji: '⏳', title: 'Verification in progress', color: COLORS.gold, message: "We're reviewing your details — usually within a few hours. You can browse rides while you wait." },
    VERIFIED: { emoji: '✅', title: 'You\'re verified!', color: '#4CAF50', message: "Your identity has been confirmed. You're ready to book rides." },
    REJECTED: { emoji: '❌', title: 'Verification failed', color: COLORS.error, message: reason || 'Your documents could not be verified. Please resubmit.' },
  }[status];

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{config.emoji}</Text>
      <Text style={[styles.title, { color: config.color }]}>{config.title}</Text>
      <Text style={styles.message}>{config.message}</Text>

      {status === 'VERIFIED' && (
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(passenger)/home')}>
          <Text style={styles.btnText}>Start exploring rides</Text>
        </TouchableOpacity>
      )}
      {status === 'PENDING' && (
        <TouchableOpacity style={styles.btnOutline} onPress={() => router.replace('/(passenger)/home')}>
          <Text style={styles.btnOutlineText}>Browse rides</Text>
        </TouchableOpacity>
      )}
      {status === 'REJECTED' && (
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/onboarding/ghana-card')}>
          <Text style={styles.btnText}>Resubmit documents</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy, padding: SPACING.lg, paddingTop: SPACING.xxl, alignItems: 'center' },
  emoji: { fontSize: 64, marginBottom: SPACING.lg, marginTop: SPACING.xxl },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', textAlign: 'center', marginBottom: SPACING.md },
  message: { fontSize: FONTS.sizes.base, color: COLORS.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: SPACING.xl, paddingHorizontal: SPACING.md },
  btn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, alignItems: 'center', width: '100%' },
  btnText: { color: COLORS.navy, fontSize: FONTS.sizes.base, fontWeight: '700' },
  btnOutline: { borderWidth: 2, borderColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, alignItems: 'center', width: '100%' },
  btnOutlineText: { color: COLORS.gold, fontSize: FONTS.sizes.base, fontWeight: '700' },
});
