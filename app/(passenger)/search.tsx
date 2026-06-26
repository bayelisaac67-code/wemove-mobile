import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../src/lib/api';
import LocationRow from '../../src/components/LocationRow';
import LiveMap from '../../src/components/LiveMap';
import { useUserLocation } from '../../src/hooks/useUserLocation';
import { segmentKm, sharedRange, soloRange, co2SavedKg, fmtRange } from '../../src/lib/estimate';

const CORRIDOR_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

const C = {
  navy: '#0D1B2A', gold: '#F5B800', white: '#FFFFFF',
  bg: '#F6F7F9', dark: '#111827', muted: '#6B7280',
  border: '#E5E7EB', hint: '#9CA3AF', cardBg: '#F3F4F6', green: '#059669',
};

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [points, setPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromStop, setFromStop] = useState<any>(null);
  const [toStop, setToStop] = useState<any>(null);
  const [editing, setEditing] = useState<'from' | 'to'>('from');
  const { location, loading: locating, request: requestLocation } = useUserLocation();

  useEffect(() => {
    api.get(`/corridors/${CORRIDOR_ID}/pickup-points`)
      .then(r => setPoints(r.data.pickupPoints || []))
      .catch(() => setPoints([]))
      .finally(() => setLoading(false));
  }, []);

  async function useMyLocation() {
    const coords = await requestLocation();
    if (!coords) {
      Alert.alert('Location unavailable', 'Turn on location for WeMove in your phone settings, then try again.');
      return;
    }
    if (points.length) {
      let nearest = points[0], best = Infinity;
      for (const p of points) {
        const d = (Number(p.lat) - coords.lat) ** 2 + (Number(p.lng) - coords.lng) ** 2;
        if (d < best) { best = d; nearest = p; }
      }
      setFromStop(nearest); setToStop(null); setEditing('to');
    }
  }

  function pickStop(p: any) {
    if (editing === 'from') {
      setFromStop(p);
      if (toStop?.id === p.id) setToStop(null);
      setEditing('to');
    } else {
      if (fromStop?.id === p.id) return;
      setToStop(p);
    }
  }

  const canSearch = !!fromStop && !!toStop;
  const listStops = editing === 'from' ? points : points.filter(p => p.id !== fromStop?.id);

  // Honest-fork preview once both stops are chosen
  const km = canSearch ? segmentKm(fromStop.order_index, toStop.order_index) : 0;
  const shared = km ? sharedRange(km) : null;
  const solo = km ? soloRange(km) : null;
  const co2 = km ? co2SavedKg(km) : 0;

  function distanceFor(stop: any): string | undefined {
    if (editing === 'to' && fromStop) {
      const d = segmentKm(fromStop.order_index, stop.order_index);
      return `${d.toFixed(1)} km`;
    }
    return undefined;
  }

  function find() {
    if (!canSearch) return;
    const direction = fromStop.order_index < toStop.order_index ? 'FORWARD' : 'REVERSE';
    router.push({
      pathname: '/(passenger)/trips-list',
      params: {
        corridor_id: CORRIDOR_ID, direction,
        pickup_point_id: fromStop.id, dropoff_point_id: toStop.id,
        pickup_name: fromStop.name, dropoff_name: toStop.name,
      },
    });
  }

  return (
    <View style={[s.root, { paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
          <Feather name="x" size={24} color={C.dark} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Your route</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Pickup / dropoff fields */}
      <View style={s.fields}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={[s.field, editing === 'from' && s.fieldActive]}
            onPress={() => setEditing('from')}
            activeOpacity={0.8}
          >
            <View style={s.dotGreen} />
            <Text style={fromStop ? s.fieldVal : s.fieldPlaceholder} numberOfLines={1}>
              {fromStop ? fromStop.name : 'Pickup point'}
            </Text>
          </TouchableOpacity>
          <View style={s.fieldGap} />
          <TouchableOpacity
            style={[s.field, editing === 'to' && s.fieldActive]}
            onPress={() => setEditing('to')}
            activeOpacity={0.8}
          >
            <View style={s.dotRed} />
            <Text style={toStop ? s.fieldVal : s.fieldPlaceholder} numberOfLines={1}>
              {toStop ? toStop.name : 'Where are you going?'}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={s.swapBtn}
          onPress={() => { const t = fromStop; setFromStop(toStop); setToStop(t); }}
        >
          <Feather name="repeat" size={16} color={C.muted} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: canSearch ? 200 : 24 }} keyboardShouldPersistTaps="handled">
        {/* Use my location */}
        <TouchableOpacity style={s.useLoc} onPress={useMyLocation} disabled={locating}>
          {locating ? <ActivityIndicator size="small" color={C.gold} /> : <Feather name="navigation" size={16} color={C.gold} />}
          <Text style={s.useLocTxt}>{locating ? 'Locating…' : 'Use my location'}</Text>
        </TouchableOpacity>

        <Text style={s.listLabel}>{editing === 'from' ? 'SELECT PICKUP' : 'SELECT DESTINATION'}</Text>

        {loading
          ? <ActivityIndicator color={C.gold} style={{ marginTop: 30 }} />
          : (
            <View style={s.list}>
              {listStops.map((p, i) => (
                <View key={p.id}>
                  {i > 0 && <View style={s.sep} />}
                  <LocationRow
                    icon="map-pin"
                    title={p.name}
                    subtitle="Accra Central ↔ Oyarifa corridor"
                    rightText={distanceFor(p)}
                    selected={editing === 'from' ? fromStop?.id === p.id : toStop?.id === p.id}
                    onPress={() => pickStop(p)}
                  />
                </View>
              ))}
            </View>
          )}

        {/* Honest fork preview */}
        {canSearch && (
          <>
            {points.length > 0 && (
              <View style={s.mapCard}>
                <LiveMap points={points} from={fromStop} to={toStop} userLocation={location} height={140} />
              </View>
            )}
            <View style={s.compareRow}>
              <View style={[s.compareCard, s.compareActive]}>
                <Text style={s.compareType}>👥 Shared</Text>
                <Text style={s.comparePrice}>{shared ? fmtRange(shared) : ''}</Text>
                <Text style={s.compareGreen}>🌿 ~{co2} kg CO₂ saved</Text>
                <View style={s.bestBadge}><Text style={s.bestBadgeTxt}>BEST VALUE</Text></View>
              </View>
              <View style={[s.compareCard, s.compareDim]}>
                <Text style={[s.compareType, { color: C.muted }]}>🚗 Solo</Text>
                <Text style={[s.comparePrice, { color: C.muted }]}>{solo ? fmtRange(solo) : ''}</Text>
                <Text style={s.compareMuted}>Door-to-door · soon</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Sticky CTA */}
      {canSearch && (
        <View style={[s.ctaBar, { paddingBottom: insets.bottom || 16 }]}>
          <TouchableOpacity style={s.cta} onPress={find} activeOpacity={0.85}>
            <Text style={s.ctaTxt}>See Available Rides</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.white, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  closeBtn: { width: 24 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.dark },
  fields: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.cardBg, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 14, borderWidth: 1.5, borderColor: 'transparent' },
  fieldActive: { borderColor: C.gold, backgroundColor: C.white },
  fieldGap: { height: 8 },
  dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#16A34A' },
  dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
  fieldVal: { flex: 1, fontSize: 15, fontWeight: '600', color: C.dark },
  fieldPlaceholder: { flex: 1, fontSize: 15, color: C.hint },
  swapBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.cardBg, alignItems: 'center', justifyContent: 'center' },
  useLoc: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 },
  useLocTxt: { fontSize: 14, fontWeight: '600', color: C.gold },
  listLabel: { fontSize: 11, fontWeight: '700', color: C.hint, letterSpacing: 0.8, marginTop: 4, marginBottom: 4 },
  list: {},
  sep: { height: 1, backgroundColor: C.border, marginLeft: 50 },
  mapCard: { borderRadius: 16, overflow: 'hidden', marginTop: 16, borderWidth: 1, borderColor: C.border },
  compareRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  compareCard: { flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  compareActive: { borderColor: C.dark, backgroundColor: C.white },
  compareDim: { borderColor: C.border, backgroundColor: C.white },
  compareType: { fontSize: 14, fontWeight: '700', color: C.dark, marginBottom: 6 },
  comparePrice: { fontSize: 16, fontWeight: '800', color: C.dark, marginBottom: 6 },
  compareGreen: { fontSize: 11, color: C.green, fontWeight: '600' },
  compareMuted: { fontSize: 11, color: C.hint },
  bestBadge: { marginTop: 8, backgroundColor: C.gold, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  bestBadgeTxt: { fontSize: 10, fontWeight: '800', color: C.navy },
  ctaBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.white, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  cta: { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  ctaTxt: { fontSize: 16, fontWeight: '800', color: C.navy },
});
