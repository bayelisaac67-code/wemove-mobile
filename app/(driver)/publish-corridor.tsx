import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../src/constants/theme';

export default function PublishCorridorScreen() {
  const router = useRouter();
  const [direction, setDirection] = useState<'FORWARD' | 'REVERSE'>('FORWARD');

  return (
    <View style={s.container}>
      <Text style={s.title}>Select route</Text>
      <Text style={s.subtitle}>Phase 1 operates on one corridor.</Text>

      <View style={s.corridorCard}>
        <Text style={s.corridorName}>Accra Central ↔ Oyarifa</Text>
        <Text style={s.corridorDesc}>Major commuting corridor · 20+ pickup points</Text>
      </View>

      <Text style={s.label}>Which direction are you travelling?</Text>
      {[
        { id: 'FORWARD' as const, label: 'Accra Central → Oyarifa', sub: 'Morning outbound / Evening homeward' },
        { id: 'REVERSE' as const, label: 'Oyarifa → Accra Central', sub: 'Morning inbound / Evening cityward' },
      ].map(d => (
        <TouchableOpacity key={d.id} style={[s.option, direction === d.id && s.optionSelected]} onPress={() => setDirection(d.id)}>
          <View style={{ flex: 1 }}>
            <Text style={s.optionLabel}>{d.label}</Text>
            <Text style={s.optionSub}>{d.sub}</Text>
          </View>
          <View style={[s.radio, direction === d.id && s.radioSelected]}>
            {direction === d.id && <View style={s.radioDot} />}
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={s.btn} onPress={() => router.push({ pathname: '/(driver)/publish-route', params: { direction } })}>
        <Text style={s.btnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy, padding: SPACING.lg, paddingTop: SPACING.xxl },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.white, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.xl },
  corridorCard: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.xl, borderWidth: 1.5, borderColor: COLORS.gold, ...SHADOW },
  corridorName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.white, marginBottom: 4 },
  corridorDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  label: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.md },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1.5, borderColor: 'transparent', gap: SPACING.md },
  optionSelected: { borderColor: COLORS.gold },
  optionLabel: { fontSize: FONTS.sizes.base, color: COLORS.white, fontWeight: '600', marginBottom: 2 },
  optionSub: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: COLORS.gold },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.gold },
  btn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center', marginTop: 'auto' },
  btnText: { color: COLORS.navy, fontSize: FONTS.sizes.base, fontWeight: '700' },
});
