export interface RoutePoint {
  name: string
  lat: number
  lon: number
}

export interface RouteSegment {
  from: RoutePoint
  to: RoutePoint
  distanceKm: number
  durationMin: number
}

export interface RouteResult {
  orderedPoints: RoutePoint[]
  segments: RouteSegment[]
  totalDistanceKm: number
  totalDurationMin: number
}

export interface RouteRequest {
  points: RoutePoint[]
}
