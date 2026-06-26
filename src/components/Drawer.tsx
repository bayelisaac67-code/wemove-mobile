import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';

const SCREEN_W = Dimensions.get('window').width;
const PANEL_W = Math.min(330, Math.round(SCREEN_W * 0.84));

const C = {
  navy: '#0D1B2A', gold: '#F5B800', white: '#FFFFFF',
  dark: '#111827', muted: '#6B7280', hint: '#9CA3AF',
  border: '#E5E7EB', bg: '#F3F4F6', error: '#EF4444', green: '#10B981',
};

type Item = { icon: keyof typeof Feather.glyphMap; label: string; sub?: string; onPress: () => void; danger?: boolean };

// Bolt-style slide-in left menu (screenshot #2). Reuses the same destinations as
// the Account screen; opened by the Home map hamburger.
export default function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const slide = useRef(new Animated.Value(-PANEL_W)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, { toValue: open ? 0 : -PANEL_W, duration: 240, useNativeDriver: true }),
      Animated.timing(fade, { toValue: open ? 1 : 0, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [open]);

  const initials = (user?.preferred_name || user?.full_name || 'W').slice(0, 2).toUpperCase();
  const rating = user?.reliability_score != null ? Number(user.reliability_score).toFixed(2) : '5.00';

  const go = (fn: () => void) => { onClose(); setTimeout(fn, 220); };
  const soon = (msg: string) => go(() => Alert.alert('Coming soon', msg));

  const items: Item[] = [
    { icon: 'credit-card', label: 'Payment', onPress: () => soon('Payment methods are on the way.') },
    { icon: 'tag', label: 'Promotions', sub: 'Enter promo code', onPress: () => soon('Promo codes are coming soon.') },
    { icon: 'clock', label: 'My Rides', onPress: () => go(() => router.push('/(passenger)/history')) },
    { icon: 'shield', label: 'Safety', onPress: () => soon('Safety tools (SOS, trusted contacts) are coming soon.') },
    { icon: 'help-circle', label: 'Support', onPress: () => go(() => Alert.alert('Support', 'Email support@wemove.app for help.')) },
    { icon: 'info', label: 'About', onPress: () => go(() => Alert.alert('WeMove', 'Premium shared rides along the Accra Central ↔ Oyarifa corridor.')) },
  ];

  if (!open) {
    // Keep mounted only while animating closed; fully unmount when settled.
    // (open toggles drive the animation; returning null when closed avoids
    // intercepting touches behind the screen.)
  }

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]} pointerEvents={open ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, s.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[s.panel, { width: PANEL_W, paddingTop: insets.top + 16, transform: [{ translateX: slide }] }]}>
        {/* Profile */}
        <View style={s.profile}>
          <View style={s.avatar}><Text style={s.avatarTxt}>{initials}</Text></View>
          <Text style={s.name}>{user?.preferred_name || user?.full_name || 'Rider'}</Text>
          <TouchableOpacity onPress={() => go(() => router.push('/(passenger)/account'))}>
            <Text style={s.myAccount}>My account</Text>
          </TouchableOpacity>
          <View style={s.ratingRow}>
            <Feather name="star" size={15} color={C.gold} />
            <Text style={s.ratingTxt}>{rating} <Text style={s.ratingMuted}>Rating</Text></Text>
          </View>
        </View>

        <View style={s.menu}>
          {items.map((it, i) => (
            <TouchableOpacity key={it.label} style={[s.item, i > 0 && s.itemBorder]} onPress={it.onPress} activeOpacity={0.6}>
              <Feather name={it.icon} size={20} color={C.dark} />
              <View style={{ flex: 1 }}>
                <Text style={s.itemLabel}>{it.label}</Text>
                {it.sub ? <Text style={s.itemSub}>{it.sub}</Text> : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={s.signOut}
          activeOpacity={0.6}
          onPress={() => Alert.alert('Sign out?', '', [
            { text: 'Cancel' },
            { text: 'Sign out', style: 'destructive', onPress: () => { onClose(); logout(); router.replace('/'); } },
          ])}
        >
          <Feather name="log-out" size={20} color={C.error} />
          <Text style={s.signOutTxt}>Sign out</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.4)' },
  panel: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: C.white, paddingHorizontal: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 2, height: 0 }, elevation: 16 },
  profile: { paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarTxt: { fontSize: 22, fontWeight: '800', color: C.navy },
  name: { fontSize: 19, fontWeight: '700', color: C.dark },
  myAccount: { fontSize: 13, color: C.green, fontWeight: '600', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  ratingTxt: { fontSize: 15, fontWeight: '700', color: C.dark },
  ratingMuted: { color: C.muted, fontWeight: '400' },
  menu: { paddingTop: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 15 },
  itemBorder: { borderTopWidth: 1, borderTopColor: '#F1F2F4' },
  itemLabel: { fontSize: 16, color: C.dark, fontWeight: '500' },
  itemSub: { fontSize: 12, color: C.muted, marginTop: 1 },
  signOut: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, marginTop: 'auto', marginBottom: 16, borderTopWidth: 1, borderTopColor: C.border },
  signOutTxt: { fontSize: 16, color: C.error, fontWeight: '600' },
});
