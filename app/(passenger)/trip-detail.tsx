import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '../../src/lib/api';
import BottomNav from '../../src/components/BottomNav';

const C = {
  navy: '#0D1B2A', gold: '#F5B800', white: '#FFFFFF',
  bg: '#F6F7F9', dark: '#111827', muted: '#6B7280',
  border: '#E5E7EB', hint: '#9CA3AF',
};

function Avatar({ name }: { name: string }) {
  return (
    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#374151' }}>{(name || '?')[0].toUpperCase()}</Text>
    </View>
  );
}

export default function TripDetailScreen() {
  const router = useRouter();
  const { tripId, pickup_point_id, dropoff_point_id, pickup_name, dropoff_name } =
    useLocalSearchParams<{ tripId: string; pickup_point_id: string; dropoff_point_id: string; pickup_name: string; dropoff_name: string }>();
  const [trip, setTrip] = useState<any>(null);
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/trips/${tripId}`, { params: { pickup_point_id, dropoff_point_id } })
      .then(r => setTrip(r.data.trip))
      .catch(() => setTrip(null))
      .finally(() => setLoading(false));
  }, [tripId]);

  if (loading) return <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center' }}><ActivityIndicator color={C.gold} size="large" /></View>;
  if (!trip) return null;

  const pricePerSeat = Number(trip.per_seat_price || 0);
  const total = (pricePerSeat * seats).toFixed(0);
  const depTime = new Date(trip.departure_time);

  return (
    <View style={s.root}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={C.dark} />
          <Text style={s.backTxt}>Back</Text>
        </TouchableOpacity>

        {/* Time + seats badge */}
        <View style={s.card}>
          <View style={s.cardTopRow}>
            <View>
              <Text style={s.depTime}>{depTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <Text style={s.depDate}>{depTime.toLocaleDateString('en-GH', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
            </View>
            <View style={s.seatsBadge}>
              <Feather name="users" size={13} color={C.muted} />
              <Text style={s.seatsBadgeTxt}>{trip.available_seats} left</Text>
            </View>
          </View>

          <View style={s.driverRow}>
            <Avatar name={trip.driver_name} />
            <View style={{ flex: 1 }}>
              <Text style={s.driverName}>{trip.driver_name}</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 3 }}>
                <Text style={s.ratingTxt}>⭐ {trip.driver_rating != null ? Number(trip.driver_rating).toFixed(1) : 'New'}</Text>
                <Text style={s.reliabilityTxt}>○ {trip.driver_reliability ?? 100}% reliable</Text>
              </View>
            </View>
          </View>

          <View style={s.vehicleLine}>
            <Feather name="truck" size={14} color={C.hint} style={{ marginRight: 8 }} />
            <Text style={s.vehicleTxt}>{trip.vehicle_colour} {trip.vehicle_make} {trip.vehicle_model} · {trip.plate_number}</Text>
          </View>
        </View>

        {/* Route */}
        <View style={s.card}>
          <View style={s.routeRow}>
            <View style={s.routeDots}>
              <View style={s.dotBlack} />
              <View style={s.routeLine} />
              <View style={s.dotRed} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.routeStop}>
                <Text style={s.routeStopName}>{trip.pickup_point_name || pickup_name}</Text>
                <Text style={s.routeStopLabel}>Pickup</Text>
              </View>
              <View style={{ height: 18 }} />
              <View style={s.routeStop}>
                <Text style={s.routeStopName}>{dropoff_name}</Text>
                <Text style={s.routeStopLabel}>Drop-off</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Seats + price */}
        <View style={s.card}>
          <Text style={s.seatsLabel}>SEATS</Text>
          <View style={s.seatsRow}>
            <View style={s.stepper}>
              <TouchableOpacity style={s.stepBtn} onPress={() => setSeats(Math.max(1, seats - 1))}>
                <Text style={s.stepTxt}>−</Text>
              </TouchableOpacity>
              <Text style={s.seatCount}>{seats}</Text>
              <TouchableOpacity style={s.stepBtn} onPress={() => setSeats(Math.min(trip.available_seats, seats + 1))}>
                <Text style={s.stepTxt}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.priceCalc}>GHS {pricePerSeat} × {seats}</Text>
              <Text style={s.priceTot}>GHS {total}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={s.btn}
          activeOpacity={0.85}
          onPress={() => router.push({ pathname: '/(passenger)/payment', params: { tripId, seats: String(seats), perSeat: String(pricePerSeat), total, pickup_point_id, dropoff_point_id, pickup_name, dropoff_name } })}
        >
          <Text style={s.btnTxt}>Continue to Payment</Text>
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
  card: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  depTime: { fontSize: 26, fontWeight: '700', color: C.dark },
  depDate: { fontSize: 13, color: C.muted, marginTop: 2 },
  seatsBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  seatsBadgeTxt: { fontSize: 12, color: C.muted, fontWeight: '600' },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  driverName: { fontSize: 16, fontWeight: '600', color: C.dark },
  ratingTxt: { fontSize: 13, color: C.muted },
  reliabilityTxt: { fontSize: 13, color: C.muted },
  vehicleLine: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  vehicleTxt: { fontSize: 13, color: C.hint },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  routeDots: { alignItems: 'center', paddingTop: 4 },
  dotBlack: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.dark },
  routeLine: { width: 2, height: 28, backgroundColor: C.border, marginVertical: 4 },
  dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
  routeStop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routeStopName: { fontSize: 15, fontWeight: '500', color: C.dark, flex: 1 },
  routeStopLabel: { fontSize: 12, color: C.muted },
  seatsLabel: { fontSize: 11, fontWeight: '700', color: C.hint, letterSpacing: 0.8, marginBottom: 14 },
  seatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { fontSize: 22, color: C.dark, lineHeight: 24 },
  seatCount: { fontSize: 24, fontWeight: '700', color: C.dark, minWidth: 28, textAlign: 'center' },
  priceCalc: { fontSize: 13, color: C.muted, marginBottom: 2 },
  priceTot: { fontSize: 22, fontWeight: '700', color: C.dark },
  btn: { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  btnTxt: { fontSize: 16, fontWeight: '700', color: C.navy },
});
