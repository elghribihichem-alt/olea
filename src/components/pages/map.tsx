'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
  MapPin,
  Filter,
  RefreshCw,
  Layers,
  X,
  Package,
  TrendingUp,
  Gavel,
  Leaf,
  Crosshair,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsCard } from '@/components/stats-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface MapRegion {
  regionId: string
  regionName: string
  latitude: number
  longitude: number
  totalAuctions: number
  totalQuantity: number
  avgPrice: number
  statusCounts: Record<string, number>
  topOliveTypes: string[]
}

interface MapSummary {
  totalRegions: number
  totalAuctions: number
  totalVolume: number
  avgPrice: number
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#45A452',
  CLOSED: '#6366f1',
  DRAFT: '#94a3b8',
  EXPIRED: '#f59e0b',
  CANCELLED: '#ef4444',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  CLOSED: 'Clôturée',
  DRAFT: 'Brouillon',
  EXPIRED: 'Expirée',
  CANCELLED: 'Annulée',
}

function formatNumber(n: number): string {
  return n.toLocaleString('fr-FR')
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────
function MapSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[500px] rounded-xl" />
    </div>
  )
}

// ─── Dynamic Leaflet Map (SSR-safe) ────────────────────────────────────────────
const MapView = dynamic(() => import('./map-view'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-muted">
      <div className="text-center space-y-2">
        <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-[#45A452]/10">
          <MapPin className="h-6 w-6 text-[#45A452]" />
        </div>
        <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
      </div>
    </div>
  ),
})

