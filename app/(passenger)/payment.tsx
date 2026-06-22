import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '../../src/lib/api';
import BottomNav from '../../src/components/BottomNav';

const C = {
  navy: '#0D1B2A', gold: '#F5B800', white: '#FFFFFF',
  bg: '#F6F7F9', dark: '#111827', muted: '#6B7280',
  border: '#E5E7EB', hint: '#9CA3AF',
};

const METHODS = [
  { id: 'MOMO', label: 'Mobile Money (MoMo)', sub: 'Pay with MTN/Vodafone/AirtelTigo', icon: 'smartphone' },
  { id: 'GHANAPAY', label: 'GhanaPay', sub: 'Bank-linked instant payment', icon: 'credit-card' },
  { id: 'CASH', label: 'Cash', sub: 'Pay driver on boarding', icon: 'dollar-sign' },
] as const;

export default function PaymentScreen() {
  const router = useRouter();
  const { tripId, seats, perSeat, total, pickup_point_id, dropoff_point_id, pickup_name, dropoff_name } =
    useLocalSearchParams<{ tripId: string; seats: string; perSeat: string; total: string; pickup_point_id: string; dropoff_point_id: string; pickup_name: string; dropoff_name: string }>();
  const [selected, setSelected] = useState<string>('MOMO');
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await api.post('/bookings', {
        trip_id: tripId,
        seats: Number(seats),
        payment_method: selected,
        pickup_point_id,
        dropoff_point_id,
      });
      router.replace({ pathname: '/(passenger)/awaiting', params: { bookingId: res.data.booking.id } });
    } catch (e: any) {
      Alert.alert('Booking failed', e?.response?.data?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.root}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={C.dark} />
          <Text style={s.backTxt}>Back</Text>
        </TouchableOpacity>
        <Text style={s.pageTitle}>Confirm & Pay</Text>

        {/* Price breakdown */}
        <View style={s.card}>
          <View style={s.priceRow}>
            <Text style={s.priceLabel}>Per seat</Text>
            <Text style={s.priceVal}>GHS {perSeat}</Text>
          </View>
          <View style={s.priceRow}>
            <Text style={s.priceLabel}>Seats</Text>
            <Text style={s.priceVal}>× {seats}</Text>
          </View>
          <View style={[s.priceRow, s.totalRow]}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalVal}>GHS {total}</Text>
          </View>
        </View>

        {/* Route */}
        <View style={s.card}>
          <View style={s.routeRow}>
            <Text style={s.routeFrom}><Text style={s.routePrefix}>From: </Text>{pickup_name}</Text>
          </View>
          <View style={s.routeRow}>
            <Text style={s.routeTo}><Text style={s.routePrefix}>To: </Text>{dropoff_name}</Text>
          </View>
        </View>

        {/* Payment method */}
        <Text style={s.sectionLabel}>PAYMENT METHOD</Text>
        {METHODS.map(m => (
          <TouchableOpacity
            key={m.id}
            style={[s.methodCard, selected === m.id && s.methodSelected]}
            onPress={() => setSelected(m.id)}
            activeOpacity={0.8}
          >
            <View style={[s.methodIcon, selected === m.id && s.methodIconOn]}>
              <Feather name={m.icon} size={18} color={selected === m.id ? '#fff' : C.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.methodLabel}>{m.label}</Text>
              <Text style={s.methodSub}>{m.sub}</Text>
            </View>
            {selected === m.id && <Feather name="check" size={18} color={C.navy} />}
          </TouchableOpacity>
        ))}

        <Text style={s.holdNote}>Payment will be held until trip completion</Text>

        <TouchableOpacity style={[s.btn, loading && s.btnDim]} onPress={handleConfirm} disabled={loading} activeOpacity={0.85}>
          <Text style={s.btnTxt}>{loading ? 'Requesting…' : `Request Seat · GHS ${total}`}</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNav active="home" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 56, paddingBottom: 24, gap: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  backTxt: { fontSize: 15, color: C.dark },
  pageTitle: { fontSize: 24, fontWeight: '700', color: C.dark, marginBottom: 4 },
  card: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, gap: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 14, color: C.muted },
  priceVal: { fontSize: 14, color: C.dark },
  totalRow: { paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: C.dark },
  totalVal: { fontSize: 20, fontWeight: '700', color: C.dark },
  routeRow: { paddingVertical: 2 },
  routePrefix: { color: C.muted },
  routeFrom: { fontSize: 14, color: C.dark },
  routeTo: { fontSize: 14, color: C.dark },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.hint, letterSpacing: 0.8, marginTop: 4 },
  methodCard: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  methodSelected: { borderColor: C.navy, borderWidth: 1.5 },
  methodIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  methodIconOn: { backgroundColor: C.navy },
  methodLabel: { fontSize: 15, fontWeight: '600', color: C.dark, marginBottom: 2 },
  methodSub: { fontSize: 12, color: C.muted },
  holdNote: { fontSize: 12, color: C.hint, textAlign: 'center', marginTop: 4 },
  btn: { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  btnDim: { opacity: 0.6 },
  btnTxt: { fontSize: 16, fontWeight: '700', color: C.navy },
});
