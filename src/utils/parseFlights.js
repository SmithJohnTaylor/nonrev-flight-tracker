import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { AIRPORTS } from '../data/airports.js'
import { haversine } from './distance.js'

function parseDate(raw) {
  if (!raw) return null
  // Accepts M/D/YYYY or MM/DD/YYYY or YYYY-MM-DD
  const parts = raw.trim().split(/[-/]/)
  if (parts.length !== 3) return null
  let y, m, d
  if (parts[0].length === 4) {
    ;[y, m, d] = parts.map(Number)
  } else {
    ;[m, d, y] = parts.map(Number)
  }
  if (!y || !m || !d) return null
  if (y < 100) y += 2000
  const date = new Date(y, m - 1, d)
  return isNaN(date) ? null : date
}

function formatDate(date) {
  if (!date) return ''
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: ({ data }) => {
        try {
          const result = processRows(data)
          // Discard raw rows so PII (names, employee IDs) is not retained in memory
          data.length = 0
          resolve(result)
        } catch (e) {
          data.length = 0
          reject(e)
        }
      },
      error: reject,
    })
  })
}

async function parseXLSX(file) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  // Get as array of arrays; raw: false gives formatted strings for dates
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })
  const result = processRows(rows)
  rows.length = 0
  return result
}

export function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (ext === 'xlsx' || ext === 'xls') return parseXLSX(file)
  return parseCSV(file)
}

function looksLikeRoute(val) {
  if (!val) return false
  return /^[A-Z]{3}\/[A-Z]{3}$/i.test(val.trim())
}

function looksLikeDate(val) {
  if (!val) return false
  return parseDate(val) !== null
}

function looksLikePriority(val) {
  if (!val) return false
  return /^S[0-9A-Z]{1,2}$/i.test(val.trim())
}

function looksLikeName(val) {
  if (!val) return false
  return /^[A-Z]{3}\s*\/\s*[A-Z]$/i.test(val.trim())
}

function normalizeName(val) {
  // "SMI / L" → "SMI/L"
  return val.trim().replace(/\s*\/\s*/, '/')
}

/** Check several data rows to see if a column consistently matches a pattern. */
function detectColumn(rows, startRow, testFn) {
  const numCols = rows[0]?.length || 0
  for (let col = 0; col < numCols; col++) {
    let matches = 0
    const sampleSize = Math.min(5, rows.length - startRow)
    for (let r = startRow; r < startRow + sampleSize; r++) {
      if (testFn((rows[r]?.[col] || '').trim())) matches++
    }
    if (matches >= Math.max(2, Math.ceil(sampleSize * 0.5))) return col
  }
  return -1
}

function processRows(rows) {
  if (rows.length < 2) throw new Error('CSV appears empty')

  // Try to detect columns by header name first
  const header = rows[0].map(h => (h || '').trim().toLowerCase())
  let routeIdx = header.findIndex(h => h === 'route')
  let dateIdx = header.findIndex(h => h === 'date')
  let dlFlightIdx = header.findIndex(h => h.includes('dl flight'))
  let priorityIdx = header.findIndex(h => h === 'priority')
  let flightNoIdx = header.findIndex(h => h === 'flight no' || h === 'flight_no' || h === '#')
  let nameIdx = header.findIndex(h => h === 'name' || h === 'passenger' || h === 'traveler')
  let dataStartRow = 1

  // If no "Route" header found, fall back to content-based detection
  if (routeIdx === -1) {
    routeIdx = detectColumn(rows, 0, looksLikeRoute)
    if (routeIdx !== -1) dataStartRow = 0
  }

  if (routeIdx === -1) throw new Error('Could not find a "Route" column in the CSV. Expected a column with values like "ATL/DTW".')

  // For any columns not found by header, try content-based detection
  if (dateIdx === -1) dateIdx = detectColumn(rows, dataStartRow, looksLikeDate)
  if (priorityIdx === -1) priorityIdx = detectColumn(rows, dataStartRow, looksLikePriority)
  if (nameIdx === -1) nameIdx = detectColumn(rows, dataStartRow, looksLikeName)

  const flights = []

  for (let i = dataStartRow; i < rows.length; i++) {
    const row = rows[i]
    const routeRaw = routeIdx >= 0 ? (row[routeIdx] || '').trim() : ''
    if (!routeRaw || !routeRaw.includes('/')) continue

    const [origin, dest] = routeRaw.split('/').map(s => s.trim().toUpperCase())
    if (!origin || !dest || origin === dest) continue

    const dateRaw = dateIdx >= 0 ? (row[dateIdx] || '') : ''
    const date = parseDate(dateRaw)

    const originAirport = AIRPORTS[origin] || null
    const destAirport = AIRPORTS[dest] || null

    let distanceMiles = null
    if (originAirport && destAirport) {
      distanceMiles = haversine(
        originAirport.lat, originAirport.lng,
        destAirport.lat, destAirport.lng
      )
    }

    const nameRaw = nameIdx >= 0 ? (row[nameIdx] || '').trim() : ''
    flights.push({
      id: i,
      person: nameRaw && looksLikeName(nameRaw) ? normalizeName(nameRaw) : '',
      flightNo: flightNoIdx >= 0 ? (row[flightNoIdx] || '').trim() : '',
      dlFlightNo: dlFlightIdx >= 0 ? (row[dlFlightIdx] || '').trim() : '',
      priority: priorityIdx >= 0 ? (row[priorityIdx] || '').trim() : '',
      route: routeRaw,
      origin,
      dest,
      originAirport,
      destAirport,
      date,
      dateFormatted: formatDate(date),
      year: date ? date.getFullYear() : null,
      distanceMiles,
      distanceKm: distanceMiles ? Math.round(distanceMiles * 1.60934) : null,
      unknownAirport: !originAirport || !destAirport,
    })
  }

  if (flights.length === 0) throw new Error('No valid flight routes found in the CSV')
  return flights
}
