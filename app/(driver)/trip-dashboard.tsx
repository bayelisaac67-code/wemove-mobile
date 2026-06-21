import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

export default function TripDashboardScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const [trip, setTrip] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [t, b] = await Promise.all([api.get(`/trips/${tripId}`), api.get(`/trips/${tripId}/bookings`)]);
    setTrip(t.data.trip);
    setBookings(b.data.bookings || []);
  }

  useEffect(() => { refresh().catch(() => {}).finally(() => setLoading(false)); }, []);

  async function handleAccept(bookingId: string) {
    await api.patch(`/bookings/${bookingId}/accept`);
    refresh();
  }

  async function handleReject(bookingId: string) {
    await api.patch(`/bookings/${bookingId}/reject`);
    refresh();
  }

  async function handleStart() {
    await api.patch(`/trips/${tripId}/start`);
    router.replace({ pathname: '/(driver)/in-trip', params: { tripId } });
  }

  async function handleCancel() {
    Alert.alert('Cancel trip?', 'All confirmed passengers will be notified and offered alternatives.', [
      { text: 'Keep trip', style: 'cancel' },
      { text: 'Cancel trip', style: 'destructive', onPress: async () => { await api.patch(`/trips/${tripId}/cancel`); router.replace('/(driver)/home'); } },
    ]);
  }

  const requested = bookings.filter(b => b.status === 'REQUESTED');
  const confirmed = bookings.filter(b => b.status === 'CONFIRMED');

  if (loading) return <View style={[s.container, { justifyContent: 'center' }]}><ActivityIndicator color={COLORS.gold} size="large" /></View>;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      <Text style={s.title}>Trip dashboard</Text>

      <View style={s.tripCard}>
        <Text style={s.tripTime}>{trip && new Date(trip.departure_time).toLocaleString()}</Text>
        <Text style={s.tripRoute}>{trip?.origin_name} → {trip?.destination_name}</Text>
        <View style={s.seatsRow}>
          <Text style={s.seatsText}>{trip?.available_seats} of {trip?.total_seats} seats available</Text>
          <View style={s.seatsBar}>
            <View style={[s.seatsBarFill, { width: `${((trip?.total_seats - trip?.available_seats) / trip?.total_seats) * 100}%` }]} />
          </View>
        </View>
      </View>

      {requested.length > 0 && (
        <>
          <Text style={s.sectionLabel}>Pending requests ({requested.length})</Text>
          {requested.map(b => (
            <View key={b.id} style={s.requestCard}>
              <View style={s.requestInfo}>
                <Text style={s.requestName}>{b.passenger_name} · ⭐{b.passenger_rating?.toFixed(1)} · {b.passenger_reliability}%</Text>
                <Text style={s.requestDetails}>{b.seats} seat{b.seats !== 1 ? 's' : ''} · {b.pickup_point_name}</Text>
              </View>
              <View style={s.requestActions}>
                <TouchableOpacity style={s.rejectBtn} onPress={() => handleReject(b.id)}><Text style={s.rejectText}>✕</Text></TouchableOpacity>
                <TouchableOpacity style={s.acceptBtn} onPress={() => handleAccept(b.id)}><Text style={s.acceptText}>✓</Text></TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}

      {confirmed.length > 0 && (
        <>
          <Text style={s.sectionLabel}>Confirmed passengers ({confirmed.length})</Text>
          {confirmed.map(b => (
            <View key={b.id} style={s.confirmedCard}>
              <Text style={s.confirmedName}>{b.passenger_name}</Text>
              <Text style={s.confirmedDetails}>{b.seats} seat{b.seats !== 1 ? 's' : ''} · {b.pickup_point_name} · GHS {b.total_price}</Text>
            </View>
          ))}
        </>
      )}

      <View style={s.actions}>
        {trip?.status === 'PUBLISHED' && (
          <TouchableOpacity style={s.startBtn} onPress={handleStart}>
            <Text style={s.startText}>Start trip</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.cancelBtn} onPress={handleCancel}>
          <Text style={s.cancelText}>Cancel trip</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xxl, paddingBottom: SPACING.xxl },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.white, marginBottom: SPACING.lg },
  tripCard: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.xl, ...SHADOW },
  tripTime: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: 4 },
  tripRoute: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white, marginBottom: SPACING.md },
  seatsRow: { gap: SPACING.xs },
  seatsText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  seatsBar: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  seatsBarFill: { height: '100%', backgroundColor: COLORS.gold, borderRadius: 3 },
  sectionLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.sm, marginTop: SPACING.md },
  requestCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW },
  requestInfo: { flex: 1 },
  requestName: { fontSize: FONTS.sizes.sm, color: COLORS.white, fontWeight: '600', marginBottom: 2 },
  requestDetails: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  requestActions: { flexDirection: 'row', gap: SPACING.sm },
  rejectBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.error + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.error },
  rejectText: { color: COLORS.error, fontSize: FONTS.sizes.base, fontWeight: '700' },
  acceptBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4CAF5022', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#4CAF50' },
  acceptText: { color: '#4CAF50', fontSize: FONTS.sizes.base, fontWeight: '700' },
  confirmedCard: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  confirmedName: { fontSize: FONTS.sizes.sm, color: COLORS.white, fontWeight: '600', marginBottom: 2 },
  confirmedDetails: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  actions: { gap: SPACING.md, marginTop: SPACING.xl },
  startBtn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center' },
  startText: { color: COLORS.navy, fontSize: FONTS.sizes.base, fontWeight: '700' },
  cancelBtn: { borderWidth: 1, borderColor: COLORS.error, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center' },
  cancelText: { color: COLORS.error, fontSize: FONTS.sizes.base, fontWeight: '600' },
});
