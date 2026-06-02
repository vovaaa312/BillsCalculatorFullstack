import client from './client'
import type { RoutePoint, RouteRequest, RouteResult, SavedRoute } from '../types/route'

export const geocodeAddress = (address: string) =>
  client.post<RoutePoint>('/routes/geocode', { address }).then(r => r.data)

export const optimizeRoute = (req: RouteRequest) =>
  client.post<RouteResult>('/routes/optimize', req).then(r => r.data)

export const resolveMapsUrl = (url: string) =>
  client.get<RoutePoint>('/routes/resolve-maps-url', { params: { url } }).then(r => r.data)

export const resolveRouteUrl = (url: string) =>
  client.get<RoutePoint[]>('/routes/resolve-route-url', { params: { url } }).then(r => r.data)

export const getSavedRoutes = () =>
  client.get<SavedRoute[]>('/routes/saved').then(r => r.data)

export const saveRoute = (name: string, points: RoutePoint[]) =>
  client.post<SavedRoute>('/routes/saved', { name, points }).then(r => r.data)

export const deleteSavedRoute = (id: number) =>
  client.delete(`/routes/saved/${id}`)
