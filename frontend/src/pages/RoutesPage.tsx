import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { optimizeRoute } from '../api/routes'
import type { RoutePoint, RouteResult } from '../types/route'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

L.Marker.prototype.options.icon = L.icon({ iconUrl, shadowUrl: iconShadow, iconAnchor: [12, 41] })

function haversineKm(a: RoutePoint, b: RoutePoint): number {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLon = (b.lon - a.lon) * Math.PI / 180
  const sa = Math.sin(dLat / 2), so = Math.sin(dLon / 2)
  const c = sa * sa + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * so * so
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c))
}

function segKey(from: RoutePoint, to: RoutePoint) {
  return `${from.lat},${from.lon}→${to.lat},${to.lon}`
}

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

function parseGoogleMapsUrl(str: string): RoutePoint | null {
  try {
    const atMatch = str.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (atMatch) return { name: `${atMatch[1]}, ${atMatch[2]}`, lat: +atMatch[1], lon: +atMatch[2] }
    const qMatch = str.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (qMatch) return { name: `${qMatch[1]}, ${qMatch[2]}`, lat: +qMatch[1], lon: +qMatch[2] }
    const llMatch = str.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (llMatch) return { name: `${llMatch[1]}, ${llMatch[2]}`, lat: +llMatch[1], lon: +llMatch[2] }
  } catch { /* ignore */ }
  return null
}

