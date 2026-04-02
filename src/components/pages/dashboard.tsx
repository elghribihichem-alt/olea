'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Users,
  Gavel,
  DollarSign,
  TrendingUp,
  Scale,
  AlertTriangle,
  Package,
  ShoppingCart,
  BarChart3,
  ArrowUpRight,
  Clock,
  Leaf,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsCard } from '@/components/stats-card'
import ReactECharts from 'echarts-for-react'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalAuctions: number
  activeAuctions: number
  closedAuctions: number
  totalBids: number
  totalTransactions: number
  completedTransactions: number
  avgPricePerKg: string
  totalVolume: number
  totalRevenue: number
  pendingReports: number
  sellersCount: number
  buyersCount: number
}

interface ChartData {
  monthlyAuctions: { status: string; count: number }[]
  auctionsByRegion: { regionId: string; name: string; count: number }[]
  auctionsByOliveType: { oliveTypeId: string; name: string; count: number }[]
  priceEvolution: { month: string; avgPrice: number }[]
  volumeByRegion: { regionId: string; name: string; volume: number }[]
}

interface RecentActivity {
  recentAuctions: {
    id: string
    title: string
    status: string
    quantity: number
    reservePrice: number | null
    endDate: string
    createdAt: string
    seller: { id: string; name: string | null; phone: string } | null
    oliveType: { id: string; name: string } | null
    region: { id: string; name: string } | null
    bidCount: number
  }[]
  recentUsers: {
    id: string
    name: string | null
    phone: string
    role: string
    status: string
    createdAt: string
    enterprise: string | null
  }[]
  recentBids: {
    id: string
    pricePerKg: number
    totalPrice: number
    status: string
    createdAt: string
    buyer: { id: string; name: string | null; phone: string } | null
    auction: {
      id: string
      title: string
      status: string
      oliveType: { name: string } | null
    } | null
  }[]
}

// ─── Colors ────────────────────────────────────────────────────────────────────
const OLIVE_COLORS = [
  '#45A452',
  '#2d8a3a',
  '#6dba6d',
  '#1f6e2b',
  '#a8d7a8',
  '#142c16',
  '#7dda7d',
  '#1a5724',
]

const OLIVE_GRADIENT_START = '#6dba6d'
const OLIVE_GRADIENT_END = '#1f6e2b'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#45A452',
  CLOSED: '#6366f1',
  DRAFT: '#94a3b8',
  EXPIRED: '#f59e0b',
  CANCELLED: '#ef4444',
  PENDING: '#f59e0b',
  IN_REVIEW: '#6366f1',
  RESOLVED: '#45A452',
  WINNING: '#45A452',
  WON: '#2d8a3a',
  LOST: '#94a3b8',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  CLOSED: 'Clôturée',
  DRAFT: 'Brouillon',
  EXPIRED: 'Expirée',
  CANCELLED: 'Annulée',
  PENDING: 'En attente',
  IN_REVIEW: 'En cours',
  RESOLVED: 'Résolu',
  WINNING: 'En tête',
  WON: 'Gagnée',
  LOST: 'Perdue',
  SUSPENDED: 'Suspendu',
}

const ROLE_LABELS: Record<string, string> = {
  SELLER: 'Vendeur',
  BUYER: 'Acheteur',
  MIXED: 'Mixte',
  ADMIN: 'Admin',
}

// ─── Common ECharts tooltip style ──────────────────────────────────────────────
const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.96)',
  borderColor: '#e2e8f0',
  borderWidth: 1,
  textStyle: { color: '#334155', fontSize: 12 },
  extraCssText: 'border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);',
}

// ─── Format helpers ────────────────────────────────────────────────────────────
function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toLocaleString('fr-FR')
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  )
}

