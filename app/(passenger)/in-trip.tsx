import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

export default function InTripScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    const t = setInterval(() => {
      api.get(`/bookings/${bookingId}`).then(r => {
        const b = r.data.booking;
        setBooking(b);
        if (b?.status === 'COMPLETED') { clearInterval(t); router.replace({ pathname: '/(passenger)/rate', params: { bookingId } }); }
      }).catch(() => {});
    }, 5000);
    api.get(`/bookings/${bookingId}`).then(r => setBooking(r.data.booking)).catch(() => {});
    return () => clearInterval(t);
  }, [bookingId]);

  async function triggerSOS() {
    Alert.alert('SOS', 'Send emergency alert?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send SOS', style: 'destructive', onPress: async () => { await api.post('/sos', { booking_id: bookingId }); Alert.alert('SOS sent', 'Help is on the way.'); } },
    ]);
  }

  return (
    <View style={s.container}>
      <View style={s.statusCard}>
        <Text style={s.statusIcon}>🚗</Text>
        <Text style={s.statusTitle}>Trip in progress</Text>
        <Text style={s.statusSub}>{booking?.driver_name || 'Your driver'} is on the way</Text>
      </View>

      <View style={s.infoCard}>
        <InfoRow icon="📍" label="Your dropoff" value={booking?.dropoff_point_name || '—'} />
        <InfoRow icon="🚘" label="Vehicle" value={`${booking?.vehicle_colour || ''} · ${booking?.plate_number || ''}`} />
        <InfoRow icon="💰" label="Fare" value={`GHS ${booking?.total_price || '—'}`} />
        <InfoRow icon="💳" label="Payment" value={booking?.payment_method || '—'} />
      </View>

      <TouchableOpacity style={s.sosBtn} onPress={triggerSOS}>
        <Text style={s.sosText}>🆘  SOS Emergency</Text>
      </TouchableOpacity>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoIcon}>{icon}</Text>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy, padding: SPACING.lg, paddingTop: SPACING.xxl, gap: SPACING.lg },
  statusCard: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.gold, ...SHADOW },
  statusIcon: { fontSize: 48, marginBottom: SPACING.md },
  statusTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.white, marginBottom: SPACING.xs },
  statusSub: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  infoCard: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, ...SHADOW },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoIcon: { fontSize: 18, marginRight: SPACING.sm, width: 24 },
  infoLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, flex: 1 },
  infoValue: { fontSize: FONTS.sizes.sm, color: COLORS.white, fontWeight: '600' },
  sosBtn: { backgroundColor: '#b71c1c', borderRadius: RADIUS.xl, paddingVertical: SPACING.lg, alignItems: 'center', marginTop: 'auto' },
  sosText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700' },
});
