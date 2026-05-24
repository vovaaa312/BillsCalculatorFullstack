import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { geocodeAddress, optimizeRoute } from '../api/routes'
import type { RoutePoint, RouteResult } from '../types/route'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

L.Marker.prototype.options.icon = L.icon({ iconUrl, shadowUrl: iconShadow, iconAnchor: [12, 41] })

function wazeLink(from: RoutePoint, to: RoutePoint) {
  return `https://waze.com/ul?ll=${to.lat},${to.lon}&navigate=yes&from=${from.lat},${from.lon}`
}

function googleLink(points: RoutePoint[]) {
  const waypoints = points.slice(1, -1).map(p => `${p.lat},${p.lon}`).join('|')
  const origin = `${points[0].lat},${points[0].lon}`
  const dest = `${points[points.length - 1].lat},${points[points.length - 1].lon}`
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`
}

function mapyCzLink(points: RoutePoint[]) {
  const coords = points.map(p => `${p.lon},${p.lat}`).join(';')
  return `https://mapy.cz/zakladni?planovani-trasy&routePoints=${coords}`
}

interface PointEntry { address: string; point: RoutePoint | null; geocoding: boolean }

const emptyEntry = (): PointEntry => ({ address: '', point: null, geocoding: false })

export default function RoutesPage() {
  const [start, setStart] = useState<PointEntry>(emptyEntry())
  const [waypoints, setWaypoints] = useState<PointEntry[]>([emptyEntry()])
  const [end, setEnd] = useState<PointEntry>(emptyEntry())
  const [result, setResult] = useState<RouteResult | null>(null)

  const geocodeMut = useMutation({ mutationFn: geocodeAddress })
  const optimizeMut = useMutation({ mutationFn: optimizeRoute, onSuccess: setResult })

  const geocodeEntry = async (entry: PointEntry, set: (e: PointEntry) => void) => {
    if (!entry.address.trim()) return
    set({ ...entry, geocoding: true })
    try {
      const pt = await geocodeMut.mutateAsync(entry.address)
      set({ ...entry, point: pt, geocoding: false })
    } catch { set({ ...entry, geocoding: false }) }
  }

  const updateWaypoint = (i: number, e: PointEntry) =>
    setWaypoints(prev => prev.map((w, j) => j === i ? e : w))

  const addWaypoint = () => setWaypoints(prev => [...prev, emptyEntry()])
  const removeWaypoint = (i: number) => setWaypoints(prev => prev.filter((_, j) => j !== i))

  const canOptimize = start.point != null && waypoints.some(w => w.point != null)

  const handleOptimize = () => {
    const points: RoutePoint[] = [
      start.point!,
      ...waypoints.filter(w => w.point).map(w => w.point!),
      ...(end.point ? [end.point] : []),
    ]
    optimizeMut.mutate({ points })
  }

  const mapCenter: [number, number] = result?.orderedPoints[0]
    ? [result.orderedPoints[0].lat, result.orderedPoints[0].lon]
    : start.point ? [start.point.lat, start.point.lon] : [50.08, 14.43]

  const polyline: [number, number][] = result?.orderedPoints.map(p => [p.lat, p.lon]) ?? []

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Optimalizace tras</h1>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="col-span-1 space-y-3">
          <AddressField label="Start" entry={start} onChange={setStart} onGeocode={() => geocodeEntry(start, setStart)} color="green" />

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Cíle</span>
              <button onClick={addWaypoint} className="text-blue-600 text-xs hover:underline">+ Přidat cíl</button>
            </div>
            {waypoints.map((w, i) => (
              <div key={i} className="relative mb-2">
                <AddressField
                  label={`Cíl ${i + 1}`}
                  entry={w}
                  onChange={e => updateWaypoint(i, e)}
                  onGeocode={() => geocodeEntry(w, e => updateWaypoint(i, e))}
                  color="blue"
                  onRemove={waypoints.length > 1 ? () => removeWaypoint(i) : undefined}
                />
              </div>
            ))}
          </div>

          <AddressField label="Konec (volitelný)" entry={end} onChange={setEnd} onGeocode={() => geocodeEntry(end, setEnd)} color="red"
            onRemove={end.point || end.address ? () => setEnd(emptyEntry()) : undefined} />

          <button
            onClick={handleOptimize}
            disabled={!canOptimize || optimizeMut.isPending}
            className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {optimizeMut.isPending ? 'Optimalizuji...' : 'Optimalizovat trasu'}
          </button>
        </div>

        <div className="col-span-2">
          <div className="h-96 rounded overflow-hidden shadow mb-3">
            <MapContainer center={mapCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {(result?.orderedPoints ?? [start.point, ...waypoints.map(w => w.point), end.point].filter(Boolean) as RoutePoint[]).map((p, i) => (
                <Marker key={i} position={[p.lat, p.lon]}>
                  <Popup>{i === 0 ? 'Start: ' : i === (result?.orderedPoints.length ?? 0) - 1 && end.point ? 'Konec: ' : `${i}. `}{p.name}</Popup>
                </Marker>
              ))}
              {polyline.length > 1 && <Polyline positions={polyline} color="blue" weight={3} />}
            </MapContainer>
          </div>

          {result && (
            <div className="bg-white rounded shadow p-4 text-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">
                  Trasa: {result.totalDistanceKm.toFixed(1)} km · {Math.round(result.totalDurationMin)} min
                </span>
                <div className="flex gap-2">
                  <a href={googleLink(result.orderedPoints)} target="_blank" rel="noopener noreferrer"
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200">Google Maps</a>
                  <a href={mapyCzLink(result.orderedPoints)} target="_blank" rel="noopener noreferrer"
                    className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">Mapy.cz</a>
                </div>
              </div>
              <ol className="space-y-2">
                {result.segments.map((seg, i) => (
                  <li key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <span className="font-medium">{i + 1}. </span>
                      <span className="text-gray-700">{seg.from.name}</span>
                      <span className="text-gray-400 mx-1">→</span>
                      <span className="text-gray-700">{seg.to.name}</span>
                      <span className="text-gray-500 text-xs ml-2">{seg.distanceKm.toFixed(1)} km · {Math.round(seg.durationMin)} min</span>
                    </div>
                    <a href={wazeLink(seg.from, seg.to)} target="_blank" rel="noopener noreferrer"
                      className="px-2 py-1 bg-sky-100 text-sky-700 rounded text-xs hover:bg-sky-200 shrink-0 ml-2">Waze</a>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AddressField({ label, entry, onChange, onGeocode, color, onRemove }: {
  label: string
  entry: PointEntry
  onChange: (e: PointEntry) => void
  onGeocode: () => void
  color: 'green' | 'blue' | 'red'
  onRemove?: () => void
}) {
  const colorMap = { green: 'bg-green-500', blue: 'bg-blue-500', red: 'bg-red-500' }
  return (
    <div className="bg-white rounded shadow p-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${colorMap[color]}`}></span>
          <span className="text-xs font-medium text-gray-600">{label}</span>
          {entry.point && <span className="text-xs text-green-600">✓ Nalezeno</span>}
        </div>
        {onRemove && <button onClick={onRemove} className="text-gray-400 hover:text-red-500 text-xs">✕</button>}
      </div>
      <div className="flex gap-1">
        <input
          value={entry.address}
          onChange={e => onChange({ ...entry, address: e.target.value, point: null })}
          onKeyDown={e => { if (e.key === 'Enter') onGeocode() }}
          placeholder="Zadejte adresu..."
          className="flex-1 border rounded px-2 py-1 text-sm"
        />
        <button
          onClick={onGeocode}
          disabled={entry.geocoding || !entry.address.trim()}
          className="px-2 py-1 bg-gray-100 border rounded text-xs hover:bg-gray-200 disabled:opacity-50"
        >
          {entry.geocoding ? '...' : 'Hledat'}
        </button>
      </div>
      {entry.point && <p className="text-xs text-gray-500 mt-1 truncate">{entry.point.name}</p>}
    </div>
  )
}
