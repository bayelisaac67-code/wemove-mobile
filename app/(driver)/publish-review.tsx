import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

const CORRIDOR_ID = '00000000-0000-0000-0000-000000000001';

export default function PublishReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<any>();
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.post('/trips/price-range', { seats: Number(params.seats) }).then(r => setPriceRange(r.data.range)).catch(() => {});
  }, []);

  async function handlePublish() {
    setLoading(true);
    try {
      const departure = new Date();
      departure.setHours(Number(params.hour), Number(params.min), 0, 0);
      await api.post('/trips', {
        corridor_id: CORRIDOR_ID,
        direction: params.direction,
        origin_point_id: params.origin,
        destination_point_id: params.destination,
        departure_time: departure.toISOString(),
        total_seats: Number(params.seats),
        recurring: params.recurring === 'true',
        weekdays: params.recurring === 'true' ? JSON.parse(params.days || '[]') : undefined,
      });
      Alert.alert('Trip published!', 'Passengers can now find your trip.', [{ text: 'OK', onPress: () => router.replace('/(driver)/home') }]);
    } catch (e: any) {
      Alert.alert('Failed to publish', e?.response?.data?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      <Text style={s.title}>Review your trip</Text>

      <View style={s.card}>
        <Row label="Corridor" value="Accra Central ↔ Oyarifa" />
        <Row label="Direction" value={params.direction === 'FORWARD' ? 'Accra Central → Oyarifa' : 'Oyarifa → Accra Central'} />
        <Row label="Departure" value={`${params.hour}:${params.min}`} />
        <Row label="Seats offered" value={params.seats} />
        <Row label="Recurring" value={params.recurring === 'true' ? `Yes · ${JSON.parse(params.days || '[]').length} days/week` : 'No'} />
      </View>

      <View style={s.earningsCard}>
        <Text style={s.earningsLabel}>Passengers will see</Text>
        <Text style={s.earningsPrice}>{priceRange ? `GHS ${priceRange.min} – ${priceRange.max}` : '—'} per seat</Text>
        <Text style={s.earningsSub}>Your earnings: ~80–90% of fare collected</Text>
      </View>

      <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handlePublish} disabled={loading}>
        {loading ? <ActivityIndicator color={COLORS.navy} /> : <Text style={s.btnText}>Publish trip</Text>}
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
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xxl, paddingBottom: SPACING.xxl },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.white, marginBottom: SPACING.xl },
  card: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg, ...SHADOW },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  rowValue: { fontSize: FONTS.sizes.sm, color: COLORS.white, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  earningsCard: { backgroundColor: COLORS.gold + '22', borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1.5, borderColor: COLORS.gold, alignItems: 'center', marginBottom: SPACING.xl },
  earningsLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.xs },
  earningsPrice: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.gold, marginBottom: SPACING.xs },
  earningsSub: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  btn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: COLORS.navy, fontSize: FONTS.sizes.base, fontWeight: '700' },
});
