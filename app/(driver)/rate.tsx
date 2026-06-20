import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

const TAGS = ['On time', 'Polite', 'No-show risk', 'Paid promptly', 'Disruptive'];

export default function DriverRateScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const [passengers, setPassengers] = useState<any[]>([]);
  const [ratings, setRatings] = useState<Record<string, { stars: number; tags: string[] }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/trips/${tripId}/bookings`).then(r => {
      const completed = (r.data.bookings || []).filter((b: any) => b.status === 'COMPLETED');
      setPassengers(completed);
      const initial: Record<string, { stars: number; tags: string[] }> = {};
      completed.forEach((b: any) => { initial[b.id] = { stars: 5, tags: [] }; });
      setRatings(initial);
    }).finally(() => setLoading(false));
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await Promise.all(passengers.map(p => api.post('/ratings', { booking_id: p.id, stars: ratings[p.id]?.stars || 5, reason_tags: ratings[p.id]?.tags || [] })));
      router.replace('/(driver)/home');
    } catch { Alert.alert('Error submitting ratings'); }
    finally { setSubmitting(false); }
  }

  if (loading) return <View style={[s.container, { justifyContent: 'center' }]}><ActivityIndicator color={COLORS.gold} /></View>;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      <Text style={s.title}>Rate your passengers</Text>
      {passengers.map(p => {
        const r = ratings[p.id] || { stars: 5, tags: [] };
        return (
          <View key={p.id} style={s.card}>
            <Text style={s.passengerName}>{p.passenger_name}</Text>
            <View style={s.starsRow}>
              {[1,2,3,4,5].map(n => (
                <TouchableOpacity key={n} onPress={() => setRatings(prev => ({ ...prev, [p.id]: { ...prev[p.id], stars: n } }))}>
                  <Text style={[s.star, r.stars >= n && s.starActive]}>{r.stars >= n ? '⭐' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.tagsWrap}>
              {TAGS.map(t => (
                <TouchableOpacity key={t} style={[s.tag, r.tags.includes(t) && s.tagSelected]}
                  onPress={() => setRatings(prev => ({ ...prev, [p.id]: { ...prev[p.id], tags: prev[p.id].tags.includes(t) ? prev[p.id].tags.filter(x => x !== t) : [...prev[p.id].tags, t] } }))}>
                  <Text style={[s.tagText, r.tags.includes(t) && s.tagTextSelected]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}
      <TouchableOpacity style={[s.btn, submitting && s.btnDisabled]} onPress={handleSubmit} disabled={submitting}>
        <Text style={s.btnText}>{submitting ? 'Submitting…' : 'Submit & finish'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xxl, paddingBottom: SPACING.xxl },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.white, marginBottom: SPACING.xl },
  card: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW },
  passengerName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.white, marginBottom: SPACING.md },
  starsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  star: { fontSize: 28, color: COLORS.textMuted },
  starActive: { color: COLORS.gold },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  tag: { paddingHorizontal: SPACING.md, paddingVertical: 4, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border },
  tagSelected: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  tagText: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  tagTextSelected: { color: COLORS.navy, fontWeight: '600' },
  btn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.lg },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: COLORS.navy, fontSize: FONTS.sizes.base, fontWeight: '700' },
});
