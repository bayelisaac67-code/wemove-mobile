import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

export default function PublishSeatsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<any>();
  const [vehicle, setVehicle] = useState<any>(null);
  const [seats, setSeats] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/vehicle').then(r => {
      const v = r.data.vehicle;
      setVehicle(v);
      setSeats(Math.max(1, (v?.seat_capacity || 5) - 1));
    }).finally(() => setLoading(false));
  }, []);

  const max = vehicle ? vehicle.seat_capacity - 1 : 4;

  return (
    <View style={s.container}>
      <Text style={s.title}>Vehicle & seats</Text>
      {loading ? <ActivityIndicator color={COLORS.gold} style={{ marginTop: SPACING.xl }} /> : (
        <>
          {vehicle && (
            <View style={s.vehicleCard}>
              <Text style={s.vehicleName}>{vehicle.vehicle_colour} {vehicle.vehicle_make} {vehicle.vehicle_model}</Text>
              <Text style={s.vehiclePlate}>{vehicle.plate_number}</Text>
              <Text style={s.vehicleCapacity}>{vehicle.seat_capacity} total seats (incl. driver)</Text>
            </View>
          )}

          <Text style={s.label}>Available seats for passengers</Text>
          <View style={s.stepper}>
            <TouchableOpacity style={s.stepBtn} onPress={() => setSeats(Math.max(1, seats - 1))}>
              <Text style={s.stepText}>−</Text>
            </TouchableOpacity>
            <Text style={s.seatCount}>{seats}</Text>
            <TouchableOpacity style={s.stepBtn} onPress={() => setSeats(Math.min(max, seats + 1))}>
              <Text style={s.stepText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.hint}>Maximum {max} (your vehicle capacity − 1 for you)</Text>
        </>
      )}

      <TouchableOpacity style={s.btn} onPress={() => router.push({ pathname: '/(driver)/publish-review', params: { ...params, seats: String(seats) } })}>
        <Text style={s.btnText}>Review & publish</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy, padding: SPACING.lg, paddingTop: SPACING.xxl },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.white, marginBottom: SPACING.xl },
  vehicleCard: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.xl, ...SHADOW },
  vehicleName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.white, marginBottom: 4 },
  vehiclePlate: { fontSize: FONTS.sizes.sm, color: COLORS.gold, marginBottom: 4 },
  vehicleCapacity: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  label: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.lg },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xl, marginBottom: SPACING.md },
  stepBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.navyLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.gold },
  stepText: { fontSize: FONTS.sizes['2xl'], color: COLORS.gold, fontWeight: '700' },
  seatCount: { fontSize: 56, fontWeight: '700', color: COLORS.white, minWidth: 60, textAlign: 'center' },
  hint: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.xxl },
  btn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center', marginTop: 'auto' },
  btnText: { color: COLORS.navy, fontSize: FONTS.sizes.base, fontWeight: '700' },
});
