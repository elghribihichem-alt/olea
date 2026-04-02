'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Leaf,
  MapPin,
  Package,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import ReactECharts from 'echarts-for-react'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface PriceData {
  global: { avgPrice: number; minPrice: number; maxPrice: number; totalBids: number }
  monthlyTrend: { month: string; avgPrice: number; minPrice: number; maxPrice: number; bidCount: number }[]
  priceByOliveType: { oliveTypeId: string; name: string; avgPrice: number; minPrice: number; maxPrice: number; bidCount: number }[]
  priceByRegion: { regionId: string; name: string; avgPrice: number; minPrice: number; maxPrice: number; bidCount: number }[]
  priceByQuantity: { label: string; min: number; max: number; avgPrice: number; bidCount: number }[]
  topDeals: {
    pricePerKg: number; totalPrice: number; createdAt: string
    buyer: { id: string; name: string | null; phone: string } | null
    auction: { id: string; title: string; quantity: number; oliveType: { name: string } | null; region: { name: string } | null } | null
  }[]
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const OLIVE_COLORS = ['#45A452', '#2d8a3a', '#6dba6d', '#1f6e2b', '#a8d7a8', '#142c16', '#7dda7d', '#1a5724']
const REGION_COLORS = ['#45A452', '#6366f1', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#84cc16', '#a855f7', '#0ea5e9']

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.96)',
  borderColor: '#e2e8f0',
  borderWidth: 1,
  textStyle: { color: '#334155', fontSize: 12 },
  extraCssText: 'border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);',
}

