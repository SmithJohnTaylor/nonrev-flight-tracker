import { AIRPORTS } from '../data/airports.js'
import { haversine } from './distance.js'

// ── Compression helpers (native CompressionStream, no extra deps) ─────────────

async function compress(str) {
  const cs = new CompressionStream('deflate-raw')
  const writer = cs.writable.getWriter()
  writer.write(new TextEncoder().encode(str))
  writer.close()
  const chunks = []
  const reader = cs.readable.getReader()
  let done, value
  while ({ done, value } = await reader.read(), !done) chunks.push(value)
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
  let off = 0
  for (const c of chunks) { out.set(c, off); off += c.length }
  return out
}

async function decompress(bytes) {
  const ds = new DecompressionStream('deflate-raw')
  const writer = ds.writable.getWriter()
  writer.write(bytes)
  writer.close()
  const chunks = []
  const reader = ds.readable.getReader()
  let done, value
  while ({ done, value } = await reader.read(), !done) chunks.push(value)
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
  let off = 0
  for (const c of chunks) { out.set(c, off); off += c.length }
  return new TextDecoder().decode(out)
}

function toBase64url(bytes) {
  // Chunk to avoid call-stack overflow on large arrays
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64url(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Encode flights array → URL-safe base64 string */
export async function encodeFlights(flights) {
  const rows = flights.map(f => [
    f.route,
    f.dateFormatted || '',
    f.flightNo || '',
    f.dlFlightNo || '',
    f.priority || '',
    f.person || '',
  ])
  const bytes = await compress(JSON.stringify(rows))
  return toBase64url(bytes)
}

/** Decode URL-safe base64 string → flights array */
export async function decodeFlights(encoded) {
  const bytes = fromBase64url(encoded)
  const json = await decompress(bytes)
  const rows = JSON.parse(json)
  return rows.map(([route, dateFormatted, flightNo, dlFlightNo, priority, person], i) => {
    const parts = route.split('/')
    const origin = (parts[0] || '').trim().toUpperCase()
    const dest = (parts[1] || '').trim().toUpperCase()
    const originAirport = AIRPORTS[origin] || null
    const destAirport = AIRPORTS[dest] || null
    const distanceMiles = originAirport && destAirport
      ? haversine(originAirport.lat, originAirport.lng, destAirport.lat, destAirport.lng)
      : null
    const date = dateFormatted ? new Date(dateFormatted) : null
    const validDate = date && !isNaN(date) ? date : null
    return {
      id: i,
      route,
      origin,
      dest,
      originAirport,
      destAirport,
      date: validDate,
      dateFormatted: dateFormatted || '',
      year: validDate ? validDate.getFullYear() : null,
      flightNo: flightNo || '',
      dlFlightNo: dlFlightNo || '',
      priority: priority || '',
      person: person || '',
      distanceMiles,
      distanceKm: distanceMiles ? Math.round(distanceMiles * 1.60934) : null,
      unknownAirport: !originAirport || !destAirport,
    }
  })
}
