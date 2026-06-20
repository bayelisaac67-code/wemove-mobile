import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../src/constants/theme';
import { api } from '../../src/lib/api';

export default function EarningsScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/earnings').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={[s.container, { justifyContent: 'center' }]}><ActivityIndicator color={COLORS.gold} size="large" /></View>;

  return (
    <View style={s.container}>
      <Text style={s.title}>Earnings</Text>
      <View style={s.summaryRow}>
        <View style={s.summaryCard}>
          <Text style={s.summaryValue}>GHS {data?.total_earnings?.toFixed(0) || 0}</Text>
          <Text style={s.summaryLabel}>Total earned</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={s.summaryValue}>GHS {data?.pending_payout?.toFixed(0) || 0}</Text>
          <Text style={s.summaryLabel}>Pending payout</Text>
        </View>
      </View>

      <View style={s.paymentBreakdown}>
        <Text style={s.breakdownTitle}>Payment breakdown</Text>
        <View style={s.breakdownRow}>
          <Text style={s.breakdownLabel}>📱 Mobile Money</Text>
          <Text style={s.breakdownValue}>GHS {data?.momo_earnings?.toFixed(0) || 0}</Text>
        </View>
        <View style={s.breakdownRow}>
          <Text style={s.breakdownLabel}>🏦 GhanaPay</Text>
          <Text style={s.breakdownValue}>GHS {data?.ghanapay_earnings?.toFixed(0) || 0}</Text>
        </View>
        <View style={s.breakdownRow}>
          <Text style={s.breakdownLabel}>💵 Cash</Text>
          <Text style={s.breakdownValue}>GHS {data?.cash_earnings?.toFixed(0) || 0}</Text>
        </View>
      </View>

      <Text style={s.sectionLabel}>Recent trips</Text>
      <FlatList
        data={data?.recent_trips || []}
        keyExtractor={t => t.id}
        contentContainerStyle={{ gap: SPACING.sm, paddingBottom: SPACING.xxl }}
        renderItem={({ item: t }) => (
          <View style={s.tripRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.tripDate}>{new Date(t.departure_time).toLocaleDateString('en-GH', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
              <Text style={s.tripRoute}>{t.origin_name} → {t.destination_name}</Text>
              <Text style={s.tripPassengers}>{t.passenger_count} passenger{t.passenger_count !== 1 ? 's' : ''}</Text>
            </View>
            <Text style={s.tripEarnings}>GHS {t.driver_payout?.toFixed(0) || 0}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No completed trips yet</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy, padding: SPACING.lg, paddingTop: SPACING.xxl },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.white, marginBottom: SPACING.xl },
  summaryRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  summaryCard: { flex: 1, backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', ...SHADOW },
  summaryValue: { fontSize: FONTS.sizes['2xl'], fontWeight: '700', color: COLORS.gold, marginBottom: 4 },
  summaryLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  paymentBreakdown: { backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.xl, ...SHADOW },
  breakdownTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.white, marginBottom: SPACING.md },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  breakdownLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  breakdownValue: { fontSize: FONTS.sizes.sm, color: COLORS.white, fontWeight: '600' },
  sectionLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.md },
  tripRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.navyLight, borderRadius: RADIUS.md, padding: SPACING.md },
  tripDate: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginBottom: 2 },
  tripRoute: { fontSize: FONTS.sizes.sm, color: COLORS.white, fontWeight: '600', marginBottom: 2 },
  tripPassengers: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  tripEarnings: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.gold },
  empty: { color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xl },
});
