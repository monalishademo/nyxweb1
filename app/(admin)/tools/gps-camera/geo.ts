export type PlaceHit = {
  displayName: string
  locationName: string
  address: string
  latitude: string
  longitude: string
  countryCode: string
  lat: number
  lon: number
}

const OLC_ALPHABET = '23456789CFGHJMPQRVWX'
const OLC_PAIR_RES = [20, 1, 0.05, 0.0025, 0.000125]

export function toPlusCode(lat: number, lon: number): string {
  let latitude = Math.min(90, Math.max(-90, lat))
  if (latitude >= 90) latitude = 89.99999999
  let longitude = lon
  while (longitude < -180) longitude += 360
  while (longitude >= 180) longitude -= 360

  let remainingLat = latitude + 90
  let remainingLon = longitude + 180
  let full = ''

  for (let i = 0; i < 5; i++) {
    const latDigit = Math.min(19, Math.floor(remainingLat / OLC_PAIR_RES[i]))
    remainingLat -= latDigit * OLC_PAIR_RES[i]
    const lonDigit = Math.min(19, Math.floor(remainingLon / OLC_PAIR_RES[i]))
    remainingLon -= lonDigit * OLC_PAIR_RES[i]
    full += OLC_ALPHABET.charAt(latDigit) + OLC_ALPHABET.charAt(lonDigit)
    if (i === 3) full += '+'
  }

  const row = Math.min(4, Math.floor(remainingLat / (0.000125 / 5)))
  const col = Math.min(3, Math.floor(remainingLon / (0.000125 / 4)))
  full += OLC_ALPHABET.charAt(row * 4 + col)

  const local = `${full.slice(4, 8)}+${full.slice(9, 12)}`
  return local.charAt(0) + local.slice(1).toLowerCase()
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

async function fetchJson(url: string, timeoutMs = 7000): Promise<any | null> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    // No custom headers: browsers block User-Agent, and extra headers can trigger CORS preflight failures.
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// Most useful place name first: village / town / city, then smaller or larger units.
function pickPlace(addr: Record<string, string | undefined>): string {
  return (
    addr.village ||
    addr.town ||
    addr.city ||
    addr.hamlet ||
    addr.suburb ||
    addr.neighbourhood ||
    addr.municipality ||
    addr.city_district ||
    addr.county ||
    addr.state_district ||
    'Location'
  )
}

function buildHit(
  lat: number,
  lon: number,
  displayName: string,
  place: string,
  state: string,
  postcode: string,
  country: string,
  countryCode: string,
): PlaceHit {
  const plus = toPlusCode(lat, lon)
  return {
    displayName,
    locationName: [place, state, country].filter(Boolean).join(', '),
    address: `${plus}, ${place}, ${state} ${postcode}, ${country}`.replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' '),
    latitude: lat.toFixed(6),
    longitude: lon.toFixed(6),
    countryCode: (countryCode || 'in').toUpperCase(),
    lat,
    lon,
  }
}

function fromNominatim(item: any, latOverride?: number, lonOverride?: number): PlaceHit {
  const lat = latOverride ?? parseFloat(item.lat)
  const lon = lonOverride ?? parseFloat(item.lon)
  const addr = item.address || {}
  return buildHit(
    lat,
    lon,
    item.display_name || `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
    pickPlace(addr),
    addr.state || '',
    addr.postcode || '',
    addr.country || '',
    addr.country_code || 'in',
  )
}

function fromPhoton(f: any): PlaceHit | null {
  const coords = f?.geometry?.coordinates
  const p = f?.properties || {}
  if (!Array.isArray(coords) || coords.length < 2) return null
  const lon = Number(coords[0])
  const lat = Number(coords[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  const place = p.name || p.city || p.district || p.county || 'Location'
  const displayName = [p.name, p.district, p.county, p.state, p.country].filter(Boolean).join(', ')
  return buildHit(lat, lon, displayName, place, p.state || '', p.postcode || '', p.country || '', p.countrycode || 'in')
}

function parseLatLon(q: string): { lat: number; lon: number } | null {
  const m = q.match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/)
  if (!m) return null
  const lat = parseFloat(m[1])
  const lon = parseFloat(m[2])
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  return { lat, lon }
}

/* ------------------------------------------------------------------ */
/* Offline fallback (only used when BOTH online services fail)         */
/* ------------------------------------------------------------------ */

function local(name: string, state: string, postcode: string, lat: number, lon: number): PlaceHit {
  return buildHit(lat, lon, `${name}, ${state}, India`, name, state, postcode, 'India', 'IN')
}

const LOCAL_PLACES: PlaceHit[] = [
  local('Binpur-I', 'West Bengal', '721501', 22.584861, 87.049663),
  local('Lalgarh', 'West Bengal', '721516', 22.8717, 87.2911),
  local('Simlapal', 'West Bengal', '722151', 22.9562, 87.0825),
]

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

export async function searchPlaces(query: string): Promise<PlaceHit[]> {
  const q = query.trim()
  if (q.length < 2) return []

  // 1) Typed coordinates, e.g. "22.5848, 87.0496"
  const ll = parseLatLon(q)
  if (ll) return [await reversePlace(ll.lat, ll.lon)]

  const results: PlaceHit[] = []
  const addUnique = (hit: PlaceHit) => {
    const dup = results.some((r) => Math.abs(r.lat - hit.lat) < 0.002 && Math.abs(r.lon - hit.lon) < 0.002)
    if (!dup) results.push(hit)
  }

  // 2) Nominatim (OpenStreetMap)
  const nom = await fetchJson(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=10&accept-language=en&q=${encodeURIComponent(q)}`,
  )
  if (Array.isArray(nom)) nom.forEach((item) => addUnique(fromNominatim(item)))

  // 3) Photon (OpenStreetMap, different index) when Nominatim finds little or fails
  if (results.length < 3) {
    const ph = await fetchJson(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en`)
    if (ph && Array.isArray(ph.features)) {
      ph.features.forEach((f: any) => {
        const hit = fromPhoton(f)
        if (hit) addUnique(hit)
      })
    }
  }

  if (results.length > 0) return results.slice(0, 10)

  // 4) Offline fallback: only real matches, never unrelated places
  const lower = q.toLowerCase()
  return LOCAL_PLACES.filter((p) => p.displayName.toLowerCase().includes(lower))
}

export function flagUrlFor(countryCode: string): string | null {
  if (!countryCode || countryCode.length !== 2) return 'https://flagcdn.com/w80/in.png'
  return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`
}

export function placeFromCoords(lat: number, lon: number, countryCode = 'IN'): PlaceHit {
  const plus = toPlusCode(lat, lon)
  return {
    displayName: `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
    locationName: 'Selected location',
    address: plus,
    latitude: lat.toFixed(6),
    longitude: lon.toFixed(6),
    countryCode,
    lat,
    lon,
  }
}

export async function reversePlace(lat: number, lon: number): Promise<PlaceHit> {
  // Nominatim reverse at the most detailed level (zoom 18 = house / village)
  const nom = await fetchJson(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=en&lat=${lat}&lon=${lon}`,
  )
  if (nom && nom.display_name) return fromNominatim(nom, lat, lon)

  // Photon reverse as backup
  const ph = await fetchJson(`https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}&lang=en`)
  if (ph && Array.isArray(ph.features) && ph.features[0]) {
    const hit = fromPhoton(ph.features[0])
    if (hit) return { ...hit, lat, lon, latitude: lat.toFixed(6), longitude: lon.toFixed(6) }
  }

  return placeFromCoords(lat, lon)
}