/**
 * Free, no-API-key emergency-services lookup using OpenStreetMap.
 *
 * Two providers, both browser-CORS friendly:
 *  - Nominatim     → geocode a free-text address to lat/lon
 *  - Overpass API  → find nearest hospitals, clinics, police, fire stations
 *
 * Designed for NZ/AU site addresses. Both services are free and community-run
 * — be a good neighbour: trigger only on user action (button click), never on
 * keystroke, and we set a polite User-Agent via the Referer + descriptive URL.
 */

export type EmergencyPlace = {
  kind: "hospital" | "clinic" | "doctors" | "police" | "fire_station";
  name: string;
  address: string;
  phone?: string;
  lat: number;
  lon: number;
  distanceKm: number;
  emergency: boolean;
};

export type GeocodeResult = {
  lat: number;
  lon: number;
  displayName: string;
  country?: string;
};

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const OVERPASS = "https://overpass-api.de/api/interpreter";
const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Tiny per-address cache so the same site address isn't re-queried during a
 * single browser session. Keeps us well within Nominatim's "be polite" usage
 * policy and saves the user waiting again if they re-click the button.
 */
const lookupCache = new Map<string, EmergencyLookupResult | null>();

/** Returns an AbortSignal that fires after `ms` milliseconds. */
function timeoutSignal(ms: number): AbortSignal {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(new Error(`Request timed out after ${ms / 1000}s`)), ms);
  return ctrl.signal;
}

/** Haversine distance in km. */
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;
  const url = new URL(NOMINATIM);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");
  // Bias to NZ + AU — the product's customer base. If the address resolves
  // elsewhere we still return it; the bias just nudges ambiguous strings.
  url.searchParams.set("countrycodes", "nz,au");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    signal: timeoutSignal(REQUEST_TIMEOUT_MS),
  });
  if (res.status === 429 || res.status === 503) {
    throw new Error("The free address lookup service is busy — try again in a minute.");
  }
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const json = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
    address?: { country_code?: string };
  }>;
  const first = json[0];
  if (!first) return null;
  return {
    lat: Number(first.lat),
    lon: Number(first.lon),
    displayName: first.display_name,
    country: first.address?.country_code,
  };
}

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function tagAddress(tags: Record<string, string>): string {
  const parts = [
    [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "),
    tags["addr:suburb"] ?? tags["addr:city"] ?? tags["addr:town"],
    tags["addr:postcode"],
  ].filter(Boolean);
  return parts.join(", ");
}

function parseElement(el: OverpassElement, originLat: number, originLon: number): EmergencyPlace | null {
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  const tags = el.tags ?? {};
  if (lat == null || lon == null || !tags.amenity) return null;
  const amenity = tags.amenity;
  if (
    amenity !== "hospital" &&
    amenity !== "clinic" &&
    amenity !== "doctors" &&
    amenity !== "police" &&
    amenity !== "fire_station"
  ) {
    return null;
  }
  return {
    kind: amenity,
    name: tags.name ?? tags["operator"] ?? "Unnamed",
    address: tagAddress(tags),
    phone: tags.phone ?? tags["contact:phone"],
    lat,
    lon,
    distanceKm: distanceKm(originLat, originLon, lat, lon),
    emergency: tags.emergency === "yes",
  };
}

/**
 * Single Overpass query for everything we care about, so we hit the public
 * server once per lookup instead of four times.
 */
export async function findNearbyEmergencyServices(
  lat: number,
  lon: number,
): Promise<EmergencyPlace[]> {
  const query = `
[out:json][timeout:25];
(
  nwr["amenity"="hospital"](around:40000,${lat},${lon});
  nwr["amenity"="clinic"](around:15000,${lat},${lon});
  nwr["amenity"="doctors"](around:10000,${lat},${lon});
  nwr["amenity"="police"](around:40000,${lat},${lon});
  nwr["amenity"="fire_station"](around:40000,${lat},${lon});
);
out center tags;`.trim();

  const res = await fetch(OVERPASS, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "data=" + encodeURIComponent(query),
    signal: timeoutSignal(REQUEST_TIMEOUT_MS),
  });
  if (res.status === 429 || res.status === 503) {
    throw new Error("The free emergency-services lookup is busy — try again in a minute.");
  }
  if (!res.ok) throw new Error(`Overpass query failed (${res.status})`);
  const json = (await res.json()) as { elements?: OverpassElement[] };
  const places = (json.elements ?? [])
    .map((el) => parseElement(el, lat, lon))
    .filter((p): p is EmergencyPlace => p !== null);
  places.sort((a, b) => a.distanceKm - b.distanceKm);
  return places;
}

/**
 * One-shot helper: geocode an address then return categorised nearest places.
 * Picks the nearest hospital with emergency=yes if available, else the nearest
 * hospital full stop.
 */
export type EmergencyLookupResult = {
  geocoded: GeocodeResult;
  nearestHospital?: EmergencyPlace;
  nearestMedicalCentre?: EmergencyPlace;
  nearestPolice?: EmergencyPlace;
  nearestFireStation?: EmergencyPlace;
};

export async function lookupEmergencyServicesForAddress(
  address: string,
): Promise<EmergencyLookupResult | null> {
  const key = address.trim().toLowerCase();
  if (lookupCache.has(key)) return lookupCache.get(key) ?? null;

  const geocoded = await geocodeAddress(address);
  if (!geocoded) {
    lookupCache.set(key, null);
    return null;
  }
  const places = await findNearbyEmergencyServices(geocoded.lat, geocoded.lon);
  const hospitals = places.filter((p) => p.kind === "hospital");
  const nearestHospital = hospitals.find((p) => p.emergency) ?? hospitals[0];
  const nearestMedicalCentre = places.find(
    (p) => (p.kind === "clinic" || p.kind === "doctors") && p !== nearestHospital,
  );
  const nearestPolice = places.find((p) => p.kind === "police");
  const nearestFireStation = places.find((p) => p.kind === "fire_station");
  const result = { geocoded, nearestHospital, nearestMedicalCentre, nearestPolice, nearestFireStation };
  lookupCache.set(key, result);
  return result;
}
