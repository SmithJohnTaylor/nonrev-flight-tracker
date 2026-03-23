import { useState } from 'react'

const COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'route', label: 'Route' },
  { key: 'originName', label: 'From' },
  { key: 'destName', label: 'To' },
  { key: 'dlFlightNo', label: 'DL Flight' },
  { key: 'priority', label: 'Priority' },
  { key: 'distanceMiles', label: 'Miles' },
  { key: 'distanceKm', label: 'km' },
]

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

export default function FlightTable({ flights }) {
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)

  function handleSort(key) {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(1)
  }

  const sorted = sortFlights(flights, sortKey, sortDir)
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
      <div className="table-wrap">
        <table className="flight-table">
          <thead>
            <tr>
              {COLUMNS.map(c => (
                <th key={c.key} onClick={() => handleSort(c.key)} className="sortable-th">
                  {c.label} {arrowFor(c.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageFlights.map(f => (
              <tr key={f.id} className={f.unknownAirport ? 'unknown-row' : ''}>
                {COLUMNS.map(c => (
                  <td key={c.key}>{getValue(f, c.key)}</td>
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
            Page {page} of {totalPages} &nbsp;·&nbsp; {flights.length.toLocaleString()} flights
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
