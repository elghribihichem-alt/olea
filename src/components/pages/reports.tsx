'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  FileBarChart,
  Download,
  Filter,
  RefreshCw,
  DollarSign,
  Gavel,
  Users,
  TrendingUp,
  Eye,
  ShoppingCart,
  BarChart3,
  Calendar,
  Leaf,
  MapPin,
  Star,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsCard } from '@/components/stats-card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ReactECharts from 'echarts-for-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface AnalyticsData {
  stats: Record<string, number | string>
  period: string
  regions: { id: string; name: string }[]
  oliveTypes: { id: string; name: string }[]
  transactions?: TransactionRow[]
  monthlySales?: { month: string | null; count: number; revenue: number; avgPrice: number }[]
  byRegion?: { regionId: string; name: string; count: number; revenue: number }[]
  byOliveType?: { oliveTypeId: string; name: string; count: number; revenue: number }[]
  statusBreakdown?: { status: string; _count: number; _sum?: { quantity: number | null } }[]
  monthlyAuctions?: { month: string | null; total: number; active: number; closed: number }[]
  topSellers?: { sellerId: string; name: string; phone: string; enterprise: string | null; auctionCount: number; totalQuantity: number }[]
  roleBreakdown?: { role: string; _count: number }[]
  monthlySignups?: { month: string | null; count: number }[]
  topBuyers?: { buyerId: string; name: string; phone: string; bidCount: number; totalSpent: number }[]
}

interface TransactionRow {
  id: string
  finalPrice: number
  status: string
  createdAt: string
  completedAt: string | null
  auction: {
    title: string
    quantity: number
    oliveType: { name: string } | null
    region: { name: string } | null
    seller: { name: string | null; phone: string } | null
  } | null
  buyer: { name: string | null; phone: string } | null
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const REPORT_TYPES = [
  { value: 'sales', label: 'Ventes & Revenus', icon: DollarSign, color: '#45A452' },
  { value: 'auctions', label: 'Enchères', icon: Gavel, color: '#6366f1' },
  { value: 'users', label: 'Utilisateurs', icon: Users, color: '#f59e0b' },
]

const PERIODS = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
  { value: '6m', label: '6 mois' },
  { value: '1y', label: '1 an' },
  { value: 'all', label: 'Tout' },
]

const COLORS = ['#45A452', '#6366f1', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#84cc16']

const OLIVE_GREEN_PALETTE = ['#45A452', '#2d8a3a', '#6dba6d', '#1f6e2b', '#a8d7a8']

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  COMPLETED: 'Complété',
  CANCELLED: 'Annulé',
  DISPUTED: 'Litige',
  DRAFT: 'Brouillon',
  ACTIVE: 'Active',
  CLOSED: 'Clôturée',
  CANCELLED_AUC: 'Annulée',
  EXPIRED: 'Expirée',
}

// ─── ECharts Shared Tooltip Style ─────────────────────────────────────────────
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

