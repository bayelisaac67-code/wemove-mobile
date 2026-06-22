import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '../../src/lib/api';
import BottomNav from '../../src/components/BottomNav';

const C = {
  navy: '#0D1B2A', gold: '#F5B800', white: '#FFFFFF',
  bg: '#F6F7F9', dark: '#111827', muted: '#6B7280',
  border: '#E5E7EB', hint: '#9CA3AF', error: '#EF4444',
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  CONFIRMED:              { bg: '#FEF3C7', color: '#D97706' },
  REQUESTED:             { bg: '#FEF3C7', color: '#D97706' },
  IN_PROGRESS:           { bg: '#DBEAFE', color: '#1D4ED8' },
  COMPLETED:             { bg: '#DCFCE7', color: '#16A34A' },
  CANCELLED_BY_PASSENGER: { bg: '#FEE2E2', color: '#DC2626' },
  CANCELLED_BY_DRIVER:   { bg: '#FEE2E2', color: '#DC2626' },
};

export default function HistoryScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/users/me/trips')
      .then(r => setBookings(r.data.bookings || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const now = Date.now();
  const upcoming = bookings.filter(b => {
    const dep = new Date(b.departure_time).getTime();
    return dep > now && ['CONFIRMED', 'REQUESTED'].includes(b.status);
  });
  const past = bookings.filter(b => {
    const dep = new Date(b.departure_time).getTime();
    return dep <= now || ['COMPLETED', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER'].includes(b.status);
  });
  const filtered = tab === 'upcoming' ? upcoming : past;

  return (
    <View style={s.root}>
      {/* Navy header */}
      <View style={s.header}>
        <Text style={s.title}>My Trips</Text>
      </View>

      {/* White content */}
      <View style={s.content}>
        {/* Tabs */}
        <View style={s.tabs}>
          {(['upcoming', 'past'] as const).map(t => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabOn]} onPress={() => setTab(t)}>
              <Text style={[s.tabTxt, tab === t && s.tabTxtOn]}>
                {t === 'upcoming' ? 'Upcoming' : 'Past'} ({t === 'upcoming' ? upcoming.length : past.length})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading
          ? <ActivityIndicator color={C.gold} style={{ marginTop: 40 }} />
          : filtered.length === 0
            ? (
              <View style={s.empty}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🗓️</Text>
                <Text style={s.emptyTxt}>No {tab} trips</Text>
              </View>
            )
            : (
              <FlatList
                data={filtered}
                keyExtractor={b => b.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
                renderItem={({ item: b }) => {
                  const st = STATUS_STYLE[b.status] || { bg: C.bg, color: C.muted };
                  const dep = new Date(b.departure_time);
                  const relTime = tab === 'upcoming'
                    ? `in ${Math.round((dep.getTime() - now) / 3600000)}h`
                    : `${Math.round((now - dep.getTime()) / 86400000)} days ago`;
                  return (
                    <TouchableOpacity
                      style={s.card}
                      activeOpacity={0.8}
                      onPress={() => router.push({ pathname: '/(passenger)/confirmed', params: { bookingId: b.id } })}
                    >
                      <View style={s.cardTop}>
                        <View style={[s.badge, { backgroundColor: st.bg }]}>
                          <Text style={[s.badgeTxt, { color: st.color }]}>{b.status.replace(/_/g, ' ')}</Text>
                        </View>
                        <Text style={s.fareAmt}>GHS {b.total_price}</Text>
                      </View>
                      <View style={s.routeRow}>
                        <Feather name="map-pin" size={13} color={C.hint} style={{ marginRight: 6, marginTop: 2 }} />
                        <Text style={s.routeTxt} numberOfLines={1}>{b.pickup_name} → {b.dropoff_name}</Text>
                      </View>
                      <View style={s.metaRow}>
                        <Text style={s.metaTxt}>{b.seats} seat{b.seats !== 1 ? 's' : ''}</Text>
                        <Text style={s.metaDot}>·</Text>
                        <Text style={s.metaTxt}>{b.payment_method}</Text>
                        <Text style={s.metaDot}>·</Text>
                        <Text style={s.metaTxt}>{relTime}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
      </View>

      <BottomNav active="trips" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navy },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 28 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff' },
  content: { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 20 },
  tabs: { flexDirection: 'row', backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabOn: { backgroundColor: C.navy },
  tabTxt: { fontSize: 13, fontWeight: '600', color: C.muted },
  tabTxtOn: { color: '#fff' },
  card: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, gap: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  fareAmt: { fontSize: 16, fontWeight: '700', color: C.dark },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start' },
  routeTxt: { fontSize: 14, fontWeight: '500', color: C.dark, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaTxt: { fontSize: 12, color: C.muted },
  metaDot: { fontSize: 12, color: C.hint },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTxt: { fontSize: 16, color: C.muted },
});
