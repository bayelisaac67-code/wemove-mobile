import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/lib/api';
import BottomNav from '../../src/components/BottomNav';
import MapHero from '../../src/components/MapHero';
import LocationRow from '../../src/components/LocationRow';
import Drawer from '../../src/components/Drawer';
import { useUserLocation } from '../../src/hooks/useUserLocation';

const CORRIDOR_ID = 'a1b2c3d4-0000-0000-0000-000000000001';
const MAP_H = Math.round(Dimensions.get('window').height * 0.40);

const C = {
  navy: '#0D1B2A', gold: '#F5B800', white: '#FFFFFF',
  bg: '#F6F7F9', dark: '#111827', muted: '#6B7280',
  border: '#E5E7EB', cardBg: '#F3F4F6', goldBg: '#FFFBEB',
};

type RecentDest = { name: string; area?: string };

export default function PassengerHome() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [recents, setRecents] = useState<RecentDest[]>([]);
  const [points, setPoints] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { location, request: requestLocation } = useUserLocation();
  const initials = (user?.preferred_name || user?.full_name || 'W').slice(0, 2).toUpperCase();

  useEffect(() => {
    api.get('/users/me/trips').then(r => {
      const bookings: any[] = r.data.bookings || [];
      const seen = new Set<string>();
      const out: RecentDest[] = [];
      for (const b of bookings) {
        if (b.dropoff_name && !seen.has(b.dropoff_name)) {
          seen.add(b.dropoff_name);
          out.push({ name: b.dropoff_name });
          if (out.length === 3) break;
        }
      }
      setRecents(out);
    }).catch(() => {});

    api.get(`/corridors/${CORRIDOR_ID}/pickup-points`)
      .then(r => setPoints(r.data.pickupPoints || []))
      .catch(() => {});

    requestLocation().catch(() => {});
  }, []);

  const goSearch = () => router.push('/(passenger)/search');

  return (
    <View style={s.root}>
      {/* Map hero */}
      <MapHero
        points={points}
        userLocation={location}
        height={MAP_H}
        interactive={false}
        onMenu={() => setDrawerOpen(true)}
        avatarText={initials}
        onAvatar={() => router.push('/(passenger)/account')}
        onPressMap={goSearch}
      />

      {/* White sheet over the map */}
      <View style={s.sheet}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} bounces={false}>
          <View style={s.handle} />
          <Text style={s.heading}>Where are you headed?</Text>

          {user?.verification_status !== 'VERIFIED' && (
            <TouchableOpacity style={s.verifyBanner} onPress={() => router.push('/onboarding/verification-status')}>
              <Feather name={user?.verification_status === 'PENDING' ? 'clock' : 'lock'} size={15} color="#92400E" />
              <Text style={s.verifyTxt}>
                {user?.verification_status === 'PENDING'
                  ? 'Verification in progress — browse now, book once approved.'
                  : 'Complete verification to start booking rides.'}
              </Text>
            </TouchableOpacity>
          )}

          {/* 2×2 adventure grid */}
          <View style={s.grid}>
            <ServiceCard emoji="👥" title="Shared Ride" sub="Share & save" badge="BEST VALUE" onPress={goSearch} />
            <ServiceCard emoji="🚗" title="Solo" sub="Coming soon" dim />
            <ServiceCard emoji="🗓️" title="Schedule" sub="Book ahead" onPress={goSearch} />
            <ServiceCard emoji="💸" title="Drive & earn" sub="Become a driver" onPress={() => router.push('/onboarding/become-driver')} />
          </View>

          {/* Where to? pill */}
          <TouchableOpacity style={s.whereTo} activeOpacity={0.85} onPress={goSearch}>
            <Feather name="search" size={18} color={C.dark} />
            <Text style={s.whereToTxt}>Where to?</Text>
            <View style={s.laterChip}>
              <Feather name="clock" size={13} color={C.muted} />
              <Text style={s.laterTxt}>Later</Text>
            </View>
          </TouchableOpacity>

          {/* Recent destinations */}
          {recents.length > 0 && (
            <View style={s.recents}>
              {recents.map((d, i) => (
                <View key={d.name}>
                  {i > 0 && <View style={s.sep} />}
                  <LocationRow
                    icon="clock"
                    title={d.name}
                    subtitle={d.area || 'Accra Central ↔ Oyarifa corridor'}
                    showChevron
                    onPress={goSearch}
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      <BottomNav active="home" />
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

function ServiceCard({ emoji, title, sub, onPress, dim, badge }: { emoji: string; title: string; sub: string; onPress?: () => void; dim?: boolean; badge?: string }) {
  return (
    <TouchableOpacity style={[s.card, dim && s.cardDim]} activeOpacity={dim ? 1 : 0.8} onPress={onPress} disabled={!onPress}>
      <Text style={[s.cardEmoji, dim && { opacity: 0.45 }]}>{emoji}</Text>
      <Text style={[s.cardTitle, dim && { color: C.muted }]}>{title}</Text>
      <Text style={s.cardSub}>{sub}</Text>
      {badge ? <View style={s.cardBadge}><Text style={s.cardBadgeTxt}>{badge}</Text></View> : null}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navy },
  sheet: { flex: 1, backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, paddingHorizontal: 20 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 10, marginBottom: 14 },
  heading: { fontSize: 26, fontWeight: '800', color: C.dark, marginBottom: 16 },
  verifyBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.goldBg, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: C.gold, padding: 12, marginBottom: 16 },
  verifyTxt: { flex: 1, fontSize: 13, color: '#92400E' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  card: { width: '47%', flexGrow: 1, backgroundColor: C.cardBg, borderRadius: 16, padding: 16, minHeight: 104, justifyContent: 'center' },
  cardDim: { opacity: 0.7 },
  cardEmoji: { fontSize: 26, marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.dark },
  cardSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  cardBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: C.gold, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  cardBadgeTxt: { fontSize: 9, fontWeight: '800', color: C.navy },
  whereTo: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.cardBg, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 16, marginBottom: 8 },
  whereToTxt: { flex: 1, fontSize: 16, fontWeight: '700', color: C.dark },
  laterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.white, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  laterTxt: { fontSize: 13, color: C.muted, fontWeight: '500' },
  recents: { marginTop: 8 },
  sep: { height: 1, backgroundColor: C.border, marginLeft: 50 },
});
