import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { colors, typography, spacing, radius, shadow } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

export default function PassengerHome() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [recentDests, setRecentDests] = useState<string[]>([]);

  useEffect(() => {
    api.get('/users/me/trips').then(r => {
      const bookings: any[] = r.data.bookings || [];
      const seen = new Set<string>();
      const names: string[] = [];
      for (const b of bookings) {
        if (b.dropoff_name && !seen.has(b.dropoff_name)) {
          seen.add(b.dropoff_name);
          names.push(b.dropoff_name);
          if (names.length === 3) break;
        }
      }
      setRecentDests(names);
    }).catch(() => {});
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.name}>{user?.preferred_name || user?.full_name?.split(' ')[0] || 'Rider'} 👋</Text>
        </View>
        <TouchableOpacity style={styles.avatar} onPress={() => router.push('/(passenger)/account')}>
          <Text style={styles.avatarText}>{(user?.preferred_name || 'W')[0].toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {/* Verification banner */}
      {user?.verification_status !== 'VERIFIED' && (
        <TouchableOpacity style={styles.verifyBanner} onPress={() => router.push('/onboarding/verify')} activeOpacity={0.85}>
          <Text style={styles.verifyText}>
            {user?.verification_status === 'PENDING'
              ? '⏳ Verification in progress — you can browse but not book yet.'
              : '🔐 Finish verification to start booking rides.'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Search */}
      <TouchableOpacity style={styles.searchCard} onPress={() => router.push('/(passenger)/search')} activeOpacity={0.9}>
        <Text style={styles.searchLabel}>Where are you going?</Text>
        <View style={styles.searchIcon}>
          <Text style={{ fontSize: 20 }}>→</Text>
        </View>
      </TouchableOpacity>

      {/* Recent */}
      {recentDests.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent destinations</Text>
          {recentDests.map((dest) => (
            <TouchableOpacity
              key={dest}
              style={styles.recentRow}
              onPress={() => router.push({ pathname: '/(passenger)/search', params: { dest } })}
              activeOpacity={0.7}
            >
              <View style={styles.recentIcon}><Text>📍</Text></View>
              <Text style={styles.recentText}>{dest}</Text>
              <Text style={styles.recentArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Become a driver */}
      {!user?.role_flags.includes('DRIVER') && (
        <TouchableOpacity style={styles.driverCard} onPress={() => router.push('/onboarding/become-driver')} activeOpacity={0.85}>
          <Text style={styles.driverTitle}>🚗 Earn with WeMove</Text>
          <Text style={styles.driverSub}>Share your commute and earn on trips you're already making.</Text>
          <Text style={styles.driverCta}>Become a driver →</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navy },
  content: { padding: spacing.lg, paddingTop: 60, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  greeting: { ...typography.body, color: colors.textSecond },
  name: { ...typography.title, color: colors.white },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...typography.subtitle, color: colors.navy },
  verifyBanner: {
    backgroundColor: colors.navyMid,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    padding: spacing.md,
  },
  verifyText: { ...typography.caption, color: colors.textSecond },
  searchCard: {
    backgroundColor: colors.navyLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  searchLabel: { ...typography.bodyBold, color: colors.textHint },
  searchIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { ...typography.label, color: colors.textSecond, marginTop: spacing.sm },
  recentRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  recentIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  recentText: { ...typography.body, color: colors.white, flex: 1 },
  recentArrow: { color: colors.textHint, fontSize: 20 },
  driverCard: {
    backgroundColor: colors.navyMid,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.gold + '40',
  },
  driverTitle: { ...typography.subtitle, color: colors.white, marginBottom: spacing.xs },
  driverSub: { ...typography.body, color: colors.textSecond, marginBottom: spacing.md },
  driverCta: { ...typography.bodyBold, color: colors.gold },
});
