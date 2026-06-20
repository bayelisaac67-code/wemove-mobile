import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

const STEPS = [
  { icon: '📋', title: 'Driver\'s licence', desc: 'Photo + licence number' },
  { icon: '🚗', title: 'Vehicle registration', desc: 'Make, model, plate, reg doc' },
  { icon: '🤳', title: 'Identity confirmation', desc: 'Quick selfie re-check' },
  { icon: '✅', title: 'Admin review', desc: 'Usually approved within a few hours' },
];

const RULES = [
  'No detours — you drive your usual route, passengers board along the way',
  'You keep 80–90% of every fare — WeMove takes a small commission',
  'Passengers are pre-verified — you can see their reliability score before accepting',
  'Five-minute wait rule at each scheduled pickup point',
];

export default function BecomeDriverScreen() {
  const router = useRouter();
  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      <Text style={s.title}>Drive with WeMove</Text>
      <Text style={s.subtitle}>Earn from trips you're already making — no new routes, no detours.</Text>

      <View style={s.earningsCard}>
        <Text style={s.earningsTitle}>Illustrative earnings</Text>
        <View style={s.earningsRow}><Text style={s.earningsItem}>1 passenger</Text><Text style={s.earningsAmount}>~GHS 12</Text></View>
        <View style={s.earningsRow}><Text style={s.earningsItem}>2 passengers</Text><Text style={s.earningsAmount}>~GHS 25</Text></View>
        <View style={s.earningsRow}><Text style={s.earningsItem}>3–4 passengers</Text><Text style={s.earningsAmount}>~GHS 30–40</Text></View>
        <Text style={s.earningsNote}>Per trip on the Accra Central ↔ Oyarifa corridor</Text>
      </View>

      <Text style={s.sectionLabel}>The rules</Text>
      {RULES.map((r, i) => <View key={i} style={s.ruleRow}><Text style={s.ruleDot}>·</Text><Text style={s.ruleText}>{r}</Text></View>)}

      <Text style={s.sectionLabel}>What you'll need</Text>
      {STEPS.map((step, i) => (
        <View key={i} style={s.step}>
          <Text style={s.stepIcon}>{step.icon}</Text>
          <View>
            <Text style={s.stepTitle}>{step.title}</Text>
            <Text style={s.stepDesc}>{step.desc}</Text>
          </View>
        </View>
      ))}

      <TouchableOpacity style={s.btn} onPress={() => router.push('/onboarding/driver-licence')}>
        <Text style={s.btnText}>Start driver verification</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.skipBtn} onPress={() => router.back()}>
        <Text style={s.skipText}>Maybe later</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xxl, paddingBottom: SPACING.xxl },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.white, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.xl, lineHeight: 22 },
  earningsCard: { backgroundColor: COLORS.gold + '22', borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1.5, borderColor: COLORS.gold, marginBottom: SPACING.xl },
  earningsTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.gold, marginBottom: SPACING.md },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs },
  earningsItem: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  earningsAmount: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.white },
  earningsNote: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: SPACING.sm },
  sectionLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.md, marginTop: SPACING.sm },
  ruleRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  ruleDot: { color: COLORS.gold, fontSize: 18, lineHeight: 22 },
  ruleText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, flex: 1, lineHeight: 22 },
  step: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start', marginBottom: SPACING.md, backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md },
  stepIcon: { fontSize: 24 },
  stepTitle: { fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.white, marginBottom: 2 },
  stepDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  btn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.xl },
  btnText: { color: COLORS.navy, fontSize: FONTS.sizes.base, fontWeight: '700' },
  skipBtn: { alignItems: 'center', marginTop: SPACING.md },
  skipText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
});
