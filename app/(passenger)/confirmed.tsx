import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

export default function ConfirmedScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<any>(null);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    api.get(`/bookings/${bookingId}`).then(r => setBooking(r.data.booking));
  }, [bookingId]);

  useEffect(() => {
    if (!booking) return;
    const tick = setInterval(() => {
      const diff = new Date(booking.departure_time).getTime() - Date.now();
      if (diff <= 0) { setCountdown('Departing now'); clearInterval(tick); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(tick);
  }, [booking]);

  async function handleCancel() {
    Alert.alert('Cancel booking?', 'A cancellation fee may apply.', [
      { text: 'Keep booking', style: 'cancel' },
      { text: 'Cancel', style: 'destructive', onPress: async () => { try { await api.delete(`/bookings/${bookingId}`); } catch {} router.replace('/(passenger)/home'); } },
    ]);
  }

  if (!booking) return null;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      <View style={s.banner}>
        <Text style={s.bannerIcon}>✅</Text>
        <Text style={s.bannerTitle}>Booking confirmed</Text>
        <Text style={s.countdown}>{countdown}</Text>
        <Text style={s.countdownLabel}>until departure</Text>
      </View>

      <View style={s.card}>
        <Row label="Pickup point" value={booking.pickup_point_name || '—'} />
        <Row label="Driver" value={booking.driver_name || '—'} />
        <Row label="Vehicle" value={`${booking.vehicle_colour} ${booking.vehicle_make} · ${booking.plate_number}`} />
        <Row label="Seats" value={String(booking.seats)} />
        <Row label="Total fare" value={`GHS ${booking.total_price}`} />
        <Row label="Payment" value={booking.payment_method} />
      </View>

      <View style={s.actions}>
        <TouchableOpacity style={s.actionBtn} onPress={() => Linking.openURL(`tel:${booking.driver_phone}`)}>
          <Text style={s.actionIcon}>📞</Text>
          <Text style={s.actionLabel}>Call driver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={() => router.push({ pathname: '/(passenger)/in-trip', params: { bookingId } })}>
          <Text style={s.actionIcon}>🗺️</Text>
          <Text style={s.actionLabel}>Track ride</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, { borderColor: COLORS.error }]} onPress={handleCancel}>
          <Text style={s.actionIcon}>✕</Text>
          <Text style={[s.actionLabel, { color: COLORS.error }]}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.sosBtn} onPress={async () => { await api.post('/sos', { booking_id: bookingId }); Alert.alert('SOS sent', 'Emergency services have been notified.'); }}>
        <Text style={s.sosText}>🆘  SOS Emergency</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.xxl },
  banner: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.lg, borderWidth: 1.5, borderColor: COLORS.gold, ...SHADOW },
  bannerIcon: { fontSize: 40, marginBottom: SPACING.sm },
  bannerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.white, marginBottom: SPACING.md },
  countdown: { fontSize: 48, fontWeight: '700', color: COLORS.gold },
  countdownLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: SPACING.xs },
  card: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg, ...SHADOW },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  rowValue: { fontSize: FONTS.sizes.sm, color: COLORS.white, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  actionBtn: { flex: 1, backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  actionIcon: { fontSize: 24, marginBottom: SPACING.xs },
  actionLabel: { fontSize: FONTS.sizes.xs, color: COLORS.white, textAlign: 'center' },
  sosBtn: { backgroundColor: '#b71c1c', borderRadius: RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center' },
  sosText: { color: COLORS.white, fontSize: FONTS.sizes.base, fontWeight: '700' },
});
