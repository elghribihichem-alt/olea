'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface NearbyAuction {
  id: string
  title: string
  latitude: number
  longitude: number
  avgPrice: number
  distanceKm?: number
  region?: { name: string }
  oliveType?: { name: string }
  [key: string]: unknown
}

export interface MapViewProps {
  regions: {
    regionId: string
    regionName: string
    latitude: number
    longitude: number
    totalAuctions: number
    avgPrice: number
    statusCounts: Record<string, number>
    [key: string]: unknown
  }[]
  selectedRegion: {
    regionId: string
  } | null
  onSelectRegion: (region: MapViewProps['regions'][number] | null) => void
  viewMode?: 'regions' | 'auctions'
  nearbyAuctions?: NearbyAuction[]
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#45A452',
  CLOSED: '#6366f1',
  DRAFT: '#94a3b8',
  EXPIRED: '#f59e0b',
  CANCELLED: '#ef4444',
}

const TUNISIA_CENTER: [number, number] = [34.0, 9.5]
const TUNISIA_ZOOM = 7

// Fix leaflet default icon issue with webpack/next
// @ts-expect-error - leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── Map View Component ────────────────────────────────────────────────────────
export default function MapView({ regions, selectedRegion, onSelectRegion, viewMode = 'regions', nearbyAuctions = [] }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.LayerGroup | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: TUNISIA_CENTER,
      zoom: TUNISIA_ZOOM,
      zoomControl: false,
      attributionControl: true,
    })

    // Tile layer - OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)

    // Zoom control top-left
    L.control.zoom({ position: 'topleft' }).addTo(map)

    // Markers layer
    markersRef.current = L.layerGroup().addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Update markers
  useEffect(() => {
    if (!markersRef.current) return

    markersRef.current.clearLayers()

    // Auctions mode: show individual auction markers
    if (viewMode === 'auctions' && nearbyAuctions.length > 0) {
      nearbyAuctions.forEach((auction) => {
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              width: 8px;
              height: 8px;
              background-color: #45A452;
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 1px 4px rgba(0,0,0,0.3);
            "></div>
          `,
          iconSize: [8, 8],
          iconAnchor: [4, 4],
        })

        const marker = L.marker([auction.latitude, auction.longitude], { icon })

        const popupContent = `
          <div style="font-family:system-ui,sans-serif;min-width:160px;">
            <div style="font-size:13px;font-weight:700;margin-bottom:4px;">${auction.title}</div>
            ${auction.avgPrice ? `<div style="font-size:12px;color:#45A452;font-weight:600;margin-bottom:4px;">${auction.avgPrice} DT/kg</div>` : ''}
            ${auction.region?.name ? `<div style="font-size:11px;color:#666;">${auction.region.name}</div>` : ''}
            ${auction.oliveType?.name ? `<div style="font-size:11px;color:#666;">${auction.oliveType.name}</div>` : ''}
            ${auction.distanceKm != null ? `<div style="font-size:11px;color:#888;margin-top:4px;">${auction.distanceKm.toFixed(1)} km</div>` : ''}
          </div>
        `

        marker.bindPopup(popupContent, {
          className: 'custom-popup',
          closeButton: false,
        })

        markersRef.current!.addLayer(marker)
      })
      return
    }

    // Regions mode: show region circles (existing behavior)
    if (!regions) return

    regions.forEach((region) => {
      // Determine dominant status for marker color
      const dominantStatus = Object.entries(region.statusCounts)
        .sort((a, b) => b[1] - a[1])[0]
      const color = dominantStatus ? (STATUS_COLORS[dominantStatus[0]] || '#45A452') : '#45A452'

      // Marker size based on auction count
      const size = Math.max(12, Math.min(30, 8 + region.totalAuctions * 0.8))

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: ${Math.max(9, size * 0.4)}px;
            font-weight: 700;
          ">
            ${region.totalAuctions}
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      })

      const marker = L.marker([region.latitude, region.longitude], { icon })

      // Popup
      const statusHTML = Object.entries(region.statusCounts)
        .sort((a, b) => b[1] - a[1])
        .map(
          ([status, count]) =>
            `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:8px;">
              <span style="width:8px;height:8px;border-radius:50%;background:${STATUS_COLORS[status] || '#94a3b8'}"></span>
              ${status}: ${count}
            </span>`
        )
        .join('')

      const popupContent = `
        <div style="font-family:system-ui,sans-serif;min-width:180px;">
          <div style="font-size:14px;font-weight:700;margin-bottom:8px;">${region.regionName}</div>
          <div style="font-size:12px;color:#666;margin-bottom:6px;">
            <strong>${region.totalAuctions}</strong> enchère${region.totalAuctions > 1 ? 's' : ''}
          </div>
          ${region.avgPrice > 0 ? `<div style="font-size:12px;color:#45A452;font-weight:600;margin-bottom:6px;">${region.avgPrice} DT/kg en moyenne</div>` : ''}
          <div style="font-size:11px;">${statusHTML}</div>
        </div>
      `

      marker.bindPopup(popupContent, {
        className: 'custom-popup',
        closeButton: false,
      })

      marker.on('click', () => {
        onSelectRegion(region)
      })

      markersRef.current!.addLayer(marker)
    })
  }, [regions, onSelectRegion, viewMode, nearbyAuctions])

  // Fly to selected region or center on nearby auctions
  useEffect(() => {
    if (!mapInstanceRef.current) return

    if (viewMode === 'auctions' && nearbyAuctions.length > 0) {
      const first = nearbyAuctions[0]
      mapInstanceRef.current.flyTo([first.latitude, first.longitude], 10, {
        duration: 1,
      })
      return
    }

    if (!selectedRegion) return

    const region = regions.find((r) => r.regionId === selectedRegion.regionId)
    if (region) {
      mapInstanceRef.current.flyTo([region.latitude, region.longitude], 9, {
        duration: 1,
      })
    }
  }, [selectedRegion, regions, viewMode, nearbyAuctions])

  return <div ref={mapRef} className="h-full w-full" style={{ minHeight: '400px' }} />
}
