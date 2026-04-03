import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import Map, { Source, Layer, Popup } from 'react-map-gl'
import { greatCirclePoints } from '../utils/distance.js'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

// Unwrap longitudes so consecutive points don't jump across the antimeridian
function unwrapCoordinates(pts) {
  const coords = pts.map(([lat, lng]) => [lng, lat])
  for (let i = 1; i < coords.length; i++) {
    while (coords[i][0] - coords[i - 1][0] > 180) coords[i][0] -= 360
    while (coords[i][0] - coords[i - 1][0] < -180) coords[i][0] += 360
  }
  return coords
}

const DARK_STYLE = 'mapbox://styles/mapbox/dark-v11'
const LIGHT_STYLE = 'mapbox://styles/mapbox/light-v11'

function useDarkMode() {
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = e => setDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return dark
}

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
  const dark = useDarkMode()
  const { routeCounts, airportCounts } = useMemo(() => buildRouteData(flights), [flights])
  const maxCount = Math.max(...Object.values(routeCounts), 1)
  const maxAirport = Math.max(...Object.values(airportCounts), 1)
  const [popupInfo, setPopupInfo] = useState(null)

  // Build GeoJSON for route lines
  const routeGeoJson = useMemo(() => {
    const seen = new Set()
    const features = []
    flights.forEach(f => {
      if (!f.originAirport || !f.destAirport) return
      const key = [f.origin, f.dest].sort().join('-')
      if (seen.has(key)) return
      seen.add(key)
      const count = routeCounts[key] || 1
      const pts = greatCirclePoints(
        f.originAirport.lat, f.originAirport.lng,
        f.destAirport.lat, f.destAirport.lng,
      )
      features.push({
        type: 'Feature',
        properties: { count, norm: count / maxCount },
        geometry: {
          type: 'LineString',
          coordinates: unwrapCoordinates(pts),
        },
      })
    })
    return { type: 'FeatureCollection', features }
  }, [flights, routeCounts, maxCount])

  // Build GeoJSON for airport dots
  const airportGeoJson = useMemo(() => {
    const seen = new Set()
    const features = []
    flights.forEach(f => {
      ;[
        { code: f.origin, airport: f.originAirport },
        { code: f.dest, airport: f.destAirport },
      ].forEach(({ code, airport }) => {
        if (!airport || seen.has(code)) return
        seen.add(code)
        const count = airportCounts[code] || 1
        features.push({
          type: 'Feature',
          properties: { code, name: airport.name, city: airport.city, country: airport.country, count, norm: count / maxAirport },
          geometry: {
            type: 'Point',
            coordinates: [airport.lng, airport.lat],
          },
        })
      })
    })
    return { type: 'FeatureCollection', features }
  }, [flights, airportCounts, maxAirport])

  const onAirportClick = useCallback(e => {
    const feature = e.features?.[0]
    if (!feature) return
    const { code, name, city, country, count } = feature.properties
    const [lng, lat] = feature.geometry.coordinates
    setPopupInfo({ lat, lng, code, name, city, country, count })
  }, [])

  const routeLayer = {
    id: 'routes',
    type: 'line',
    paint: {
      'line-color': '#4f8ef7',
      'line-width': ['interpolate', ['linear'], ['get', 'norm'], 0, 1, 1, 3.5],
      'line-opacity': ['interpolate', ['linear'], ['get', 'norm'], 0, 0.3, 1, 0.8],
    },
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
  }

  const airportLayer = {
    id: 'airports',
    type: 'circle',
    paint: {
      'circle-color': '#e8375a',
      'circle-opacity': 0.85,
      'circle-radius': ['interpolate', ['linear'], ['get', 'norm'], 0, 3, 1, 8],
      'circle-stroke-width': 1,
      'circle-stroke-color': '#e8375a',
      'circle-stroke-opacity': 0.4,
    },
  }

  return (
    <div className="map-section">
      <h2 className="section-title">Route Map</h2>
      <div className="map-container">
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={dark ? DARK_STYLE : LIGHT_STYLE}
          initialViewState={{ longitude: 0, latitude: 20, zoom: 1.5 }}
          style={{ width: '100%', height: '100%' }}
          interactiveLayerIds={['airports']}
          onClick={onAirportClick}
          projection="globe"
        >
          <Source id="routes" type="geojson" data={routeGeoJson}>
            <Layer {...routeLayer} />
          </Source>
          <Source id="airports" type="geojson" data={airportGeoJson}>
            <Layer {...airportLayer} />
          </Source>

          {popupInfo && (
            <Popup
              longitude={popupInfo.lng}
              latitude={popupInfo.lat}
              anchor="bottom"
              onClose={() => setPopupInfo(null)}
              closeOnClick={false}
            >
              <strong>{popupInfo.code}</strong> — {popupInfo.name}
              <br />
              {popupInfo.city}, {popupInfo.country}
              <br />
              {popupInfo.count} flight{popupInfo.count !== 1 ? 's' : ''}
            </Popup>
          )}
        </Map>
      </div>
      <p className="map-legend">
        <span className="legend-line" /> Route (thicker = more flights) &nbsp;&nbsp;
        <span className="legend-dot" /> Airport (larger = more flights)
      </p>
    </div>
  )
}
