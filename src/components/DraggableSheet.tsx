import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, StyleSheet, Animated, PanResponder, ScrollView, Dimensions,
} from 'react-native';

const SCREEN_H = Dimensions.get('window').height;

type Props = {
  /** Collapsed peek height (visible when fully down). */
  peekHeight?: number;
  /** Expanded height (visible when fully up). Defaults to ~78% of screen. */
  expandedHeight?: number;
  /** Distance reserved at the bottom (e.g. for a tab bar) so the sheet sits above it. */
  bottomInset?: number;
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
 */
export default function DraggableSheet({
  peekHeight = 190,
  expandedHeight = Math.round(SCREEN_H * 0.78),
  bottomInset = 0,
  onSnap,
  header,
  children,
}: Props) {
  // translateY: 0 = expanded (up), RANGE = collapsed (down to peek).
  const RANGE = Math.max(0, expandedHeight - peekHeight);
  const translateY = useRef(new Animated.Value(RANGE)).current; // start collapsed
  const offset = useRef(RANGE);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const id = translateY.addListener(({ value }) => { offset.current = value; });
    return () => translateY.removeListener(id);
  }, [translateY]);

  const snapTo = (target: number) => {
    const isExpanded = target === 0;
    Animated.spring(translateY, {
      toValue: target,
      useNativeDriver: true,
      bounciness: 2,
      speed: 14,
    }).start(() => {
      setExpanded(isExpanded);
      onSnap?.(isExpanded ? 'expanded' : 'peek');
    });
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 6,
        onPanResponderMove: (_e, g) => {
          let next = offset.current + g.dy;
          if (next < 0) next = 0;
          if (next > RANGE) next = RANGE;
          translateY.setValue(next);
        },
        onPanResponderRelease: (_e, g) => {
          const current = offset.current;
          // Decide by velocity first, then by position.
          if (g.vy < -0.5) return snapTo(0);
          if (g.vy > 0.5) return snapTo(RANGE);
          snapTo(current < RANGE / 2 ? 0 : RANGE);
        },
      }),
    [RANGE],
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
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 12 },
  body: { flex: 1, paddingHorizontal: 20, marginTop: 4 },
});
