import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

export default function DriverInTripScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const [pickups, setPickups] = useState<any[]>([]);
  const [waitTimers, setWaitTimers] = useState<Record<string, number>>({});
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    api.get(`/trips/${tripId}/pickups`).then(r => setPickups(r.data.pickups || []));
    return () => clearInterval(intervalRef.current);
  }, []);

  function startWaitTimer(pickupId: string) {
    setWaitTimers(t => ({ ...t, [pickupId]: 300 }));
    intervalRef.current = setInterval(() => {
      setWaitTimers(t => {
        const remaining = (t[pickupId] || 0) - 1;
        if (remaining <= 0) { clearInterval(intervalRef.current); return { ...t, [pickupId]: 0 }; }
        return { ...t, [pickupId]: remaining };
      });
    }, 1000);
  }

  async function markPickedUp(passengerId: string, bookingId: string) {
    await api.patch(`/bookings/${bookingId}/picked-up`);
    setPickups(p => p.map(pt => ({ ...pt, passengers: pt.passengers.map((pa: any) => pa.booking_id === bookingId ? { ...pa, picked_up: true } : pa) })));
  }

  async function markNoShow(bookingId: string) {
    await api.patch(`/bookings/${bookingId}/no-show`);
    setPickups(p => p.map(pt => ({ ...pt, passengers: pt.passengers.map((pa: any) => pa.booking_id === bookingId ? { ...pa, no_show: true } : pa) })));
  }

  async function handleEndTrip() {
    Alert.alert('End trip?', 'This will complete the trip and release payments.', [
      { text: 'Continue driving', style: 'cancel' },
      { text: 'End trip', onPress: async () => { await api.patch(`/trips/${tripId}/complete`); router.replace({ pathname: '/(driver)/rate', params: { tripId } }); } },
    ]);
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <View style={s.container}>
      <Text style={s.title}>Trip in progress</Text>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: SPACING.md, paddingBottom: SPACING.xl }}>
        {pickups.map((pt, i) => (
          <View key={pt.pickup_point_id} style={s.pickupCard}>
            <View style={s.pickupHeader}>
              <View style={s.pickupNum}><Text style={s.pickupNumText}>{i + 1}</Text></View>
              <Text style={s.pickupName}>{pt.pickup_point_name}</Text>
              {!waitTimers[pt.pickup_point_id] && (
                <TouchableOpacity style={s.waitBtn} onPress={() => startWaitTimer(pt.pickup_point_id)}>
                  <Text style={s.waitBtnText}>Start 5-min wait</Text>
                </TouchableOpacity>
              )}
              {waitTimers[pt.pickup_point_id] !== undefined && (
                <Text style={[s.timer, waitTimers[pt.pickup_point_id] === 0 && s.timerExpired]}>
                  {waitTimers[pt.pickup_point_id] === 0 ? 'Time up' : fmt(waitTimers[pt.pickup_point_id])}
                </Text>
              )}
            </View>
            {pt.passengers?.map((pa: any) => (
              <View key={pa.booking_id} style={[s.passenger, pa.picked_up && s.passengerDone, pa.no_show && s.passengerNoShow]}>
                <Text style={s.passengerName}>{pa.passenger_name} · {pa.seats} seat{pa.seats !== 1 ? 's' : ''}</Text>
                {!pa.picked_up && !pa.no_show && (
                  <View style={s.passengerActions}>
                    <TouchableOpacity style={s.noShowBtn} onPress={() => markNoShow(pa.booking_id)}><Text style={s.noShowText}>No-show</Text></TouchableOpacity>
                    <TouchableOpacity style={s.pickedUpBtn} onPress={() => markPickedUp(pa.passenger_id, pa.booking_id)}><Text style={s.pickedUpText}>Picked up ✓</Text></TouchableOpacity>
                  </View>
                )}
                {pa.picked_up && <Text style={s.statusText}>✓ On board</Text>}
                {pa.no_show && <Text style={[s.statusText, { color: COLORS.error }]}>No-show</Text>}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity style={s.endBtn} onPress={handleEndTrip}>
        <Text style={s.endBtnText}>End trip</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy, padding: SPACING.lg, paddingTop: SPACING.xxl },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.white, marginBottom: SPACING.lg },
  pickupCard: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, ...SHADOW },
  pickupHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  pickupNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  pickupNumText: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.navy },
  pickupName: { flex: 1, fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.white },
  waitBtn: { backgroundColor: COLORS.gold + '33', borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  waitBtnText: { fontSize: FONTS.sizes.xs, color: COLORS.gold, fontWeight: '600' },
  timer: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.gold },
  timerExpired: { color: COLORS.error },
  passenger: { backgroundColor: COLORS.navy, borderRadius: RADIUS.sm, padding: SPACING.sm, marginBottom: SPACING.xs },
  passengerDone: { opacity: 0.6 },
  passengerNoShow: { opacity: 0.4 },
  passengerName: { fontSize: FONTS.sizes.sm, color: COLORS.white, marginBottom: SPACING.xs },
  passengerActions: { flexDirection: 'row', gap: SPACING.sm },
  noShowBtn: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.error },
  noShowText: { fontSize: FONTS.sizes.xs, color: COLORS.error },
  pickedUpBtn: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.sm, backgroundColor: '#4CAF5022', borderWidth: 1, borderColor: '#4CAF50' },
  pickedUpText: { fontSize: FONTS.sizes.xs, color: '#4CAF50' },
  statusText: { fontSize: FONTS.sizes.xs, color: '#4CAF50', fontWeight: '600' },
  endBtn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.md },
  endBtnText: { color: COLORS.navy, fontSize: FONTS.sizes.base, fontWeight: '700' },
});
