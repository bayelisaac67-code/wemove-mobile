import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '../../src/lib/api';
import BottomNav from '../../src/components/BottomNav';

const C = {
  navy: '#0D1B2A', gold: '#F5B800', white: '#FFFFFF',
  bg: '#F6F7F9', dark: '#111827', muted: '#6B7280',
  border: '#E5E7EB', hint: '#9CA3AF', error: '#EF4444',
  green: '#10B981', greenBg: '#D1FAE5',
};

export default function ConfirmedScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    api.get(`/bookings/${bookingId}`).then(r => setBooking(r.data.booking)).catch(() => {});
  }, [bookingId]);

  const dep = booking ? new Date(booking.departure_time) : null;

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Green banner */}
        <View style={s.banner}>
          <View style={s.checkCircle}>
            <Feather name="check" size={28} color={C.white} />
          </View>
          <Text style={s.bannerTitle}>Ride Confirmed!</Text>
          <Text style={s.bannerSub}>Your seat is booked. Get ready to move.</Text>
        </View>

        {/* Trip details */}
        <View style={s.card}>
          {dep && (
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Departure</Text>
              <Text style={s.metaVal}>{dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {dep.toLocaleDateString('en-GH', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
            </View>
          )}
          {booking?.driver_name && (
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Driver</Text>
              <View style={s.driverChip}>
                <View style={s.driverAvatar}><Text style={s.driverAvatarTxt}>{booking.driver_name[0].toUpperCase()}</Text></View>
                <Text style={s.metaVal}>{booking.driver_name}</Text>
              </View>
            </View>
          )}
          {booking && (
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Vehicle</Text>
              <Text style={s.metaVal}>{booking.vehicle_colour} {booking.vehicle_make} · {booking.plate_number}</Text>
            </View>
          )}
          {booking && (
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Fare</Text>
              <Text style={[s.metaVal, s.fareVal]}>GHS {booking.total_price}</Text>
            </View>
          )}
          {booking && (
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Payment</Text>
              <Text style={s.metaVal}>{booking.payment_method}</Text>
            </View>
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
                <View style={{ height: 20 }} />
                <Text style={s.stopName}>{booking.dropoff_point_name}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={s.actionsRow}>
          <TouchableOpacity style={s.actionBtn} onPress={() => Alert.alert('Calling driver', 'In-app call coming soon.')}>
            <Feather name="phone" size={20} color={C.navy} />
            <Text style={s.actionBtnTxt}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { borderColor: C.error }]} onPress={() => Alert.alert('Cancel booking?', 'Are you sure?', [
            { text: 'No' },
            { text: 'Yes, cancel', style: 'destructive', onPress: async () => { try { await api.delete(`/bookings/${bookingId}`); } catch {} router.replace('/(passenger)/home'); } },
          ])}>
            <Feather name="x" size={20} color={C.error} />
            <Text style={[s.actionBtnTxt, { color: C.error }]}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* SOS */}
        <TouchableOpacity style={s.sosBtn} onPress={() => Alert.alert('SOS', 'Emergency SOS — this will alert WeMove admins immediately. Proceed?', [{ text: 'Cancel' }, { text: 'Send SOS', style: 'destructive' }])}>
          <Feather name="alert-triangle" size={16} color={C.error} />
          <Text style={s.sosTxt}>Emergency SOS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.homeBtn} onPress={() => router.replace('/(passenger)/home')}>
          <Text style={s.homeBtnTxt}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNav active="home" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingTop: 56, gap: 12, paddingBottom: 24 },
  banner: { backgroundColor: C.greenBg, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 4 },
  checkCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  bannerTitle: { fontSize: 22, fontWeight: '700', color: '#065F46', marginBottom: 4 },
  bannerSub: { fontSize: 13, color: '#047857', textAlign: 'center' },
  card: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, gap: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaLabel: { fontSize: 13, color: C.muted },
  metaVal: { fontSize: 13, fontWeight: '500', color: C.dark, flex: 1, textAlign: 'right' },
  fareVal: { fontSize: 16, fontWeight: '700', color: C.dark },
  driverChip: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' },
  driverAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  driverAvatarTxt: { fontSize: 11, fontWeight: '700', color: '#374151' },
  routeRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  dots: { alignItems: 'center', paddingTop: 4 },
  dotBlack: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.dark },
  dotLine: { width: 2, height: 24, backgroundColor: C.border, marginVertical: 4 },
  dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
  stopName: { fontSize: 14, fontWeight: '500', color: C.dark },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.white, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, paddingVertical: 14 },
  actionBtnTxt: { fontSize: 15, fontWeight: '600', color: C.navy },
  sosBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 14, borderWidth: 1, borderColor: '#FECACA', paddingVertical: 12 },
  sosTxt: { fontSize: 14, fontWeight: '600', color: C.error },
  homeBtn: { backgroundColor: C.navy, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  homeBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
