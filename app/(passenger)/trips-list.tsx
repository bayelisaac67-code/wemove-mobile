import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '../../src/lib/api';
import BottomNav from '../../src/components/BottomNav';

const C = {
  navy: '#0D1B2A', gold: '#F5B800', white: '#FFFFFF',
  bg: '#F6F7F9', dark: '#111827', muted: '#6B7280',
  border: '#E5E7EB', hint: '#9CA3AF',
};

type Trip = {
  id: string; departure_time: string; driver_name: string;
  driver_rating: any; driver_reliability: number;
  vehicle_make: string; vehicle_model: string; vehicle_colour: string;
  plate_number: string; available_seats: number;
  pickup_point_name: string; per_seat_price: number;
};

function Avatar({ name }: { name: string }) {
  const letter = (name || '?')[0].toUpperCase();
  return (
    <View style={av.wrap}>
      <Text style={av.txt}>{letter}</Text>
    </View>
  );
}
const av = StyleSheet.create({
  wrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  txt: { fontSize: 16, fontWeight: '700', color: '#374151' },
});

export default function TripsListScreen() {
  const router = useRouter();
  const { corridor_id, direction, pickup_point_id, dropoff_point_id, pickup_name, dropoff_name } =
    useLocalSearchParams<{ corridor_id: string; direction: string; pickup_point_id: string; dropoff_point_id: string; pickup_name: string; dropoff_name: string }>();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/trips/search', { params: { corridor_id, direction, pickup_point_id, dropoff_point_id, seats: 1 } })
      .then(r => setTrips(r.data.trips || []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, [pickup_point_id, dropoff_point_id]);

  return (
    <View style={s.root}>
      {/* Navy header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.title}>Available Rides</Text>
        <Text style={s.route}>{pickup_name} → {dropoff_name}</Text>
        {!loading && (
          <View style={s.countBadge}>
            <Text style={s.countTxt}>{trips.length} ride{trips.length !== 1 ? 's' : ''} found</Text>
          </View>
        )}
      </View>

      {/* White content */}
      <View style={s.content}>
        {loading
          ? <ActivityIndicator color={C.gold} style={{ marginTop: 40 }} size="large" />
          : trips.length === 0
            ? (
              <View style={s.empty}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🚗</Text>
                <Text style={s.emptyTitle}>No rides available</Text>
                <Text style={s.emptyHint}>Try a different time or check back shortly</Text>
              </View>
            )
            : (
              <FlatList
                data={trips}
                keyExtractor={t => t.id}
                contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: t }) => (
                  <TouchableOpacity
                    style={s.card}
                    activeOpacity={0.8}
                    onPress={() => router.push({ pathname: '/(passenger)/trip-detail', params: { tripId: t.id, pickup_point_id, dropoff_point_id, pickup_name, dropoff_name } })}
                  >
                    <View style={s.cardTop}>
                      <View>
                        <Text style={s.time}>{new Date(t.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        <Text style={s.date}>{new Date(t.departure_time).toLocaleDateString('en-GH', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={s.price}>GHS {t.per_seat_price}</Text>
                        <Text style={s.perSeat}>per seat</Text>
                      </View>
                    </View>

                    <View style={s.driverRow}>
                      <Avatar name={t.driver_name} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.driverName}>{t.driver_name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                          <Text style={s.rating}>⭐ {Number(t.driver_rating || 0).toFixed(1)}</Text>
                          <Text style={s.reliability}>○ {t.driver_reliability}% reliable</Text>
                        </View>
                      </View>
                      <View style={s.seatsBadge}>
                        <Feather name="users" size={12} color={C.muted} />
                        <Text style={s.seatsTxt}>{t.available_seats} left</Text>
                      </View>
                    </View>

                    <View style={s.vehicleLine}>
                      <Feather name="truck" size={13} color={C.hint} style={{ marginRight: 6 }} />
                      <Text style={s.vehicleTxt}>{t.vehicle_make} · {t.vehicle_colour} · {t.plate_number}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
      </View>

      <BottomNav active="home" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navy },
  header: { padding: 20, paddingTop: 56, paddingBottom: 28 },
  backBtn: { marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  route: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 10 },
  countBadge: { backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  countTxt: { fontSize: 12, color: '#fff', fontWeight: '600' },
  content: { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 20 },
  card: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  time: { fontSize: 22, fontWeight: '700', color: C.dark },
  date: { fontSize: 12, color: C.muted, marginTop: 2 },
  price: { fontSize: 18, fontWeight: '700', color: C.dark },
  perSeat: { fontSize: 11, color: C.muted, textAlign: 'right' },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  driverName: { fontSize: 15, fontWeight: '600', color: C.dark },
  rating: { fontSize: 12, color: C.muted },
  reliability: { fontSize: 12, color: C.muted },
  seatsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  seatsTxt: { fontSize: 12, color: C.muted, fontWeight: '600' },
  vehicleLine: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  vehicleTxt: { fontSize: 12, color: C.hint },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: C.dark, marginBottom: 6 },
  emptyHint: { fontSize: 13, color: C.muted, textAlign: 'center' },
});
