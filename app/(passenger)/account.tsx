import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';

const STATUS_COLOR: Record<string, string> = { VERIFIED: '#4CAF50', PENDING: COLORS.gold, REJECTED: COLORS.error, UNVERIFIED: COLORS.textMuted };

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>{(user?.preferred_name || user?.full_name || '?')[0].toUpperCase()}</Text>
      </View>
      <Text style={s.name}>{user?.preferred_name || user?.full_name || 'User'}</Text>
      <View style={[s.badge, { backgroundColor: STATUS_COLOR[user?.verification_status || 'UNVERIFIED'] + '22', borderColor: STATUS_COLOR[user?.verification_status || 'UNVERIFIED'] }]}>
        <Text style={[s.badgeText, { color: STATUS_COLOR[user?.verification_status || 'UNVERIFIED'] }]}>{user?.verification_status || 'UNVERIFIED'}</Text>
      </View>
      <Text style={s.reliability}>Reliability: {user?.reliability_score ?? 100}/100</Text>

      <View style={s.section}>
        <MenuItem icon="👤" label="Edit profile" onPress={() => router.push('/onboarding/profile')} />
        <MenuItem icon="💳" label="Payment methods" onPress={() => Alert.alert('Coming soon', 'This feature is on the way.')} />
        <MenuItem icon="🗺️" label="Saved routes" onPress={() => Alert.alert('Coming soon', 'This feature is on the way.')} />
        <MenuItem icon="🚨" label="Emergency contact" onPress={() => Alert.alert('Coming soon', 'This feature is on the way.')} />
      </View>

      <View style={s.section}>
        <MenuItem icon="🚗" label="Become a driver" onPress={() => router.push('/onboarding/become-driver')} />
        <MenuItem icon="📋" label="Verification status" onPress={() => router.push('/onboarding/verification-status')} />
      </View>

      <View style={s.section}>
        <MenuItem icon="❓" label="Help & support" onPress={() => Alert.alert('Coming soon', 'This feature is on the way.')} />
        <MenuItem icon="🚪" label="Log out" onPress={() => Alert.alert('Log out?', '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: () => { logout(); router.replace('/'); } }])} textColor={COLORS.error} />
      </View>
    </ScrollView>
  );
}

function MenuItem({ icon, label, onPress, textColor }: { icon: string; label: string; onPress: () => void; textColor?: string }) {
  return (
    <TouchableOpacity style={s.menuItem} onPress={onPress}>
      <Text style={s.menuIcon}>{icon}</Text>
      <Text style={[s.menuLabel, textColor ? { color: textColor } : {}]}>{label}</Text>
      <Text style={s.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xxl, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  avatarText: { fontSize: 32, fontWeight: '700', color: COLORS.navy },
  name: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.white, marginBottom: SPACING.sm },
  badge: { paddingHorizontal: SPACING.md, paddingVertical: 4, borderRadius: RADIUS.xl, borderWidth: 1, marginBottom: SPACING.xs },
  badgeText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  reliability: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.xl },
  section: { width: '100%', backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, marginBottom: SPACING.lg, ...SHADOW },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuIcon: { fontSize: 20, marginRight: SPACING.md, width: 28 },
  menuLabel: { flex: 1, fontSize: FONTS.sizes.base, color: COLORS.white },
  menuArrow: { fontSize: 20, color: COLORS.textMuted },
});
