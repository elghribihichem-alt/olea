'use client'

import { useEffect, useState, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsCard } from '@/components/stats-card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  MapPin,
  DollarSign,
  RefreshCw,
  Filter,
  Leaf,
  BarChart3,
  CalendarDays,
  Grid3X3,
  Bell,
  BellRing,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface OliveTypeOption {
  id: string
  name: string
}

interface RegionOption {
  id: string
  name: string
}

interface PredictionHistory {
  month: string
  avgPrice: number | null
  predicted: false
}

interface PredictionForecast {
  month: string
  avgPrice: number
  predicted: true
  lowerBound: number
  upperBound: number
}

interface PredictionData {
  history: PredictionHistory[]
  forecast: PredictionForecast[]
  trend: 'up' | 'down' | 'stable'
  slope: number
}

interface ComparisonItem {
  id: string
  name: string
  avgPrice: number
  minPrice: number
  maxPrice: number
  bidCount: number
  volume: number
}

interface ComparisonData {
  dimension: 'regions' | 'types'
  items: ComparisonItem[]
}

interface SeasonalityMonth {
  month: number
  monthName: string
  avgPrice: number
  bidCount: number
}

interface SeasonalityData {
  months: SeasonalityMonth[]
  peakMonth: number
  lowMonth: number
  peakPrice: number
  lowPrice: number
}

interface HeatmapCell {
  oliveType: string
  region: string
  avgPrice: number
  bidCount: number
}

interface HeatmapData {
  oliveTypes: string[]
  regions: string[]
  data: HeatmapCell[]
}

interface AlertItem {
  id: string
  userId: string
  oliveTypeId: string | null
  regionId: string | null
  condition: 'ABOVE' | 'BELOW'
  threshold: number
  isActive: boolean
  triggeredAt: string | null
  createdAt: string
  user: { id: string; name: string | null; phone: string } | null
  oliveType: { id: string; name: string } | null
  region: { id: string; name: string } | null
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const PRIMARY = '#45A452'
const DARK_OLIVE = '#1f6e2b'
const LIGHT_OLIVE = '#86EFAC'
const AMBER = '#f59e0b'
const RED = '#ef4444'
const INDIGO = '#6366f1'
const MULTI = ['#45A452', '#6366f1', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#f97316']

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.96)',
  borderColor: '#e2e8f0',
  borderWidth: 1,
  textStyle: { color: '#334155', fontSize: 12 },
  extraCssText: 'border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);',
}

const FRENCH_MONTHS_SHORT = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
]

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatMonthLabel(monthStr: string): string {
  const d = new Date(monthStr + '-01')
  return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}

