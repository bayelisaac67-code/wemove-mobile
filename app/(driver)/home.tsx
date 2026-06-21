import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

export default function DriverHomeScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/trips?role=driver'),
      api.get('/users/earnings'),
    ]).then(([t, e]) => {
      setTrips(t.data.trips || []);
      setEarnings(e.data.total_earnings || 0);
      setPendingRequests(t.data.trips?.reduce((acc: number, tr: any) => acc + (tr.pending_requests || 0), 0) || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      <View style={s.header}>
        <Text style={s.greeting}>Driver dashboard</Text>
        <TouchableOpacity onPress={() => router.push('/(passenger)/home')}>
          <Text style={s.switchText}>Switch to passenger</Text>
        </TouchableOpacity>
      </View>

      <View style={s.statsRow}>
        <View style={s.stat}>
          <Text style={s.statValue}>GHS {earnings.toFixed(0)}</Text>
          <Text style={s.statLabel}>Total earnings</Text>
        </View>
        <View style={s.stat}>
          <Text style={[s.statValue, pendingRequests > 0 && { color: COLORS.error }]}>{pendingRequests}</Text>
          <Text style={s.statLabel}>Pending requests</Text>
        </View>
      </View>

      <TouchableOpacity style={s.publishBtn} onPress={() => router.push('/(driver)/publish-corridor')}>
        <Text style={s.publishIcon}>＋</Text>
        <Text style={s.publishText}>Publish a trip</Text>
      </TouchableOpacity>

      <Text style={s.sectionLabel}>Your trips</Text>
      {loading
        ? <ActivityIndicator color={COLORS.gold} />
        : trips.length === 0
          ? <Text style={s.empty}>No trips published yet</Text>
          : trips.map(t => (
            <TouchableOpacity key={t.id} style={s.tripCard} onPress={() => router.push({ pathname: '/(driver)/trip-dashboard', params: { tripId: t.id } })}>
              <View style={s.tripTop}>
                <Text style={s.tripTime}>{new Date(t.departure_time).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                <View style={[s.tripBadge, { backgroundColor: t.status === 'PUBLISHED' ? COLORS.gold + '33' : COLORS.navyLight }]}>
                  <Text style={[s.tripBadgeText, { color: t.status === 'PUBLISHED' ? COLORS.gold : COLORS.textMuted }]}>{t.status}</Text>
                </View>
              </View>
              <Text style={s.tripRoute}>{t.origin_name} → {t.destination_name}</Text>
              <Text style={s.tripSeats}>{t.available_seats} of {t.total_seats} seats available · {t.pending_requests || 0} pending</Text>
            </TouchableOpacity>
          ))
      }
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xxl, paddingBottom: SPACING.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  greeting: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.white },
  switchText: { fontSize: FONTS.sizes.sm, color: COLORS.gold },
  statsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  stat: { flex: 1, backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', ...SHADOW },
  statValue: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.gold, marginBottom: 4 },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  publishBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.xl },
  publishIcon: { fontSize: FONTS.sizes.xl, color: COLORS.navy, fontWeight: '700' },
  publishText: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.navy },
  sectionLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.md },
  tripCard: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW },
  tripTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
  tripTime: { fontSize: FONTS.sizes.sm, color: COLORS.white, fontWeight: '600' },
  tripBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.sm },
  tripBadgeText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  tripRoute: { fontSize: FONTS.sizes.base, color: COLORS.white, fontWeight: '600', marginBottom: 4 },
  tripSeats: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  empty: { color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xl },
});
