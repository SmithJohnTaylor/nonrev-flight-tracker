import { useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet'
import { greatCirclePoints, splitAtAntimeridian } from '../utils/distance.js'

// Count how many times each route appears so we can vary line weight
function buildRouteData(flights) {
  const routeCounts = {}
  const airportCounts = {}

  flights.forEach(f => {
    if (!f.originAirport || !f.destAirport) return
    const key = [f.origin, f.dest].sort().join('-')
    routeCounts[key] = (routeCounts[key] || 0) + 1
    airportCounts[f.origin] = (airportCounts[f.origin] || 0) + 1
    airportCounts[f.dest] = (airportCounts[f.dest] || 0) + 1
  })

  return { routeCounts, airportCounts }
}

export default function RouteMap({ flights }) {
  const { routeCounts, airportCounts } = useMemo(() => buildRouteData(flights), [flights])
  const maxCount = Math.max(...Object.values(routeCounts), 1)
  const maxAirport = Math.max(...Object.values(airportCounts), 1)

  // Deduplicate routes for rendering
  const uniqueRoutes = useMemo(() => {
    const seen = new Set()
    const routes = []
    flights.forEach(f => {
      if (!f.originAirport || !f.destAirport) return
      const key = [f.origin, f.dest].sort().join('-')
      if (seen.has(key)) return
      seen.add(key)
      routes.push({
        key,
        origin: f.origin,
        dest: f.dest,
        originAirport: f.originAirport,
        destAirport: f.destAirport,
        count: routeCounts[key] || 1,
      })
    })
    return routes
  }, [flights, routeCounts])

  const uniqueAirports = useMemo(() => {
    const seen = new Set()
    const airports = []
    flights.forEach(f => {
      ;[
        { code: f.origin, airport: f.originAirport },
        { code: f.dest, airport: f.destAirport },
      ].forEach(({ code, airport }) => {
        if (!airport || seen.has(code)) return
        seen.add(code)
        airports.push({ code, airport, count: airportCounts[code] || 1 })
      })
    })
    return airports
  }, [flights, airportCounts])

  return (
    <div className="map-section">
      <h2 className="section-title">Route Map</h2>
      <div className="map-container">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: '100%', width: '100%' }}
          worldCopyJump={false}
          minZoom={1}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={19}
          />

          {uniqueRoutes.map(route => {
            const pts = greatCirclePoints(
              route.originAirport.lat,
              route.originAirport.lng,
              route.destAirport.lat,
              route.destAirport.lng,
            )
            const segments = splitAtAntimeridian(pts)
            const opacity = 0.3 + 0.5 * (route.count / maxCount)
            const weight = 1 + 2 * (route.count / maxCount)

            return segments.map((seg, i) => (
              <Polyline
                key={`${route.key}-${i}`}
                positions={seg}
                pathOptions={{ color: '#4f8ef7', weight, opacity }}
              />
            ))
          })}

          {uniqueAirports.map(({ code, airport, count }) => {
            const radius = 3 + 5 * (count / maxAirport)
            return (
              <CircleMarker
                key={code}
                center={[airport.lat, airport.lng]}
                radius={radius}
                pathOptions={{ color: '#e8375a', fillColor: '#e8375a', fillOpacity: 0.8, weight: 1 }}
              >
                <Popup>
                  <strong>{code}</strong> — {airport.name}
                  <br />
                  {airport.city}, {airport.country}
                  <br />
                  {count} flight{count !== 1 ? 's' : ''}
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>
      <p className="map-legend">
        <span className="legend-line" /> Route (thicker = more flights) &nbsp;&nbsp;
        <span className="legend-dot" /> Airport (larger = more flights)
      </p>
    </div>
  )
}
