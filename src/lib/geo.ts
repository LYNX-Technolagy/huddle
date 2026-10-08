// src/lib/geo.ts
// Nominatim (OpenStreetMap) geocoding helpers.
// Free service — requires a User-Agent header and max 1 req/sec.
// Never throws — returns null on failure so callers can handle gracefully.

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'HuddleApp/1.0 (contact@joinhuddleup.netlify.app)';
const TIMEOUT_MS = 8000;

export interface GeoResult {
  lat: number;
  lng: number;
  city: string | null;
  displayName: string | null;
}

/**
 * Fetch with a hard timeout so we never hang on Nominatim.
 */
async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    return await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Extract the most useful "city" field from Nominatim's address object.
 * Nominatim returns different keys depending on the location type.
 */
function pickCity(address: Record<string, string> | undefined): string | null {
  if (!address) return null;
  return (
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.county ??
    address.state ??
    null
  );
}

/**
 * Reverse geocode: lat/lng → city name.
 * Returns null if lookup fails or times out.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeoResult | null> {
  try {
    const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&addressdetails=1`;
    const res = await fetchWithTimeout(url);

    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.error) return null;

    return {
      lat,
      lng,
      city: pickCity(data.address),
      displayName: data.display_name ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Forward geocode: city text → lat/lng.
 * Returns null if lookup fails or times out.
 */
export async function forwardGeocode(
  query: string
): Promise<GeoResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  try {
    const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1&addressdetails=1`;
    const res = await fetchWithTimeout(url);

    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const first = data[0];
    const lat = parseFloat(first.lat);
    const lng = parseFloat(first.lon);

    if (isNaN(lat) || isNaN(lng)) return null;

    return {
      lat,
      lng,
      city: pickCity(first.address) ?? trimmed,
      displayName: first.display_name ?? null,
    };
  } catch {
    return null;
  }
}