async function nominatimSearch(query: string): Promise<RoutePoint[]> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=0`,
    { headers: { 'Accept-Language': 'cs' } }
  )
  const data: { display_name: string; lat: string; lon: string }[] = await res.json()
  return data.map(d => ({ name: d.display_name, lat: +d.lat, lon: +d.lon }))
}

async function reverseGeocode(lat: number, lon: number): Promise<RoutePoint> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
    { headers: { 'Accept-Language': 'cs' } }
  )
  const data: { display_name: string } = await res.json()
  return { name: data.display_name, lat, lon }
}

interface PointEntry { address: string; point: RoutePoint | null; geocoding: boolean }
const emptyEntry = (): PointEntry => ({ address: '', point: null, geocoding: false })

type MapClickTarget = 'start' | number | 'end' | null

function MapClickHandler({ target, onPlace }: { target: MapClickTarget; onPlace: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      if (target !== null) onPlace(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function RoutesPage() {
  const [start, setStart] = useState<PointEntry>(emptyEntry())
  const [waypoints, setWaypoints] = useState<PointEntry[]>([emptyEntry()])
  const [end, setEnd] = useState<PointEntry>(emptyEntry())
  const [result, setResult] = useState<RouteResult | null>(null)
  const [editablePoints, setEditablePoints] = useState<RoutePoint[]>([])
  const [mapClickTarget, setMapClickTarget] = useState<MapClickTarget>(null)

  const optimizeMut = useMutation({
    mutationFn: optimizeRoute,
    onSuccess: (res) => {
      setResult(res)
      setEditablePoints([...res.orderedPoints])
    },
  })

  const updateWaypoint = (i: number, e: PointEntry) =>
    setWaypoints(prev => prev.map((w, j) => j === i ? e : w))
  const addWaypoint = () => setWaypoints(prev => [...prev, emptyEntry()])
  const removeWaypoint = (i: number) => setWaypoints(prev => prev.filter((_, j) => j !== i))

  const handleMapPlace = useCallback(async (lat: number, lon: number) => {
    const pt = await reverseGeocode(lat, lon)
    if (mapClickTarget === 'start') setStart({ address: pt.name, point: pt, geocoding: false })
    else if (mapClickTarget === 'end') setEnd({ address: pt.name, point: pt, geocoding: false })
    else if (typeof mapClickTarget === 'number') updateWaypoint(mapClickTarget, { address: pt.name, point: pt, geocoding: false })
    setMapClickTarget(null)
  }, [mapClickTarget])

  const handleGps = () => {
    if (!navigator.geolocation) return
    setStart(e => ({ ...e, geocoding: true }))
    navigator.geolocation.getCurrentPosition(async pos => {
      const pt = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
      setStart({ address: pt.name, point: pt, geocoding: false })
    }, () => setStart(e => ({ ...e, geocoding: false })))
  }

  const canOptimize = start.point != null && waypoints.some(w => w.point != null)

  const handleOptimize = () => {
    const points: RoutePoint[] = [
      start.point!,
      ...waypoints.filter(w => w.point).map(w => w.point!),
      ...(end.point ? [end.point] : []),
    ]
    optimizeMut.mutate({ points })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setEditablePoints(prev => {
      const oldIdx = prev.findIndex((_, i) => String(i) === active.id)
      const newIdx = prev.findIndex((_, i) => String(i) === over.id)
      if (oldIdx <= 0 || newIdx <= 0) return prev  // start (idx 0) is fixed
      return arrayMove(prev, oldIdx, newIdx)
    })
  }

  // Build a lookup map from original server segments for distance reuse
  const originalSegMap = useMemo(() => {
    const map = new Map<string, { distanceKm: number; durationMin: number }>()
    if (!result) return map
    for (const seg of result.segments) {
      map.set(segKey(seg.from, seg.to), { distanceKm: seg.distanceKm, durationMin: seg.durationMin })
    }
    return map
  }, [result])

  // Derive display segments from current editable point order
  const displaySegments = useMemo(() => {
    if (editablePoints.length < 2) return []
    return editablePoints.slice(0, -1).map((from, i) => {
      const to = editablePoints[i + 1]
      const existing = originalSegMap.get(segKey(from, to))
      return {
        from,
        to,
        distanceKm: existing?.distanceKm ?? null,
        durationMin: existing?.durationMin ?? null,
        approxKm: existing ? null : haversineKm(from, to),
      }
    })
  }, [editablePoints, originalSegMap])

  const totalDistKm = displaySegments.reduce((s, seg) => s + (seg.distanceKm ?? seg.approxKm ?? 0), 0)
  const totalDurMin = displaySegments.reduce((s, seg) => s + (seg.durationMin ?? 0), 0)
  const hasApprox = displaySegments.some(s => s.approxKm !== null)

  const isReordered = result !== null && editablePoints.length > 0 &&
    editablePoints.some((p, i) => p !== result.orderedPoints[i])

  const mapCenter: [number, number] = editablePoints[0]
    ? [editablePoints[0].lat, editablePoints[0].lon]
    : start.point ? [start.point.lat, start.point.lon] : [50.08, 14.43]

  const polyline: [number, number][] = editablePoints.map(p => [p.lat, p.lon])

  const mapCursorClass = mapClickTarget !== null ? 'cursor-crosshair' : ''

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Optimalizace tras</h1>

      {mapClickTarget !== null && (
        <div className="mb-2 px-3 py-2 bg-amber-50 border border-amber-300 rounded text-sm text-amber-800 flex items-center justify-between">
          <span>Klikněte na mapu pro umístění bodu</span>
          <button onClick={() => setMapClickTarget(null)} className="text-amber-600 hover:text-amber-800 font-medium">Zrušit</button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="col-span-1 space-y-3">
          <AddressField
            label="Start"
            entry={start}
            onChange={setStart}
            color="green"
            isMapTarget={mapClickTarget === 'start'}
            onMapClick={() => setMapClickTarget(t => t === 'start' ? null : 'start')}
            showGps
            onGps={handleGps}
          />

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
                  color="blue"
                  isMapTarget={mapClickTarget === i}
                  onMapClick={() => setMapClickTarget(t => t === i ? null : i)}
                  onRemove={waypoints.length > 1 ? () => removeWaypoint(i) : undefined}
                />
              </div>
            ))}
          </div>

          <AddressField
            label="Konec (volitelný)"
            entry={end}
            onChange={setEnd}
            color="red"
            isMapTarget={mapClickTarget === 'end'}
            onMapClick={() => setMapClickTarget(t => t === 'end' ? null : 'end')}
            onRemove={end.point || end.address ? () => setEnd(emptyEntry()) : undefined}
          />

          <button
            onClick={handleOptimize}
            disabled={!canOptimize || optimizeMut.isPending}
            className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {optimizeMut.isPending ? 'Optimalizuji...' : 'Optimalizovat trasu'}
          </button>
        </div>

        <div className="col-span-2">
          <div className={`h-96 rounded overflow-hidden shadow mb-3 ${mapCursorClass}`}>
            <MapContainer center={mapCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapClickHandler target={mapClickTarget} onPlace={handleMapPlace} />
              {(editablePoints.length > 0
                ? editablePoints
                : [start.point, ...waypoints.map(w => w.point), end.point].filter(Boolean) as RoutePoint[]
              ).map((p, i) => (
                <Marker key={i} position={[p.lat, p.lon]}>
                  <Popup>{i === 0 ? 'Start: ' : `${i}. `}{p.name}</Popup>
                </Marker>
              ))}
              {polyline.length > 1 && <Polyline positions={polyline} color="blue" weight={3} />}
            </MapContainer>
          </div>

          {result && editablePoints.length > 0 && (
            <div className="bg-white rounded shadow p-4 text-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-semibold">
                    Trasa: {totalDistKm.toFixed(1)} km{totalDurMin > 0 ? ` · ${Math.round(totalDurMin)} min` : ''}
                  </span>
                  {hasApprox && (
                    <span className="ml-2 text-xs text-amber-600">* přibližné vzdálenosti po ruční úpravě</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {isReordered && (
                    <button
                      onClick={() => setEditablePoints([...result.orderedPoints])}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
                    >
                      Obnovit pořadí
                    </button>
                  )}
                  <a href={googleLink(editablePoints)} target="_blank" rel="noopener noreferrer"
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200">Google Maps</a>
                  <a href={mapyCzLink(editablePoints)} target="_blank" rel="noopener noreferrer"
                    className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">Mapy.cz</a>
                </div>
              </div>

              {/* Draggable point order list */}
              <div className="mb-3 border rounded overflow-hidden">
                {/* Fixed start point */}
                {editablePoints[0] && (
                  <div className="flex items-center gap-2 px-3 py-2 border-b bg-green-50">
                    <span className="text-xs font-bold w-5 shrink-0 text-green-600">S</span>
                    <span className="flex-1 text-xs text-gray-700 truncate" title={editablePoints[0].name}>
                      {editablePoints[0].name}
                    </span>
                  </div>
                )}
                {/* Sortable destinations */}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext
                    items={editablePoints.slice(1).map((_, i) => String(i + 1))}
                    strategy={verticalListSortingStrategy}
                  >
                    {editablePoints.slice(1).map((p, i) => (
                      <SortablePointRow key={String(i + 1)} id={String(i + 1)} index={i + 1} point={p} />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>

              {/* Segment details */}
              <ol className="space-y-2">
                {displaySegments.map((seg, i) => (
                  <li key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">{i + 1}. </span>
                      <span className="text-gray-700">{seg.from.name}</span>
                      <span className="text-gray-400 mx-1">→</span>
                      <span className="text-gray-700">{seg.to.name}</span>
                      <span className="text-gray-500 text-xs ml-2">
                        {seg.distanceKm !== null
                          ? `${seg.distanceKm.toFixed(1)} km · ${Math.round(seg.durationMin!)} min`
                          : `~${seg.approxKm!.toFixed(1)} km (vzdušná čára)`}
                      </span>
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

function SortablePointRow({ id, index, point }: { id: string; index: number; point: RoutePoint }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-3 py-2 border-b last:border-0 bg-white"
    >
      <span className="text-xs font-bold w-5 shrink-0 text-gray-400">{index}</span>
      <span className="flex-1 text-xs text-gray-700 truncate" title={point.name}>{point.name}</span>
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 px-2 py-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none"
        title="Přetáhnout"
      >
        ⠿
      </button>
    </div>
  )
}

function AddressField({
  label, entry, onChange, color, isMapTarget, onMapClick, onRemove, showGps, onGps,
}: {
  label: string
  entry: PointEntry
  onChange: (e: PointEntry) => void
  color: 'green' | 'blue' | 'red'
  isMapTarget?: boolean
  onMapClick: () => void
  onRemove?: () => void
  showGps?: boolean
  onGps?: () => void
}) {
  const [suggestions, setSuggestions] = useState<RoutePoint[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const colorMap = { green: 'bg-green-500', blue: 'bg-blue-500', red: 'bg-red-500' }

  const handleChange = (val: string) => {
    onChange({ ...entry, address: val, point: null })
    setSuggestions([])

    const gmapsPoint = parseGoogleMapsUrl(val)
    if (gmapsPoint) {
      onChange({ address: val, point: gmapsPoint, geocoding: false })
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim().length < 3) { setShowSuggestions(false); return }
    debounceRef.current = setTimeout(async () => {
      const results = await nominatimSearch(val)
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
    }, 400)
  }

  const selectSuggestion = (pt: RoutePoint) => {
    onChange({ address: pt.name, point: pt, geocoding: false })
    setSuggestions([])
    setShowSuggestions(false)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="bg-white rounded shadow p-3" ref={containerRef}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${colorMap[color]}`}></span>
          <span className="text-xs font-medium text-gray-600">{label}</span>
          {entry.point && <span className="text-xs text-green-600">✓</span>}
        </div>
        <div className="flex items-center gap-1">
          {showGps && onGps && (
            <button
              onClick={onGps}
              disabled={entry.geocoding}
              title="Použít GPS polohu"
              className="px-1.5 py-0.5 bg-gray-100 border rounded text-xs hover:bg-gray-200 disabled:opacity-50"
            >
              {entry.geocoding ? '...' : '📍'}
            </button>
          )}
          <button
            onClick={onMapClick}
            title="Kliknout na mapu"
            className={`px-1.5 py-0.5 border rounded text-xs hover:bg-gray-200 ${isMapTarget ? 'bg-amber-200 border-amber-400' : 'bg-gray-100'}`}
          >
            🗺
          </button>
          {onRemove && <button onClick={onRemove} className="text-gray-400 hover:text-red-500 text-xs ml-1">✕</button>}
        </div>
      </div>
      <div className="relative">
        <input
          value={entry.address}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Adresa nebo odkaz Google Maps..."
          className="w-full border rounded px-2 py-1 text-sm"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-white border rounded shadow-lg max-h-48 overflow-y-auto text-xs">
            {suggestions.map((s, i) => (
              <li
                key={i}
                onMouseDown={() => selectSuggestion(s)}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-0 truncate"
                title={s.name}
              >
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      {entry.point && <p className="text-xs text-gray-500 mt-1 truncate">{entry.point.name}</p>}
    </div>
  )
}
