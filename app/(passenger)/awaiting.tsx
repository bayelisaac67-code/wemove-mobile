import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

export default function AwaitingScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [status, setStatus] = useState<'REQUESTED' | 'CONFIRMED' | 'REJECTED'>('REQUESTED');
  const [dots, setDots] = useState('');

  useEffect(() => {
    const dotTimer = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    const pollTimer = setInterval(async () => {
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        const s = res.data.booking?.status;
        if (s === 'CONFIRMED') { clearInterval(pollTimer); clearInterval(dotTimer); setStatus('CONFIRMED'); setTimeout(() => router.replace({ pathname: '/(passenger)/confirmed', params: { bookingId } }), 1200); }
        if (s === 'REJECTED') { clearInterval(pollTimer); clearInterval(dotTimer); setStatus('REJECTED'); }
      } catch {}
    }, 3000);
    return () => { clearInterval(dotTimer); clearInterval(pollTimer); };
  }, [bookingId]);

  if (status === 'CONFIRMED') return (
    <View style={[s.container, { justifyContent: 'center' }]}>
      <Text style={s.bigIcon}>✅</Text>
      <Text style={s.confirmedText}>Booking confirmed!</Text>
    </View>
  );

  if (status === 'REJECTED') return (
    <View style={[s.container, { justifyContent: 'center', padding: SPACING.lg }]}>
      <Text style={s.bigIcon}>❌</Text>
      <Text style={s.rejectedTitle}>Driver declined</Text>
      <Text style={s.rejectedMsg}>Let's find you another ride.</Text>
      <TouchableOpacity style={s.btn} onPress={() => router.back()}>
        <Text style={s.btnText}>See other rides</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[s.container, { justifyContent: 'center', alignItems: 'center', padding: SPACING.lg }]}>
      <ActivityIndicator color={COLORS.gold} size="large" style={{ marginBottom: SPACING.xl }} />
      <Text style={s.waitTitle}>Waiting for driver{dots}</Text>
      <Text style={s.waitSub}>The driver will accept or decline shortly</Text>
      <TouchableOpacity style={s.cancelBtn} onPress={async () => { await api.patch(`/bookings/${bookingId}/cancel`); router.back(); }}>
        <Text style={s.cancelText}>Cancel request</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  bigIcon: { fontSize: 72, textAlign: 'center', marginBottom: SPACING.lg },
  confirmedText: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: '#4CAF50', textAlign: 'center' },
  rejectedTitle: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.error, textAlign: 'center', marginBottom: SPACING.sm },
  rejectedMsg: { fontSize: FONTS.sizes.base, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.xl },
  waitTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.white, marginBottom: SPACING.sm },
  waitSub: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.xxl },
  btn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, alignItems: 'center' },
  btnText: { color: COLORS.navy, fontWeight: '700', fontSize: FONTS.sizes.base },
  cancelBtn: { marginTop: SPACING.lg },
  cancelText: { color: COLORS.error, fontSize: FONTS.sizes.sm },
});
