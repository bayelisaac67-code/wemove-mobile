import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Tab = 'home' | 'trips' | 'account';

const TABS: { key: Tab; label: string; icon: string; route: string }[] = [
  { key: 'home', label: 'Home', icon: 'home', route: '/(passenger)/home' },
  { key: 'trips', label: 'Trips', icon: 'clock', route: '/(passenger)/history' },
  { key: 'account', label: 'Account', icon: 'user', route: '/(passenger)/account' },
];

export default function BottomNav({ active }: { active: Tab }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.bar, { paddingBottom: insets.bottom || 12 }]}>
      {TABS.map(tab => {
        const on = active === tab.key;
        return (
          <TouchableOpacity key={tab.key} style={s.tab} onPress={() => router.replace(tab.route as any)} activeOpacity={0.7}>
            <View style={[s.iconWrap, on && s.iconWrapOn]}>
              <Feather name={tab.icon as any} size={20} color={on ? '#fff' : '#9CA3AF'} />
            </View>
            <Text style={[s.label, on && s.labelOn]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  iconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  iconWrapOn: { backgroundColor: '#0D1B2A' },
  label: { fontSize: 11, color: '#9CA3AF' },
  labelOn: { color: '#0D1B2A', fontWeight: '600' },
});
