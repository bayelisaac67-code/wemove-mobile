import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, FlatList, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '../../src/lib/api';
import BottomNav from '../../src/components/BottomNav';
import LiveMap from '../../src/components/LiveMap';
import { useUserLocation } from '../../src/hooks/useUserLocation';

const CORRIDOR_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

const C = {
  navy: '#0D1B2A', gold: '#F5B800', white: '#FFFFFF',
  bg: '#F6F7F9', dark: '#111827', muted: '#6B7280',
  border: '#E5E7EB', hint: '#9CA3AF',
};

export default function SearchScreen() {
  const router = useRouter();
  const [points, setPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromStop, setFromStop] = useState<any>(null);
  const [toStop, setToStop] = useState<any>(null);
  const [picker, setPicker] = useState<'from' | 'to' | null>(null);
  const { location, loading: locating, request: requestLocation } = useUserLocation();

  async function useMyLocation() {
    const coords = await requestLocation();
    if (!coords) {
      Alert.alert('Location unavailable', 'Turn on location for WeMove in your phone settings, then try again.');
      return;
    }
    // snap FROM to the nearest corridor stop
    if (points.length) {
      let nearest = points[0];
      let best = Infinity;
      for (const p of points) {
        const d = (Number(p.lat) - coords.lat) ** 2 + (Number(p.lng) - coords.lng) ** 2;
        if (d < best) { best = d; nearest = p; }
      }
      setFromStop(nearest);
      setToStop(null);
    }
  }

  useEffect(() => {
    api.get(`/corridors/${CORRIDOR_ID}/pickup-points`)
      .then(r => setPoints(r.data.pickupPoints || []))
      .catch(() => setPoints([]))
      .finally(() => setLoading(false));
  }, []);

  const toOptions = points.filter(p => p.id !== fromStop?.id);

  function selectFrom(p: any) { setFromStop(p); setToStop(null); setPicker(null); }
  function selectTo(p: any) { setToStop(p); setPicker(null); }

  function find() {
    if (!fromStop || !toStop) return;
    const direction = fromStop.order_index < toStop.order_index ? 'FORWARD' : 'REVERSE';
    router.push({
      pathname: '/(passenger)/trips-list',
      params: {
        corridor_id: CORRIDOR_ID,
        direction,
        pickup_point_id: fromStop.id,
        dropoff_point_id: toStop.id,
        pickup_name: fromStop.name,
        dropoff_name: toStop.name,
      },
    });
  }

  const canSearch = !!fromStop && !!toStop;

  return (
    <View style={s.root}>
      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false} bounces={false}>
        {/* Navy header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={s.title}>Find a Shared Ride</Text>
          <Text style={s.subtitle}>Select your pickup and destination</Text>
        </View>

        {/* White content */}
        <View style={s.content}>
          {loading
            ? <ActivityIndicator color={C.gold} style={{ marginTop: 40 }} />
            : (
              <>
                {/* FROM / TO card */}
                <View style={s.routeCard}>
                  <View style={s.routeHeader}>
                    <Text style={s.routeSection}>FROM</Text>
                    <TouchableOpacity onPress={useMyLocation} disabled={locating} style={s.locBtn}>
                      {locating
                        ? <ActivityIndicator size="small" color={C.muted} />
                        : <Feather name="navigation" size={13} color={C.muted} />}
                      <Text style={s.locTxt}>{locating ? 'Locating…' : 'Use my location'}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={s.stopRow} onPress={() => setPicker('from')}>
                    <View style={s.dotBlack} />
                    <View style={s.stopField}>
                      <Feather name="map-pin" size={14} color={fromStop ? C.dark : C.hint} style={{ marginRight: 6 }} />
                      <Text style={fromStop ? s.stopSelected : s.stopPlaceholder}>
                        {fromStop ? fromStop.name : 'Select pickup stop'}
                      </Text>
                    </View>
                    <Feather name="chevron-down" size={18} color={C.hint} />
                  </TouchableOpacity>

                  <View style={s.divider}>
                    <View style={s.dividerLine} />
                    <TouchableOpacity style={s.swapBtn} onPress={() => { const tmp = fromStop; setFromStop(toStop); setToStop(tmp); }}>
                      <Feather name="repeat" size={14} color={C.muted} />
                    </TouchableOpacity>
                  </View>

                  <Text style={s.routeSection}>TO</Text>
                  <TouchableOpacity style={s.stopRow} onPress={() => fromStop ? setPicker('to') : Alert.alert('Select pickup first', 'Choose your boarding stop first.')} activeOpacity={0.7}>
                    <View style={s.dotRed} />
                    <View style={s.stopField}>
                      <Feather name="map-pin" size={14} color={toStop ? C.dark : C.hint} style={{ marginRight: 6 }} />
                      <Text style={toStop ? s.stopSelected : s.stopPlaceholder}>
                        {toStop ? toStop.name : 'Where are you going?'}
                      </Text>
                    </View>
                    <Feather name="chevron-down" size={18} color={C.hint} />
                  </TouchableOpacity>
                </View>

                {/* Live map */}
                {points.length > 0 && (
                  <View style={s.mapCard}>
                    <LiveMap
                      points={points}
                      from={fromStop}
                      to={toStop}
                      userLocation={location}
                      height={200}
                    />
                  </View>
                )}

                {/* Ride type */}
                <View style={s.typeRow}>
                  <View style={[s.typeCard, s.typeActive]}>
                    <Text style={s.typeIcon}>👥</Text>
                    <Text style={s.typeLabel}>Shared</Text>
                    <Text style={s.typePrice}>GHS 10–15</Text>
                    <View style={s.typeMetas}>
                      <Text style={s.typeMeta}>⏰ Scheduled</Text>
                      <Text style={s.typeMeta}>🌿 Eco-friendly</Text>
                    </View>
                    <View style={s.bestBadge}><Text style={s.bestBadgeTxt}>BEST VALUE</Text></View>
                  </View>
                  <View style={[s.typeCard, s.typeDim]}>
                    <Text style={[s.typeIcon, { opacity: 0.35 }]}>📍</Text>
                    <Text style={[s.typeLabel, { color: C.muted }]}>Solo</Text>
                    <Text style={[s.typePrice, { color: C.hint }]}>Coming soon</Text>
                    <Text style={s.typeDimSub}>Door-to-door private ride</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[s.btn, !canSearch && s.btnDisabled]}
                  onPress={find}
                  disabled={!canSearch}
                  activeOpacity={0.85}
                >
                  <Text style={s.btnTxt}>See Available Rides</Text>
                </TouchableOpacity>
              </>
            )}
        </View>
      </ScrollView>

      <BottomNav active="home" />

      {/* Stop picker modal */}
      <Modal visible={picker !== null} animationType="slide" transparent onRequestClose={() => setPicker(null)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setPicker(null)} />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>{picker === 'from' ? 'Select pickup stop' : 'Where are you going?'}</Text>
            <TouchableOpacity onPress={() => setPicker(null)}>
              <Feather name="x" size={22} color={C.muted} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={picker === 'from' ? points : toOptions}
            keyExtractor={p => p.id}
            renderItem={({ item }) => {
              const isSelected = picker === 'from' ? fromStop?.id === item.id : toStop?.id === item.id;
              return (
                <TouchableOpacity style={s.stopItem} onPress={() => picker === 'from' ? selectFrom(item) : selectTo(item)}>
                  <Feather name="map-pin" size={16} color={isSelected ? C.gold : C.hint} style={{ marginRight: 12 }} />
                  <Text style={[s.stopItemTxt, isSelected && s.stopItemSelected]}>{item.name}</Text>
                  {isSelected && <Feather name="check" size={16} color={C.gold} />}
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: C.border, marginLeft: 44 }} />}
          />
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navy },
  scroll: { flex: 1 },
  header: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  backBtn: { marginBottom: 14 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  content: { backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  routeCard: { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 16 },
  mapCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: C.border },
  routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  routeSection: { fontSize: 11, fontWeight: '700', color: C.hint, letterSpacing: 0.8 },
  locBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locTxt: { fontSize: 12, color: C.muted },
  stopRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  dotBlack: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.dark, marginRight: 10 },
  dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', marginRight: 10 },
  stopField: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  stopPlaceholder: { fontSize: 15, color: C.hint },
  stopSelected: { fontSize: 15, color: C.dark, fontWeight: '500' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  swapBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  typeCard: { flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  typeActive: { backgroundColor: C.white, borderColor: C.dark },
  typeDim: { backgroundColor: C.white, borderColor: C.border, opacity: 0.65 },
  typeIcon: { fontSize: 24, marginBottom: 6 },
  typeLabel: { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 2 },
  typePrice: { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 6 },
  typeMetas: { gap: 2 },
  typeMeta: { fontSize: 11, color: C.muted },
  typeDimSub: { fontSize: 11, color: C.hint },
  bestBadge: { marginTop: 8, backgroundColor: C.gold, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  bestBadgeTxt: { fontSize: 10, fontWeight: '700', color: C.navy },
  btn: { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnDisabled: { opacity: 0.45 },
  btnTxt: { fontSize: 16, fontWeight: '700', color: C.navy },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, maxHeight: '75%' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 12 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: C.dark },
  stopItem: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingLeft: 20 },
  stopItemTxt: { flex: 1, fontSize: 15, color: C.dark },
  stopItemSelected: { fontWeight: '600', color: C.navy },
});
