import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

type Props = {
  icon?: keyof typeof Feather.glyphMap;   // default 'clock'
  title: string;
  subtitle?: string;
  rightText?: string;                     // e.g. distance "4.3 km"
  showChevron?: boolean;
  selected?: boolean;
  onPress?: () => void;
};

const C = {
  navy: '#0D1B2A', gold: '#F5B800', dark: '#111827',
  muted: '#6B7280', hint: '#9CA3AF', bg: '#F3F4F6', border: '#E5E7EB',
  goldBg: '#FFFBEB',
};

// Bolt-style location/list row: gray rounded-square icon + bold title + muted
// subtitle, with an optional right-hand value (distance) or chevron.
export default function LocationRow({
  icon = 'clock', title, subtitle, rightText, showChevron, selected, onPress,
}: Props) {
  return (
    <TouchableOpacity
      style={[s.row, selected && s.rowSelected]}
      activeOpacity={onPress ? 0.6 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[s.iconBox, selected && s.iconBoxSelected]}>
        <Feather name={icon} size={18} color={selected ? C.navy : C.muted} />
      </View>
      <View style={s.body}>
        <Text style={[s.title, selected && s.titleSelected]} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={s.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {rightText ? <Text style={s.right}>{rightText}</Text> : null}
      {showChevron ? <Feather name="chevron-right" size={18} color={C.hint} style={{ marginLeft: 6 }} /> : null}
      {selected && !rightText && !showChevron ? <Feather name="check" size={18} color={C.gold} /> : null}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  rowSelected: { },
  iconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  iconBoxSelected: { backgroundColor: C.goldBg },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: C.dark },
  titleSelected: { color: C.navy, fontWeight: '700' },
  subtitle: { fontSize: 12, color: C.muted, marginTop: 1 },
  right: { fontSize: 13, color: C.muted, fontWeight: '500' },
});
