import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LiveMap, { MapPoint } from './LiveMap';

type Props = {
  points: MapPoint[];
  from?: MapPoint | null;
  to?: MapPoint | null;
  userLocation?: { lat: number; lng: number } | null;
  height: number;
  interactive?: boolean;
  onMenu?: () => void;        // floating hamburger, top-left
  onBack?: () => void;        // floating back arrow, top-left (use instead of menu)
  avatarText?: string;        // gold avatar, top-right
  onAvatar?: () => void;
  onPressMap?: () => void;    // tap the map (only when non-interactive)
};

// Bolt-style map hero: a full-width map at the top of a screen with floating
// circular controls over it. Wraps the existing LiveMap (Leaflet WebView) so the
// map provider can still be swapped in one place later.
export default function MapHero({
  points, from, to, userLocation, height,
  interactive = false, onMenu, onBack, avatarText, onAvatar, onPressMap,
}: Props) {
  const insets = useSafeAreaInsets();
  const top = (insets.top || 12) + 4;

  return (
    <View style={[styles.wrap, { height }]}>
      <LiveMap
        points={points}
        from={from}
        to={to}
        userLocation={userLocation}
        height={height}
        interactive={interactive}
        rounded={false}
      />

      {/* Tap-through layer to open search when the map isn't draggable */}
      {!interactive && onPressMap && (
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onPressMap} />
      )}

      {/* Top-left: menu or back */}
      {(onMenu || onBack) && (
        <TouchableOpacity
          style={[styles.fab, { top, left: 16 }]}
          activeOpacity={0.85}
          onPress={onBack || onMenu}
        >
          <Feather name={onBack ? 'arrow-left' : 'menu'} size={22} color="#0D1B2A" />
        </TouchableOpacity>
      )}

      {/* Top-right: avatar */}
      {avatarText != null && (
        <TouchableOpacity
          style={[styles.avatar, { top, right: 16 }]}
          activeOpacity={0.85}
          onPress={onAvatar}
        >
          <Text style={styles.avatarTxt}>{avatarText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', backgroundColor: '#EAEAEA' },
  fab: {
    position: 'absolute', width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  avatar: {
    position: 'absolute', width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F5B800', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  avatarTxt: { fontSize: 15, fontWeight: '700', color: '#0D1B2A' },
});