// ─── Main Map Page ─────────────────────────────────────────────────────────────
export default function MapPage() {
  const [mapData, setMapData] = useState<{ regions: MapRegion[]; summary: MapSummary } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState<MapRegion | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [statusFilter, setStatusFilter] = useState('ALL')
  const [oliveTypeFilter, setOliveTypeFilter] = useState('ALL')
  const [oliveTypes, setOliveTypes] = useState<{ id: string; name: string }[]>([])

  const [viewMode, setViewMode] = useState<'regions' | 'auctions'>('regions')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [nearbyRadius, setNearbyRadius] = useState(50)
  const [nearbyAuctions, setNearbyAuctions] = useState<any[] | null>(null)
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [nearbyCount, setNearbyCount] = useState(0)
  const [geoError, setGeoError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: statusFilter, oliveTypeId: oliveTypeFilter })
      const res = await fetch(`/api/map/data?${params}`)
      if (!res.ok) throw new Error('Fetch error')
      const data = await res.json()
      setMapData(data)
    } catch {
      toast.error('Erreur lors du chargement de la carte')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, oliveTypeFilter])

  useEffect(() => {
    fetch('/api/olive-types').then((r) => r.json()).then(setOliveTypes).catch(() => {})
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Geolocation handler
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non supportée par votre navigateur')
      return
    }
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        toast.success('Position détectée')
      },
      (err) => {
        setGeoError('Impossible de détecter votre position')
        toast.error('Erreur de géolocalisation')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  // Fetch nearby auctions when location changes
  useEffect(() => {
    if (!userLocation) return
    setNearbyLoading(true)
    fetch(`/api/map/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${nearbyRadius}`)
      .then(r => r.json())
      .then(data => {
        setNearbyAuctions(data.auctions)
        setNearbyCount(data.count)
      })
      .catch(() => toast.error('Erreur recherche proximité'))
      .finally(() => setNearbyLoading(false))
  }, [userLocation, nearbyRadius])

  if (loading && !mapData) return <MapSkeleton />

  if (!mapData) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground">Erreur de chargement</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard title="Régions actives" value={mapData.summary.totalRegions} subtitle="sur 24 gouvernorats" icon={MapPin} iconColor="text-[#45A452]" iconBg="bg-[#45A452]/10" />
        <StatsCard title="Enchères" value={formatNumber(mapData.summary.totalAuctions)} icon={Gavel} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatsCard title="Volume total" value={formatNumber(mapData.summary.totalVolume) + ' kg'} icon={Package} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatsCard title="Prix moyen" value={mapData.summary.avgPrice + ' DT/kg'} icon={TrendingUp} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" /> Filtres :
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-full md:w-[160px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="CLOSED">Clôturée</SelectItem>
                <SelectItem value="DRAFT">Brouillon</SelectItem>
                <SelectItem value="EXPIRED">Expirée</SelectItem>
              </SelectContent>
            </Select>
            <Select value={oliveTypeFilter} onValueChange={setOliveTypeFilter}>
              <SelectTrigger className="h-10 w-full md:w-[180px]">
                <SelectValue placeholder="Type d'olive" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les types</SelectItem>
                {oliveTypes.map((ot) => (
                  <SelectItem key={ot.id} value={ot.id}>{ot.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={fetchData}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* View Mode Toggle + Nearby Search */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border bg-muted p-0.5">
                <Button
                  variant={viewMode === 'regions' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setViewMode('regions')}
                >
                  Vue régions
                </Button>
                <Button
                  variant={viewMode === 'auctions' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setViewMode('auctions')}
                >
                  Vue enchères
                </Button>
              </div>
            </div>

            {viewMode === 'auctions' && (
              <div className="flex flex-col gap-3 rounded-lg border p-3 bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 text-[#45A452]" />
                  Autour de moi
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs"
                    onClick={handleGeolocate}
                  >
                    <Crosshair className="h-3.5 w-3.5 mr-1.5" />
                    📍 Ma position
                  </Button>
                  {userLocation && (
                    <>
                      <span className="text-xs text-muted-foreground">
                        {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                      </span>
                      <Select value={String(nearbyRadius)} onValueChange={(v) => setNearbyRadius(Number(v))}>
                        <SelectTrigger className="h-9 w-full sm:w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 km</SelectItem>
                          <SelectItem value="25">25 km</SelectItem>
                          <SelectItem value="50">50 km</SelectItem>
                          <SelectItem value="100">100 km</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>
                {geoError && (
                  <p className="text-xs text-destructive">{geoError}</p>
                )}
                {nearbyLoading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Recherche en cours...
                  </div>
                )}
                {!nearbyLoading && nearbyAuctions && (
                  <p className="text-xs text-muted-foreground">
                    {nearbyCount} enchère{nearbyCount !== 1 ? 's' : ''} dans un rayon de {nearbyRadius} km
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map Container */}
      <Card className="overflow-hidden">
        <div className="flex h-[500px] md:h-[600px] relative">
          {/* Map */}
          <div className="flex-1 relative">
            {/* @ts-expect-error - MapRegion type has extra fields beyond MapViewProps */}
            <MapView
              regions={mapData.regions}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
              viewMode={viewMode}
              nearbyAuctions={nearbyAuctions || []}
            />

            {/* Layer toggle */}
            <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9 bg-white shadow-md" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Layers className="h-4 w-4" />
              </Button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 z-[1000] rounded-lg bg-white/95 backdrop-blur-sm shadow-md p-2">
              <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">LÉGENDE</p>
              <div className="space-y-1">
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[key] }} />
                    <span className="text-[10px] text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Region details */}
          {sidebarOpen && selectedRegion && (
            <div className="w-72 border-l bg-background hidden md:flex flex-col">
              <div className="flex items-center justify-between p-3 border-b">
                <h3 className="text-sm font-semibold truncate">{selectedRegion.regionName}</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setSelectedRegion(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <ScrollArea className="flex-1 p-3 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-[#45A452]" />
                    <span className="text-xs font-medium">Statistiques</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Enchères</span>
                      <span className="font-semibold">{selectedRegion.totalAuctions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Volume</span>
                      <span className="font-medium">{formatNumber(selectedRegion.totalQuantity)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prix moyen</span>
                      <span className="font-semibold text-[#45A452]">
                        {selectedRegion.avgPrice > 0 ? `${selectedRegion.avgPrice} DT/kg` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <span className="text-xs font-medium">Répartition par statut</span>
                  <div className="space-y-2">
                    {Object.entries(selectedRegion.statusCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([status, count]) => (
                        <div key={status} className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[status] || '#94a3b8' }} />
                          <span className="text-xs flex-1">{STATUS_LABELS[status] || status}</span>
                          <span className="text-xs font-semibold">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
                <Separator />
                {selectedRegion.topOliveTypes.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-medium">Variétés d&apos;olives</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRegion.topOliveTypes.map((name) => (
                        <Badge key={name} variant="secondary" className="text-[10px]">{name}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>
      </Card>

      {/* Nearby Auctions List */}
      {viewMode === 'auctions' && nearbyAuctions && nearbyAuctions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#45A452]" />
              Enchères à proximité ({nearbyCount})
            </CardTitle>
            <CardDescription>Dans un rayon de {nearbyRadius} km de votre position</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {nearbyAuctions.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div>
                      <div className="text-sm font-medium">{a.title}</div>
                      <div className="text-xs text-muted-foreground">{a.region?.name} — {a.oliveType?.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-[#45A452]">{a.avgPrice} DT/kg</div>
                      <div className="text-[10px] text-muted-foreground">{a.distanceKm?.toFixed(1)} km</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Region table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#45A452]" />
            Détail par région
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Région</th>
                  <th className="pb-2 pr-4 font-medium">Enchères</th>
                  <th className="pb-2 pr-4 font-medium hidden sm:table-cell">Volume (kg)</th>
                  <th className="pb-2 pr-4 font-medium hidden md:table-cell">Prix moyen</th>
                  <th className="pb-2 font-medium">Statuts</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mapData.regions.sort((a, b) => b.totalAuctions - a.totalAuctions).map((region) => (
                  <tr key={region.regionId} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedRegion(region)}>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[#45A452]" />
                        <span className="font-medium">{region.regionName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 font-semibold">{region.totalAuctions}</td>
                    <td className="py-2.5 pr-4 hidden sm:table-cell text-muted-foreground">{formatNumber(region.totalQuantity)}</td>
                    <td className="py-2.5 pr-4 hidden md:table-cell font-medium text-[#45A452]">
                      {region.avgPrice > 0 ? `${region.avgPrice} DT` : '—'}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1">
                        {Object.entries(region.statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                          <Badge key={status} variant="secondary" className="text-[10px]" style={{ backgroundColor: (STATUS_COLORS[status] || '#94a3b8') + '15', color: STATUS_COLORS[status] || '#94a3b8' }}>
                            {count}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
