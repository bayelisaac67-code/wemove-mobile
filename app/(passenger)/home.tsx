import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/lib/api';
import BottomNav from '../../src/components/BottomNav';
import LiveMap from '../../src/components/LiveMap';
import LocationRow from '../../src/components/LocationRow';
import Drawer from '../../src/components/Drawer';
import DraggableSheet from '../../src/components/DraggableSheet';
import { useUserLocation } from '../../src/hooks/useUserLocation';

const CORRIDOR_ID = 'a1b2c3d4-0000-0000-0000-000000000001';
const NAV_H = 64;                              // bottom tab bar height (+ safe area added below)
const H = Dimensions.get('window').height;
const PEEK = 230;                              // collapsed sheet height
const EXPANDED = Math.round(H * 0.72);         // expanded sheet height

const C = {
  navy: '#0D1B2A', gold: '#F5B800', white: '#FFFFFF',
  bg: '#F6F7F9', dark: '#111827', muted: '#6B7280',
  border: '#E5E7EB', cardBg: '#F3F4F6', goldBg: '#FFFBEB',
};

type RecentDest = { name: string; area?: string };

export default function PassengerHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [recents, setRecents] = useState<RecentDest[]>([]);
  const [points, setPoints] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { location, request: requestLocation } = useUserLocation();
  const initials = (user?.preferred_name || user?.full_name || 'W').slice(0, 2).toUpperCase();

  // Shared drag value (0 = expanded, RANGE = collapsed). Drives both the sheet
  // and the map height so the map shrinks as the sheet rises.
  const navTotal = NAV_H + (insets.bottom || 12);
  const RANGE = Math.max(1, EXPANDED - PEEK);
  const translateY = useRef(new Animated.Value(RANGE)).current;
  // map fills from the top down to the sheet's top edge:
  //   mapHeight = translateY + (H - navTotal - EXPANDED)
  // collapsed (translateY=RANGE) → H - navTotal - PEEK (tall);  expanded (0) → H - navTotal - EXPANDED (short)
  const mapHeight = Animated.add(translateY, H - navTotal - EXPANDED);

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
  const top = (insets.top || 12) + 4;

  return (
    <View style={s.root}>
      {/* Map fills the top; its height shrinks/grows with the sheet drag */}
      <Animated.View style={[s.mapWrap, { height: mapHeight }]}>
        <LiveMap points={points} userLocation={location} fill interactive rounded={false} />
      </Animated.View>

      {/* Floating controls over the map */}
      <TouchableOpacity style={[s.fab, { top, left: 16 }]} activeOpacity={0.85} onPress={() => setDrawerOpen(true)}>
        <Feather name="menu" size={22} color={C.navy} />
      </TouchableOpacity>
      <TouchableOpacity style={[s.avatar, { top, right: 16 }]} activeOpacity={0.85} onPress={() => router.push('/(passenger)/account')}>
        <Text style={s.avatarTxt}>{initials}</Text>
      </TouchableOpacity>

      {/* Draggable bottom sheet over the map, above the tab bar */}
      <DraggableSheet
        peekHeight={PEEK}
        expandedHeight={EXPANDED}
        bottomInset={navTotal}
        translateY={translateY}
        header={
          <>
            <Text style={s.heading}>Where are you headed?</Text>
            <TouchableOpacity style={s.whereTo} activeOpacity={0.85} onPress={goSearch}>
              <Feather name="search" size={18} color={C.dark} />
              <Text style={s.whereToTxt}>Where to?</Text>
              <View style={s.laterChip}>
                <Feather name="clock" size={13} color={C.muted} />
                <Text style={s.laterTxt}>Later</Text>
              </View>
            </TouchableOpacity>
          </>
        }
      >
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

        {/* 2×2 service grid */}
        <View style={s.grid}>
          <ServiceCard emoji="👥" title="Shared Ride" sub="Share & save" badge="BEST VALUE" onPress={goSearch} />
          <ServiceCard emoji="🚗" title="Solo" sub="Coming soon" dim />
          <ServiceCard emoji="🗓️" title="Schedule" sub="Book ahead" onPress={goSearch} />
          <ServiceCard emoji="💸" title="Drive & earn" sub="Become a driver" onPress={() => router.push('/onboarding/become-driver')} />
        </View>

        {/* Recent destinations */}
        {recents.length > 0 && (
          <View style={s.recents}>
            <Text style={s.recentsLabel}>RECENT</Text>
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
      </DraggableSheet>

      {/* Bottom tab bar — pinned to the very bottom */}
      <View style={s.navWrap}>
        <BottomNav active="home" />
      </View>

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
  root: { flex: 1, backgroundColor: C.bg },
  mapWrap: { width: '100%', backgroundColor: '#EAEAEA' },
  navWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  fab: {
    position: 'absolute', width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  avatar: {
    position: 'absolute', width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  avatarTxt: { fontSize: 15, fontWeight: '700', color: C.navy },
  heading: { fontSize: 22, fontWeight: '800', color: C.dark, marginBottom: 12 },
  whereTo: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.cardBg, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 16, marginBottom: 4 },
  whereToTxt: { flex: 1, fontSize: 16, fontWeight: '700', color: C.dark },
  laterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.white, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  laterTxt: { fontSize: 13, color: C.muted, fontWeight: '500' },
  verifyBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.goldBg, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: C.gold, padding: 12, marginTop: 8, marginBottom: 8 },
  verifyTxt: { flex: 1, fontSize: 13, color: '#92400E' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12, marginBottom: 8 },
  card: { width: '47%', flexGrow: 1, backgroundColor: C.cardBg, borderRadius: 16, padding: 16, minHeight: 104, justifyContent: 'center' },
  cardDim: { opacity: 0.7 },
  cardEmoji: { fontSize: 26, marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.dark },
  cardSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  cardBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: C.gold, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  cardBadgeTxt: { fontSize: 9, fontWeight: '800', color: C.navy },
  recents: { marginTop: 12 },
  recentsLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8, marginBottom: 4 },
  sep: { height: 1, backgroundColor: C.border, marginLeft: 50 },
});