function formatNumber(n: number): string {
  return n.toLocaleString('fr-FR')
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function PricesSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PricesPage() {
  const [data, setData] = useState<PriceData | null>(null)
  const [loading, setLoading] = useState(true)

  const [oliveTypeFilter, setOliveTypeFilter] = useState('ALL')
  const [regionFilter, setRegionFilter] = useState('ALL')

  const [oliveTypes, setOliveTypes] = useState<{ id: string; name: string }[]>([])
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([])

  const fetchPrices = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        oliveTypeId: oliveTypeFilter,
        regionId: regionFilter,
      })
      const res = await fetch(`/api/prices?${params}`)
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      toast.error('Erreur lors du chargement des prix')
    } finally {
      setLoading(false)
    }
  }, [oliveTypeFilter, regionFilter])

  useEffect(() => {
    Promise.all([
      fetch('/api/olive-types').then((r) => r.json()),
      fetch('/api/regions').then((r) => r.json()),
    ]).then(([ot, rg]) => {
      setOliveTypes(ot)
      setRegions(rg)
    })
  }, [])

  useEffect(() => {
    fetchPrices()
  }, [fetchPrices])

  if (loading && !data) return <PricesSkeleton />
  if (!data) return <div className="flex items-center justify-center p-8 text-muted-foreground">Erreur</div>

  // ── ECharts Options ────────────────────────────────────────────────────────

  // 1. Monthly Trend — min/max band + avg gradient area + DataZoom
  const trendMonths = data.monthlyTrend.map((t) => {
    const d = new Date(t.month + '-01')
    return {
      label: d.toLocaleDateString('fr-FR', { month: 'short' }),
      full: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      min: t.minPrice,
      avg: t.avgPrice,
      max: t.maxPrice,
      bids: t.bidCount,
    }
  })

  const trendOption = {
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'axis',
      formatter: (params: { name: string; seriesName: string; value: number; marker: string; dataIndex: number }[]) => {
        const d = trendMonths[params[0]?.dataIndex]
        if (!d) return ''
        return `<strong>${d.full}</strong><br/>`
          + params.map((p) => `${p.marker} ${p.seriesName} : <b>${p.value.toFixed(2)} DT/kg</b>`).join('<br/>')
      },
    },
    legend: {
      data: ['Max', 'Moyen', 'Min'],
      top: 0,
      right: 0,
      textStyle: { fontSize: 11, color: '#64748b' },
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 8,
    },
    grid: { left: 60, right: 30, top: 35, bottom: 60 },
    xAxis: {
      type: 'category',
      data: trendMonths.map((t) => t.label),
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { fontSize: 11, color: '#64748b' },
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { fontSize: 11, color: '#94a3b8', formatter: '{value} DT' },
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      {
        type: 'slider', start: 0, end: 100, height: 24, bottom: 8,
        borderColor: 'transparent', backgroundColor: '#f1f5f9',
        fillerColor: 'rgba(69,164,82,0.12)',
        handleStyle: { color: '#45A452', borderColor: '#45A452' },
        textStyle: { fontSize: 10, color: '#94a3b8' },
      },
    ],
    series: [
      {
        name: 'Max',
        type: 'line',
        data: trendMonths.map((t) => t.max),
        smooth: 0.3,
        symbol: 'none',
        lineStyle: { width: 1.5, color: '#ef4444', type: 'dashed' },
        areaStyle: { color: 'transparent' },
      },
      {
        name: 'Moyen',
        type: 'line',
        data: trendMonths.map((t) => t.avg),
        smooth: 0.4,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { width: 3, color: '#45A452' },
        itemStyle: { color: '#45A452', borderWidth: 2, borderColor: '#fff' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(69,164,82,0.25)' },
              { offset: 0.6, color: 'rgba(69,164,82,0.06)' },
              { offset: 1, color: 'rgba(69,164,82,0.01)' },
            ],
          },
        },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(69,164,82,0.4)', borderWidth: 3 },
        },
        animationDuration: 1600,
      },
      {
        name: 'Min',
        type: 'line',
        data: trendMonths.map((t) => t.min),
        smooth: 0.3,
        symbol: 'none',
        lineStyle: { width: 1.5, color: '#6366f1', type: 'dashed' },
        areaStyle: { color: 'transparent' },
      },
    ],
  }

  // 2. Price by Olive Type — Gradient Horizontal Bar
  const oliveSorted = [...data.priceByOliveType].sort((a, b) => b.avgPrice - a.avgPrice)
  const oliveBarOption = {
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: { name: string; value: number; dataIndex: number }[]) => {
        const item = oliveSorted[params[0].dataIndex]
        return `<strong>${params[0].name}</strong><br/>`
          + `Moyen : <b style="color:#45A452">${item.avgPrice.toFixed(2)} DT/kg</b><br/>`
          + `Min : ${item.minPrice.toFixed(2)} DT — Max : ${item.maxPrice.toFixed(2)} DT<br/>`
          + `Offres : ${item.bidCount}`
      },
    },
    grid: { left: 90, right: 30, top: 10, bottom: 20 },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { fontSize: 11, color: '#94a3b8', formatter: '{value} DT' },
    },
    yAxis: {
      type: 'category',
      data: oliveSorted.map((o) => o.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 11, color: '#475569' },
    },
    series: [
      {
        type: 'bar',
        data: oliveSorted.map((_, i) => ({
          value: oliveSorted[i].avgPrice,
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#6dba6d' },
                { offset: 1, color: '#1f6e2b' },
              ],
            },
            borderRadius: [0, 6, 6, 0],
          },
        })),
        barWidth: '55%',
        label: {
          show: true,
          position: 'right',
          fontSize: 11,
          fontWeight: 600,
          color: '#334155',
          formatter: (params: { value: number }) => params.value.toFixed(1),
        },
        animationDuration: 1200,
        animationEasing: 'cubicOut',
      },
    ],
  }

  // 3. Price by Region — Gradient Bar with DataZoom
  const regionSorted = [...data.priceByRegion.slice(0, 12)].sort((a, b) => b.avgPrice - a.avgPrice)
  const regionBarOption = {
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: { name: string; value: number; dataIndex: number }[]) => {
        const item = regionSorted[params[0].dataIndex]
        return `<strong>${params[0].name}</strong><br/>`
          + `Moyen : <b style="color:#6366f1">${item.avgPrice.toFixed(2)} DT/kg</b><br/>`
          + `Min : ${item.minPrice.toFixed(2)} DT — Max : ${item.maxPrice.toFixed(2)} DT<br/>`
          + `Offres : ${item.bidCount}`
      },
    },
    grid: { left: 90, right: 30, top: 10, bottom: 60 },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { fontSize: 11, color: '#94a3b8', formatter: '{value} DT' },
    },
    yAxis: {
      type: 'category',
      data: regionSorted.map((r) => r.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 10, color: '#475569' },
    },
    dataZoom: [
      {
        type: 'slider',
        start: 0,
        end: regionSorted.length > 8 ? (8 / regionSorted.length) * 100 : 100,
        height: 18,
        bottom: 4,
        yAxisIndex: 0,
        borderColor: 'transparent',
        backgroundColor: '#f1f5f9',
        fillerColor: 'rgba(99,102,241,0.12)',
        handleStyle: { color: '#6366f1', borderColor: '#6366f1' },
        textStyle: { fontSize: 9, color: '#94a3b8' },
      },
    ],
    series: [
      {
        type: 'bar',
        data: regionSorted.map((_, i) => ({
          value: regionSorted[i].avgPrice,
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#818cf8' },
                { offset: 1, color: '#4f46e5' },
              ],
            },
            borderRadius: [0, 6, 6, 0],
          },
        })),
        barWidth: '55%',
        label: {
          show: true,
          position: 'right',
          fontSize: 11,
          fontWeight: 600,
          color: '#334155',
          formatter: (params: { value: number }) => params.value.toFixed(1),
        },
        animationDuration: 1200,
        animationEasing: 'cubicOut',
      },
    ],
  }

  // 4. Price by Quantity — Bar + Scatter (price vs bid count)
  const qtyOption = {
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params: { seriesType: string; seriesName: string; name: string; value: number; dataIndex: number }[]) => {
        const item = data.priceByQuantity[params[0]?.dataIndex]
        if (!item) return ''
        let html = `<strong>${item.label}</strong><br/>`
        html += `Min : ${item.min} kg — Max : ${item.max} kg<br/>`
        params.forEach((p) => {
          if (p.seriesType === 'bar') {
            html += `${p.marker} Prix moyen : <b style="color:#f59e0b">${p.value.toFixed(2)} DT/kg</b><br/>`
          } else {
            html += `${p.marker} Offres : <b>${p.value}</b>`
          }
        })
        return html
      },
    },
    legend: {
      data: ['Prix moyen', 'Offres'],
      top: 0,
      right: 0,
      textStyle: { fontSize: 11, color: '#64748b' },
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 8,
    },
    grid: { left: 60, right: 60, top: 35, bottom: 20 },
    xAxis: {
      type: 'category',
      data: data.priceByQuantity.map((q) => q.label),
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { fontSize: 10, color: '#64748b' },
    },
    yAxis: [
      {
        type: 'value',
        name: 'DT/kg',
        nameTextStyle: { fontSize: 10, color: '#94a3b8' },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { fontSize: 11, color: '#94a3b8' },
      },
      {
        type: 'value',
        name: 'Offres',
        nameTextStyle: { fontSize: 10, color: '#94a3b8' },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { fontSize: 11, color: '#94a3b8' },
      },
    ],
    series: [
      {
        name: 'Prix moyen',
        type: 'bar',
        yAxisIndex: 0,
        data: data.priceByQuantity.map((q) => q.avgPrice),
        barWidth: '45%',
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#fbbf24' },
              { offset: 1, color: '#d97706' },
            ],
          },
          borderRadius: [6, 6, 0, 0],
        },
        animationDuration: 1200,
      },
      {
        name: 'Offres',
        type: 'line',
        yAxisIndex: 1,
        data: data.priceByQuantity.map((q) => q.bidCount),
        smooth: 0.3,
        symbol: 'circle',
        symbolSize: 10,
        lineStyle: { width: 2.5, color: '#6366f1' },
        itemStyle: {
          color: '#6366f1',
          borderWidth: 2,
          borderColor: '#fff',
        },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(99,102,241,0.4)' },
        },
        animationDuration: 1400,
      },
    ],
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Global Price Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard
          title="Prix moyen"
          value={data.global.avgPrice + ' DT/kg'}
          subtitle={`${data.global.totalBids} offres gagnantes`}
          icon={DollarSign}
          iconColor="text-[#45A452]"
          iconBg="bg-[#45A452]/10"
        />
        <StatsCard
          title="Prix le plus bas"
          value={data.global.minPrice + ' DT/kg'}
          icon={TrendingDown}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatsCard
          title="Prix le plus haut"
          value={data.global.maxPrice + ' DT/kg'}
          icon={TrendingUp}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
        <StatsCard
          title="Écart de prix"
          value={(data.global.maxPrice - data.global.minPrice).toFixed(2) + ' DT'}
          subtitle={`${((1 - data.global.minPrice / Math.max(data.global.maxPrice, 0.01)) * 100).toFixed(0)}% de variation`}
          icon={BarChart3}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" /> Filtres :
            </div>
            <Select value={oliveTypeFilter} onValueChange={setOliveTypeFilter}>
              <SelectTrigger className="h-10 w-full md:w-[180px]">
                <Leaf className="mr-2 h-4 w-4 text-[#45A452]" />
                <SelectValue placeholder="Type d'olive" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les types</SelectItem>
                {oliveTypes.map((ot) => (
                  <SelectItem key={ot.id} value={ot.id}>{ot.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="h-10 w-full md:w-[180px]">
                <MapPin className="mr-2 h-4 w-4 text-blue-500" />
                <SelectValue placeholder="Région" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes les régions</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={fetchPrices}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend — min/max/avg with DataZoom */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#45A452]" />
            Évolution des prix (DT/kg)
          </CardTitle>
          <CardDescription>Tendance mensuelle — min, moyen, max — zoomez pour explorer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            {data.monthlyTrend.length > 0 ? (
              <ReactECharts
                option={trendOption}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Price by Olive Type + Region */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* By Olive Type — Gradient Bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Leaf className="h-4 w-4 text-[#45A452]" />
              Prix par variété
            </CardTitle>
            <CardDescription>Prix moyen par type d&apos;olive</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ReactECharts
                option={oliveBarOption}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </div>
          </CardContent>
        </Card>

        {/* By Region — Gradient Bar with DataZoom */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              Prix par région
            </CardTitle>
            <CardDescription>Prix moyen par gouvernorat — défilez pour voir tout</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ReactECharts
                option={regionBarOption}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price by Quantity — Bar + Line composed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-amber-600" />
            Prix par tranche de quantité
          </CardTitle>
          <CardDescription>Impact de la quantité sur le prix au kilo et le nombre d&apos;offres</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ReactECharts
              option={qtyOption}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Top Deals */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-[#45A452]" />
            Meilleures offres
          </CardTitle>
          <CardDescription>Les 10 transactions aux prix les plus élevés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">#</th>
                  <th className="pb-2 pr-4 font-medium">Enchère</th>
                  <th className="pb-2 pr-4 font-medium hidden sm:table-cell">Acheteur</th>
                  <th className="pb-2 pr-4 font-medium">Prix/kg</th>
                  <th className="pb-2 pr-4 font-medium hidden md:table-cell">Total</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.topDeals.map((deal, idx) => (
                  <tr key={idx} className="hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 pr-4">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="font-medium text-sm max-w-[180px] truncate">{deal.auction?.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {deal.auction?.oliveType?.name} — {deal.auction?.region?.name} — {formatNumber(Math.round(deal.auction?.quantity ?? 0))} kg
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 hidden sm:table-cell text-muted-foreground text-xs">
                      {deal.buyer?.name || deal.buyer?.phone}
                    </td>
                    <td className="py-2.5 pr-4 font-semibold text-[#45A452]">{deal.pricePerKg.toFixed(2)} DT</td>
                    <td className="py-2.5 pr-4 hidden md:table-cell text-muted-foreground">
                      {formatNumber(Math.round(deal.totalPrice))} DT
                    </td>
                    <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">{formatDate(deal.createdAt)}</td>
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