function formatMonthFull(monthStr: string): string {
  const d = new Date(monthStr + '-01')
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────
function MarketIntelligenceSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <Skeleton className="h-20 rounded-xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-14 rounded-xl" />
      <Skeleton className="h-[500px] rounded-xl" />
      <Skeleton className="h-[400px] rounded-xl" />
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function MarketIntelligencePage() {
  // ── Filters ────────────────────────────────────────────────────────────────
  const [oliveTypes, setOliveTypes] = useState<OliveTypeOption[]>([])
  const [regions, setRegions] = useState<RegionOption[]>([])
  const [oliveTypeFilter, setOliveTypeFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')

  // ── KPI data ───────────────────────────────────────────────────────────────
  const [currentAvgPrice, setCurrentAvgPrice] = useState<number>(0)
  const [kpiTrend, setKpiTrend] = useState<'up' | 'down' | 'stable'>('stable')
  const [kpiVolatility, setKpiVolatility] = useState<number>(0)
  const [bestRegion, setBestRegion] = useState<string>('—')

  // ── Tab data ───────────────────────────────────────────────────────────────
  const [predictions, setPredictions] = useState<PredictionData | null>(null)
  const [comparison, setComparison] = useState<ComparisonData | null>(null)
  const [seasonality, setSeasonality] = useState<SeasonalityData | null>(null)
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null)
  const [alerts, setAlerts] = useState<AlertItem[]>([])

  // ── UI states ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [loadingKpi, setLoadingKpi] = useState(true)
  const [loadingPredictions, setLoadingPredictions] = useState(true)
  const [loadingComparison, setLoadingComparison] = useState(true)
  const [loadingSeasonality, setLoadingSeasonality] = useState(true)
  const [loadingHeatmap, setLoadingHeatmap] = useState(true)
  const [loadingAlerts, setLoadingAlerts] = useState(true)
  const [creatingAlert, setCreatingAlert] = useState(false)
  const [sortField, setSortField] = useState<keyof ComparisonItem>('avgPrice')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // ── New alert form ─────────────────────────────────────────────────────────
  const [alertOliveType, setAlertOliveType] = useState('')
  const [alertRegion, setAlertRegion] = useState('')
  const [alertCondition, setAlertCondition] = useState<'' | 'ABOVE' | 'BELOW'>('')
  const [alertThreshold, setAlertThreshold] = useState('')

  // ── Fetch filters (olive types + regions) ──────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/api/olive-types').then((r) => r.json()),
      fetch('/api/regions').then((r) => r.json()),
    ]).then(([ot, rg]) => {
      setOliveTypes(Array.isArray(ot) ? ot : [])
      setRegions(Array.isArray(rg) ? rg : [])
    })
  }, [])

  // ── Fetch heatmap (no filter dependency) ──────────────────────────────────
  const fetchHeatmap = useCallback(async () => {
    setLoadingHeatmap(true)
    try {
      const res = await fetch('/api/market/heatmap')
      if (!res.ok) throw new Error()
      setHeatmap(await res.json())
    } catch {
      toast.error('Erreur lors du chargement de la matrice')
    } finally {
      setLoadingHeatmap(false)
    }
  }, [])

  // ── Fetch alerts ──────────────────────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    setLoadingAlerts(true)
    try {
      const res = await fetch('/api/market/alerts')
      if (!res.ok) throw new Error()
      setAlerts(Array.isArray(await res.json()) ? [] : [])
      // Re-fetch properly
      const data = await res.json().catch(() => [])
      setAlerts(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Erreur lors du chargement des alertes')
      setAlerts([])
    } finally {
      setLoadingAlerts(false)
    }
  }, [])

  // Actually fix the double-fetch above
  useEffect(() => {
    const loadAlerts = async () => {
      setLoadingAlerts(true)
      try {
        const res = await fetch('/api/market/alerts')
        if (!res.ok) throw new Error()
        const data = await res.json()
        setAlerts(Array.isArray(data) ? data : [])
      } catch {
        setAlerts([])
      } finally {
        setLoadingAlerts(false)
      }
    }
    loadAlerts()
  }, [])

  // ── Fetch tab data based on filters ────────────────────────────────────────
  const fetchTabData = useCallback(async () => {
    const params = new URLSearchParams()
    if (oliveTypeFilter) params.set('oliveTypeId', oliveTypeFilter)
    if (regionFilter) params.set('regionId', regionFilter)
    const qs = params.toString()

    // Fetch predictions, comparison, seasonality in parallel
    setLoadingPredictions(true)
    setLoadingComparison(true)
    setLoadingSeasonality(true)
    setLoadingKpi(true)

    try {
      const [predRes, compRes, seasRes] = await Promise.all([
        fetch(`/api/market/predictions?${qs}`),
        fetch(`/api/market/comparison?${qs}`),
        fetch(`/api/market/seasonality?${qs}`),
      ])

      if (predRes.ok) {
        const predData: PredictionData = await predRes.json()
        setPredictions(predData)
        setKpiTrend(predData.trend)

        // Extract KPIs from predictions
        const nonNull = predData.history.filter((h) => h.avgPrice !== null)
        if (nonNull.length > 0) {
          const prices = nonNull.map((h) => h.avgPrice!)
          setCurrentAvgPrice(prices[prices.length - 1])
          const maxP = Math.max(...prices)
          const minP = Math.min(...prices)
          setKpiVolatility(Number((maxP - minP).toFixed(2)))
        }
      }

      if (compRes.ok) {
        const compData: ComparisonData = await compRes.json()
        setComparison(compData)
        if (compData.items.length > 0) {
          setBestRegion(compData.items[0].name)
        }
      }

      if (seasRes.ok) {
        setSeasonality(await seasRes.json())
      }
    } catch {
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoadingPredictions(false)
      setLoadingComparison(false)
      setLoadingSeasonality(false)
      setLoadingKpi(false)
      setLoading(false)
    }
  }, [oliveTypeFilter, regionFilter])

  useEffect(() => {
    fetchTabData()
    fetchHeatmap()
  }, [fetchTabData, fetchHeatmap])

  // ── Refresh all ────────────────────────────────────────────────────────────
  const handleRefresh = () => {
    setLoading(true)
    fetchTabData()
    fetchHeatmap()
  }

  // ── Create alert ───────────────────────────────────────────────────────────
  const handleCreateAlert = async () => {
    if (!alertCondition || !alertThreshold || Number(alertThreshold) <= 0) {
      toast.error('Veuillez remplir la condition et un seuil valide')
      return
    }
    setCreatingAlert(true)
    try {
      const res = await fetch('/api/market/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'system',
          oliveTypeId: alertOliveType || null,
          regionId: alertRegion || null,
          condition: alertCondition,
          threshold: Number(alertThreshold),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur')
      }
      toast.success('Alerte créée avec succès')
      setAlertOliveType('')
      setAlertRegion('')
      setAlertCondition('')
      setAlertThreshold('')
      // Refresh alerts
      const alertsRes = await fetch('/api/market/alerts')
      if (alertsRes.ok) {
        const data = await alertsRes.json()
        setAlerts(Array.isArray(data) ? data : [])
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la création de l'alerte")
    } finally {
      setCreatingAlert(false)
    }
  }

  // ── Sort comparison table ──────────────────────────────────────────────────
  const handleSort = (field: keyof ComparisonItem) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const sortedItems = comparison
    ? [...comparison.items].sort((a, b) => {
        const av = a[sortField]
        const bv = b[sortField]
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av
        }
        return sortDir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av))
      })
    : []

  // ══════════════════════════════════════════════════════════════════════════
  // ── INITIAL LOAD ──────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  if (loading && loadingKpi) return <MarketIntelligenceSkeleton />

  // ══════════════════════════════════════════════════════════════════════════
  // ── ECHARTS OPTIONS ───────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // ── Tab 1: Predictions Line Chart ──────────────────────────────────────────
  const predictionOption = (() => {
    if (!predictions) return {}

    const allLabels = [
      ...predictions.history.map((h) => formatMonthLabel(h.month)),
      ...predictions.forecast.map((f) => formatMonthLabel(f.month)),
    ]

    const histData = predictions.history.map((h) => h.avgPrice)
    const forecastData = predictions.forecast.map((f) => f.avgPrice)
    const lowerData = [
      ...predictions.history.map(() => null),
      ...predictions.forecast.map((f) => f.lowerBound),
    ]
    const upperData = [
      ...predictions.history.map(() => null),
      ...predictions.forecast.map((f) => f.upperBound),
    ]

    // Find forecast start index for markLine
    const forecastStartIdx = predictions.history.length - 1

    // Find peak price in history
    const histNonNull = predictions.history.filter((h) => h.avgPrice !== null)
    let peakIdx = -1
    let peakVal = 0
    histNonNull.forEach((h) => {
      if (h.avgPrice !== null && h.avgPrice > peakVal) {
        peakVal = h.avgPrice
        peakIdx = predictions.history.indexOf(h)
      }
    })

    return {
      tooltip: {
        ...TOOLTIP_STYLE,
        trigger: 'axis',
        formatter: (params: { name: string; seriesName: string; value: number | null; marker: string; dataIndex: number }[]) => {
          const idx = params[0]?.dataIndex
          if (idx === undefined) return ''
          const isForecast = idx >= predictions.history.length
          const monthStr = isForecast
            ? predictions.forecast[idx - predictions.history.length]?.month
            : predictions.history[idx]?.month
          if (!monthStr) return ''
          const fullLabel = formatMonthFull(monthStr)
          let html = `<strong>${fullLabel}</strong>`
          if (isForecast) {
            html += ' <span style="color:#f59e0b;font-size:10px">⏱ Prévision</span>'
          }
          html += '<br/>'
          params.forEach((p) => {
            if (p.value !== null && p.value !== undefined) {
              html += `${p.marker} ${p.seriesName} : <b>${p.value.toFixed(2)} DT/kg</b><br/>`
            }
          })
          return html
        },
      },
      legend: {
        data: ['Prix historique', 'Prévision', 'Borne inférieure', 'Borne supérieure'],
        top: 0,
        right: 0,
        textStyle: { fontSize: 11, color: '#64748b' },
        icon: 'roundRect',
        itemWidth: 14,
        itemHeight: 8,
      },
      grid: { left: 60, right: 30, top: 40, bottom: 65 },
      xAxis: {
        type: 'category' as const,
        data: allLabels,
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false },
        axisLabel: { fontSize: 11, color: '#64748b', rotate: 30 },
        boundaryGap: false,
      },
      yAxis: {
        type: 'value' as const,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { fontSize: 11, color: '#94a3b8', formatter: '{value} DT' },
      },
      dataZoom: [
        { type: 'inside' as const, start: 0, end: 100 },
        {
          type: 'slider' as const,
          start: 0,
          end: 100,
          height: 24,
          bottom: 8,
          borderColor: 'transparent',
          backgroundColor: '#f1f5f9',
          fillerColor: 'rgba(69,164,82,0.12)',
          handleStyle: { color: PRIMARY, borderColor: PRIMARY },
          textStyle: { fontSize: 10, color: '#94a3b8' },
        },
      ],
      series: [
        {
          name: 'Prix historique',
          type: 'line',
          data: histData,
          smooth: 0.4,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: { width: 3, color: PRIMARY },
          itemStyle: { color: PRIMARY, borderWidth: 2, borderColor: '#fff' },
          connectNulls: true,
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowColor: 'rgba(69,164,82,0.4)', borderWidth: 3 },
          },
          markLine: forecastStartIdx >= 0 ? {
            silent: true,
            symbol: 'none',
            lineStyle: { color: AMBER, type: 'dashed' as const, width: 1.5 },
            label: {
              show: true,
              position: 'insideEndTop' as const,
              formatter: 'Début prévision →',
              fontSize: 10,
              color: AMBER,
            },
            data: [{ xAxis: forecastStartIdx }],
          } : undefined,
          markPoint: peakIdx >= 0 ? {
            data: [{
              type: 'max' as const,
              name: 'Prix max',
              symbolSize: 50,
              label: {
                formatter: (p: { value: number }) => p.value.toFixed(1) + ' DT',
                fontSize: 10,
                color: '#fff',
                fontWeight: 600,
              },
              itemStyle: { color: DARK_OLIVE },
            }],
          } : undefined,
          animationDuration: 1600,
        },
        {
          name: 'Prévision',
          type: 'line',
          data: [...Array(predictions.history.length - 1).fill(null), histData[histData.length - 1], ...forecastData],
          smooth: 0.4,
          symbol: 'diamond',
          symbolSize: 8,
          lineStyle: { width: 2.5, color: PRIMARY, type: 'dashed' as const },
          itemStyle: { color: PRIMARY, borderWidth: 2, borderColor: '#fff' },
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowColor: 'rgba(69,164,82,0.4)' },
          },
          animationDuration: 1600,
        },
        {
          name: 'Borne inférieure',
          type: 'line',
          data: lowerData,
          smooth: 0.3,
          symbol: 'none',
          lineStyle: { width: 0, color: 'transparent' },
          areaStyle: { color: 'transparent' },
          silent: true,
        },
        {
          name: 'Borne supérieure',
          type: 'line',
          data: upperData,
          smooth: 0.3,
          symbol: 'none',
          lineStyle: { width: 0, color: 'transparent' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(69,164,82,0.0)' },
                { offset: 0.5, color: 'rgba(134,239,172,0.15)' },
                { offset: 1, color: 'rgba(69,164,82,0.0)' },
              ],
            },
          },
          silent: true,
          z: 0,
        },
        {
          // Confidence band - lower line
          name: '_lower_band',
          type: 'line',
          data: lowerData,
          smooth: 0.3,
          symbol: 'none',
          lineStyle: { width: 1, color: LIGHT_OLIVE, type: 'dotted' as const },
          areaStyle: {
            color: 'rgba(134,239,172,0.15)',
          },
          silent: true,
          z: 1,
        },
      ],
    }
  })()

  // ── Tab 2: Comparison Radar Chart ─────────────────────────────────────────
  const comparisonRadarOption = (() => {
    if (!comparison || comparison.items.length === 0) return {}

    const names = comparison.items.map((i) => i.name)
    const maxPrice = Math.max(...comparison.items.map((i) => i.avgPrice), 1)

    return {
      tooltip: {
        ...TOOLTIP_STYLE,
        trigger: 'item',
        formatter: (params: { name: string; value: number }[]) => {
          if (!Array.isArray(params)) return ''
          let html = ''
          params.forEach((p: { name: string; value: number }) => {
            html += `${p.name} : <b style="color:${PRIMARY}">${p.value.toFixed(2)} DT/kg</b><br/>`
          })
          return html
        },
      },
      radar: {
        indicator: names.map((n) => ({
          name: n.length > 10 ? n.slice(0, 9) + '…' : n,
          max: maxPrice * 1.15,
        })),
        shape: 'polygon' as const,
        radius: '65%',
        axisName: { fontSize: 10, color: '#475569' },
        splitArea: {
          areaStyle: { color: ['rgba(69,164,82,0.02)', 'rgba(69,164,82,0.04)', 'rgba(69,164,82,0.06)', 'rgba(69,164,82,0.08)'] },
        },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: comparison.items.map((i) => i.avgPrice),
              name: 'Prix moyen',
              areaStyle: { color: 'rgba(69,164,82,0.2)' },
              lineStyle: { width: 2, color: PRIMARY },
              itemStyle: { color: PRIMARY },
              symbol: 'circle',
              symbolSize: 6,
            },
          ],
          animationDuration: 1200,
        },
      ],
    }
  })()

  // ── Tab 3: Seasonality Bar Chart ──────────────────────────────────────────
  const seasonalityOption = (() => {
    if (!seasonality) return {}

    const monthNames = seasonality.months.map((m) => m.monthName.slice(0, 4))
    const peakIdx = seasonality.peakMonth - 1
    const lowIdx = seasonality.lowMonth - 1

    return {
      tooltip: {
        ...TOOLTIP_STYLE,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: { name: string; value: number; dataIndex: number }[]) => {
          const idx = params[0]?.dataIndex
          const m = seasonality.months[idx]
          if (!m) return ''
          return `<strong>${m.monthName}</strong><br/>`
            + `Prix moyen : <b style="color:${PRIMARY}">${m.avgPrice.toFixed(2)} DT/kg</b><br/>`
            + `Nombre d'offres : <b>${m.bidCount}</b>`
        },
      },
      grid: { left: 60, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category' as const,
        data: monthNames,
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false },
        axisLabel: { fontSize: 11, color: '#64748b' },
      },
      yAxis: {
        type: 'value' as const,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { fontSize: 11, color: '#94a3b8', formatter: '{value} DT' },
      },
      series: [
        {
          type: 'bar',
          data: seasonality.months.map((m, idx) => ({
            value: m.avgPrice,
            itemStyle: {
              color: idx === peakIdx
                ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#6dba6d' }, { offset: 1, color: DARK_OLIVE }] }
                : idx === lowIdx
                  ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#fbbf24' }, { offset: 1, color: '#b45309' }] }
                  : { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#86EFAC' }, { offset: 1, color: PRIMARY }] },
              borderRadius: [6, 6, 0, 0],
            },
          })),
          barWidth: '55%',
          label: {
            show: true,
            position: 'top' as const,
            fontSize: 10,
            color: '#475569',
            formatter: (params: { value: number }) => params.value > 0 ? params.value.toFixed(1) : '',
          },
          animationDuration: 1200,
          animationEasing: 'cubicOut',
        },
      ],
    }
  })()

  // ── Tab 4: Heatmap Chart ──────────────────────────────────────────────────
  const heatmapOption = (() => {
    if (!heatmap || heatmap.data.length === 0) return {}

    const oliveTypes = heatmap.oliveTypes
    const regions = heatmap.regions

    // Convert data to [regionIdx, oliveTypeIdx, price]
    const chartData: [number, number, number, number][] = []
    heatmap.data.forEach((d) => {
      const ri = regions.indexOf(d.region)
      const oi = oliveTypes.indexOf(d.oliveType)
      if (ri >= 0 && oi >= 0) {
        chartData.push([ri, oi, d.avgPrice, d.bidCount])
      }
    })

    // Collect all prices for min/max visualMap
    const prices = heatmap.data.map((d) => d.avgPrice)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)

    return {
      tooltip: {
        ...TOOLTIP_STYLE,
        formatter: (params: { data: number[] }) => {
          const d = params.data
          if (!d) return ''
          const region = regions[d[0]] || ''
          const oliveType = oliveTypes[d[1]] || ''
          const price = d[2]
          const bids = d[3]
          return `<strong>${oliveType}</strong> — ${region}<br/>`
            + `Prix moyen : <b style="color:${PRIMARY}">${price.toFixed(2)} DT/kg</b><br/>`
            + `Nombre d'offres : <b>${bids}</b>`
        },
      },
      grid: { left: 120, right: 60, top: 10, bottom: 80 },
      xAxis: {
        type: 'category' as const,
        data: regions.map((r) => r.length > 12 ? r.slice(0, 11) + '…' : r),
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false },
        axisLabel: { fontSize: 10, color: '#64748b', rotate: 35 },
        splitArea: { show: false },
      },
      yAxis: {
        type: 'category' as const,
        data: oliveTypes,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontSize: 11, color: '#475569' },
      },
      visualMap: {
        min: minPrice,
        max: maxPrice,
        calculable: true,
        orient: 'horizontal' as const,
        left: 'center',
        bottom: 0,
        itemWidth: 14,
        itemHeight: 120,
        text: ['Élevé', 'Bas'],
        textStyle: { fontSize: 11, color: '#64748b' },
        inRange: {
          color: ['#f0fdf4', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', PRIMARY, DARK_OLIVE],
        },
      },
      series: [
        {
          type: 'heatmap',
          data: chartData,
          label: {
            show: true,
            fontSize: 10,
            fontWeight: 600,
            color: '#334155',
            formatter: (params: { data: number[] }) => {
              const val = params.data?.[2]
              return val !== undefined ? val.toFixed(1) : ''
            },
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0,0,0,0.2)',
            },
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 3,
            borderRadius: 4,
          },
          animationDuration: 1000,
        },
      ],
    }
  })()

  // ══════════════════════════════════════════════════════════════════════════
  // ── RENDER ────────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  const trendIcon = kpiTrend === 'up' ? TrendingUp : kpiTrend === 'down' ? TrendingDown : Minus
  const trendColor = kpiTrend === 'up' ? 'text-emerald-600' : kpiTrend === 'down' ? 'text-red-600' : 'text-amber-600'
  const trendBg = kpiTrend === 'up' ? 'bg-emerald-50' : kpiTrend === 'down' ? 'bg-red-50' : 'bg-amber-50'
  const trendLabel = kpiTrend === 'up' ? '↑ Hausse' : kpiTrend === 'down' ? '↓ Baisse' : '→ Stable'

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* ── 1. Header Banner ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#45A452] to-[#2d8a3a] p-4 text-white md:p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
          <Brain className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold md:text-xl">Intelligence de Marché</h2>
          <p className="text-sm text-white/80 truncate">
            Analyse prédictive, comparaisons régionales et suivi saisonnier des prix
          </p>
        </div>
      </div>

      {/* ── 2. KPI Stats Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {loadingKpi ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <StatsCard
              title="Prix moyen actuel"
              value={currentAvgPrice.toFixed(2) + ' DT/kg'}
              subtitle="Offres gagnantes"
              icon={DollarSign}
              iconColor="text-[#45A452]"
              iconBg="bg-[#45A452]/10"
            />
            <StatsCard
              title="Tendance"
              value={trendLabel}
              subtitle={`Pente : ${predictions?.slope ?? 0}`}
              icon={trendIcon}
              iconColor={trendColor}
              iconBg={trendBg}
            />
            <StatsCard
              title="Volatilité"
              value={kpiVolatility.toFixed(2) + ' DT'}
              subtitle="Écart max-min"
              icon={Activity}
              iconColor="text-amber-600"
              iconBg="bg-amber-50"
            />
            <StatsCard
              title="Meilleure région"
              value={bestRegion}
              subtitle="Prix le plus élevé"
              icon={MapPin}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
            />
          </>
        )}
      </div>

      {/* ── 3. Filters Row ────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" /> Filtres :
            </div>
            <Select value={oliveTypeFilter} onValueChange={setOliveTypeFilter}>
              <SelectTrigger className="h-10 w-full md:w-[200px]">
                <Leaf className="mr-2 h-4 w-4 text-[#45A452]" />
                <SelectValue placeholder="Type d'olive" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {oliveTypes.map((ot) => (
                  <SelectItem key={ot.id} value={ot.id}>{ot.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="h-10 w-full md:w-[200px]">
                <MapPin className="mr-2 h-4 w-4 text-blue-500" />
                <SelectValue placeholder="Région" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les régions</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-10 shrink-0" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Rafraîchir
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── 4. Main Tabs ──────────────────────────────────────────────────── */}
      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="predictions" className="text-xs sm:text-sm gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 hidden sm:block" />
            Prédictions
          </TabsTrigger>
          <TabsTrigger value="comparison" className="text-xs sm:text-sm gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 hidden sm:block" />
            Comparaison
          </TabsTrigger>
          <TabsTrigger value="seasonality" className="text-xs sm:text-sm gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 hidden sm:block" />
            Saisonnalité
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="text-xs sm:text-sm gap-1.5">
            <Grid3X3 className="h-3.5 w-3.5 hidden sm:block" />
            Matrice
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Prédictions ─────────────────────────────────────────── */}
        <TabsContent value="predictions">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#45A452]" />
                Prédictions de prix
              </CardTitle>
              <CardDescription>
                Historique des 12 derniers mois + prévision linéaire sur 3 mois avec intervalle de confiance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPredictions ? (
                <div className="h-72 flex items-center justify-center">
                  <Skeleton className="h-full w-full rounded-xl" />
                </div>
              ) : predictions && predictions.history.some((h) => h.avgPrice !== null) ? (
                <div className="h-72">
                  <ReactECharts
                    option={predictionOption}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'svg' }}
                  />
                </div>
              ) : (
                <div className="flex h-72 items-center justify-center text-muted-foreground text-sm">
                  Aucune donnée de prix disponible pour cette sélection
                </div>
              )}

              {/* Prediction summary cards */}
              {predictions && (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Tendance</p>
                    <div className="flex items-center justify-center gap-1.5">
                      {kpiTrend === 'up' && <ArrowUpRight className="h-4 w-4 text-emerald-600" />}
                      {kpiTrend === 'down' && <ArrowDownRight className="h-4 w-4 text-red-600" />}
                      {kpiTrend === 'stable' && <Minus className="h-4 w-4 text-amber-600" />}
                      <span className={`text-lg font-bold ${kpiTrend === 'up' ? 'text-emerald-600' : kpiTrend === 'down' ? 'text-red-600' : 'text-amber-600'}`}>
                        {kpiTrend === 'up' ? 'Hausse' : kpiTrend === 'down' ? 'Baisse' : 'Stable'}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Pente (DT/mois)</p>
                    <p className="text-lg font-bold text-foreground">
                      {predictions.slope >= 0 ? '+' : ''}{predictions.slope.toFixed(4)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Prévision prochain mois</p>
                    <p className="text-lg font-bold text-[#45A452]">
                      {predictions.forecast[0]?.avgPrice.toFixed(2) ?? '—'} DT
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Comparaison ─────────────────────────────────────────── */}
        <TabsContent value="comparison">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#45A452]" />
                Comparaison multi-dimension
              </CardTitle>
              <CardDescription>
                {comparison
                  ? comparison.dimension === 'regions'
                    ? 'Comparaison des prix moyens par région'
                    : 'Comparaison des prix moyens par type d\'olive'
                  : 'Chargement...'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Radar chart */}
                {loadingComparison ? (
                  <Skeleton className="h-72 rounded-xl" />
                ) : comparison && comparison.items.length > 0 ? (
                  <div className="h-72">
                    <ReactECharts
                      option={comparisonRadarOption}
                      style={{ height: '100%', width: '100%' }}
                      opts={{ renderer: 'svg' }}
                    />
                  </div>
                ) : (
                  <div className="flex h-72 items-center justify-center text-muted-foreground text-sm">
                    Aucune donnée de comparaison
                  </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  {loadingComparison ? (
                    <Skeleton className="h-64 rounded-xl" />
                  ) : sortedItems.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr className="border-b text-left text-xs text-muted-foreground">
                          <th className="pb-2 pr-3 font-medium cursor-pointer select-none" onClick={() => handleSort('avgPrice')}>
                            <span className="flex items-center gap-1"># {sortField === 'avgPrice' && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</span>
                          </th>
                          <th className="pb-2 pr-3 font-medium cursor-pointer select-none" onClick={() => handleSort('name')}>
                            Nom {sortField === 'name' && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                          </th>
                          <th className="pb-2 pr-3 font-medium cursor-pointer select-none text-right" onClick={() => handleSort('avgPrice')}>
                            Moyen {sortField === 'avgPrice' && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                          </th>
                          <th className="pb-2 pr-3 font-medium text-right hidden sm:table-cell">Min</th>
                          <th className="pb-2 pr-3 font-medium text-right hidden sm:table-cell">Max</th>
                          <th className="pb-2 font-medium text-right">Offres</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {sortedItems.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-2.5 pr-3">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                                style={{
                                  backgroundColor: idx === 0 ? '#45A452' : idx === 1 ? '#6366f1' : idx === 2 ? '#f59e0b' : '#f1f5f9',
                                  color: idx < 3 ? '#fff' : '#64748b',
                                }}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="py-2.5 pr-3 font-medium text-foreground">{item.name}</td>
                            <td className="py-2.5 pr-3 text-right font-semibold text-[#45A452]">{item.avgPrice.toFixed(2)} DT</td>
                            <td className="py-2.5 pr-3 text-right text-muted-foreground hidden sm:table-cell">{item.minPrice.toFixed(2)}</td>
                            <td className="py-2.5 pr-3 text-right text-muted-foreground hidden sm:table-cell">{item.maxPrice.toFixed(2)}</td>
                            <td className="py-2.5 text-right text-muted-foreground">{item.bidCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
                      Aucune donnée
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Saisonnalité ────────────────────────────────────────── */}
        <TabsContent value="seasonality">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#45A452]" />
                Analyse saisonnière
              </CardTitle>
              <CardDescription>
                Prix moyen par mois (toutes années confondues) — vert = pic, orange = creux
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSeasonality ? (
                <Skeleton className="h-72 rounded-xl" />
              ) : seasonality && seasonality.months.some((m) => m.bidCount > 0) ? (
                <div className="h-72">
                  <ReactECharts
                    option={seasonalityOption}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'svg' }}
                  />
                </div>
              ) : (
                <div className="flex h-72 items-center justify-center text-muted-foreground text-sm">
                  Aucune donnée saisonnière
                </div>
              )}

              {/* Seasonality summary cards */}
              {seasonality && seasonality.peakMonth > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      <p className="text-xs font-medium text-emerald-700">Mois le plus cher</p>
                    </div>
                    <p className="text-xl font-bold text-emerald-700">
                      {FRENCH_MONTHS_SHORT[seasonality.peakMonth - 1]}
                    </p>
                    <p className="text-sm text-emerald-600">
                      {seasonality.peakPrice.toFixed(2)} DT/kg en moyenne
                    </p>
                  </div>
                  <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="h-4 w-4 text-amber-600" />
                      <p className="text-xs font-medium text-amber-700">Mois le moins cher</p>
                    </div>
                    <p className="text-xl font-bold text-amber-700">
                      {FRENCH_MONTHS_SHORT[seasonality.lowMonth - 1]}
                    </p>
                    <p className="text-sm text-amber-600">
                      {seasonality.lowPrice.toFixed(2)} DT/kg en moyenne
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 4: Matrice Prix (Heatmap) ──────────────────────────────── */}
        <TabsContent value="heatmap">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Grid3X3 className="h-4 w-4 text-[#45A452]" />
                Matrice des prix
              </CardTitle>
              <CardDescription>
                Carte thermique des prix moyens croisant types d&apos;olives et régions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHeatmap ? (
                <Skeleton className="h-80 rounded-xl" />
              ) : heatmap && heatmap.data.length > 0 ? (
                <div className="h-80">
                  <ReactECharts
                    option={heatmapOption}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'svg' }}
                  />
                </div>
              ) : (
                <div className="flex h-80 items-center justify-center text-muted-foreground text-sm">
                  Aucune donnée disponible pour la matrice
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── 5. Alertes de Prix ────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#45A452]" />
            Alertes de prix
          </CardTitle>
          <CardDescription>
            Créez des alertes pour être notifié lorsque les prix atteignent un seuil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing alerts list */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {loadingAlerts ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : alerts.length > 0 ? (
              alerts.map((alert) => (
                <div key={alert.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                    <BellRing className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">
                        {alert.oliveType?.name || 'Tous types'}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground truncate">
                        {alert.region?.name || 'Toutes régions'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="secondary"
                        className="text-[10px]"
                        style={{
                          backgroundColor: alert.condition === 'ABOVE' ? '#45A45215' : '#ef444415',
                          color: alert.condition === 'ABOVE' ? '#45A452' : '#ef4444',
                        }}
                      >
                        {alert.condition === 'ABOVE' ? '↑ Au-dessus' : '↓ En-dessous'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Seuil : <b>{alert.threshold.toFixed(2)} DT/kg</b>
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-[10px] shrink-0"
                    style={{
                      backgroundColor: alert.triggeredAt ? '#f59e0b15' : alert.isActive ? '#45A45215' : '#94a3b815',
                      color: alert.triggeredAt ? '#f59e0b' : alert.isActive ? '#45A452' : '#94a3b8',
                    }}
                  >
                    {alert.triggeredAt ? 'Déclenchée' : alert.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">Aucune alerte configurée</p>
                <p className="text-xs mt-1">Créez votre première alerte ci-dessous</p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* New alert form */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-[#45A452]" />
              Nouvelle alerte
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 w-full sm:w-auto">
                <label className="text-xs text-muted-foreground mb-1 block">Type d&apos;olive (optionnel)</label>
                <Select value={alertOliveType} onValueChange={setAlertOliveType}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {oliveTypes.map((ot) => (
                      <SelectItem key={ot.id} value={ot.id}>{ot.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 w-full sm:w-auto">
                <label className="text-xs text-muted-foreground mb-1 block">Région (optionnelle)</label>
                <Select value={alertRegion} onValueChange={setAlertRegion}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Toutes les régions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les régions</SelectItem>
                    {regions.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 w-full sm:w-auto">
                <label className="text-xs text-muted-foreground mb-1 block">Condition</label>
                <Select value={alertCondition} onValueChange={(v) => setAlertCondition(v as '' | 'ABOVE' | 'BELOW')}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ABOVE">Au-dessus</SelectItem>
                    <SelectItem value="BELOW">En-dessous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-[140px]">
                <label className="text-xs text-muted-foreground mb-1 block">Seuil (DT/kg)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="h-10"
                  min="0"
                  step="0.01"
                />
              </div>
              <Button
                onClick={handleCreateAlert}
                disabled={creatingAlert || !alertCondition || !alertThreshold}
                className="h-10 shrink-0 bg-[#45A452] hover:bg-[#3d9349] text-white"
              >
                {creatingAlert ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Créer l&apos;alerte
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
