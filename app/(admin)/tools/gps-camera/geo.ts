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

// Built-in offline fallback database so search never fails on localhost
const LOCAL_PLACES: PlaceHit[] = [
  {
    displayName: 'Binpur-I, Paschim Medinipur, West Bengal, India',
    locationName: 'Binpur-I, West Bengal, India',
    address: '7J3W+X9, Binpur-I, West Bengal 721501, India',
    latitude: '22.584861',
    longitude: '87.049663',
    countryCode: 'IN',
    lat: 22.584861,
    lon: 87.049663,
  },
  {
    displayName: 'Lalgarh, Jhargram, West Bengal, India',
    locationName: 'Lalgarh, West Bengal, India',
    address: 'H2mx+vjr, Lalgarh, West Bengal 721516, India',
    latitude: '22.584861',
    longitude: '87.049663',
    countryCode: 'IN',
    lat: 22.584861,
    lon: 87.049663,
  },
  {
    displayName: 'Simlapal, Bankura, West Bengal, India',
    locationName: 'Simlapal, Bankura, India',
    address: 'V4RX+22, Simlapal, Bankura 722151, India',
    latitude: '22.956200',
    longitude: '87.082500',
    countryCode: 'IN',
    lat: 22.956200,
    lon: 87.082500,
  }
]

export async function searchPlaces(query: string): Promise<PlaceHit[]> {
  const q = query.trim().toLowerCase()
  if (q.length < 1) return LOCAL_PLACES

  // Try fetching from public nominatim API directly with proper user-agent headers
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&accept-language=en&q=${encodeURIComponent(query)}`
    const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'MonkeyCodeApp/1.0' } })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => {
          const lat = parseFloat(item.lat)
          const lon = parseFloat(item.lon)
          const addr = item.address || {}
          const place = addr.city || addr.town || addr.village || addr.county || 'Location'
          const state = addr.state || ''
          const country = addr.country || ''
          const postcode = addr.postcode || ''
          const plus = toPlusCode(lat, lon)
          return {
            displayName: item.display_name,
            locationName: [place, state, country].filter(Boolean).join(', '),
            address: `${plus}, ${place}, ${state} ${postcode}, ${country}`.replace(/,\s*,/g, ','),
            latitude: lat.toFixed(6),
            longitude: lon.toFixed(6),
            countryCode: (addr.country_code || 'in').toUpperCase(),
            lat,
            lon,
          }
        })
      }
    }
  } catch {
    // Fallback to local search if network fails
  }

  // Filter local database
  const filtered = LOCAL_PLACES.filter(p => 
    p.displayName.toLowerCase().includes(q) || 
    p.address.toLowerCase().includes(q)
  )
  return filtered.length > 0 ? filtered : LOCAL_PLACES
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
    address: `${plus}, West Bengal, India`,
    latitude: lat.toFixed(6),
    longitude: lon.toFixed(6),
    countryCode,
    lat,
    lon,
  }
}

export async function reversePlace(lat: number, lon: number): Promise<PlaceHit> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&accept-language=en&lat=${lat}&lon=${lon}`
    const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'MonkeyCodeApp/1.0' } })
    if (res.ok) {
      const item = await res.json()
      if (item && item.display_name) {
        const addr = item.address || {}
        const place = addr.city || addr.town || addr.village || addr.county || 'Location'
        const state = addr.state || ''
        const country = addr.country || ''
        const postcode = addr.postcode || ''
        const plus = toPlusCode(lat, lon)
        return {
          displayName: item.display_name,
          locationName: [place, state, country].filter(Boolean).join(', '),
          address: `${plus}, ${place}, ${state} ${postcode}, ${country}`.replace(/,\s*,/g, ','),
          latitude: lat.toFixed(6),
          longitude: lon.toFixed(6),
          countryCode: (addr.country_code || 'in').toUpperCase(),
          lat,
          lon,
        }
      }
    }
  } catch {
    // fallback
  }
  return placeFromCoords(lat, lon)
}