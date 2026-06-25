// Client-side display estimates for the "honest fork" comparison (PCD §4).
// These mirror the API's pricing/carbon constants so the search screen can show
// a Shared-vs-Solo comparison BEFORE a trip is picked, without an extra round-trip.
// The server is always the source of truth at booking time — these are previews.

const KM_PER_STOP = 2.5;        // matches pricingEngine.getSegmentKm
const FLOOR = 10;               // FLOOR_FARE_GHS
const PER_KM = 1.5;             // PER_KM_RATE_GHS
const CO2_PER_KM_KG = 0.17;     // pricingEngine CO2_PER_KM_KG

// Solo (door-to-door) band — mirrors pricingEngine.getSoloEstimate
const SOLO_PER_KM_MIN = 2.0;
const SOLO_PER_KM_MAX = 3.0;
const SOLO_FLOOR = 15;

export function segmentKm(fromOrder: number, toOrder: number): number {
  return Math.abs(Number(toOrder) - Number(fromOrder)) * KM_PER_STOP || KM_PER_STOP * 2;
}

export function co2SavedKg(km: number): number {
  return Math.round(km * CO2_PER_KM_KG * 10) / 10;
}

// Shared per-seat band: occupancy discount means more riders → cheaper (toward floor).
export function sharedRange(km: number): { min: number; max: number } {
  const base = Math.max(FLOOR, Math.ceil(km * PER_KM));
  return {
    min: Math.max(FLOOR, Math.round(base * 0.6)),
    max: Math.max(FLOOR, base),
  };
}

export function soloRange(km: number): { min: number; max: number } {
  return {
    min: Math.max(SOLO_FLOOR, Math.ceil(km * SOLO_PER_KM_MIN)),
    max: Math.max(SOLO_FLOOR, Math.ceil(km * SOLO_PER_KM_MAX)),
  };
}

export function fmtRange(r: { min: number; max: number }): string {
  return r.min === r.max ? `GHS ${r.min}` : `GHS ${r.min}–${r.max}`;
}
