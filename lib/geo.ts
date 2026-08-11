// lib/geo.ts

export interface LatLng {
  lat: number;
  lng: number;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance in kilometers between two points (§2). */
export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

/**
 * Forward geocoding via OpenStreetMap Nominatim — no API key needed and
 * keeps us on the same map stack already chosen for §2 (Leaflet/OSM).
 * Server-side only: Nominatim's usage policy requires a descriptive
 * User-Agent and reasonable request volume.
 */
export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  if (!query.trim()) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "ma");

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "ORYOC/1.0 (contact@oryoc.ma)" },
    });
    if (!res.ok) return null;
    const results = (await res.json()) as { lat: string; lon: string; display_name: string }[];
    const first = results[0];
    if (!first) return null;
    return { lat: parseFloat(first.lat), lng: parseFloat(first.lon), displayName: first.display_name };
  } catch (err) {
    console.error("[geo] geocoding failed", err);
    return null;
  }
}

/** ±1 room / ±10% price fuzzy matching window, per §5.6. */
export function fuzzyRoomRange(rooms: number): { min: number; max: number } {
  return { min: Math.max(0, rooms - 1), max: rooms + 1 };
}

export function fuzzyPriceRange(price: number): { min: number; max: number } {
  return { min: price * 0.9, max: price * 1.1 };
}
