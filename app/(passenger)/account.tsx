import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/authStore';
import BottomNav from '../../src/components/BottomNav';

const C = {
  navy: '#0D1B2A', gold: '#F5B800', white: '#FFFFFF',
  bg: '#F6F7F9', dark: '#111827', muted: '#6B7280',
  border: '#E5E7EB', hint: '#9CA3AF', error: '#EF4444',
};

type MenuItem = { icon: string; label: string; onPress: () => void; danger?: boolean };

export default function AccountScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [stats, setStats] = useState({ trips: 0, rating: null as number | null, reliability: 100 });

  useEffect(() => {
    api.get('/users/me/trips')
      .then(r => {
        const bookings: any[] = r.data.bookings || [];
        const completed = bookings.filter(b => b.status === 'COMPLETED');
        setStats(prev => ({ ...prev, trips: completed.length }));
      })
      .catch(() => {});
    api.get('/users/me')
      .then(r => {
        const u = r.data.user;
        setStats(prev => ({ ...prev, rating: u.reliability_score != null ? Number(u.reliability_score) : null }));
      })
      .catch(() => {});
  }, []);

  const initials = (user?.full_name || user?.preferred_name || '?').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  const isVerified = user?.verification_status === 'VERIFIED';

  const sections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Account',
      items: [
        { icon: 'user', label: 'Edit Profile', onPress: () => Alert.alert('Coming soon', 'Profile editing is on the way.') },
        { icon: 'shield', label: 'Verification Status', onPress: () => router.push('/onboarding/verification-status' as any) },
        { icon: 'bell', label: 'Notifications', onPress: () => Alert.alert('Coming soon') },
      ],
    },
    {
      title: 'Ride',
      items: [
        { icon: 'clock', label: 'Trip History', onPress: () => router.push('/(passenger)/history') },
        { icon: 'star', label: 'Rate & Reviews', onPress: () => Alert.alert('Coming soon') },
      ],
    },
    {
      title: 'More',
      items: [
        { icon: 'help-circle', label: 'Help & Support', onPress: () => Alert.alert('Support', 'Email support@wemove.app for help.') },
        { icon: 'info', label: 'About WeMove', onPress: () => Alert.alert('WeMove', 'Premium shared rides along the Accra Central ↔ Oyarifa corridor.') },
        { icon: 'log-out', label: 'Sign Out', danger: true, onPress: () => Alert.alert('Sign out?', '', [{ text: 'Cancel' }, { text: 'Sign out', style: 'destructive', onPress: () => { signOut(); router.replace('/'); } }]) },
      ],
    },
  ];

  return (
    <View style={s.root}>
      {/* Navy header */}
      <View style={s.header}>
        <View style={s.avatarCircle}>
          <Text style={s.avatarTxt}>{initials}</Text>
        </View>
        <Text style={s.name}>{user?.preferred_name || user?.full_name || 'User'}</Text>
        <Text style={s.phone}>{user?.phone}</Text>
        {isVerified && (
          <View style={s.verifiedBadge}>
            <Feather name="check-circle" size={12} color="#10B981" />
            <Text style={s.verifiedTxt}>VERIFIED</Text>
          </View>
        )}
      </View>

      {/* White content */}
      <ScrollView style={s.content} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Stats card */}
        <View style={s.statsCard}>
          <View style={s.statItem}>
            <Text style={s.statVal}>{stats.trips}</Text>
            <Text style={s.statLabel}>Trips</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statVal}>{stats.rating != null ? stats.rating.toFixed(1) : '—'}</Text>
            <Text style={s.statLabel}>Rating</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statVal}>{stats.reliability}%</Text>
            <Text style={s.statLabel}>Reliable</Text>
          </View>
        </View>

        {sections.map(sec => (
          <View key={sec.title} style={{ marginBottom: 8 }}>
            <Text style={s.sectionLabel}>{sec.title.toUpperCase()}</Text>
            <View style={s.menuCard}>
              {sec.items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[s.menuItem, i > 0 && s.menuItemBorder]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[s.menuIcon, item.danger && s.menuIconDanger]}>
                    <Feather name={item.icon as any} size={17} color={item.danger ? C.error : C.muted} />
                  </View>
                  <Text style={[s.menuLabel, item.danger && s.menuLabelDanger]}>{item.label}</Text>
                  {!item.danger && <Feather name="chevron-right" size={16} color={C.hint} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={s.version}>WeMove v1.0 · Pilot</Text>
      </ScrollView>

      <BottomNav active="account" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navy },
  header: { alignItems: 'center', paddingTop: 56, paddingBottom: 32, paddingHorizontal: 20 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarTxt: { fontSize: 28, fontWeight: '800', color: C.navy },
  name: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  phone: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 8 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  verifiedTxt: { fontSize: 11, fontWeight: '700', color: '#10B981' },
  content: { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 20 },
  statsCard: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 20 },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '700', color: C.dark, marginBottom: 2 },
  statLabel: { fontSize: 12, color: C.muted },
  statDivider: { width: 1, height: 36, backgroundColor: C.border },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.hint, letterSpacing: 0.8, marginBottom: 8 },
  menuCard: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  menuItemBorder: { borderTopWidth: 1, borderTopColor: C.border },
  menuIcon: { width: 34, height: 34, borderRadius: 8, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  menuIconDanger: { backgroundColor: '#FEF2F2' },
  menuLabel: { flex: 1, fontSize: 15, color: C.dark },
  menuLabelDanger: { color: C.error },
  version: { textAlign: 'center', fontSize: 12, color: C.hint, marginTop: 12 },
});