// ─── Main Dashboard Component ──────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [charts, setCharts] = useState<ChartData | null>(null)
  const [recent, setRecent] = useState<RecentActivity | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, chartsRes, recentRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/charts'),
        fetch('/api/dashboard/recent'),
      ])

      if (!statsRes.ok || !chartsRes.ok || !recentRes.ok) throw new Error('API error')

      const [statsData, chartsData, recentData] = await Promise.all([
        statsRes.json(),
        chartsRes.json(),
        recentRes.json(),
      ])

      setStats(statsData)
      setCharts(chartsData)
      setRecent(recentData)
    } catch (error) {
      console.error('Dashboard fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) return <DashboardSkeleton />

  if (!stats || !charts || !recent) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground">Erreur de chargement des données</p>
      </div>
    )
  }

  // ── Prepare data ───────────────────────────────────────────────────────────

  const statusDistribution = charts.monthlyAuctions.map((m) => ({
    name: STATUS_LABELS[m.status] || m.status,
    value: m.count,
    color: STATUS_COLORS[m.status] || '#94a3b8',
  }))

  // ── ECharts Options ────────────────────────────────────────────────────────

  // 1. Auctions by Region — Gradient Horizontal Bar
  const regionBarOption = {
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: { value: number; name: string }[]) =>
        `<strong>${params[0].name}</strong><br/>Enchères : <b>${params[0].value}</b>`,
    },
    grid: { left: 100, right: 30, top: 10, bottom: 20 },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { fontSize: 11, color: '#94a3b8' },
    },
    yAxis: {
      type: 'category',
      data: [...charts.auctionsByRegion].sort((a, b) => b.count - a.count).map((r) => r.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 11, color: '#475569' },
    },
    series: [
      {
        type: 'bar',
        data: [...charts.auctionsByRegion]
          .sort((a, b) => b.count - a.count)
          .map((_, i) => ({
            value: [...charts.auctionsByRegion].sort((a, b) => b.count - a.count)[i].count,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: OLIVE_GRADIENT_START },
                  { offset: 1, color: OLIVE_GRADIENT_END },
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
        },
        animationDuration: 1200,
        animationEasing: 'cubicOut',
      },
    ],
  }

  // 2. Status Distribution — Nightingale Rose Chart
  const statusRoseOption = {
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'item',
      formatter: (params: { name: string; value: number; percent: number }) =>
        `<strong>${params.name}</strong><br/>Total : <b>${params.value}</b><br/>Part : <b>${params.percent}%</b>`,
    },
    legend: { show: false },
    series: [
      {
        type: 'pie',
        roseType: 'area',
        radius: ['15%', '70%'],
        center: ['50%', '50%'],
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0,0,0,0.15)',
          },
        },
        data: statusDistribution.map((s) => ({
          value: s.value,
          name: s.name,
          itemStyle: { color: s.color },
        })),
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDuration: 1400,
      },
    ],
  }

  // 3. Price Evolution — Gradient Area with DataZoom
  const priceData = charts.priceEvolution.map((p) => ({
    month: p.month,
    value: p.avgPrice,
    label: (() => {
      const d = new Date(p.month + '-01')
      return d.toLocaleDateString('fr-FR', { month: 'short' })
    })(),
    fullLabel: (() => {
      const d = new Date(p.month + '-01')
      return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    })(),
  }))

  const priceLineOption = {
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'axis',
      formatter: (params: { name: string; value: number }[]) =>
        `<strong>${priceData[params[0].dataIndex]?.fullLabel || params[0].name}</strong><br/>Prix moyen : <b style="color:#45A452">${params[0].value.toFixed(2)} DT/kg</b>`,
    },
    grid: { left: 60, right: 30, top: 20, bottom: 60 },
    xAxis: {
      type: 'category',
      data: priceData.map((p) => p.label),
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
      {
        type: 'inside',
        start: 0,
        end: 100,
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
      },
      {
        type: 'slider',
        start: 0,
        end: 100,
        height: 24,
        bottom: 8,
        borderColor: 'transparent',
        backgroundColor: '#f1f5f9',
        fillerColor: 'rgba(69,164,82,0.15)',
        handleStyle: { color: '#45A452', borderColor: '#45A452' },
        textStyle: { fontSize: 10, color: '#94a3b8' },
        dataBackground: {
          lineStyle: { color: '#45A452', opacity: 0.3 },
          areaStyle: { color: '#45A452', opacity: 0.05 },
        },
        selectedDataBackground: {
          lineStyle: { color: '#45A452' },
          areaStyle: { color: 'rgba(69,164,82,0.1)' },
        },
      },
    ],
    series: [
      {
        type: 'line',
        data: priceData.map((p) => p.value),
        smooth: 0.4,
        symbol: 'circle',
        symbolSize: 8,
        showSymbol: true,
        lineStyle: { width: 3, color: '#45A452' },
        itemStyle: { color: '#45A452', borderWidth: 2, borderColor: '#fff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(69,164,82,0.3)' },
              { offset: 0.5, color: 'rgba(69,164,82,0.1)' },
              { offset: 1, color: 'rgba(69,164,82,0.01)' },
            ],
          },
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(69,164,82,0.4)',
            borderColor: '#fff',
            borderWidth: 3,
            size: 12,
          },
        },
        animationDuration: 1600,
        animationEasing: 'cubicOut',
      },
    ],
  }

  // 4. Volume by Region — Treemap
  const volumeTreemapOption = {
    tooltip: {
      ...TOOLTIP_STYLE,
      formatter: (params: { name: string; value: number }) =>
        `<strong>${params.name}</strong><br/>Volume : <b>${formatNumber(Math.round(params.value))} kg</b>`,
    },
    series: [
      {
        type: 'treemap',
        width: '96%',
        height: '96%',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        label: {
          show: true,
          fontSize: 11,
          fontWeight: 600,
          color: '#fff',
          formatter: (params: { name: string; value: number }) =>
            `{name|${params.name}}\n{val|${formatNumber(Math.round(params.value))} kg}`,
          rich: {
            name: { fontSize: 12, fontWeight: 700, lineHeight: 18 },
            val: { fontSize: 10, opacity: 0.85, lineHeight: 16 },
          },
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 3,
          gapWidth: 3,
          borderRadius: 6,
        },
        levels: [
          {
            itemStyle: {
              borderColor: '#fff',
              borderWidth: 3,
              gapWidth: 3,
            },
          },
        ],
        data: charts.volumeByRegion.map((v, i) => ({
          name: v.name,
          value: v.volume,
          itemStyle: {
            color: OLIVE_COLORS[i % OLIVE_COLORS.length],
          },
        })),
        animationDuration: 1200,
        animationEasing: 'cubicOut',
      },
    ],
  }

  // 5. Olive Types — Sunburst
  const oliveSunburstOption = {
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'item',
      formatter: (params: { name: string; value: number; treePathInfo: { name: string }[] }) =>
        `<strong>${params.name}</strong><br/>Enchères : <b>${params.value}</b>`,
    },
    series: [
      {
        type: 'sunburst',
        radius: ['10%', '90%'],
        center: ['50%', '50%'],
        sort: 'desc',
        emphasis: { focus: 'ancestor' },
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          rotate: 'radial',
          fontSize: 11,
          fontWeight: 600,
          color: '#fff',
          formatter: '{b}',
        },
        levels: [
          {},
          {
            r0: '10%',
            r: '50%',
            label: { show: true, fontSize: 11, fontWeight: 700, color: '#fff' },
            itemStyle: { borderWidth: 2, borderColor: '#fff' },
          },
          {
            r0: '52%',
            r: '90%',
            label: {
              show: true,
              fontSize: 9,
              fontWeight: 500,
              color: '#475569',
              position: 'outside',
              align: 'left',
            },
            itemStyle: { borderWidth: 1, borderColor: '#f1f5f9' },
          },
        ],
        data: charts.auctionsByOliveType.map((o, i) => ({
          name: o.name,
          value: o.count,
          itemStyle: { color: OLIVE_COLORS[i % OLIVE_COLORS.length] },
        })),
        animationDuration: 1400,
        animationEasing: 'cubicOut',
      },
    ],
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Welcome banner */}
      <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#45A452] to-[#2d8a3a] p-4 text-white md:p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
          <Leaf className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold md:text-xl">
            Bienvenue sur EnchèreSolive
          </h2>
          <p className="text-sm text-white/80 truncate">
            Plateforme de gestion des enchères d&apos;olives en Tunisie — {stats.activeAuctions} enchères en cours
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatsCard
          title="Utilisateurs"
          value={formatNumber(stats.totalUsers)}
          subtitle={`${stats.activeUsers} actifs`}
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatsCard
          title="Enchères actives"
          value={formatNumber(stats.activeAuctions)}
          subtitle={`${stats.totalAuctions} au total`}
          icon={Gavel}
          iconColor="text-[#45A452]"
          iconBg="bg-[#45A452]/10"
        />
        <StatsCard
          title="Volume total"
          value={formatNumber(Math.round(stats.totalVolume)) + ' kg'}
          subtitle="enchères actives"
          icon={Package}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatsCard
          title="Prix moyen"
          value={stats.avgPricePerKg + ' DT'}
          subtitle="par kg"
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatsCard
          title="Offres totales"
          value={formatNumber(stats.totalBids)}
          subtitle="toutes enchères"
          icon={TrendingUp}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
        <StatsCard
          title="Transactions"
          value={stats.completedTransactions}
          subtitle={`${stats.totalTransactions} au total`}
          icon={ShoppingCart}
          iconColor="text-cyan-600"
          iconBg="bg-cyan-50"
        />
        <StatsCard
          title="Vendeurs"
          value={stats.sellersCount}
          subtitle={`${stats.buyersCount} acheteurs`}
          icon={Scale}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />
        <StatsCard
          title="Litiges en attente"
          value={stats.pendingReports}
          subtitle="à traiter"
          icon={AlertTriangle}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
        />
      </div>

      {/* Charts Section — Row 1 */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Auctions by Region — Gradient Bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#45A452]" />
              Enchères par région
            </CardTitle>
            <CardDescription>Répartition géographique des enchères</CardDescription>
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

        {/* Status Distribution — Nightingale Rose */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Gavel className="h-4 w-4 text-[#45A452]" />
              Répartition par statut
            </CardTitle>
            <CardDescription>Distribution des enchères par état</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-72 items-center">
              <div className="w-1/2 h-full">
                <ReactECharts
                  option={statusRoseOption}
                  style={{ height: '100%', width: '100%' }}
                  opts={{ renderer: 'svg' }}
                />
              </div>
              <div className="w-1/2 space-y-3">
                {statusDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Evolution — Gradient Area with DataZoom */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#45A452]" />
            Évolution des prix
          </CardTitle>
          <CardDescription>Prix moyen par kg au fil des mois (DT/kg) — survolez et zoomez</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            {charts.priceEvolution.length > 0 ? (
              <ReactECharts
                option={priceLineOption}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                Aucune donnée de prix disponible
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts Section — Row 3 */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Volume by Region — Treemap */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-600" />
              Volume par région (kg)
            </CardTitle>
            <CardDescription>Quantité disponible par gouvernorat</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ReactECharts
                option={volumeTreemapOption}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Olive Types — Sunburst */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Leaf className="h-4 w-4 text-[#45A452]" />
              Variétés d&apos;olives
            </CardTitle>
            <CardDescription>Répartition par type d&apos;olive</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ReactECharts
                option={oliveSunburstOption}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#45A452]" />
            Activité récente
          </CardTitle>
          <CardDescription>Dernières actions sur la plateforme</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="auctions" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="auctions" className="text-xs sm:text-sm">
                Enchères
              </TabsTrigger>
              <TabsTrigger value="bids" className="text-xs sm:text-sm">
                Offres
              </TabsTrigger>
              <TabsTrigger value="users" className="text-xs sm:text-sm">
                Utilisateurs
              </TabsTrigger>
            </TabsList>

            {/* Recent Auctions */}
            <TabsContent value="auctions" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Titre</th>
                      <th className="pb-2 pr-4 font-medium hidden sm:table-cell">Vendeur</th>
                      <th className="pb-2 pr-4 font-medium">Statut</th>
                      <th className="pb-2 pr-4 font-medium hidden md:table-cell">Quantité</th>
                      <th className="pb-2 pr-4 font-medium hidden md:table-cell">Offres</th>
                      <th className="pb-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recent.recentAuctions.map((auction) => (
                      <tr key={auction.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="font-medium text-foreground max-w-[200px] truncate">
                            {auction.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {auction.oliveType?.name} — {auction.region?.name}
                          </div>
                        </td>
                        <td className="py-3 pr-4 hidden sm:table-cell text-muted-foreground">
                          {auction.seller?.name || auction.seller?.phone}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-medium"
                            style={{
                              backgroundColor: (STATUS_COLORS[auction.status] || '#94a3b8') + '15',
                              color: STATUS_COLORS[auction.status] || '#94a3b8',
                            }}
                          >
                            {STATUS_LABELS[auction.status] || auction.status}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 hidden md:table-cell text-muted-foreground">
                          {formatNumber(Math.round(auction.quantity))} kg
                        </td>
                        <td className="py-3 pr-4 hidden md:table-cell">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <ArrowUpRight className="h-3 w-3" />
                            {auction.bidCount}
                          </div>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(auction.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Recent Bids */}
            <TabsContent value="bids" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Enchère</th>
                      <th className="pb-2 pr-4 font-medium hidden sm:table-cell">Acheteur</th>
                      <th className="pb-2 pr-4 font-medium">Prix/kg</th>
                      <th className="pb-2 pr-4 font-medium hidden md:table-cell">Total</th>
                      <th className="pb-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recent.recentBids.map((bid) => (
                      <tr key={bid.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="font-medium text-foreground max-w-[180px] truncate">
                            {bid.auction?.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {bid.auction?.oliveType?.name}
                          </div>
                        </td>
                        <td className="py-3 pr-4 hidden sm:table-cell text-muted-foreground">
                          {bid.buyer?.name || bid.buyer?.phone}
                        </td>
                        <td className="py-3 pr-4 font-semibold text-[#45A452]">
                          {bid.pricePerKg.toFixed(2)} DT
                        </td>
                        <td className="py-3 pr-4 hidden md:table-cell text-muted-foreground">
                          {formatNumber(Math.round(bid.totalPrice))} DT
                        </td>
                        <td className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(bid.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Recent Users */}
            <TabsContent value="users" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Nom</th>
                      <th className="pb-2 pr-4 font-medium hidden sm:table-cell">Téléphone</th>
                      <th className="pb-2 pr-4 font-medium">Rôle</th>
                      <th className="pb-2 pr-4 font-medium">Statut</th>
                      <th className="pb-2 font-medium">Inscription</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recent.recentUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="font-medium text-foreground">
                            {user.name || user.phone}
                          </div>
                          {user.enterprise && (
                            <div className="text-xs text-muted-foreground">{user.enterprise}</div>
                          )}
                        </td>
                        <td className="py-3 pr-4 hidden sm:table-cell text-muted-foreground">
                          {user.phone}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="secondary" className="text-[10px] font-medium">
                            {ROLE_LABELS[user.role] || user.role}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-medium"
                            style={{
                              backgroundColor: user.status === 'ACTIVE' ? '#45A45215' : '#ef444415',
                              color: user.status === 'ACTIVE' ? '#45A452' : '#ef4444',
                            }}
                          >
                            {STATUS_LABELS[user.status] || user.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(user.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
