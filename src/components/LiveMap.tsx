import React, { useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

export type MapPoint = {
  id?: string;
  name: string;
  lat: number | string;
  lng: number | string;
  order_index?: number;
};

type Props = {
  points: MapPoint[];               // all corridor stops (drawn as the route)
  from?: MapPoint | null;           // highlighted pickup (green)
  to?: MapPoint | null;             // highlighted dropoff (red)
  userLocation?: { lat: number; lng: number } | null;
  height?: number;
  interactive?: boolean;            // allow drag/zoom (default true)
  rounded?: boolean;
};

const NAVY = '#0D1B2A';
const GOLD = '#F5B800';

/**
 * Live, interactive map for Expo Go — no Google key, no dev build needed.
 * Renders Leaflet + free Carto tiles inside a WebView. Plots the WeMove
 * corridor, highlights the selected pickup/dropoff, and shows the user's
 * GPS location. Swap the tile layer for Google tiles once we ship a dev build.
 */
export default function LiveMap({
  points,
  from,
  to,
  userLocation,
  height = 220,
  interactive = true,
  rounded = true,
}: Props) {
  const html = useMemo(() => {
    const pts = (points || [])
      .map(p => ({ name: p.name, lat: Number(p.lat), lng: Number(p.lng), order: p.order_index ?? 0 }))
      .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng))
      .sort((a, b) => a.order - b.order);

    const fromPt = from ? { lat: Number(from.lat), lng: Number(from.lng), name: from.name } : null;
    const toPt = to ? { lat: Number(to.lat), lng: Number(to.lng), name: to.name } : null;
    const user = userLocation && Number.isFinite(userLocation.lat) ? userLocation : null;

    const data = JSON.stringify({ pts, fromPt, toPt, user, interactive });

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #EAEAEA; }
    .pin { background: ${GOLD}; color: ${NAVY}; width: 22px; height: 22px; border-radius: 50%;
           display: flex; align-items: center; justify-content: center; font: 700 11px sans-serif;
           border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.4); }
    .pin.from { background: #16A34A; color: #fff; width: 26px; height: 26px; }
    .pin.to   { background: #EF4444; color: #fff; width: 26px; height: 26px; }
    .me { width: 16px; height: 16px; border-radius: 50%; background: #2563EB; border: 3px solid #fff;
          box-shadow: 0 0 0 6px rgba(37,99,235,0.25); }
    .leaflet-control-attribution { font-size: 8px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var D = ${data};
    var map = L.map('map', {
      zoomControl: false, attributionControl: true,
      dragging: D.interactive, scrollWheelZoom: D.interactive,
      doubleClickZoom: D.interactive, touchZoom: D.interactive, tap: D.interactive
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19, subdomains: 'abcd'
    }).addTo(map);

    var bounds = [];
    function icon(cls, label){ return L.divIcon({ className:'', html:'<div class="'+cls+'">'+(label||'')+'</div>', iconSize:[22,22], iconAnchor:[11,11] }); }

    // route line through all stops
    if (D.pts.length > 1) {
      var line = D.pts.map(function(p){ return [p.lat, p.lng]; });
      L.polyline(line, { color: '${NAVY}', weight: 4, opacity: 0.55 }).addTo(map);
    }

    // all stop markers (skip ones that are the highlighted from/to, drawn separately)
    D.pts.forEach(function(p, i){
      var isFrom = D.fromPt && Math.abs(p.lat-D.fromPt.lat)<1e-6 && Math.abs(p.lng-D.fromPt.lng)<1e-6;
      var isTo   = D.toPt   && Math.abs(p.lat-D.toPt.lat)<1e-6   && Math.abs(p.lng-D.toPt.lng)<1e-6;
      if (isFrom || isTo) return;
      L.marker([p.lat, p.lng], { icon: icon('pin', String(i+1)) }).addTo(map).bindPopup(p.name);
      bounds.push([p.lat, p.lng]);
    });

    if (D.fromPt) { L.marker([D.fromPt.lat, D.fromPt.lng], { icon: icon('pin from','A') }).addTo(map).bindPopup(D.fromPt.name); bounds.push([D.fromPt.lat, D.fromPt.lng]); }
    if (D.toPt)   { L.marker([D.toPt.lat, D.toPt.lng],   { icon: icon('pin to','B')   }).addTo(map).bindPopup(D.toPt.name);   bounds.push([D.toPt.lat, D.toPt.lng]); }

    if (D.user) {
      L.marker([D.user.lat, D.user.lng], { icon: L.divIcon({ className:'', html:'<div class="me"></div>', iconSize:[16,16], iconAnchor:[8,8] }) }).addTo(map);
      bounds.push([D.user.lat, D.user.lng]);
    }

    // focus: the selected segment if any, else the whole corridor
    if (D.fromPt && D.toPt) {
      map.fitBounds([[D.fromPt.lat,D.fromPt.lng],[D.toPt.lat,D.toPt.lng]], { padding:[50,50], maxZoom:14 });
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding:[40,40], maxZoom:14 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 13);
    } else {
      map.setView([5.61, -0.165], 12);
    }
  </script>
</body>
</html>`;
  }, [points, from, to, userLocation, interactive]);

  return (
    <View
      style={[styles.wrap, { height }, rounded && styles.rounded]}
      pointerEvents={interactive ? 'auto' : 'none'}
    >
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        scrollEnabled={false}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={GOLD} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden', backgroundColor: '#EAEAEA' },
  rounded: { borderRadius: 16 },
  web: { flex: 1, backgroundColor: 'transparent' },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAEAEA' },
});
