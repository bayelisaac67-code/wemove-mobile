import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

const METHODS = [
  { id: 'MOMO', label: 'Mobile Money', icon: '📱', desc: 'Pay now — seat reserved instantly' },
  { id: 'GHANAPAY', label: 'GhanaPay', icon: '🏦', desc: 'Pay now — seat reserved instantly' },
  { id: 'CASH', label: 'Cash', icon: '💵', desc: 'Pay driver on boarding' },
];

export default function PaymentScreen() {
  const router = useRouter();
  const { tripId, seats, total, pickup_point_id, dropoff_point_id } = useLocalSearchParams<{ tripId: string; seats: string; total: string; pickup_point_id: string; dropoff_point_id: string }>();
  const [selected, setSelected] = useState('MOMO');
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await api.post('/bookings', { trip_id: tripId, seats: Number(seats), payment_method: selected, pickup_point_id, dropoff_point_id });
      router.replace({ pathname: '/(passenger)/awaiting', params: { bookingId: res.data.booking.id } });
    } catch (e: any) {
      Alert.alert('Booking failed', e?.response?.data?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      <Text style={s.title}>Payment</Text>

      <View style={s.summary}>
        <Text style={s.summaryLabel}>Total fare</Text>
        <Text style={s.summaryAmount}>GHS {total}</Text>
        <Text style={s.summarySeats}>{seats} seat{Number(seats) !== 1 ? 's' : ''}</Text>
      </View>

      <Text style={s.sectionLabel}>Choose payment method</Text>
      {METHODS.map(m => (
        <TouchableOpacity key={m.id} style={[s.method, selected === m.id && s.methodSelected]} onPress={() => setSelected(m.id)}>
          <Text style={s.methodIcon}>{m.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.methodLabel}>{m.label}</Text>
            <Text style={s.methodDesc}>{m.desc}</Text>
          </View>
          <View style={[s.radio, selected === m.id && s.radioSelected]}>
            {selected === m.id && <View style={s.radioDot} />}
          </View>
        </TouchableOpacity>
      ))}

      {selected !== 'CASH' && (
        <View style={s.notice}>
          <Text style={s.noticeText}>💡 Your payment will be held securely and only released to the driver after you complete the trip.</Text>
        </View>
      )}

      <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleConfirm} disabled={loading}>
        <Text style={s.btnText}>{loading ? 'Requesting…' : `Confirm & request seat${Number(seats) !== 1 ? 's' : ''}`}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xxl },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.white, marginBottom: SPACING.xl },
  summary: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', marginBottom: SPACING.xl, ...SHADOW },
  summaryLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.xs },
  summaryAmount: { fontSize: 40, fontWeight: '700', color: COLORS.gold },
  summarySeats: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: SPACING.xs },
  sectionLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.md },
  method: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1.5, borderColor: 'transparent', gap: SPACING.md },
  methodSelected: { borderColor: COLORS.gold },
  methodIcon: { fontSize: 24 },
  methodLabel: { fontSize: FONTS.sizes.base, color: COLORS.white, fontWeight: '600' },
  methodDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: COLORS.gold },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.gold },
  notice: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, marginVertical: SPACING.md },
  noticeText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, lineHeight: 20 },
  btn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.md },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: COLORS.navy, fontSize: FONTS.sizes.base, fontWeight: '700' },
});
