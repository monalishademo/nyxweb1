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

// ---------- Plus Code (Open Location Code), integer math ----------
const OLC_ALPHABET = '23456789CFGHJMPQRVWX'
const LAT_MULT = 8000 * 3125 // 25,000,000 per degree (11-digit precision)
const LON_MULT = 8000 * 1024 // 8,192,000 per degree

export function toPlusCode(lat: number, lon: number): string {
  const maxLat = 180 * LAT_MULT
  const maxLon = 360 * LON_MULT

  let latVal = Math.floor(Math.round((Math.min(90, Math.max(-90, lat)) + 90) * LAT_MULT * 1e6) / 1e6)
  latVal = Math.min(latVal, maxLat - 1)

  let lonVal = Math.floor(Math.round((lon + 180) * LON_MULT * 1e6) / 1e6)
  lonVal = ((lonVal % maxLon) + maxLon) % maxLon

  let code = ''

  const gridLat = latVal % 5
  const gridLon = lonVal % 4
  code = OLC_ALPHABET.charAt(gridLat * 4 + gridLon) + code
  latVal = Math.floor(latVal / 5)
  lonVal = Math.floor(lonVal / 4)

  for (let i = 0; i < 5; i++) {
    code = OLC_ALPHABET.charAt(lonVal % 20) + code
    code = OLC_ALPHABET.charAt(latVal % 20) + code
    latVal = Math.floor(latVal / 20)
    lonVal = Math.floor(lonVal / 20)
  }

  const full = `${code.slice(0, 8)}+${code.slice(8)}`
  return full.slice(4) // e.g. "R6JR+GHH"
}

// ---------- Extract Lat/Lon from Google Maps URL or raw coordinates ----------
function extractCoordsFromQuery(q: string): { lat: number; lon: number } | null {
  // 1. Direct "lat, lon" e.g. "24.876128, 86.210956"
  const direct = q.match(/^([+-]?\d{1,2}\.\d+)\s*,\s*([+-]?\d{1,3}\.\d+)$/)
  if (direct) {
    const lat = parseFloat(direct[1])
    const lon = parseFloat(direct[2])
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return { lat, lon }
  }

  // 2. Google Maps URL "@lat,lon" or "!3dLAT!4dLON" or "?q=lat,lon"
  const atMatch = q.match(/@([+-]?\d{1,2}\.\d+),([+-]?\d{1,3}\.\d+)/)
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lon: parseFloat(atMatch[2]) }
  }

  const dataMatch = q.match(/!3d([+-]?\d{1,2}\.\d+)!4d([+-]?\d{1,3}\.\d+)/)
  if (dataMatch) {
    return { lat: parseFloat(dataMatch[1]), lon: parseFloat(dataMatch[2]) }
  }

  const qMatch = q.match(/[?&](?:q|ll|center)=([+-]?\d{1,2}\.\d+)(?:,|%2C)([+-]?\d{1,3}\.\d+)/i)
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lon: parseFloat(qMatch[2]) }
  }

  return null
}

function isShortMapsUrl(q: string): boolean {
  return /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)\//i.test(q)
}

// ---------- Resolve short maps.app.goo.gl URL without route.ts ----------
async function resolveShortMapsUrl(shortUrl: string, signal?: AbortSignal): Promise<{ lat: number; lon: number } | null> {
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(shortUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(shortUrl)}`,
  ]

  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl, { signal })
      if (!res.ok) continue
      const html = await res.text()
      const coords = extractCoordsFromQuery(html)
      if (coords) return coords
    } catch (e: any) {
      if (e?.name === 'AbortError') throw e
    }
  }
  return null
}

// ---------- helpers ----------
function dedupeParts(items: Array<string | undefined>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of items) {
    const val = (raw || '').trim()
    if (!val) continue
    const key = val.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      out.push(val)
    }
  }
  return out
}

function makeHit(
  parts: {
    street?: string
    locality?: string
    place: string
    district?: string
    state?: string
    country?: string
    postcode?: string
    countryCode?: string
  },
  lat: number,
  lon: number,
  displayName: string,
): PlaceHit {
  const { street, locality, place, district, state = '', country = '', postcode = '', countryCode = '' } = parts
  const plus = toPlusCode(lat, lon)

  const titleParts = dedupeParts([place, state, country])
  const locationName = titleParts.join(', ')

  const statePin = [state, postcode].filter(Boolean).join(' ')
  const addrParts = dedupeParts([plus, street, locality, place, district, statePin, country])

  return {
    displayName,
    locationName,
    address: addrParts.join(', '),
    latitude: lat.toFixed(6),
    longitude: lon.toFixed(6),
    countryCode: countryCode.toUpperCase(),
    lat,
    lon,
  }
}

function fromNominatim(item: any, lat: number, lon: number): PlaceHit {
  const a = item.address || {}
  const place =
    a.city || a.town || a.village || a.suburb || a.municipality || a.county || a.state_district || item.name || 'Location'
  const street = [a.house_number, a.road || a.pedestrian || a.residential].filter(Boolean).join(', ')
  const locality = a.neighbourhood || a.hamlet || a.quarter || a.suburb || ''
  const district = a.state_district && a.state_district !== place ? a.state_district : ''

  return makeHit(
    {
      street,
      locality,
      place,
      district,
      state: a.state,
      country: a.country,
      postcode: a.postcode,
      countryCode: a.country_code || '',
    },
    lat,
    lon,
    item.display_name,
  )
}

function fromPhoton(feature: any): PlaceHit {
  const p = feature.properties || {}
  const [lon, lat] = feature.geometry?.coordinates || [0, 0]
  const place = p.city || p.town || p.village || p.locality || p.name || p.county || 'Location'
  const street = [p.housenumber, p.street].filter(Boolean).join(', ')
  const locality = p.name && p.name !== place ? p.name : p.district || ''
  const district = p.county && p.county !== place ? p.county : ''
  const state = p.state || ''
  const country = p.country || ''
  const postcode = p.postcode || ''

  const displayName = dedupeParts([p.name, p.street, p.district, p.city || p.town || p.village, p.county, state, postcode, country]).join(', ')

  return makeHit(
    {
      street,
      locality,
      place,
      district,
      state,
      country,
      postcode,
      countryCode: p.countrycode || '',
    },
    lat,
    lon,
    displayName || `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
  )
}

