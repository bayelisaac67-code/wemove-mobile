import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

// Phase 1 launch corridor (Accra Central ↔ Oyarifa)
const CORRIDOR_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

export default function SearchScreen() {
  const router = useRouter();
  const [points, setPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState<'FORWARD' | 'REVERSE'>('FORWARD');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');

  useEffect(() => {
    api.get(`/corridors/${CORRIDOR_ID}/pickup-points`)
      .then(r => setPoints(r.data.pickupPoints || []))
      .catch(() => setPoints([]))
      .finally(() => setLoading(false));
  }, []);

  // Points in travel order for the chosen direction.
  const ordered = direction === 'REVERSE' ? [...points].reverse() : points;
  const pickupIdx = ordered.findIndex(p => p.id === pickup);
  const dropoffOptions = ordered.filter((_, i) => i > pickupIdx);

  function setDir(d: 'FORWARD' | 'REVERSE') { setDirection(d); setPickup(''); setDropoff(''); }

  function find() {
    const dropName = ordered.find(p => p.id === dropoff)?.name || '';
    router.push({
      pathname: '/(passenger)/trips-list',
      params: { corridor_id: CORRIDOR_ID, direction, pickup_point_id: pickup, dropoff_point_id: dropoff, dropoff_name: dropName },
    });
  }

  if (loading) return <View style={[s.container, { justifyContent: 'center' }]}><ActivityIndicator color={COLORS.gold} size="large" /></View>;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      <Text style={s.title}>Where are you going?</Text>

      <Text style={s.label}>Direction</Text>
      <View style={s.dirRow}>
        <TouchableOpacity style={[s.dirBtn, direction === 'FORWARD' && s.dirBtnActive]} onPress={() => setDir('FORWARD')}>
          <Text style={[s.dirText, direction === 'FORWARD' && s.dirTextActive]}>Towards Oyarifa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.dirBtn, direction === 'REVERSE' && s.dirBtnActive]} onPress={() => setDir('REVERSE')}>
          <Text style={[s.dirText, direction === 'REVERSE' && s.dirTextActive]}>Towards Accra</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.label}>Where will you board?</Text>
      <View style={s.list}>
        {ordered.map(p => (
          <TouchableOpacity key={p.id} style={[s.point, pickup === p.id && s.pointSelected]} onPress={() => { setPickup(p.id); setDropoff(''); }}>
            <Text style={[s.pointText, pickup === p.id && s.pointTextSelected]}>📍 {p.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {pickup !== '' && (
        <>
          <Text style={s.label}>Where are you headed?</Text>
          <View style={s.list}>
            {dropoffOptions.map(p => (
              <TouchableOpacity key={p.id} style={[s.point, dropoff === p.id && s.pointSelected]} onPress={() => setDropoff(p.id)}>
                <Text style={[s.pointText, dropoff === p.id && s.pointTextSelected]}>🏁 {p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <TouchableOpacity style={[s.btn, (!pickup || !dropoff) && s.btnDisabled]} disabled={!pickup || !dropoff} onPress={find}>
        <Text style={s.btnText}>Find rides</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xxl, paddingBottom: SPACING.xxl },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.white, marginBottom: SPACING.lg },
  label: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.sm, marginTop: SPACING.lg },
  dirRow: { flexDirection: 'row', gap: SPACING.sm },
  dirBtn: { flex: 1, backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  dirBtnActive: { borderColor: COLORS.gold },
  dirText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, fontWeight: '600' },
  dirTextActive: { color: COLORS.white },
  list: { gap: SPACING.xs },
  point: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, borderWidth: 1, borderColor: 'transparent' },
  pointSelected: { borderColor: COLORS.gold },
  pointText: { fontSize: FONTS.sizes.base, color: COLORS.textMuted },
  pointTextSelected: { color: COLORS.white, fontWeight: '600' },
  btn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.xl },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: COLORS.navy, fontSize: FONTS.sizes.base, fontWeight: '700' },
});
