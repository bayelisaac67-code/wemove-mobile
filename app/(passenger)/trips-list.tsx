import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../src/lib/api';
import MapHero from '../../src/components/MapHero';

const CORRIDOR_ID = 'a1b2c3d4-0000-0000-0000-000000000001';
const MAP_H = Math.round(Dimensions.get('window').height * 0.30);

const C = {
  navy: '#0D1B2A', gold: '#F5B800', white: '#FFFFFF',
  bg: '#F6F7F9', dark: '#111827', muted: '#6B7280',
  border: '#E5E7EB', hint: '#9CA3AF', cardBg: '#F3F4F6', green: '#059669',
};

type Trip = {
  id: string; departure_time: string; driver_name: string;
  driver_rating: any; driver_reliability: number;
  vehicle_make: string; vehicle_model: string; vehicle_colour: string;
  plate_number: string; available_seats: number; per_seat_price: number;
};

export default function TripsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { corridor_id, direction, pickup_point_id, dropoff_point_id, pickup_name, dropoff_name } =
    useLocalSearchParams<{ corridor_id: string; direction: string; pickup_point_id: string; dropoff_point_id: string; pickup_name: string; dropoff_name: string }>();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [points, setPoints] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [co2, setCo2] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/trips/search', { params: { corridor_id, direction, pickup_point_id, dropoff_point_id, seats: 1 } })
      .then(r => {
        const list: Trip[] = r.data.trips || [];
        setTrips(list);
        setCo2(r.data.co2_saved_kg ?? null);
        if (list.length) setSelectedId(list[0].id);
      })
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));

    api.get(`/corridors/${CORRIDOR_ID}/pickup-points`)
      .then(r => setPoints(r.data.pickupPoints || []))
      .catch(() => {});
  }, [pickup_point_id, dropoff_point_id]);

  const fromPt = points.find(p => p.id === pickup_point_id) || null;
  const toPt = points.find(p => p.id === dropoff_point_id) || null;
  const selected = trips.find(t => t.id === selectedId) || null;

  function continueToDetail() {
    if (!selected) return;
    router.push({ pathname: '/(passenger)/trip-detail', params: { tripId: selected.id, pickup_point_id, dropoff_point_id, pickup_name, dropoff_name } });
  }

  return (
    <View style={s.root}>
      <MapHero points={points} from={fromPt} to={toPt} height={MAP_H} interactive={false} onBack={() => router.back()} />

      <View style={s.sheet}>
        {/* Route bar */}
        <View style={s.routeBar}>
          <Feather name="map-pin" size={14} color={C.green} />
          <Text style={s.routeTxt} numberOfLines={1}>{pickup_name}</Text>
          <Feather name="arrow-right" size={14} color={C.muted} />
          <Text style={s.routeTxt} numberOfLines={1}>{dropoff_name}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={C.gold} style={{ marginTop: 40 }} size="large" />
        ) : trips.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🚗</Text>
            <Text style={s.emptyTitle}>No rides available right now</Text>
            <Text style={s.emptyHint}>Try a different time or check back shortly.</Text>
          </View>
        ) : (
          <>
            <View style={s.listHeadRow}>
              <Text style={s.listHead}>{trips.length} ride{trips.length !== 1 ? 's' : ''} available</Text>
              {co2 != null && <Text style={s.co2Head}>🌿 ~{co2} kg CO₂ saved</Text>}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
              {trips.map(t => {
                const on = t.id === selectedId;
                return (
                  <TouchableOpacity key={t.id} style={[s.ride, on && s.rideOn]} activeOpacity={0.85} onPress={() => setSelectedId(t.id)}>
                    <View style={s.rideAvatar}><Text style={s.rideAvatarTxt}>{(t.driver_name || '?')[0].toUpperCase()}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.rideName}>{t.driver_name}</Text>
                      <Text style={s.rideMeta}>
                        ⭐ {Number(t.driver_rating || 0).toFixed(1)} · {t.available_seats} seats · {new Date(t.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <Text style={s.rideVehicle}>{t.vehicle_colour} {t.vehicle_make} · {t.plate_number}</Text>
                    </View>
                    <Text style={s.ridePrice}>GHS {t.per_seat_price}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}
      </View>

      {/* Sticky CTA */}
      {!loading && trips.length > 0 && selected && (
        <View style={[s.ctaBar, { paddingBottom: insets.bottom || 16 }]}>
          <View style={s.payChip}>
            <Feather name="dollar-sign" size={15} color={C.green} />
            <Text style={s.payTxt}>Cash</Text>
            <Feather name="chevron-down" size={15} color={C.muted} />
          </View>
          <TouchableOpacity style={s.cta} onPress={continueToDetail} activeOpacity={0.85}>
            <Text style={s.ctaTxt}>Continue · GHS {selected.per_seat_price}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  sheet: { flex: 1, backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, paddingHorizontal: 20, paddingTop: 16 },
  routeBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.cardBg, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 16 },
  routeTxt: { fontSize: 13, fontWeight: '600', color: C.dark, flexShrink: 1 },
  listHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  listHead: { fontSize: 14, fontWeight: '700', color: C.dark },
  co2Head: { fontSize: 12, color: C.green, fontWeight: '600' },
  ride: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, padding: 14, marginBottom: 10 },
  rideOn: { borderColor: C.gold, backgroundColor: '#FFFDF5' },
  rideAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.cardBg, alignItems: 'center', justifyContent: 'center' },
  rideAvatarTxt: { fontSize: 17, fontWeight: '700', color: '#374151' },
  rideName: { fontSize: 15, fontWeight: '700', color: C.dark },
  rideMeta: { fontSize: 12, color: C.muted, marginTop: 2 },
  rideVehicle: { fontSize: 11, color: C.hint, marginTop: 2 },
  ridePrice: { fontSize: 17, fontWeight: '800', color: C.dark },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 6 },
  emptyHint: { fontSize: 13, color: C.muted, textAlign: 'center' },
  ctaBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.white, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  payChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.cardBg, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14 },
  payTxt: { fontSize: 14, fontWeight: '600', color: C.dark },
  cta: { flex: 1, backgroundColor: C.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  ctaTxt: { fontSize: 16, fontWeight: '800', color: C.navy },
});
