import client from './client'
import type { RoutePoint, RouteRequest, RouteResult } from '../types/route'

export const geocodeAddress = (address: string) =>
  client.post<RoutePoint>('/routes/geocode', { address }).then(r => r.data)

export const optimizeRoute = (req: RouteRequest) =>
  client.post<RouteResult>('/routes/optimize', req).then(r => r.data)
