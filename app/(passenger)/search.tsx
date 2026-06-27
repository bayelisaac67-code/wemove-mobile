import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../src/lib/api';
import LocationRow from '../../src/components/LocationRow';
import LiveMap from '../../src/components/LiveMap';
import { useUserLocation } from '../../src/hooks/useUserLocation';
import { segmentKm, sharedRange, soloRange, co2SavedKg, fmtRange } from '../../src/lib/estimate';
import { searchPlaces, reverseGeocode, nearestStop, Place } from '../../src/lib/geocode';

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
  const [fromLabel, setFromLabel] = useState<string>('');
  const [toLabel, setToLabel] = useState<string>('');
  const [editing, setEditing] = useState<'from' | 'to'>('from');
  const { location, loading: locating, request: requestLocation } = useUserLocation();

  // address typeahead
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<any>(null);

  // map pin picker overlay
  const [pinMode, setPinMode] = useState(false);
  const [pinPlace, setPinPlace] = useState<Place | null>(null);
  const reverseTimer = useRef<any>(null);

  useEffect(() => {
    api.get(`/corridors/${CORRIDOR_ID}/pickup-points`)
      .then(r => setPoints(r.data.pickupPoints || []))
      .catch(() => setPoints([]))
      .finally(() => setLoading(false));
  }, []);

  // debounced forward geocode as the user types
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (query.trim().length < 3) { setResults([]); setSearching(false); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const r = await searchPlaces(query);
      setResults(r);
      setSearching(false);
    }, 400);
    return () => searchTimer.current && clearTimeout(searchTimer.current);
  }, [query]);

  // assign a precise place to the field currently being edited, snapping to a stop
  function applyPlace(place: Place) {
    const snap = nearestStop(points, place.lat, place.lng);
    if (!snap) { Alert.alert('Out of area', 'No nearby WeMove stop yet. Pick a corridor stop below.'); return; }
    if (editing === 'from') {
      setFromStop(snap); setFromLabel(place.label);
      if (toStop?.id === snap.id) { setToStop(null); setToLabel(''); }
      setEditing('to');
    } else {
      if (fromStop?.id === snap.id) {
        Alert.alert('Same stop', 'Pickup and destination snap to the same WeMove stop. Choose another.');
        return;
      }
      setToStop(snap); setToLabel(place.label);
    }
    setQuery(''); setResults([]);
  }

  async function useMyLocation() {
    const coords = await requestLocation();
    if (!coords) {
      Alert.alert('Location unavailable', 'Turn on location for WeMove in your phone settings, then try again.');
      return;
    }
    const snap = nearestStop(points, coords.lat, coords.lng);
    if (snap) {
      setEditing('from');
      const rev = await reverseGeocode(coords.lat, coords.lng);
      setFromStop(snap); setFromLabel(rev?.label || snap.name);
      setToStop(null); setToLabel(''); setEditing('to');
    }
  }

  function pickStop(p: any) {
    if (editing === 'from') {
      setFromStop(p); setFromLabel(p.name);
      if (toStop?.id === p.id) { setToStop(null); setToLabel(''); }
      setEditing('to');
    } else {
      if (fromStop?.id === p.id) return;
      setToStop(p); setToLabel(p.name);
    }
  }

  // ── map pin picker ──────────────────────────────────────────────────────────
  function openPin() { setPinPlace(null); setPinMode(true); }
  function onPinMove(lat: number, lng: number) {
    if (reverseTimer.current) clearTimeout(reverseTimer.current);
    reverseTimer.current = setTimeout(async () => {
      const p = await reverseGeocode(lat, lng);
      if (p) setPinPlace(p);
    }, 600);
  }
  function confirmPin() {
    if (pinPlace) applyPlace(pinPlace);
    setPinMode(false);
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
        pickup_name: fromLabel || fromStop.name, dropoff_name: toLabel || toStop.name,
      },
    });
  }

  // ── pin picker full-screen overlay ──────────────────────────────────────────
  if (pinMode) {
    return (
      <View style={s.pinRoot}>
        <LiveMap points={points} userLocation={location} fill picker onPinMove={onPinMove} height={undefined as any} />
        <TouchableOpacity style={[s.fab, { top: insets.top + 8, left: 16 }]} onPress={() => setPinMode(false)} activeOpacity={0.85}>
          <Feather name="arrow-left" size={22} color={C.navy} />
        </TouchableOpacity>
        <View style={s.pinHint}><Text style={s.pinHintTxt}>Drag the map to place the pin</Text></View>
        <View style={[s.pinCard, { paddingBottom: (insets.bottom || 16) + 12 }]}>
          <Text style={s.pinLabel} numberOfLines={1}>{pinPlace?.label || 'Move the map…'}</Text>
          {pinPlace?.sub ? <Text style={s.pinSub} numberOfLines={1}>{pinPlace.sub}</Text> : null}
          <Text style={s.pinNote}>We'll match you to the nearest WeMove stop.</Text>
          <TouchableOpacity style={[s.cta, !pinPlace && s.ctaDim]} onPress={confirmPin} disabled={!pinPlace} activeOpacity={0.85}>
            <Text style={s.ctaTxt}>Confirm {editing === 'from' ? 'pickup' : 'destination'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
              {fromStop ? (fromLabel || fromStop.name) : 'Pickup point'}
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
              {toStop ? (toLabel || toStop.name) : 'Where are you going?'}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={s.swapBtn}
          onPress={() => {
            const ts = fromStop, tl = fromLabel;
            setFromStop(toStop); setFromLabel(toLabel);
            setToStop(ts); setToLabel(tl);
          }}
        >
          <Feather name="repeat" size={16} color={C.muted} />
        </TouchableOpacity>
      </View>

      {/* Address search box */}
      <View style={s.searchBox}>
        <Feather name="search" size={16} color={C.muted} />
        <TextInput
          style={s.searchInput}
          placeholder={`Search ${editing === 'from' ? 'pickup' : 'destination'} (e.g. 37 Military Hospital)`}
          placeholderTextColor={C.hint}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {searching ? <ActivityIndicator size="small" color={C.gold} /> : null}
        {query.length > 0 && !searching ? (
          <TouchableOpacity onPress={() => setQuery('')}><Feather name="x" size={16} color={C.hint} /></TouchableOpacity>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: canSearch ? 200 : 24 }} keyboardShouldPersistTaps="handled">
        {/* Address results (when searching) */}
        {results.length > 0 && (
          <View style={s.list}>
            {results.map((p, i) => (
              <View key={`${p.lat},${p.lng},${i}`}>
                {i > 0 && <View style={s.sep} />}
                <LocationRow icon="map-pin" title={p.label} subtitle={p.sub} showChevron onPress={() => applyPlace(p)} />
              </View>
            ))}
          </View>
        )}

        {results.length === 0 && (
          <>
            {/* Quick actions */}
            <TouchableOpacity style={s.quickRow} onPress={useMyLocation} disabled={locating}>
              {locating ? <ActivityIndicator size="small" color={C.gold} /> : <Feather name="navigation" size={16} color={C.gold} />}
              <Text style={s.quickTxt}>{locating ? 'Locating…' : 'Use my location'}</Text>
            </TouchableOpacity>
            <View style={s.sep} />
            <TouchableOpacity style={s.quickRow} onPress={openPin}>
              <Feather name="map" size={16} color={C.gold} />
              <Text style={s.quickTxt}>Set location on map</Text>
            </TouchableOpacity>

            <Text style={s.listLabel}>{editing === 'from' ? 'WEMOVE PICKUP STOPS' : 'WEMOVE STOPS'}</Text>

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
          </>
        )}

        {/* Honest fork preview */}
        {canSearch && results.length === 0 && (
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
  fields: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.cardBg, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 14, borderWidth: 1.5, borderColor: 'transparent' },
  fieldActive: { borderColor: C.gold, backgroundColor: C.white },
  fieldGap: { height: 8 },
  dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#16A34A' },
  dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
  fieldVal: { flex: 1, fontSize: 15, fontWeight: '600', color: C.dark },
  fieldPlaceholder: { flex: 1, fontSize: 15, color: C.hint },
  swapBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.cardBg, alignItems: 'center', justifyContent: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.cardBg, borderRadius: 12, paddingHorizontal: 14, height: 48, marginBottom: 6 },
  searchInput: { flex: 1, fontSize: 15, color: C.dark, paddingVertical: 0 },
  quickRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  quickTxt: { fontSize: 14, fontWeight: '600', color: C.gold },
  listLabel: { fontSize: 11, fontWeight: '700', color: C.hint, letterSpacing: 0.8, marginTop: 10, marginBottom: 4 },
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
  ctaDim: { opacity: 0.5 },
  ctaTxt: { fontSize: 16, fontWeight: '800', color: C.navy },

  // pin picker overlay
  pinRoot: { flex: 1, backgroundColor: '#EAEAEA' },
  fab: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  pinHint: { position: 'absolute', top: '46%', alignSelf: 'center', backgroundColor: 'rgba(13,27,42,0.8)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  pinHintTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },
  pinCard: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 18, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: -3 }, elevation: 16 },
  pinLabel: { fontSize: 17, fontWeight: '800', color: C.dark },
  pinSub: { fontSize: 13, color: C.muted, marginTop: 2 },
  pinNote: { fontSize: 12, color: C.green, marginTop: 8, marginBottom: 12, fontWeight: '600' },
});
