import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINS = ['00', '15', '30', '45'];

export default function PublishScheduleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ direction: string; origin: string; destination: string }>();
  const [hour, setHour] = useState('17');
  const [min, setMin] = useState('30');
  const [recurring, setRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);

  function toggleDay(i: number) {
    setSelectedDays(d => d.includes(i) ? d.filter(x => x !== i) : [...d, i].sort());
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      <Text style={s.title}>Schedule</Text>
      <Text style={s.subtitle}>When are you departing?</Text>

      <Text style={s.label}>Departure time</Text>
      <View style={s.timeRow}>
        <ScrollView style={s.picker} showsVerticalScrollIndicator={false}>
          {HOURS.map(h => (
            <TouchableOpacity key={h} style={[s.pickerItem, hour === h && s.pickerItemSelected]} onPress={() => setHour(h)}>
              <Text style={[s.pickerText, hour === h && s.pickerTextSelected]}>{h}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={s.colon}>:</Text>
        <ScrollView style={s.picker} showsVerticalScrollIndicator={false}>
          {MINS.map(m => (
            <TouchableOpacity key={m} style={[s.pickerItem, min === m && s.pickerItemSelected]} onPress={() => setMin(m)}>
              <Text style={[s.pickerText, min === m && s.pickerTextSelected]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <Text style={s.timeDisplay}>{hour}:{min}</Text>

      <View style={s.recurringRow}>
        <Text style={s.recurringLabel}>Make this a recurring trip</Text>
        <Switch value={recurring} onValueChange={setRecurring} trackColor={{ true: COLORS.gold }} thumbColor={COLORS.white} />
      </View>

      {recurring && (
        <>
          <Text style={s.label}>Repeat on</Text>
          <View style={s.daysRow}>
            {DAYS.map((d, i) => (
              <TouchableOpacity key={d} style={[s.dayBtn, selectedDays.includes(i) && s.dayBtnSelected]} onPress={() => toggleDay(i)}>
                <Text style={[s.dayText, selectedDays.includes(i) && s.dayTextSelected]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <TouchableOpacity style={s.btn} onPress={() => router.push({
        pathname: '/(driver)/publish-seats',
        params: { ...params, hour, min, recurring: String(recurring), days: JSON.stringify(selectedDays) },
      })}>
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
  label: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.md },
  timeRow: { flexDirection: 'row', alignItems: 'center', height: 160, marginBottom: SPACING.md },
  picker: { flex: 1, backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, maxHeight: 160 },
  pickerItem: { paddingVertical: SPACING.sm, alignItems: 'center' },
  pickerItemSelected: { backgroundColor: COLORS.gold + '33' },
  pickerText: { fontSize: FONTS.sizes.lg, color: COLORS.textMuted },
  pickerTextSelected: { color: COLORS.gold, fontWeight: '700' },
  colon: { fontSize: 32, color: COLORS.white, marginHorizontal: SPACING.md },
  timeDisplay: { fontSize: 48, fontWeight: '700', color: COLORS.gold, textAlign: 'center', marginBottom: SPACING.xl },
  recurringRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg },
  recurringLabel: { fontSize: FONTS.sizes.base, color: COLORS.white },
  daysRow: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.xl },
  dayBtn: { flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, backgroundColor: COLORS.navyLight, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  dayBtnSelected: { borderColor: COLORS.gold, backgroundColor: COLORS.gold + '22' },
  dayText: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600' },
  dayTextSelected: { color: COLORS.gold },
  btn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center' },
  btnText: { color: COLORS.navy, fontSize: FONTS.sizes.base, fontWeight: '700' },
});
