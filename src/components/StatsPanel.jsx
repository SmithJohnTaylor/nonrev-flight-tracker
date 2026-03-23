export default function StatsPanel({ flights, allFlights, selectedYear }) {
  if (!flights.length) return null

  const withDist = flights.filter(f => f.distanceMiles !== null)
  const totalMiles = withDist.reduce((s, f) => s + f.distanceMiles, 0)
  const uniqueAirports = new Set(flights.flatMap(f => [f.origin, f.dest]))
  const countries = new Set(
    flights.flatMap(f => [
      f.originAirport?.country,
      f.destAirport?.country,
    ]).filter(Boolean)
  )
  const maxFlight = withDist.length
    ? withDist.reduce((a, b) => (a.distanceMiles > b.distanceMiles ? a : b))
    : null
  const avgMiles = withDist.length ? Math.round(totalMiles / withDist.length) : 0
  const earthCircumference = 24901
  const timesAroundWorld = (totalMiles / earthCircumference).toFixed(1)
  const unknownCount = flights.filter(f => f.unknownAirport).length

  // Year-by-year breakdown (only shown for "all")
  const yearBreakdown = []
  if (selectedYear === 'all') {
    const byYear = {}
    allFlights.forEach(f => {
      if (!f.year) return
      if (!byYear[f.year]) byYear[f.year] = { flights: 0, miles: 0 }
      byYear[f.year].flights++
      if (f.distanceMiles) byYear[f.year].miles += f.distanceMiles
    })
    Object.entries(byYear)
      .sort(([a], [b]) => Number(b) - Number(a))
      .forEach(([year, d]) => yearBreakdown.push({ year, ...d }))
  }

  return (
    <div className="stats-panel">
      <div className="stat-cards">
        <StatCard value={flights.length.toLocaleString()} label="Flights" />
        <StatCard value={totalMiles.toLocaleString()} label="Total Miles" />
        <StatCard value={`${timesAroundWorld}×`} label="Times Around the World" />
        <StatCard value={avgMiles.toLocaleString()} label="Avg Miles / Flight" />
        <StatCard value={uniqueAirports.size} label="Unique Airports" />
        <StatCard value={countries.size} label="Countries" />
        {maxFlight && (
          <StatCard
            value={maxFlight.distanceMiles.toLocaleString()}
            label={`Longest Flight (${maxFlight.route})`}
          />
        )}
      </div>

      {unknownCount > 0 && (
        <p className="unknown-note">
          ⚠ {unknownCount} route{unknownCount > 1 ? 's' : ''} could not be found in the airport database
          — distance shown as "—"
        </p>
      )}

      {yearBreakdown.length > 0 && (
        <div className="year-breakdown">
          <h3>Year by Year</h3>
          <div className="year-breakdown-grid">
            {yearBreakdown.map(({ year, flights: f, miles }) => (
              <div key={year} className="year-breakdown-row">
                <span className="yb-year">{year}</span>
                <span className="yb-flights">{f} flights</span>
                <div className="yb-bar-wrap">
                  <div
                    className="yb-bar"
                    style={{
                      width: `${Math.round((miles / yearBreakdown[0].miles) * 100)}%`,
                    }}
                  />
                </div>
                <span className="yb-miles">{miles.toLocaleString()} mi</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
