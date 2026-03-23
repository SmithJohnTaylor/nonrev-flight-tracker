const R_MILES = 3958.8

export function haversine(lat1, lng1, lat2, lng2) {
  const toRad = d => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return Math.round(R_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

/** Returns [[lat, lng], ...] great-circle intermediate points for map arcs. */
export function greatCirclePoints(lat1, lng1, lat2, lng2, n = 60) {
  const toRad = d => (d * Math.PI) / 180
  const toDeg = r => (r * 180) / Math.PI

  const φ1 = toRad(lat1), λ1 = toRad(lng1)
  const φ2 = toRad(lat2), λ2 = toRad(lng2)

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((φ2 - φ1) / 2) ** 2 +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2
      )
    )

  if (d < 0.0001) return [[lat1, lng1]]

  const points = []
  for (let i = 0; i <= n; i++) {
    const f = i / n
    const A = Math.sin((1 - f) * d) / Math.sin(d)
    const B = Math.sin(f * d) / Math.sin(d)
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2)
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2)
    const z = A * Math.sin(φ1) + B * Math.sin(φ2)
    points.push([toDeg(Math.atan2(z, Math.sqrt(x ** 2 + y ** 2))), toDeg(Math.atan2(y, x))])
  }
  return points
}

/** Split a great-circle path at the antimeridian so Leaflet draws it correctly. */
export function splitAtAntimeridian(points) {
  const segments = [[]]
  for (let i = 0; i < points.length; i++) {
    segments[segments.length - 1].push(points[i])
    if (i < points.length - 1) {
      const [lat1, lng1] = points[i]
      const [lat2, lng2] = points[i + 1]
      const dLng = lng2 - lng1
      if (Math.abs(dLng) > 180) {
        // Normalize lng2 onto the same side as lng1 to interpolate correctly
        const lng2n = dLng > 0 ? lng2 - 360 : lng2 + 360
        const boundary = lng1 > 0 ? 180 : -180
        const t = (boundary - lng1) / (lng2n - lng1)
        const crossLat = lat1 + t * (lat2 - lat1)
        // Close current segment at the antimeridian, open next from the other side
        segments[segments.length - 1].push([crossLat, boundary])
        segments.push([[crossLat, -boundary]])
      }
    }
  }
  return segments.filter(s => s.length >= 2)
}
