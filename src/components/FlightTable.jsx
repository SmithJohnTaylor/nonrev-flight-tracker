import { useState } from 'react'

const BASE_COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'route', label: 'Route' },
  { key: 'originName', label: 'From' },
  { key: 'destName', label: 'To' },
  { key: 'dlFlightNo', label: 'DL Flight', mobileHide: true },
  { key: 'priority', label: 'Priority', mobileHide: true },
  { key: 'distanceMiles', label: 'Miles' },
  { key: 'distanceKm', label: 'km', mobileHide: true },
]

const PERSON_COLUMN = { key: 'person', label: 'Traveler' }

function sortFlights(flights, key, dir) {
  return [...flights].sort((a, b) => {
    let av = a[key]
    let bv = b[key]
    if (key === 'date') {
      av = a.date ? a.date.getTime() : 0
      bv = b.date ? b.date.getTime() : 0
    }
    if (av == null) return 1
    if (bv == null) return -1
    if (av < bv) return dir === 'asc' ? -1 : 1
    if (av > bv) return dir === 'asc' ? 1 : -1
    return 0
  })
}

const PAGE_SIZE = 50

function matchesAirport(query, iata, airport) {
  const q = query.toLowerCase()
  if (iata?.toLowerCase().includes(q)) return true
  if (airport?.city?.toLowerCase().includes(q)) return true
  return false
}

export default function FlightTable({ flights, multiPerson }) {
  const COLUMNS = multiPerson ? [PERSON_COLUMN, ...BASE_COLUMNS] : BASE_COLUMNS
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [fromFilter, setFromFilter] = useState('')
  const [toFilter, setToFilter] = useState('')

  function handleSort(key) {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(1)
  }

  function handleFromFilter(val) { setFromFilter(val); setPage(1) }
  function handleToFilter(val) { setToFilter(val); setPage(1) }

  const filtered = flights.filter(f => {
    if (fromFilter && !matchesAirport(fromFilter, f.origin, f.originAirport)) return false
    if (toFilter && !matchesAirport(toFilter, f.dest, f.destAirport)) return false
    return true
  })

  const sorted = sortFlights(filtered, sortKey, sortDir)
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageFlights = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function getValue(f, key) {
    switch (key) {
      case 'date': return f.dateFormatted || '—'
      case 'route': return f.route
      case 'originName': return f.originAirport
        ? `${f.origin} · ${f.originAirport.city}`
        : f.origin
      case 'destName': return f.destAirport
        ? `${f.dest} · ${f.destAirport.city}`
        : f.dest
      case 'distanceMiles': return f.distanceMiles != null ? f.distanceMiles.toLocaleString() : '—'
      case 'distanceKm': return f.distanceKm != null ? f.distanceKm.toLocaleString() : '—'
      default: return f[key] || '—'
    }
  }

  function arrowFor(key) {
    if (sortKey !== key) return <span className="sort-arrow muted">↕</span>
    return <span className="sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="table-section">
      <div className="table-filters">
        <div className="table-filter-field">
          <label>From</label>
          <input
            type="text"
            placeholder="IATA or city…"
            value={fromFilter}
            onChange={e => handleFromFilter(e.target.value)}
          />
        </div>
        <div className="table-filter-field">
          <label>To</label>
          <input
            type="text"
            placeholder="IATA or city…"
            value={toFilter}
            onChange={e => handleToFilter(e.target.value)}
          />
        </div>
        {(fromFilter || toFilter) && (
          <button className="filter-clear-btn" onClick={() => { handleFromFilter(''); handleToFilter('') }}>
            Clear
          </button>
        )}
      </div>
      <div className="table-wrap">
        <table className="flight-table">
          <thead>
            <tr>
              {COLUMNS.map(c => (
                <th key={c.key} onClick={() => handleSort(c.key)} className={`sortable-th${c.mobileHide ? ' mobile-hide' : ''}`}>
                  {c.label} {arrowFor(c.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageFlights.map(f => (
              <tr key={f.id} className={f.unknownAirport ? 'unknown-row' : ''}>
                {COLUMNS.map(c => (
                  <td key={c.key} className={c.mobileHide ? 'mobile-hide' : ''}>{getValue(f, c.key)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            ‹ Prev
          </button>
          <span>
            Page {page} of {totalPages} &nbsp;·&nbsp; {sorted.length.toLocaleString()}{sorted.length !== flights.length ? ` of ${flights.length.toLocaleString()}` : ''} flights
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  )
}
