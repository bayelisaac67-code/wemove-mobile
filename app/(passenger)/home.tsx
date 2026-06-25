import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/lib/api';
import BottomNav from '../../src/components/BottomNav';
import LiveMap from '../../src/components/LiveMap';
import { useUserLocation } from '../../src/hooks/useUserLocation';

const CORRIDOR_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

const C = {
  navy: '#0D1B2A', gold: '#F5B800', white: '#FFFFFF',
  bg: '#F6F7F9', dark: '#111827', muted: '#6B7280',
  border: '#E5E7EB', goldLight: '#FFFBEB',
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function PassengerHome() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [recentDests, setRecentDests] = useState<string[]>([]);
  const [points, setPoints] = useState<any[]>([]);
  const { location, request: requestLocation } = useUserLocation();
  const name = user?.preferred_name || user?.full_name?.split(' ')[0] || 'Rider';
  const initials = (user?.preferred_name || user?.full_name || 'W').slice(0, 2).toUpperCase();

  useEffect(() => {
    api.get('/users/me/trips').then(r => {
      const bookings: any[] = r.data.bookings || [];
      const seen = new Set<string>();
      const names: string[] = [];
      for (const b of bookings) {
        if (b.dropoff_name && !seen.has(b.dropoff_name)) {
          seen.add(b.dropoff_name); names.push(b.dropoff_name);
          if (names.length === 3) break;
        }
      }
      setRecentDests(names);
    }).catch(() => {});

    api.get(`/corridors/${CORRIDOR_ID}/pickup-points`)
      .then(r => setPoints(r.data.pickupPoints || []))
      .catch(() => {});

    requestLocation().catch(() => {});
  }, []);

  return (
    <View style={s.root}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} bounces={false}>
        {/* Navy header */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.greet}>{greeting()},</Text>
            <Text style={s.name}>{name} 👋</Text>
            <Text style={s.sub}>Where are you headed today?</Text>
          </View>
          <TouchableOpacity style={s.avatar} onPress={() => router.push('/(passenger)/account')}>
            <Text style={s.avatarTxt}>{initials}</Text>
          </TouchableOpacity>
        </View>

        {/* White content */}
        <View style={s.content}>
          {user?.verification_status !== 'VERIFIED' && (
            <TouchableOpacity style={s.verifyBanner} onPress={() => router.push('/onboarding/verification-status')}>
              <Text style={s.verifyTxt}>
                {user?.verification_status === 'PENDING'
                  ? '⏳ Verification in progress — you can browse but not book yet.'
                  : '🔐 Complete verification to start booking rides.'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Live map */}
          {points.length > 0 && (
            <TouchableOpacity style={s.mapCard} activeOpacity={0.9} onPress={() => router.push('/(passenger)/search')}>
              <LiveMap points={points} userLocation={location} height={180} interactive={false} />
              <View style={s.mapOverlay}>
                <Text style={s.mapOverlayTxt}>Tap to plan your ride →</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Find a shared ride */}
          <TouchableOpacity style={s.findCard} onPress={() => router.push('/(passenger)/search')} activeOpacity={0.85}>
            <View style={s.findLeft}>
              <View style={s.searchIcon}>
                <Text style={{ fontSize: 16 }}>🔍</Text>
              </View>
              <View>
                <Text style={s.findTitle}>Find a shared ride</Text>
                <Text style={s.findSub}>Search along the corridor</Text>
              </View>
            </View>
            <Text style={s.findArrow}>→</Text>
          </TouchableOpacity>

          {/* Ride type cards — same trip, your choice (PCD §4) */}
          <View style={s.typeRow}>
            <View style={[s.typeCard, s.typeCardActive]}>
              <Text style={s.typeIcon}>👥</Text>
              <Text style={s.typeLabel}>Shared</Text>
              <Text style={s.typePrice}>GHS 10–15</Text>
              <Text style={s.typeMeta}>Scheduled · Walk to stop</Text>
              <Text style={s.typeMetaGreen}>🌿 Saves carbon</Text>
              <View style={s.bestBadge}><Text style={s.bestBadgeTxt}>BEST VALUE</Text></View>
            </View>
            <View style={[s.typeCard, s.typeCardDim]}>
              <Text style={[s.typeIcon, { opacity: 0.5 }]}>🚗</Text>
              <Text style={[s.typeLabel, { color: C.muted }]}>Solo</Text>
              <Text style={[s.typePrice, { color: C.muted }]}>GHS 15+</Text>
              <Text style={s.typeMeta}>Door-to-door private</Text>
              <Text style={[s.typeMeta, { color: C.gold, marginTop: 4, fontWeight: '600' }]}>Coming soon</Text>
            </View>
          </View>

          {/* Recent destinations */}
          {recentDests.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Recent destinations</Text>
              {recentDests.map(dest => (
                <TouchableOpacity key={dest} style={s.recentRow}
                  onPress={() => router.push({ pathname: '/(passenger)/search', params: { dest } })}>
                  <Text style={s.recentDot}>📍</Text>
                  <Text style={s.recentName}>{dest}</Text>
                  <Text style={s.recentChev}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Become a driver */}
          {!user?.role_flags?.includes('DRIVER') && (
            <TouchableOpacity style={s.driverCard} onPress={() => router.push('/onboarding/become-driver')}>
              <Text style={s.driverTitle}>🚗  Earn with WeMove</Text>
              <Text style={s.driverSub}>Share your commute and earn on trips you already make.</Text>
              <Text style={s.driverCta}>Become a driver →</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
      <BottomNav active="home" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navy },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', padding: 20, paddingTop: 60, paddingBottom: 48 },
  greet: { fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 2 },
  name: { fontSize: 26, fontWeight: '700', color: '#fff' },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 15, fontWeight: '700', color: C.navy },
  content: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, minHeight: 600 },
  verifyBanner: { backgroundColor: '#FFFBEB', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: C.gold, padding: 12, marginBottom: 16 },
  verifyTxt: { fontSize: 13, color: '#92400E' },
  mapCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: C.border },
  mapOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(13,27,42,0.78)', paddingVertical: 10, paddingHorizontal: 14 },
  mapOverlayTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },
  findCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  findLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  findTitle: { fontSize: 15, fontWeight: '600', color: C.dark },
  findSub: { fontSize: 12, color: C.muted, marginTop: 1 },
  findArrow: { fontSize: 18, color: C.dark },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeCard: { flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  typeCardActive: { backgroundColor: C.white, borderColor: C.dark },
  typeCardDim: { backgroundColor: C.bg, borderColor: C.border },
  typeIcon: { fontSize: 22, marginBottom: 6 },
  typeLabel: { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 2 },
  typePrice: { fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 4 },
  typeMeta: { fontSize: 11, color: C.muted },
  typeMetaGreen: { fontSize: 11, color: '#059669', fontWeight: '600', marginTop: 2 },
  bestBadge: { marginTop: 8, backgroundColor: C.gold, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  bestBadgeTxt: { fontSize: 10, fontWeight: '700', color: C.navy },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: C.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  recentDot: { fontSize: 16, marginRight: 10 },
  recentName: { flex: 1, fontSize: 15, color: C.dark },
  recentChev: { fontSize: 20, color: C.muted },
  driverCard: { backgroundColor: '#0D1B2A', borderRadius: 14, padding: 18, marginTop: 4 },
  driverTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 6 },
  driverSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 12 },
  driverCta: { fontSize: 14, fontWeight: '600', color: C.gold },
});
