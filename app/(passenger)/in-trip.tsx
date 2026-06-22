import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '../../src/lib/api';
import BottomNav from '../../src/components/BottomNav';

const C = {
  navy: '#0D1B2A', gold: '#F5B800', white: '#FFFFFF',
  bg: '#F6F7F9', dark: '#111827', muted: '#6B7280',
  border: '#E5E7EB', hint: '#9CA3AF', error: '#EF4444',
};

export default function InTripScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    api.get(`/bookings/${bookingId}`).then(r => setBooking(r.data.booking)).catch(() => {});
  }, [bookingId]);

  return (
    <View style={s.root}>
      {/* Navy header */}
      <View style={s.header}>
        <View style={s.inTripBadge}>
          <Text style={s.inTripBadgeDot}>●</Text>
          <Text style={s.inTripBadgeTxt}>Trip in progress</Text>
        </View>
        <Text style={s.title}>You're on the move!</Text>
        {booking?.driver_name && <Text style={s.sub}>Driver: {booking.driver_name}</Text>}
      </View>

      {/* White content */}
      <View style={s.content}>
        {/* Vehicle info */}
        <View style={s.card}>
          {booking && (
            <>
              <View style={s.driverRow}>
                <View style={s.driverAvatar}>
                  <Text style={s.driverAvatarTxt}>{(booking.driver_name || '?')[0].toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={s.driverName}>{booking.driver_name}</Text>
                  {booking.driver_rating != null && (
                    <Text style={s.driverMeta}>⭐ {Number(booking.driver_rating).toFixed(1)}  ○ {booking.driver_reliability ?? 100}% reliable</Text>
                  )}
                </View>
              </View>
              <View style={s.vehicleLine}>
                <Feather name="truck" size={14} color={C.hint} style={{ marginRight: 8 }} />
                <Text style={s.vehicleTxt}>{booking.vehicle_colour} {booking.vehicle_make} · {booking.plate_number}</Text>
              </View>
            </>
          )}
        </View>

        {/* Route */}
        {booking && (
          <View style={s.card}>
            <View style={s.routeRow}>
              <View style={s.dots}>
                <View style={s.dotBlack} />
                <View style={s.dotLine} />
                <View style={s.dotRed} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.stopName}>{booking.pickup_point_name}</Text>
                <View style={{ height: 18 }} />
                <Text style={[s.stopName, { color: '#EF4444' }]}>{booking.dropoff_point_name} — your stop</Text>
              </View>
            </View>
          </View>
        )}

        {/* Fare */}
        {booking && (
          <View style={[s.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <Text style={s.fareLabel}>Fare</Text>
            <Text style={s.fareAmt}>GHS {booking.total_price}</Text>
          </View>
        )}

        {/* SOS */}
        <TouchableOpacity style={s.sosBtn} onPress={() => Alert.alert('Emergency SOS', 'This will alert WeMove admins immediately.', [{ text: 'Cancel' }, { text: 'Send SOS', style: 'destructive' }])}>
          <Feather name="alert-triangle" size={16} color={C.error} />
          <Text style={s.sosTxt}>Emergency SOS</Text>
        </TouchableOpacity>

        {/* Rate + end trip (post-trip) */}
        <TouchableOpacity
          style={s.rateBtn}
          onPress={() => router.replace({ pathname: '/(passenger)/rate', params: { bookingId } })}
        >
          <Text style={s.rateBtnTxt}>Trip complete — Rate your driver</Text>
        </TouchableOpacity>
      </View>

      <BottomNav active="home" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navy },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32 },
  inTripBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16,185,129,0.2)', alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  inTripBadgeDot: { fontSize: 10, color: '#10B981' },
  inTripBadgeTxt: { fontSize: 12, fontWeight: '600', color: '#10B981' },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  content: { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 },
  card: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  driverAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  driverAvatarTxt: { fontSize: 16, fontWeight: '700', color: '#374151' },
  driverName: { fontSize: 15, fontWeight: '600', color: C.dark },
  driverMeta: { fontSize: 12, color: C.muted, marginTop: 2 },
  vehicleLine: { flexDirection: 'row', alignItems: 'center' },
  vehicleTxt: { fontSize: 13, color: C.hint },
  routeRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  dots: { alignItems: 'center', paddingTop: 4 },
  dotBlack: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.dark },
  dotLine: { width: 2, height: 24, backgroundColor: C.border, marginVertical: 4 },
  dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
  stopName: { fontSize: 15, fontWeight: '500', color: C.dark },
  fareLabel: { fontSize: 14, color: C.muted },
  fareAmt: { fontSize: 20, fontWeight: '700', color: C.dark },
  sosBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 14, borderWidth: 1, borderColor: '#FECACA', paddingVertical: 12 },
  sosTxt: { fontSize: 14, fontWeight: '600', color: C.error },
  rateBtn: { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  rateBtnTxt: { fontSize: 15, fontWeight: '700', color: C.navy },
});
