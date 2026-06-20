import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

const TYPES = [
  { id: 'DAILY_COMMUTER', label: 'Daily Commuter', icon: '🗓️', desc: 'Same route every day — set it once, earn every weekday. Best for consistent commuters.' },
  { id: 'FLEXIBLE', label: 'Flexible Driver', icon: '🗺️', desc: 'Your route varies — publish trips whenever you\'re making a journey. Best for occasional drivers.' },
  { id: 'PROFESSIONAL', label: 'Professional Driver', icon: '👔', desc: 'Available all day for Solo rides. Coming with Solo rides in Phase 2.', disabled: true },
];

export default function DriverTypeScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState('DAILY_COMMUTER');
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    setLoading(true);
    try {
      await api.post('/users/driver/submit', { driver_type: selected });
      Alert.alert('Driver verification submitted!', 'We\'ll review your documents and notify you within a few hours.', [{ text: 'OK', onPress: () => router.replace('/(passenger)/home') }]);
    } catch { Alert.alert('Submission failed. Please try again.'); }
    finally { setLoading(false); }
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Driver type</Text>
      <Text style={s.subtitle}>Choose how you'll drive with WeMove.</Text>

      {TYPES.map(t => (
        <TouchableOpacity key={t.id} style={[s.option, selected === t.id && s.optionSelected, t.disabled && s.optionDisabled]} onPress={() => !t.disabled && setSelected(t.id)} disabled={t.disabled}>
          <Text style={s.optionIcon}>{t.icon}</Text>
          <View style={{ flex: 1 }}>
            <View style={s.optionTitleRow}>
              <Text style={[s.optionLabel, t.disabled && s.optionLabelDisabled]}>{t.label}</Text>
              {t.disabled && <View style={s.comingSoonBadge}><Text style={s.comingSoonText}>Phase 2</Text></View>}
            </View>
            <Text style={s.optionDesc}>{t.desc}</Text>
          </View>
          {!t.disabled && (
            <View style={[s.radio, selected === t.id && s.radioSelected]}>
              {selected === t.id && <View style={s.radioDot} />}
            </View>
          )}
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleContinue} disabled={loading}>
        {loading ? <ActivityIndicator color={COLORS.navy} /> : <Text style={s.btnText}>Submit for approval</Text>}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy, padding: SPACING.lg, paddingTop: SPACING.xxl },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.white, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.xl },
  option: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1.5, borderColor: 'transparent', gap: SPACING.md, ...SHADOW },
  optionSelected: { borderColor: COLORS.gold },
  optionDisabled: { opacity: 0.5 },
  optionIcon: { fontSize: 28, marginTop: 2 },
  optionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 4 },
  optionLabel: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.white },
  optionLabelDisabled: { color: COLORS.textMuted },
  optionDesc: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, lineHeight: 20 },
  comingSoonBadge: { backgroundColor: COLORS.border, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.xs, paddingVertical: 2 },
  comingSoonText: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  radioSelected: { borderColor: COLORS.gold },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.gold },
  btn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center', marginTop: 'auto' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: COLORS.navy, fontSize: FONTS.sizes.base, fontWeight: '700' },
});
