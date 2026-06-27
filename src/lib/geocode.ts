// Free address geocoding via OpenStreetMap Nominatim — no API key, works in Expo Go.
// Policy notes: max ~1 req/sec, must send an identifying User-Agent/Referer, and
// results are biased to an Accra bounding box. Fine for the pilot's volume.
// Swap this file for a Google Geocoding call later (one place) when a key exists.

const NOMINATIM = 'https://nominatim.openstreetmap.org';
// Greater Accra bounding box: left,top,right,bottom (lng/lat)
const ACCRA_VIEWBOX = '-0.45,5.80,0.10,5.45';
const HEADERS = {
  'User-Agent': 'WeMove/1.0 (rides; support@wemove.app)',
  'Referer': 'https://wemove-admin.vercel.app',
  'Accept-Language': 'en',
};

export type Place = { label: string; sub?: string; lat: number; lng: number };

export type Stop = {
  id?: string;
  name: string;
  lat: number | string;
  lng: number | string;
  order_index?: number;
  [k: string]: any;
};

/** Forward geocode: free-text query → up to `limit` Accra-biased places. */
export async function searchPlaces(query: string, limit = 6): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url =
    `${NOMINATIM}/search?format=json&addressdetails=1&limit=${limit}` +
    `&viewbox=${ACCRA_VIEWBOX}&bounded=1&countrycodes=gh&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];
    const rows: any[] = await res.json();
    return rows
      .map(r => splitLabel(r.display_name, Number(r.lat), Number(r.lon)))
      .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  } catch {
    return [];
  }
}

/** Reverse geocode: coordinates → a human address label + secondary line. */
export async function reverseGeocode(lat: number, lng: number): Promise<Place | null> {
  const url = `${NOMINATIM}/reverse?format=json&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    const r = await res.json();
    if (!r || !r.display_name) return { label: 'Dropped pin', sub: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng };
    return splitLabel(r.display_name, lat, lng);
  } catch {
    return { label: 'Dropped pin', sub: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng };
  }
}

/** Nearest corridor stop to a coordinate (used to snap precise picks to a bookable stop). */
export function nearestStop<T extends Stop>(stops: T[], lat: number, lng: number): T | null {
  if (!stops || !stops.length) return null;
  let best = stops[0];
  let bestD = Infinity;
  for (const s of stops) {
    const d = (Number(s.lat) - lat) ** 2 + (Number(s.lng) - lng) ** 2;
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}

// Nominatim display_name is "Place, Area, City, Region, Country". Use the first
// chunk as the title and the next 1–2 as the subtitle.
function splitLabel(displayName: string, lat: number, lng: number): Place {
  const parts = String(displayName || '').split(',').map(s => s.trim()).filter(Boolean);
  const label = parts[0] || 'Selected location';
  const sub = parts.slice(1, 3).join(', ') || undefined;
  return { label, sub, lat, lng };
}
