import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

const CORRIDOR_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

export default function PublishRouteScreen() {
  const router = useRouter();
  const { direction } = useLocalSearchParams<{ direction: string }>();
  const [points, setPoints] = useState<any[]>([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/corridors/${CORRIDOR_ID}/pickup-points`).then(r => {
      const pts = r.data.pickupPoints || [];
      setPoints(direction === 'REVERSE' ? [...pts].reverse() : pts);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [direction]);

  const originIdx = points.findIndex(p => p.id === origin);
  const validDest = points.filter((_, i) => i > originIdx);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      <Text style={s.title}>Your route</Text>
      <Text style={s.subtitle}>Pick where you start and end along the corridor.</Text>

      {loading ? <ActivityIndicator color={COLORS.gold} /> : (
        <>
          <Text style={s.label}>Where do you start?</Text>
          <View style={s.pointsList}>
            {points.map(p => (
              <TouchableOpacity key={p.id} style={[s.point, origin === p.id && s.pointSelected]} onPress={() => { setOrigin(p.id); setDestination(''); }}>
                <Text style={[s.pointText, origin === p.id && s.pointTextSelected]}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {origin !== '' && (
            <>
              <Text style={s.label}>Where do you end?</Text>
              <View style={s.pointsList}>
                {validDest.map(p => (
                  <TouchableOpacity key={p.id} style={[s.point, destination === p.id && s.pointSelected]} onPress={() => setDestination(p.id)}>
                    <Text style={[s.pointText, destination === p.id && s.pointTextSelected]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </>
      )}

      <TouchableOpacity
        style={[s.btn, (!origin || !destination) && s.btnDisabled]}
        disabled={!origin || !destination}
        onPress={() => router.push({ pathname: '/(driver)/publish-schedule', params: { direction, origin, destination } })}
      >
        <Text style={s.btnText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xxl, paddingBottom: SPACING.xxl },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.white, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.xl },
  label: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.sm, marginTop: SPACING.lg },
  pointsList: { gap: SPACING.xs },
  point: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, borderWidth: 1, borderColor: 'transparent' },
  pointSelected: { borderColor: COLORS.gold },
  pointText: { fontSize: FONTS.sizes.base, color: COLORS.textMuted },
  pointTextSelected: { color: COLORS.white, fontWeight: '600' },
  btn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.xl },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: COLORS.navy, fontSize: FONTS.sizes.base, fontWeight: '700' },
});