function formatCurrency(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' DT'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatMonth(month: string | null | undefined): string {
  if (!month) return '—'
  const parts = month.split('-')
  if (parts.length < 2) return month
  const y = parseInt(parts[0])
  const m = parseInt(parts[1]) - 1
  if (isNaN(y) || isNaN(m)) return month
  const d = new Date(y, m, 1)
  return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function ReportsSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [reportType, setReportType] = useState('sales')
  const [period, setPeriod] = useState('30d')
  const [regionId, setRegionId] = useState('ALL')
  const [oliveTypeId, setOliveTypeId] = useState('ALL')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<string | null>(null)

  const [regions, setRegions] = useState<{ id: string; name: string }[]>([])
  const [oliveTypes, setOliveTypes] = useState<{ id: string; name: string }[]>([])

  // ─── Fetch analytics ───────────────────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: reportType,
        period,
        regionId: regionId === 'ALL' ? '' : regionId,
        oliveTypeId: oliveTypeId === 'ALL' ? '' : oliveTypeId,
      })
      const res = await fetch(`/api/analytics?${params}`)
      if (!res.ok) throw new Error()
      const result = await res.json()
      setData(result)
      setRegions(result.regions || [])
      setOliveTypes(result.oliveTypes || [])
    } catch {
      toast.error('Erreur lors du chargement du rapport')
    } finally {
      setLoading(false)
    }
  }, [reportType, period, regionId, oliveTypeId])

  useEffect(() => {
    // Load reference data on mount
    fetch('/api/regions').then((r) => r.json()).then(setRegions).catch(() => {})
    fetch('/api/olive-types').then((r) => r.json()).then(setOliveTypes).catch(() => {})
  }, [])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  // ─── CSV Export ────────────────────────────────────────────────────────
  const handleExport = async (exportType: string) => {
    setExporting(exportType)
    try {
      const params = new URLSearchParams({
        type: exportType,
        period,
        regionId: regionId === 'ALL' ? '' : regionId,
        oliveTypeId: oliveTypeId === 'ALL' ? '' : oliveTypeId,
      })
      const res = await fetch(`/api/export?${params}`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = res.headers.get('Content-Disposition')
      const filename = disposition
        ? disposition.split('filename=')[1]?.replace(/"/g, '')
        : `export_${exportType}.csv`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Export téléchargé avec succès')
    } catch {
      toast.error('Erreur lors de l\'export')
    } finally {
      setExporting(null)
    }
  }

  // ─── Reset filters ─────────────────────────────────────────────────────
  const resetFilters = () => {
    setPeriod('30d')
    setRegionId('ALL')
    setOliveTypeId('ALL')
  }

  if (loading && !data) return <ReportsSkeleton />
  if (!data) return <div className="flex items-center justify-center p-8 text-muted-foreground">Erreur de chargement</div>

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* ── Report Type Tabs ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {REPORT_TYPES.map((rt) => {
          const Icon = rt.icon
          const isActive = reportType === rt.value
          return (
            <button
              key={rt.value}
              onClick={() => setReportType(rt.value)}
              className={`flex items-center gap-3 rounded-xl border-2 p-3 md:p-4 transition-all duration-200 ${
                isActive
                  ? 'border-[#45A452] bg-[#45A452]/5 shadow-sm'
                  : 'border-transparent bg-white hover:border-muted hover:bg-muted/50'
              }`}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: isActive ? rt.color + '15' : '#f3f4f6' }}
              >
                <Icon className="h-5 w-5" style={{ color: isActive ? rt.color : '#6b7280' }} />
              </div>
              <div className="text-left">
                <span className="text-sm font-semibold" style={{ color: isActive ? rt.color : '#374151' }}>
                  {rt.label}
                </span>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {rt.value === 'sales' ? 'Transactions & revenus' : rt.value === 'auctions' ? 'Enchères & volumes' : 'Inscriptions & activité'}
                </p>
              </div>
              {isActive && (
                <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#45A452]">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Filters & Export ─────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-1">
              {/* Period */}
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="h-10 w-full sm:w-[140px]">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Region */}
              <Select value={regionId} onValueChange={setRegionId}>
                <SelectTrigger className="h-10 w-full sm:w-[170px]">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Région" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toutes les régions</SelectItem>
                  {regions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Olive Type */}
              <Select value={oliveTypeId} onValueChange={setOliveTypeId}>
                <SelectTrigger className="h-10 w-full sm:w-[170px]">
                  <Leaf className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Variété" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toutes les variétés</SelectItem>
                  {oliveTypes.map((ot) => (
                    <SelectItem key={ot.id} value={ot.id}>{ot.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={resetFilters}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Export buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => handleExport('transactions')}
                disabled={!!exporting}
              >
                {exporting === 'transactions' ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                )}
                Transactions CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => handleExport('auctions')}
                disabled={!!exporting}
              >
                {exporting === 'auctions' ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                )}
                Enchères CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => handleExport('users')}
                disabled={!!exporting}
              >
                {exporting === 'users' ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                )}
                Utilisateurs CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Report Content ───────────────────────────────────────────────── */}
      {reportType === 'sales' && <SalesReport data={data} />}
      {reportType === 'auctions' && <AuctionsReport data={data} />}
      {reportType === 'users' && <UsersReport data={data} />}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// SALES REPORT
// ════════════════════════════════════════════════════════════════════════════════
function SalesReport({ data }: { data: AnalyticsData }) {
  const stats = data.stats
  const transactions = data.transactions || []
  const monthlySales = data.monthlySales || []
  const byRegion = data.byRegion || []
  const byOliveType = data.byOliveType || []

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard
          title="Revenu total"
          value={formatCurrency(Number(stats.totalRevenue) || 0)}
          icon={DollarSign}
          iconColor="text-[#45A452]"
          iconBg="bg-[#45A452]/10"
        />
        <StatsCard
          title="Transactions"
          value={formatNumber(Number(stats.totalTransactions) || 0)}
          icon={ShoppingCart}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatsCard
          title="Panier moyen"
          value={formatCurrency(Number(stats.avgTransaction) || 0)}
          icon={TrendingUp}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatsCard
          title="Période"
          value={data.period === 'all' ? 'Tout' : data.period}
          icon={Calendar}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      {/* ── Chart 1: Monthly Revenue (Bar + Line overlay) ───────────────── */}
      {monthlySales.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#45A452]" />
              Revenus mensuels
            </CardTitle>
            <CardDescription>Évolution du chiffre d&apos;affaires par mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ReactECharts
                opts={{ renderer: 'svg' }}
                style={{ height: '100%', width: '100%' }}
                option={{
                  tooltip: {
                    ...TOOLTIP_STYLE,
                    trigger: 'axis',
                    axisPointer: { type: 'cross', crossStyle: { color: '#999' } },
                    formatter: (params: Array<{ seriesName: string; value: number; marker: string }>) => {
                      let tip = `<div style="font-weight:600;margin-bottom:4px;">${formatMonth(monthlySales[params[0]?.dataIndex]?.month || '')}</div>`
                      params.forEach((p) => {
                        tip += `<div style="display:flex;align-items:center;gap:6px;">${p.marker}<span>${p.seriesName === 'Revenu' ? formatCurrency(p.value) : formatNumber(p.value)} <span style="color:#94a3b8">${p.seriesName}</span></span></div>`
                      })
                      return tip
                    },
                  },
                  legend: {
                    data: ['Revenu', 'Transactions'],
                    top: 0,
                    right: 0,
                    textStyle: { fontSize: 12, color: '#64748b' },
                    itemWidth: 14,
                    itemHeight: 10,
                  },
                  grid: { left: 10, right: 60, top: 40, bottom: 10, containLabel: true },
                  xAxis: {
                    type: 'category',
                    data: monthlySales.map((d) => formatMonth(d.month)),
                    axisLabel: { fontSize: 11, color: '#64748b' },
                    axisLine: { lineStyle: { color: '#e2e8f0' } },
                    axisTick: { show: false },
                  },
                  yAxis: [
                    {
                      type: 'value',
                      axisLabel: {
                        fontSize: 11,
                        color: '#64748b',
                        formatter: (v: number) => formatNumber(Math.round(v)),
                      },
                      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
                      axisLine: { show: false },
                    },
                    {
                      type: 'value',
                      axisLabel: {
                        fontSize: 11,
                        color: '#6366f1',
                        formatter: (v: number) => formatNumber(Math.round(v)),
                      },
                      splitLine: { show: false },
                      axisLine: { show: false },
                    },
                  ],
                  series: [
                    {
                      name: 'Revenu',
                      type: 'bar',
                      yAxisIndex: 0,
                      barMaxWidth: 50,
                      itemStyle: {
                        borderRadius: [4, 4, 0, 0],
                        color: {
                          type: 'linear',
                          x: 0, y: 0, x2: 0, y2: 1,
                          colorStops: [
                            { offset: 0.05, color: '#6dba6d' },
                            { offset: 0.95, color: '#2d8a3a' },
                          ],
                        },
                      },
                      data: monthlySales.map((d) => d.revenue),
                    },
                    {
                      name: 'Transactions',
                      type: 'line',
                      yAxisIndex: 1,
                      smooth: true,
                      symbol: 'circle',
                      symbolSize: 8,
                      lineStyle: { width: 2, color: '#6366f1' },
                      itemStyle: { color: '#6366f1', borderWidth: 2, borderColor: '#fff' },
                      data: monthlySales.map((d) => d.count),
                    },
                  ],
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Chart 2: Revenue by Region (horizontal bar) ─────────────────── */}
      {/* ── Chart 3: Revenue by Olive Type (Nightingale rose) ───────────── */}
      {(byRegion.length > 0 || byOliveType.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {byRegion.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  Revenus par région
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ReactECharts
                    opts={{ renderer: 'svg' }}
                    style={{ height: '100%', width: '100%' }}
                    option={{
                      tooltip: {
                        ...TOOLTIP_STYLE,
                        trigger: 'axis',
                        axisPointer: { type: 'shadow' },
                        formatter: (params: Array<{ name: string; value: number; marker: string }>) => {
                          const p = params[0]
                          return `<div style="font-weight:600;margin-bottom:4px;">${p.name}</div><div>${p.marker} ${formatCurrency(p.value)}</div>`
                        },
                      },
                      grid: { left: 10, right: 20, top: 10, bottom: 10, containLabel: true },
                      xAxis: {
                        type: 'value',
                        axisLabel: {
                          fontSize: 11,
                          color: '#64748b',
                          formatter: (v: number) => formatNumber(Math.round(v)),
                        },
                        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
                        axisLine: { show: false },
                      },
                      yAxis: {
                        type: 'category',
                        data: [...byRegion].sort((a, b) => a.revenue - b.revenue).map((d) => d.name),
                        axisLabel: { fontSize: 11, color: '#64748b' },
                        axisLine: { lineStyle: { color: '#e2e8f0' } },
                        axisTick: { show: false },
                      },
                      series: [
                        {
                          type: 'bar',
                          barMaxWidth: 24,
                          data: [...byRegion].sort((a, b) => a.revenue - b.revenue).map((d, i) => ({
                            value: d.revenue,
                            itemStyle: {
                              borderRadius: [0, 4, 4, 0],
                              color: {
                                type: 'linear',
                                x: 0, y: 0, x2: 1, y2: 0,
                                colorStops: [
                                  { offset: 0, color: '#a8d7a8' },
                                  { offset: 1, color: '#2d8a3a' },
                                ],
                              },
                            },
                          })),
                        },
                      ],
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {byOliveType.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-[#45A452]" />
                  Revenus par variété
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ReactECharts
                    opts={{ renderer: 'svg' }}
                    style={{ height: '100%', width: '100%' }}
                    option={{
                      tooltip: {
                        ...TOOLTIP_STYLE,
                        trigger: 'item',
                        formatter: (params: { name: string; value: number; marker: string; percent: number }) => {
                          return `<div style="font-weight:600;margin-bottom:4px;">${params.name}</div><div>${params.marker} ${formatCurrency(params.value)} <span style="color:#94a3b8">(${params.percent}%)</span></div>`
                        },
                      },
                      legend: {
                        type: 'scroll',
                        bottom: 0,
                        left: 'center',
                        textStyle: { fontSize: 11, color: '#64748b' },
                        itemWidth: 10,
                        itemHeight: 10,
                        itemGap: 12,
                      },
                      series: [
                        {
                          type: 'pie',
                          roseType: 'area',
                          radius: ['15%', '70%'],
                          center: ['50%', '45%'],
                          itemStyle: {
                            borderRadius: 6,
                            borderColor: '#fff',
                            borderWidth: 2,
                          },
                          label: {
                            show: true,
                            fontSize: 11,
                            color: '#64748b',
                            formatter: '{b}',
                          },
                          labelLine: {
                            lineStyle: { color: '#cbd5e1' },
                            length: 12,
                            length2: 8,
                          },
                          data: byOliveType.map((d, i) => ({
                            name: d.name,
                            value: d.revenue,
                            itemStyle: { color: COLORS[i % COLORS.length] },
                          })),
                        },
                      ],
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Transactions Table */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Dernières transactions
            </CardTitle>
            <CardDescription>Les {transactions.length} transactions les plus récentes</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background z-10">
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Enchère</th>
                    <th className="pb-2 pr-4 font-medium hidden md:table-cell">Variété</th>
                    <th className="pb-2 pr-4 font-medium hidden lg:table-cell">Région</th>
                    <th className="pb-2 pr-4 font-medium hidden sm:table-cell">Acheteur</th>
                    <th className="pb-2 pr-4 font-medium">Montant</th>
                    <th className="pb-2 pr-4 font-medium">Statut</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 pr-4">
                        <div className="font-medium text-sm max-w-[160px] truncate">{tx.auction?.title}</div>
                        <div className="text-xs text-muted-foreground">{tx.auction ? formatNumber(Math.round(tx.auction.quantity)) + ' kg' : ''}</div>
                      </td>
                      <td className="py-2.5 pr-4 hidden md:table-cell text-xs text-muted-foreground">
                        {tx.auction?.oliveType?.name}
                      </td>
                      <td className="py-2.5 pr-4 hidden lg:table-cell text-xs text-muted-foreground">
                        {tx.auction?.region?.name}
                      </td>
                      <td className="py-2.5 pr-4 hidden sm:table-cell text-xs text-muted-foreground">
                        {tx.buyer?.name || tx.buyer?.phone}
                      </td>
                      <td className="py-2.5 pr-4 font-semibold text-[#45A452]">
                        {formatCurrency(tx.finalPrice)}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold"
                          style={{
                            backgroundColor: tx.status === 'COMPLETED' ? '#45A45215' : '#f59e0b15',
                            color: tx.status === 'COMPLETED' ? '#45A452' : '#f59e0b',
                          }}
                        >
                          {STATUS_LABELS[tx.status] || tx.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(tx.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// AUCTIONS REPORT
// ════════════════════════════════════════════════════════════════════════════════
function AuctionsReport({ data }: { data: AnalyticsData }) {
  const stats = data.stats
  const statusBreakdown = data.statusBreakdown || []
  const monthlyAuctions = data.monthlyAuctions || []
  const topSellers = data.topSellers || []

  const statusColors: Record<string, string> = {
    DRAFT: '#94a3b8',
    ACTIVE: '#45A452',
    CLOSED: '#6366f1',
    CANCELLED: '#ef4444',
    EXPIRED: '#f59e0b',
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard
          title="Total enchères"
          value={formatNumber(Number(stats.totalAuctions) || 0)}
          icon={Gavel}
          iconColor="text-[#6366f1]"
          iconBg="bg-[#6366f1]/10"
        />
        <StatsCard
          title="Volume total"
          value={formatNumber(Math.round(Number(stats.totalQuantity) || 0)) + ' kg'}
          icon={ShoppingCart}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatsCard
          title="Vues totales"
          value={formatNumber(Number(stats.totalViews) || 0)}
          icon={Eye}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatsCard
          title="Période"
          value={data.period === 'all' ? 'Tout' : data.period}
          icon={Calendar}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      {/* ── Chart 4: Status Breakdown (ring donut with rich tooltips) ──── */}
      {/* ── Chart 5: Monthly Auctions (stacked area with gradient fills) ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {statusBreakdown.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#6366f1]" />
                Répartition par statut
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ReactECharts
                  opts={{ renderer: 'svg' }}
                  style={{ height: '100%', width: '100%' }}
                  option={{
                    tooltip: {
                      ...TOOLTIP_STYLE,
                      trigger: 'item',
                      formatter: (params: { name: string; value: number; marker: string; percent: number; data?: { status?: string } }) => {
                        const total = statusBreakdown.reduce((s, b) => s + b._count, 0)
                        return `<div style="font-weight:600;margin-bottom:4px;">${params.name}</div>` +
                          `<div>${params.marker} ${formatNumber(params.value)} enchères</div>` +
                          `<div style="color:#94a3b8;font-size:11px;">${params.percent}% du total (${formatNumber(total)})</div>`
                      },
                    },
                    legend: {
                      type: 'scroll',
                      bottom: 0,
                      left: 'center',
                      textStyle: { fontSize: 11, color: '#64748b' },
                      itemWidth: 10,
                      itemHeight: 10,
                      itemGap: 12,
                    },
                    series: [
                      {
                        type: 'pie',
                        radius: ['40%', '70%'],
                        center: ['50%', '45%'],
                        avoidLabelOverlap: true,
                        itemStyle: {
                          borderRadius: 6,
                          borderColor: '#fff',
                          borderWidth: 2,
                        },
                        emphasis: {
                          label: {
                            show: true,
                            fontSize: 13,
                            fontWeight: 'bold',
                            color: '#334155',
                          },
                          itemStyle: {
                            shadowBlur: 10,
                            shadowColor: 'rgba(0,0,0,0.15)',
                          },
                        },
                        label: {
                          show: false,
                        },
                        labelLine: {
                          show: false,
                        },
                        data: statusBreakdown.map((s) => ({
                          name: STATUS_LABELS[s.status] || s.status,
                          value: s._count,
                          itemStyle: { color: statusColors[s.status] || '#94a3b8' },
                        })),
                      },
                    ],
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {monthlyAuctions.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#45A452]" />
                Enchères par mois
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ReactECharts
                  opts={{ renderer: 'svg' }}
                  style={{ height: '100%', width: '100%' }}
                  option={{
                    tooltip: {
                      ...TOOLTIP_STYLE,
                      trigger: 'axis',
                      axisPointer: { type: 'cross', crossStyle: { color: '#999' } },
                      formatter: (params: Array<{ seriesName: string; value: number; marker: string }>) => {
                        let tip = `<div style="font-weight:600;margin-bottom:4px;">${formatMonth(monthlyAuctions[params[0]?.dataIndex]?.month || '')}</div>`
                        params.forEach((p) => {
                          const label = p.seriesName === 'Actives' ? 'Actives' : 'Clôturées'
                          tip += `<div>${p.marker} ${formatNumber(p.value)} ${label}</div>`
                        })
                        return tip
                      },
                    },
                    legend: {
                      data: ['Actives', 'Clôturées'],
                      top: 0,
                      right: 0,
                      textStyle: { fontSize: 12, color: '#64748b' },
                      itemWidth: 14,
                      itemHeight: 10,
                    },
                    grid: { left: 10, right: 20, top: 40, bottom: 10, containLabel: true },
                    xAxis: {
                      type: 'category',
                      boundaryGap: false,
                      data: monthlyAuctions.map((d) => formatMonth(d.month)),
                      axisLabel: { fontSize: 11, color: '#64748b' },
                      axisLine: { lineStyle: { color: '#e2e8f0' } },
                      axisTick: { show: false },
                    },
                    yAxis: {
                      type: 'value',
                      axisLabel: { fontSize: 11, color: '#64748b' },
                      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
                      axisLine: { show: false },
                    },
                    series: [
                      {
                        name: 'Actives',
                        type: 'line',
                        stack: 'auctions',
                        smooth: true,
                        symbol: 'none',
                        areaStyle: {
                          color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                              { offset: 0, color: 'rgba(69,164,82,0.25)' },
                              { offset: 1, color: 'rgba(69,164,82,0.01)' },
                            ],
                          },
                        },
                        lineStyle: { width: 2, color: '#45A452' },
                        data: monthlyAuctions.map((d) => d.active),
                      },
                      {
                        name: 'Clôturées',
                        type: 'line',
                        stack: 'auctions',
                        smooth: true,
                        symbol: 'none',
                        areaStyle: {
                          color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                              { offset: 0, color: 'rgba(99,102,241,0.25)' },
                              { offset: 1, color: 'rgba(99,102,241,0.01)' },
                            ],
                          },
                        },
                        lineStyle: { width: 2, color: '#6366f1' },
                        data: monthlyAuctions.map((d) => d.closed),
                      },
                    ],
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Sellers */}
      {topSellers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Top vendeurs
            </CardTitle>
            <CardDescription>Les vendeurs les plus actifs sur la période</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">#</th>
                    <th className="pb-2 pr-4 font-medium">Vendeur</th>
                    <th className="pb-2 pr-4 font-medium hidden sm:table-cell">Entreprise</th>
                    <th className="pb-2 pr-4 font-medium">Enchères</th>
                    <th className="pb-2 pr-4 font-medium hidden md:table-cell">Volume total</th>
                    <th className="pb-2 font-medium hidden sm:table-cell">Téléphone</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topSellers.map((seller, idx) => (
                    <tr key={seller.sellerId} className="hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 pr-4">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${idx < 3 ? 'bg-amber-50 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 font-medium">{seller.name}</td>
                      <td className="py-2.5 pr-4 hidden sm:table-cell text-xs text-muted-foreground">{seller.enterprise || '—'}</td>
                      <td className="py-2.5 pr-4">
                        <Badge variant="secondary" className="font-semibold">{seller.auctionCount}</Badge>
                      </td>
                      <td className="py-2.5 pr-4 hidden md:table-cell text-muted-foreground">
                        {formatNumber(Math.round(seller.totalQuantity))} kg
                      </td>
                      <td className="py-2.5 hidden sm:table-cell text-xs text-muted-foreground">{seller.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// USERS REPORT
// ════════════════════════════════════════════════════════════════════════════════
function UsersReport({ data }: { data: AnalyticsData }) {
  const stats = data.stats
  const roleBreakdown = data.roleBreakdown || []
  const monthlySignups = data.monthlySignups || []
  const topBuyers = data.topBuyers || []

  const roleColors: Record<string, string> = {
    SELLER: '#45A452',
    BUYER: '#6366f1',
    MIXED: '#f59e0b',
    ADMIN: '#ef4444',
  }

  const roleLabels: Record<string, string> = {
    SELLER: 'Vendeurs',
    BUYER: 'Acheteurs',
    MIXED: 'Mixtes',
    ADMIN: 'Admins',
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard
          title="Total utilisateurs"
          value={formatNumber(Number(stats.totalUsers) || 0)}
          icon={Users}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatsCard
          title="Note moyenne"
          value={(Number(stats.avgRating) || 0).toFixed(1) + ' / 5'}
          icon={Star}
          iconColor="text-[#45A452]"
          iconBg="bg-[#45A452]/10"
        />
        <StatsCard
          title="Vendeurs"
          value={formatNumber(roleBreakdown.find((r) => r.role === 'SELLER')?._count || 0)}
          icon={ArrowUpRight}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatsCard
          title="Acheteurs"
          value={formatNumber(roleBreakdown.find((r) => r.role === 'BUYER')?._count || 0)}
          icon={ShoppingCart}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      {/* ── Chart 6: Monthly Signups (area with gradient + data points) ── */}
      {/* ── Chart 7: Role Breakdown (ring with emphasis animation) ─────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {monthlySignups.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#45A452]" />
                Inscriptions mensuelles
              </CardTitle>
              <CardDescription>Évolution du nombre de nouveaux utilisateurs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ReactECharts
                  opts={{ renderer: 'svg' }}
                  style={{ height: '100%', width: '100%' }}
                  option={{
                    tooltip: {
                      ...TOOLTIP_STYLE,
                      trigger: 'axis',
                      formatter: (params: Array<{ value: number; marker: string }>) => {
                        const p = params[0]
                        return `<div style="font-weight:600;margin-bottom:4px;">${formatMonth(monthlySignups[p?.dataIndex]?.month || '')}</div>` +
                          `<div>${p.marker} ${formatNumber(p.value)} Inscriptions</div>`
                      },
                    },
                    grid: { left: 10, right: 20, top: 20, bottom: 10, containLabel: true },
                    xAxis: {
                      type: 'category',
                      boundaryGap: false,
                      data: monthlySignups.map((d) => formatMonth(d.month)),
                      axisLabel: { fontSize: 11, color: '#64748b' },
                      axisLine: { lineStyle: { color: '#e2e8f0' } },
                      axisTick: { show: false },
                    },
                    yAxis: {
                      type: 'value',
                      axisLabel: { fontSize: 11, color: '#64748b' },
                      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
                      axisLine: { show: false },
                    },
                    series: [
                      {
                        name: 'Inscriptions',
                        type: 'line',
                        smooth: true,
                        symbol: 'circle',
                        symbolSize: 8,
                        showSymbol: true,
                        lineStyle: { width: 2, color: '#45A452' },
                        itemStyle: {
                          color: '#45A452',
                          borderWidth: 2,
                          borderColor: '#fff',
                        },
                        areaStyle: {
                          color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                              { offset: 0, color: 'rgba(69,164,82,0.25)' },
                              { offset: 1, color: 'rgba(69,164,82,0.01)' },
                            ],
                          },
                        },
                        data: monthlySignups.map((d) => d.count),
                      },
                    ],
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {roleBreakdown.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-500" />
                Répartition par rôle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ReactECharts
                  opts={{ renderer: 'svg' }}
                  style={{ height: '100%', width: '100%' }}
                  option={{
                    tooltip: {
                      ...TOOLTIP_STYLE,
                      trigger: 'item',
                      formatter: (params: { name: string; value: number; marker: string; percent: number }) => {
                        return `<div style="font-weight:600;margin-bottom:4px;">${params.name}</div>` +
                          `<div>${params.marker} ${formatNumber(params.value)} utilisateurs</div>` +
                          `<div style="color:#94a3b8;font-size:11px;">${params.percent}%</div>`
                      },
                    },
                    legend: {
                      type: 'scroll',
                      bottom: 0,
                      left: 'center',
                      textStyle: { fontSize: 11, color: '#64748b' },
                      itemWidth: 10,
                      itemHeight: 10,
                      itemGap: 12,
                    },
                    series: [
                      {
                        type: 'pie',
                        radius: ['40%', '70%'],
                        center: ['50%', '45%'],
                        avoidLabelOverlap: true,
                        itemStyle: {
                          borderRadius: 6,
                          borderColor: '#fff',
                          borderWidth: 2,
                        },
                        emphasis: {
                          scaleSize: 12,
                          label: {
                            show: true,
                            fontSize: 14,
                            fontWeight: 'bold',
                            color: '#334155',
                          },
                          itemStyle: {
                            shadowBlur: 14,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0,0,0,0.2)',
                          },
                          animationType: 'scale',
                          animationEasing: 'elasticOut',
                        },
                        label: {
                          show: true,
                          fontSize: 11,
                          color: '#64748b',
                          formatter: '{b}\n{d}%',
                        },
                        labelLine: {
                          lineStyle: { color: '#cbd5e1' },
                          length: 12,
                          length2: 8,
                        },
                        animationType: 'scale',
                        animationEasing: 'elasticOut',
                        data: roleBreakdown.map((r) => ({
                          name: roleLabels[r.role] || r.role,
                          value: r._count,
                          itemStyle: { color: roleColors[r.role] || '#94a3b8' },
                        })),
                      },
                    ],
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Buyers */}
      {topBuyers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-[#6366f1]" />
              Top acheteurs
            </CardTitle>
            <CardDescription>Les acheteurs les plus actifs par montant total dépensé</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">#</th>
                    <th className="pb-2 pr-4 font-medium">Acheteur</th>
                    <th className="pb-2 pr-4 font-medium hidden sm:table-cell">Téléphone</th>
                    <th className="pb-2 pr-4 font-medium">Offres gagnantes</th>
                    <th className="pb-2 font-medium">Total dépensé</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topBuyers.map((buyer, idx) => (
                    <tr key={buyer.buyerId} className="hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 pr-4">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${idx < 3 ? 'bg-amber-50 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 font-medium">{buyer.name}</td>
                      <td className="py-2.5 pr-4 hidden sm:table-cell text-xs text-muted-foreground">{buyer.phone}</td>
                      <td className="py-2.5 pr-4">
                        <Badge variant="secondary" className="font-semibold">{buyer.bidCount}</Badge>
                      </td>
                      <td className="py-2.5 font-semibold text-[#45A452]">{formatCurrency(buyer.totalSpent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
