import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

export default function TripDetailScreen() {
  const router = useRouter();
  const { tripId, pickup_point_id, dropoff_point_id } = useLocalSearchParams<{ tripId: string; pickup_point_id: string; dropoff_point_id: string }>();
  const [trip, setTrip] = useState<any>(null);
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/trips/${tripId}`, { params: { pickup_point_id, dropoff_point_id } })
      .then(r => setTrip(r.data.trip))
      .catch(() => setTrip(null))
      .finally(() => setLoading(false));
  }, [tripId]);

  if (loading) return <View style={[s.container, { justifyContent: 'center' }]}><ActivityIndicator color={COLORS.gold} size="large" /></View>;
  if (!trip) return null;

  const total = (trip.per_seat_price * seats).toFixed(0);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      <Text style={s.title}>Trip details</Text>

      <View style={s.card}>
        <Row label="Departure" value={new Date(trip.departure_time).toLocaleString()} />
        <Row label="Driver" value={`${trip.driver_name} · ⭐${trip.driver_rating?.toFixed(1)}`} />
        <Row label="Vehicle" value={`${trip.vehicle_colour} ${trip.vehicle_make} ${trip.vehicle_model}`} />
        <Row label="Plate" value={trip.plate_number} />
        <Row label="Seats left" value={String(trip.available_seats)} />
        <Row label="Your pickup" value={trip.pickup_point_name || '—'} />
      </View>

      <Text style={s.seatLabel}>Number of seats</Text>
      <View style={s.stepper}>
        <TouchableOpacity style={s.stepBtn} onPress={() => setSeats(Math.max(1, seats - 1))}>
          <Text style={s.stepText}>−</Text>
        </TouchableOpacity>
        <Text style={s.seatCount}>{seats}</Text>
        <TouchableOpacity style={s.stepBtn} onPress={() => setSeats(Math.min(trip.available_seats, seats + 1))}>
          <Text style={s.stepText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={s.priceRow}>
        <Text style={s.priceLabel}>Total</Text>
        <Text style={s.priceValue}>GHS {total}</Text>
      </View>

      <TouchableOpacity style={s.btn} onPress={() => router.push({ pathname: '/(passenger)/payment', params: { tripId, seats: String(seats), total, pickup_point_id, dropoff_point_id } })}>
        <Text style={s.btnText}>Continue to payment</Text>
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
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xxl },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.white, marginBottom: SPACING.lg },
  card: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.xl, ...SHADOW },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  rowValue: { fontSize: FONTS.sizes.sm, color: COLORS.white, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  seatLabel: { fontSize: FONTS.sizes.base, color: COLORS.white, fontWeight: '600', marginBottom: SPACING.md },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xl, marginBottom: SPACING.xl },
  stepBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.navyLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.gold },
  stepText: { fontSize: FONTS.sizes.xl, color: COLORS.gold, fontWeight: '700' },
  seatCount: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.white, minWidth: 32, textAlign: 'center' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl, backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md },
  priceLabel: { fontSize: FONTS.sizes.base, color: COLORS.textMuted },
  priceValue: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.gold },
  btn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center' },
  btnText: { color: COLORS.navy, fontSize: FONTS.sizes.base, fontWeight: '700' },
});
