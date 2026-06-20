import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: COLORS.gold, IN_PROGRESS: '#2196F3', COMPLETED: '#4CAF50',
  CANCELLED_BY_PASSENGER: COLORS.error, CANCELLED_BY_DRIVER: COLORS.error,
};

export default function HistoryScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/users/trips').then(r => setBookings(r.data.trips || [])).finally(() => setLoading(false));
  }, []);

  const now = Date.now();
  const filtered = bookings.filter(b => {
    const dep = new Date(b.departure_time).getTime();
    return tab === 'upcoming' ? dep > now && ['CONFIRMED','REQUESTED'].includes(b.status) : dep <= now || ['COMPLETED','CANCELLED_BY_PASSENGER','CANCELLED_BY_DRIVER'].includes(b.status);
  });

  return (
    <View style={s.container}>
      <Text style={s.title}>My trips</Text>
      <View style={s.tabs}>
        {(['upcoming', 'past'] as const).map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading
        ? <ActivityIndicator color={COLORS.gold} style={{ marginTop: SPACING.xl }} />
        : filtered.length === 0
          ? <View style={s.empty}><Text style={s.emptyIcon}>🗓️</Text><Text style={s.emptyText}>No {tab} trips</Text></View>
          : (
            <FlatList
              data={filtered}
              keyExtractor={b => b.id}
              contentContainerStyle={{ gap: SPACING.md, paddingBottom: SPACING.xxl }}
              renderItem={({ item: b }) => (
                <TouchableOpacity style={s.card} onPress={() => router.push({ pathname: '/(passenger)/confirmed', params: { bookingId: b.id } })}>
                  <View style={s.cardTop}>
                    <Text style={s.cardDate}>{new Date(b.departure_time).toLocaleDateString('en-GH', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                    <View style={[s.badge, { backgroundColor: STATUS_COLORS[b.status] || COLORS.border }]}>
                      <Text style={s.badgeText}>{b.status.replace(/_/g, ' ')}</Text>
                    </View>
                  </View>
                  <Text style={s.route}>{b.pickup_point_name} → {b.dropoff_point_name}</Text>
                  <Text style={s.price}>GHS {b.total_price} · {b.seats} seat{b.seats !== 1 ? 's' : ''}</Text>
                </TouchableOpacity>
              )}
            />
          )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy, padding: SPACING.lg, paddingTop: SPACING.xxl },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.white, marginBottom: SPACING.lg },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: 4, marginBottom: SPACING.lg },
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.sm },
  tabActive: { backgroundColor: COLORS.gold },
  tabText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, fontWeight: '600' },
  tabTextActive: { color: COLORS.navy },
  card: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, ...SHADOW },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  cardDate: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  badge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.sm },
  badgeText: { fontSize: FONTS.sizes.xs, color: COLORS.navy, fontWeight: '700', textTransform: 'capitalize' },
  route: { fontSize: FONTS.sizes.base, color: COLORS.white, fontWeight: '600', marginBottom: SPACING.xs },
  price: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: FONTS.sizes.base, color: COLORS.textMuted },
});
