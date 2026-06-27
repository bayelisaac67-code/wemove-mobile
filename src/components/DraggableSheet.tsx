import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, StyleSheet, Animated, PanResponder, ScrollView, Dimensions, Easing,
} from 'react-native';

const SCREEN_H = Dimensions.get('window').height;

type Props = {
  /** Collapsed peek height (visible when fully down). */
  peekHeight?: number;
  /** Expanded height (visible when fully up). Defaults to ~78% of screen. */
  expandedHeight?: number;
  /** Distance reserved at the bottom (e.g. for a tab bar) so the sheet sits above it. */
  bottomInset?: number;
  /**
   * Optional shared drag value (0 = expanded/up, RANGE = collapsed/down). Pass one
   * in when a parent needs to size something behind the sheet (e.g. a map that
   * shrinks as the sheet rises). If omitted, an internal value is used.
   */
  translateY?: Animated.Value;
  /** Fires whenever the sheet settles on a snap point. */
  onSnap?: (state: 'peek' | 'expanded') => void;
  /** Always-visible peek content (handle + search pill). Drag zone. */
  header: React.ReactNode;
  /** Scrollable body, revealed when expanded. */
  children: React.ReactNode;
};

/**
 * Bolt-style draggable bottom sheet over a full-screen map.
 * Pure core-RN (Animated + PanResponder) — no native deps, safe in Expo Go.
 * Two snap points: a small peek tab and an expanded panel. Dragging the header
 * (handle/search zone) resizes the sheet; the body scrolls only when expanded.
 * The drag value (`translateY`) can be shared so a parent map shrinks/grows with it.
 */
export default function DraggableSheet({
  peekHeight = 220,
  expandedHeight = Math.round(SCREEN_H * 0.78),
  bottomInset = 0,
  translateY: external,
  onSnap,
  header,
  children,
}: Props) {
  // translateY: 0 = expanded (up), RANGE = collapsed (down to peek).
  const RANGE = Math.max(1, expandedHeight - peekHeight);
  const internal = useRef(new Animated.Value(RANGE)).current; // start collapsed
  const translateY = external || internal;
  const offset = useRef(RANGE);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const id = translateY.addListener(({ value }) => { offset.current = value; });
    return () => translateY.removeListener(id);
  }, [translateY]);

  const snapTo = (target: number) => {
    const isExpanded = target === 0;
    // Smooth, controlled glide (no bounce) — distance-aware so a short drag
    // doesn't whip across the screen.
    const distance = Math.abs(offset.current - target);
    const duration = Math.min(420, Math.max(220, distance * 0.9));
    Animated.timing(translateY, {
      toValue: target,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // shared with map height (JS-driven), so keep JS here too
    }).start(({ finished }) => {
      if (finished) { setExpanded(isExpanded); onSnap?.(isExpanded ? 'expanded' : 'peek'); }
    });
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        // Only claim the gesture once it's clearly a vertical drag (lets taps through).
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 10 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_e, g) => {
          let next = offset.current + g.dy;
          if (next < 0) next = 0;
          if (next > RANGE) next = RANGE;
          translateY.setValue(next);
        },
        onPanResponderRelease: (_e, g) => {
          const current = offset.current;
          // Velocity decides if it's a clear flick; otherwise snap to the nearer end.
          if (g.vy < -0.6) return snapTo(0);
          if (g.vy > 0.6) return snapTo(RANGE);
          snapTo(current < RANGE / 2 ? 0 : RANGE);
        },
      }),
    [RANGE, translateY],
  );

  return (
    <Animated.View
      style={[
        s.sheet,
        { height: expandedHeight, bottom: bottomInset, transform: [{ translateY }] },
      ]}
    >
      {/* Drag zone: handle + header (search pill) */}
      <View {...pan.panHandlers} style={s.headerZone}>
        <View style={s.handle} />
        {header}
      </View>

      {/* Body — scrolls only when expanded so drag/scroll don't fight */}
      <ScrollView
        style={s.body}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={expanded}
        bounces={false}
      >
        {children}
      </ScrollView>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -3 },
    elevation: 16,
  },
  headerZone: { paddingHorizontal: 20, paddingTop: 8 },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 12 },
  body: { flex: 1, paddingHorizontal: 20, marginTop: 4 },
});
