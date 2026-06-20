import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

type Trip = {
  id: string; departure_time: string; driver_name: string; driver_rating: number;
  driver_reliability: number; vehicle_make: string; vehicle_model: string;
  vehicle_colour: string; plate_number: string; available_seats: number;
  pickup_point_name: string; walk_minutes: number; per_seat_price: number;
};

export default function TripsListScreen() {
  const router = useRouter();
  const { destination } = useLocalSearchParams<{ destination: string }>();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.post('/trips/search', { destination }).then(r => setTrips(r.data.trips || [])).finally(() => setLoading(false));
  }, [destination]);

  function stars(n: number) { return '⭐'.repeat(Math.round(n)); }

  if (loading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator color={COLORS.gold} size="large" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Rides to {destination}</Text>
      {trips.length === 0
        ? <View style={styles.empty}><Text style={styles.emptyIcon}>🚗</Text><Text style={styles.emptyText}>No rides match right now</Text><Text style={styles.emptyHint}>Try a different time or check back soon</Text></View>
        : (
          <FlatList
            data={trips}
            keyExtractor={t => t.id}
            contentContainerStyle={{ gap: SPACING.md, paddingBottom: SPACING.xxl }}
            renderItem={({ item: t }) => (
              <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/(passenger)/trip-detail', params: { tripId: t.id } })}>
                <View style={styles.cardTop}>
                  <Text style={styles.time}>{new Date(t.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  <Text style={styles.price}>GHS {t.per_seat_price}</Text>
                </View>
                <View style={styles.cardMid}>
                  <Text style={styles.driver}>{t.driver_name} · {stars(t.driver_rating)} · {t.driver_reliability}% reliable</Text>
                  <Text style={styles.vehicle}>{t.vehicle_colour} {t.vehicle_make} {t.vehicle_model} · {t.plate_number}</Text>
                </View>
                <View style={styles.cardBottom}>
                  <Text style={styles.pickup}>📍 {t.pickup_point_name} · {t.walk_minutes} min walk</Text>
                  <Text style={styles.seats}>{t.available_seats} seat{t.available_seats !== 1 ? 's' : ''} left</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy, padding: SPACING.lg, paddingTop: SPACING.xxl },
  heading: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.white, marginBottom: SPACING.lg },
  card: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, ...SHADOW },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  time: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.white },
  price: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.gold },
  cardMid: { gap: SPACING.xs, marginBottom: SPACING.sm },
  driver: { fontSize: FONTS.sizes.sm, color: COLORS.white },
  vehicle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm },
  pickup: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, flex: 1 },
  seats: { fontSize: FONTS.sizes.xs, color: COLORS.gold, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: FONTS.sizes.lg, color: COLORS.white, fontWeight: '600' },
  emptyHint: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
});
