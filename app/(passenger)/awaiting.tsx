import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '../../src/lib/api';
import BottomNav from '../../src/components/BottomNav';

const C = {
  navy: '#0D1B2A', gold: '#F5B800', white: '#FFFFFF',
  bg: '#F6F7F9', dark: '#111827', muted: '#6B7280',
  border: '#E5E7EB', hint: '#9CA3AF', error: '#EF4444',
  orange: '#D97706', orangeBg: '#FEF3C7',
};

export default function AwaitingScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [status, setStatus] = useState<'REQUESTED' | 'CONFIRMED' | 'REJECTED'>('REQUESTED');
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    api.get(`/bookings/${bookingId}`).then(r => setBooking(r.data.booking)).catch(() => {});

    const poll = setInterval(async () => {
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        const b = res.data.booking;
        setBooking(b);
        const s = b?.status;
        if (s === 'CONFIRMED') {
          clearInterval(poll);
          setStatus('CONFIRMED');
          setTimeout(() => router.replace({ pathname: '/(passenger)/confirmed', params: { bookingId } }), 1000);
        }
        if (s === 'REJECTED') { clearInterval(poll); setStatus('REJECTED'); }
      } catch {}
    }, 3000);
    return () => clearInterval(poll);
  }, [bookingId]);

  if (status === 'CONFIRMED') {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 60, marginBottom: 16 }}>✅</Text>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#10B981' }}>Booking confirmed!</Text>
      </View>
    );
  }

  if (status === 'REJECTED') {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontSize: 60, marginBottom: 16 }}>❌</Text>
        <Text style={{ fontSize: 20, fontWeight: '700', color: C.error, marginBottom: 8 }}>Driver declined</Text>
        <Text style={{ fontSize: 14, color: C.muted, textAlign: 'center', marginBottom: 24 }}>Let's find you another ride.</Text>
        <TouchableOpacity style={{ backgroundColor: C.gold, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28 }} onPress={() => router.back()}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: C.navy }}>See other rides</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dep = booking ? new Date(booking.departure_time) : null;

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header row */}
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>Booking Details</Text>
          <View style={s.requestedBadge}>
            <Text style={s.requestedTxt}>REQUESTED</Text>
          </View>
        </View>

        {/* Spinner card */}
        <View style={s.spinnerCard}>
          <ActivityIndicator color={C.gold} size="large" style={{ marginBottom: 10 }} />
          <Text style={s.waitTitle}>Waiting for driver acceptance</Text>
          <Text style={s.waitSub}>You'll be notified when the driver responds</Text>
        </View>

        {/* Trip info */}
        {booking && (
          <View style={s.card}>
            <View style={s.cardTopRow}>
              <View>
                {dep && <Text style={s.depTime}>{dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>}
                {dep && <Text style={s.depDate}>{dep.toLocaleDateString('en-GH', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.fareAmt}>GHS {booking.total_price}</Text>
                <Text style={s.fareSeats}>{booking.seats} seat{booking.seats !== 1 ? 's' : ''}</Text>
              </View>
            </View>

            <View style={s.vehicleLine}>
              <Feather name="truck" size={13} color={C.hint} style={{ marginRight: 6 }} />
              <Text style={s.vehicleTxt}>{booking.vehicle_colour} {booking.vehicle_make} · {booking.plate_number}</Text>
            </View>

            {booking.driver_name && (
              <View style={s.driverRow}>
                <View style={s.driverAvatar}><Text style={s.driverAvatarTxt}>{booking.driver_name[0].toUpperCase()}</Text></View>
                <View>
                  <Text style={s.driverName}>{booking.driver_name}</Text>
                  {booking.driver_rating != null && (
                    <Text style={s.driverMeta}>⭐ {Number(booking.driver_rating).toFixed(1)}  ○ {booking.driver_reliability ?? 100}%</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

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
                <View style={{ height: 20 }} />
                <Text style={s.stopName}>{booking.dropoff_point_name}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Payment / Status */}
        {booking && (
          <View style={s.card}>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Payment</Text>
              <Text style={s.metaVal}>{booking.payment_method}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Status</Text>
              <Text style={[s.metaVal, { color: C.orange }]}>PENDING</Text>
            </View>
          </View>
        )}

        {/* Cancel */}
        <TouchableOpacity
          style={s.cancelBtn}
          onPress={async () => { try { await api.delete(`/bookings/${bookingId}`); } catch {} router.back(); }}
        >
          <Feather name="x" size={16} color={C.error} />
          <Text style={s.cancelTxt}>Cancel Booking</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNav active="home" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingTop: 56, gap: 12, paddingBottom: 24 },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: C.dark },
  requestedBadge: { backgroundColor: C.orangeBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  requestedTxt: { fontSize: 12, fontWeight: '700', color: C.orange },
  spinnerCard: { backgroundColor: C.orangeBg, borderRadius: 14, padding: 20, alignItems: 'center' },
  waitTitle: { fontSize: 15, fontWeight: '600', color: C.dark, textAlign: 'center', marginBottom: 4 },
  waitSub: { fontSize: 12, color: C.muted, textAlign: 'center' },
  card: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  depTime: { fontSize: 20, fontWeight: '700', color: C.dark },
  depDate: { fontSize: 12, color: C.muted, marginTop: 2 },
  fareAmt: { fontSize: 16, fontWeight: '700', color: C.dark },
  fareSeats: { fontSize: 12, color: C.muted },
  vehicleLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  vehicleTxt: { fontSize: 13, color: C.hint },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  driverAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  driverAvatarTxt: { fontSize: 14, fontWeight: '700', color: '#374151' },
  driverName: { fontSize: 14, fontWeight: '600', color: C.dark },
  driverMeta: { fontSize: 12, color: C.muted, marginTop: 2 },
  routeRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  dots: { alignItems: 'center', paddingTop: 4 },
  dotBlack: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.dark },
  dotLine: { width: 2, height: 24, backgroundColor: C.border, marginVertical: 4 },
  dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
  stopName: { fontSize: 15, fontWeight: '500', color: C.dark },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  metaLabel: { fontSize: 14, color: C.muted },
  metaVal: { fontSize: 14, fontWeight: '600', color: C.dark },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.white, borderRadius: 14, borderWidth: 1.5, borderColor: C.error, paddingVertical: 14 },
  cancelTxt: { fontSize: 15, fontWeight: '600', color: C.error },
});
