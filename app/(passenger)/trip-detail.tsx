import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../src/lib/api';
import MapHero from '../../src/components/MapHero';

const CORRIDOR_ID = 'a1b2c3d4-0000-0000-0000-000000000001';
const MAP_H = Math.round(Dimensions.get('window').height * 0.28);

const C = {
  navy: '#0D1B2A', gold: '#F5B800', white: '#FFFFFF',
  bg: '#F6F7F9', dark: '#111827', muted: '#6B7280',
  border: '#E5E7EB', hint: '#9CA3AF', green: '#059669', greenBg: '#ECFDF5',
};

export default function TripDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tripId, pickup_point_id, dropoff_point_id, pickup_name, dropoff_name } =
    useLocalSearchParams<{ tripId: string; pickup_point_id: string; dropoff_point_id: string; pickup_name: string; dropoff_name: string }>();
  const [trip, setTrip] = useState<any>(null);
  const [points, setPoints] = useState<any[]>([]);
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/trips/${tripId}`, { params: { pickup_point_id, dropoff_point_id } })
      .then(r => setTrip(r.data.trip))
      .catch(() => setTrip(null))
      .finally(() => setLoading(false));
    api.get(`/corridors/${CORRIDOR_ID}/pickup-points`)
      .then(r => setPoints(r.data.pickupPoints || []))
      .catch(() => {});
  }, [tripId]);

  if (loading) return <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center' }}><ActivityIndicator color={C.gold} size="large" /></View>;
  if (!trip) return null;

  const pricePerSeat = Number(trip.per_seat_price || 0);
  const total = (pricePerSeat * seats).toFixed(0);
  const depTime = new Date(trip.departure_time);
  const fromPt = points.find(p => p.id === pickup_point_id) || null;
  const toPt = points.find(p => p.id === dropoff_point_id) || null;
  const co2 = trip.co2_saved_kg != null ? (Number(trip.co2_saved_kg) * seats).toFixed(1) : null;

  return (
    <View style={s.root}>
      <MapHero points={points} from={fromPt} to={toPt} height={MAP_H} interactive={false} onBack={() => router.back()} />

      <View style={s.sheet}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={s.handle} />

          {/* Driver */}
          <View style={s.driverRow}>
            <View style={s.avatar}><Text style={s.avatarTxt}>{(trip.driver_name || '?')[0].toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.driverName}>{trip.driver_name}</Text>
              <Text style={s.driverMeta}>⭐ {trip.driver_rating != null ? Number(trip.driver_rating).toFixed(1) : 'New'} · {trip.driver_reliability ?? 100}% reliable</Text>
            </View>
            <View style={s.timePill}>
              <Text style={s.timeTxt}>{depTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <Text style={s.dateTxt}>{depTime.toLocaleDateString('en-GH', { month: 'short', day: 'numeric' })}</Text>
            </View>
          </View>

          <Text style={s.vehicle}>🚗 {trip.vehicle_colour} {trip.vehicle_make} {trip.vehicle_model} · {trip.plate_number}</Text>

          {/* Route */}
          <View style={s.routeCard}>
            <View style={s.routeDots}><View style={s.dotGreen} /><View style={s.routeLine} /><View style={s.dotRed} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.stopName}>{trip.pickup_point_name || pickup_name}</Text>
              <Text style={s.stopLabel}>Pickup</Text>
              <View style={{ height: 14 }} />
              <Text style={s.stopName}>{dropoff_name}</Text>
              <Text style={s.stopLabel}>Drop-off</Text>
            </View>
          </View>

          {/* Seats */}
          <View style={s.seatsRow}>
            <View>
              <Text style={s.seatsLabel}>SEATS</Text>
              <Text style={s.seatsHint}>{trip.available_seats} available</Text>
            </View>
            <View style={s.stepper}>
              <TouchableOpacity style={s.stepBtn} onPress={() => setSeats(Math.max(1, seats - 1))}><Text style={s.stepTxt}>−</Text></TouchableOpacity>
              <Text style={s.seatCount}>{seats}</Text>
              <TouchableOpacity style={s.stepBtn} onPress={() => setSeats(Math.min(trip.available_seats, seats + 1))}><Text style={s.stepTxt}>+</Text></TouchableOpacity>
            </View>
          </View>

          {/* Carbon */}
          {co2 != null && (
            <View style={s.carbon}>
              <Text style={s.carbonTxt}>🌿 ~{co2} kg CO₂ saved vs riding solo</Text>
              {trip.solo_estimate && <Text style={s.soloTxt}>A solo ride would cost about GHS {trip.solo_estimate.min}–{trip.solo_estimate.max}.</Text>}
            </View>
          )}
        </ScrollView>

        {/* Sticky CTA */}
        <View style={[s.ctaBar, { paddingBottom: insets.bottom || 16 }]}>
          <View>
            <Text style={s.ctaPrice}>GHS {total}</Text>
            <Text style={s.ctaSub}>GHS {pricePerSeat} × {seats}</Text>
          </View>
          <TouchableOpacity
            style={s.cta}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/(passenger)/payment', params: { tripId, seats: String(seats), perSeat: String(pricePerSeat), total, pickup_point_id, dropoff_point_id, pickup_name, dropoff_name } })}
          >
            <Text style={s.ctaTxt}>Continue to Payment</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  sheet: { flex: 1, backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, paddingHorizontal: 20 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 10, marginBottom: 16 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 19, fontWeight: '700', color: '#374151' },
  driverName: { fontSize: 17, fontWeight: '700', color: C.dark },
  driverMeta: { fontSize: 12, color: C.muted, marginTop: 2 },
  timePill: { alignItems: 'flex-end' },
  timeTxt: { fontSize: 18, fontWeight: '800', color: C.dark },
  dateTxt: { fontSize: 12, color: C.muted },
  vehicle: { fontSize: 13, color: C.muted, marginBottom: 16 },
  routeCard: { flexDirection: 'row', gap: 14, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 16, marginBottom: 16 },
  routeDots: { alignItems: 'center', paddingTop: 4 },
  dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#16A34A' },
  routeLine: { width: 2, height: 30, backgroundColor: C.border, marginVertical: 4 },
  dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
  stopName: { fontSize: 15, fontWeight: '600', color: C.dark },
  stopLabel: { fontSize: 12, color: C.muted, marginTop: 1 },
  seatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  seatsLabel: { fontSize: 11, fontWeight: '700', color: C.hint, letterSpacing: 0.8 },
  seatsHint: { fontSize: 13, color: C.muted, marginTop: 3 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { fontSize: 22, color: C.dark, lineHeight: 24 },
  seatCount: { fontSize: 22, fontWeight: '700', color: C.dark, minWidth: 28, textAlign: 'center' },
  carbon: { backgroundColor: C.greenBg, borderRadius: 12, padding: 14 },
  carbonTxt: { fontSize: 13, fontWeight: '600', color: C.green },
  soloTxt: { fontSize: 12, color: C.muted, marginTop: 6 },
  ctaBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  ctaPrice: { fontSize: 20, fontWeight: '800', color: C.dark },
  ctaSub: { fontSize: 12, color: C.muted },
  cta: { flex: 1, backgroundColor: C.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  ctaTxt: { fontSize: 16, fontWeight: '800', color: C.navy },
});
