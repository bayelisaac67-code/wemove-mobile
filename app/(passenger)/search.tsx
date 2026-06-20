import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../src/constants/theme';

const RECENT = ['Oyarifa Junction', 'Accra Central', '37 Station', 'Madina Market'];

export default function SearchScreen() {
  const router = useRouter();
  const [destination, setDestination] = useState('');

  function handleSearch(dest: string) {
    router.push({ pathname: '/(passenger)/trips-list', params: { destination: dest } });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Where are you going?</Text>

      <View style={styles.inputRow}>
        <Text style={styles.pin}>📍</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter destination"
          placeholderTextColor={COLORS.textMuted}
          value={destination}
          onChangeText={setDestination}
          onSubmitEditing={() => destination && handleSearch(destination)}
          autoFocus
          returnKeyType="search"
        />
        {destination.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch(destination)} style={styles.goBtn}>
            <Text style={styles.goText}>Go</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Comparison card (Shared active, Solo coming soon) */}
      <View style={styles.comparisonRow}>
        <View style={[styles.compCard, styles.compCardActive]}>
          <Text style={styles.compLabel}>Shared Ride</Text>
          <Text style={styles.compPrice}>From GHS 10</Text>
          <Text style={styles.compDetail}>Assigned pickup point</Text>
          <Text style={styles.compBadge}>🌿 Carbon saving</Text>
        </View>
        <View style={[styles.compCard, styles.compCardDisabled]}>
          <Text style={[styles.compLabel, { color: COLORS.textMuted }]}>Solo Ride</Text>
          <Text style={[styles.compPrice, { color: COLORS.textMuted }]}>Coming soon</Text>
          <Text style={[styles.compDetail, { color: COLORS.textMuted }]}>Door-to-door</Text>
        </View>
      </View>

      <Text style={styles.recentLabel}>Recent destinations</Text>
      <ScrollView>
        {RECENT.map(r => (
          <TouchableOpacity key={r} style={styles.recentItem} onPress={() => handleSearch(r)}>
            <Text style={styles.recentIcon}>🕐</Text>
            <Text style={styles.recentText}>{r}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy, padding: SPACING.lg, paddingTop: SPACING.xxl },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.white, marginBottom: SPACING.lg },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, marginBottom: SPACING.xl },
  pin: { fontSize: 18, marginRight: SPACING.sm },
  input: { flex: 1, color: COLORS.white, fontSize: FONTS.sizes.base, paddingVertical: SPACING.md },
  goBtn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  goText: { color: COLORS.navy, fontWeight: '700', fontSize: FONTS.sizes.sm },
  comparisonRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  compCard: { flex: 1, borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.xs },
  compCardActive: { backgroundColor: COLORS.navyLight, borderWidth: 1.5, borderColor: COLORS.gold },
  compCardDisabled: { backgroundColor: COLORS.navyLight, borderWidth: 1, borderColor: COLORS.border, opacity: 0.5 },
  compLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.white },
  compPrice: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.gold },
  compDetail: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  compBadge: { fontSize: FONTS.sizes.xs, color: '#4CAF50' },
  recentLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.sm },
  recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  recentIcon: { fontSize: 16, marginRight: SPACING.md },
  recentText: { color: COLORS.white, fontSize: FONTS.sizes.base },
});