// ---------- Fast Result Cache ----------
const searchCache = new Map<string, PlaceHit[]>()
const reverseCache = new Map<string, PlaceHit>()

// ---------- Offline fallback ----------
const mkLocal = (place: string, state: string, district: string, lat: number, lon: number, postcode: string) =>
  makeHit(
    { place, district, state, country: 'India', postcode, countryCode: 'IN' },
    lat,
    lon,
    `${place}, ${district}, ${state}, India`,
  )

const LOCAL_PLACES: PlaceHit[] = [
  mkLocal('Binpur-I', 'West Bengal', 'Paschim Medinipur', 22.584861, 87.049663, '721501'),
  mkLocal('Simlapal', 'West Bengal', 'Bankura', 22.9562, 87.0825, '722151'),
  mkLocal('Khaira', 'Bihar', 'Jamui', 24.876128, 86.210956, '811317'),
]

// ---------- Public Search API (Instant Photon + Nominatim fallback + URL/Coords) ----------
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceHit[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  // 1. Short Google Maps URL (maps.app.goo.gl / goo.gl/maps) without route.ts
  if (isShortMapsUrl(trimmed)) {
    const coords = await resolveShortMapsUrl(trimmed, signal)
    if (coords) {
      const exact = await reversePlace(coords.lat, coords.lon, signal)
      return [exact]
    }
    return []
  }

  // 2. Check if user pasted a full Google Maps URL or Latitude, Longitude
  const coords = extractCoordsFromQuery(trimmed)
  if (coords) {
    const exact = await reversePlace(coords.lat, coords.lon, signal)
    return [exact]
  }

  const cacheKey = trimmed.toLowerCase()
  const cached = searchCache.get(cacheKey)
  if (cached) return cached

  // 3. Fast Photon Autocomplete API (no 1-sec delay, finds schools, POIs, villages)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=8&lang=en`
    const res = await fetch(photonUrl, { headers: { Accept: 'application/json' }, signal })
    if (res.ok) {
      const json = await res.json()
      if (Array.isArray(json?.features) && json.features.length > 0) {
        const hits = json.features.map((f: any) => fromPhoton(f))
        searchCache.set(cacheKey, hits)
        return hits
      }
    }
  } catch (e: any) {
    if (e?.name === 'AbortError') throw e
  }

  // 4. Fallback to Nominatim if Photon returns empty
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&accept-language=en&q=${encodeURIComponent(trimmed)}`
    const res = await fetch(nomUrl, { headers: { Accept: 'application/json' }, signal })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const hits = data.map((item: any) => fromNominatim(item, parseFloat(item.lat), parseFloat(item.lon)))
        searchCache.set(cacheKey, hits)
        return hits
      }
    }
  } catch (e: any) {
    if (e?.name === 'AbortError') throw e
  }

  return LOCAL_PLACES.filter(
    (p) => p.displayName.toLowerCase().includes(cacheKey) || p.address.toLowerCase().includes(cacheKey),
  )
}

export function flagUrlFor(countryCode: string): string | null {
  if (!countryCode || countryCode.length !== 2) return null
  return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`
}

export function placeFromCoords(lat: number, lon: number): PlaceHit {
  const plus = toPlusCode(lat, lon)
  return {
    displayName: `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
    locationName: 'Selected location',
    address: plus,
    latitude: lat.toFixed(6),
    longitude: lon.toFixed(6),
    countryCode: '',
    lat,
    lon,
  }
}

export async function reversePlace(lat: number, lon: number, signal?: AbortSignal): Promise<PlaceHit> {
  const key = `${lat.toFixed(5)},${lon.toFixed(5)}`
  const cached = reverseCache.get(key)
  if (cached) return cached

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=en&lat=${lat}&lon=${lon}`
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal })
    if (res.ok) {
      const item = await res.json()
      if (item && item.display_name) {
        const hit = fromNominatim(item, lat, lon)
        reverseCache.set(key, hit)
        return hit
      }
    }
  } catch (e: any) {
    if (e?.name === 'AbortError') throw e
  }

  return placeFromCoords(lat, lon)
}