'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Gavel,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  XCircle,
  Ban,
  Play,
  MoreHorizontal,
  ArrowUpRight,
  Clock,
  MapPin,
  User,
  Package,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsCard } from '@/components/stats-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import ReactECharts from 'echarts-for-react'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Auction {
  id: string
  title: string
  description: string | null
  quantity: number
  reservePrice: number | null
  status: string
  endDate: string
  isOffline: boolean
  viewCount: number
  createdAt: string
  publishedAt: string | null
  closedAt: string | null
  seller: { id: string; name: string | null; phone: string; enterprise: string | null } | null
  oliveType: { id: string; name: string } | null
  region: { id: string; name: string } | null
  bidCount: number
  highestBid: { pricePerKg: number; status: string } | null
}

interface AuctionDetail extends Auction {
  images: { id: string; url: string; order: number }[]
  bids: {
    id: string
    pricePerKg: number
    totalPrice: number
    status: string
    createdAt: string
    buyer: { id: string; name: string | null; phone: string } | null
  }[]
  transaction: {
    id: string
    finalPrice: number
    status: string
    completedAt: string | null
  } | null
}

interface FilterOption {
  id: string
  name: string
  _count?: { auctions: number }
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

const BID_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  WINNING: 'En tête',
  WON: 'Gagnée',
  LOST: 'Perdue',
  WITHDRAWN: 'Retirée',
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatNumber(n: number): string {
  return n.toLocaleString('fr-FR')
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

function getDaysRemaining(endDate: string): number {
  const diff = new Date(endDate).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────
function AuctionsSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-12 rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ─── Expanded Row ──────────────────────────────────────────────────────────────
function ExpandedAuction({ auction }: { auction: AuctionDetail }) {
  return (
    <div className="border-t bg-muted/30 px-4 py-4">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Bids list */}
        <div className="md:col-span-2">
          <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-[#45A452]" />
            Offres ({auction.bids.length})
          </h4>
          {auction.bids.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune offre pour le moment</p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {auction.bids.map((bid, idx) => (
                <div
                  key={bid.id}
                  className="flex items-center justify-between rounded-lg bg-background p-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-medium">
                        {bid.buyer?.name || bid.buyer?.phone}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatDate(bid.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold text-[#45A452]">
                        {bid.pricePerKg.toFixed(2)} DT/kg
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total: {formatNumber(Math.round(bid.totalPrice))} DT
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-medium"
                      style={{
                        backgroundColor: (bid.status === 'WINNING' || bid.status === 'WON' ? '#45A452' : '#94a3b8') + '15',
                        color: bid.status === 'WINNING' || bid.status === 'WON' ? '#45A452' : '#94a3b8',
                      }}
                    >
                      {BID_STATUS_LABELS[bid.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seller + Transaction info */}
        <div className="space-y-4">
          {/* Seller card */}
          <div>
            <h4 className="mb-2 text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              Vendeur
            </h4>
            <div className="rounded-lg bg-background p-3 space-y-1.5 text-sm">
              <p className="font-medium">{auction.seller?.name || 'N/A'}</p>
              <p className="text-muted-foreground">{auction.seller?.phone}</p>
              {auction.seller?.enterprise && (
                <p className="text-muted-foreground">{auction.seller.enterprise}</p>
              )}
            </div>
          </div>

          {/* Auction details */}
          <div>
            <h4 className="mb-2 text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-500" />
              Détails
            </h4>
            <div className="rounded-lg bg-background p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantité</span>
                <span className="font-medium">{formatNumber(Math.round(auction.quantity))} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prix réserve</span>
                <span className="font-medium">
                  {auction.reservePrice ? `${auction.reservePrice.toFixed(2)} DT/kg` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vues</span>
                <span className="font-medium">{auction.viewCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{auction.isOffline ? '🌍 Présentiel' : '💻 En ligne'}</span>
              </div>
            </div>
          </div>

          {/* Transaction */}
          {auction.transaction && (
            <div>
              <h4 className="mb-2 text-sm font-semibold">Transaction</h4>
              <div className="rounded-lg bg-background p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant</span>
                  <span className="font-semibold text-[#45A452]">
                    {formatNumber(Math.round(auction.transaction.finalPrice))} DT
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {auction.transaction.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Auctions Page ────────────────────────────────────────────────────────
export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, closed: 0, draft: 0, expired: 0, cancelled: 0 })
  const [withBidsCount, setWithBidsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedDetail, setExpandedDetail] = useState<AuctionDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [oliveTypeFilter, setOliveTypeFilter] = useState('ALL')
  const [regionFilter, setRegionFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filter options
  const [oliveTypes, setOliveTypes] = useState<FilterOption[]>([])
  const [regions, setRegions] = useState<FilterOption[]>([])

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; title: string }>({
    open: false,
    id: '',
    title: '',
  })

  // ─── Fetch auctions ─────────────────────────────────────────────────────────
  const fetchAuctions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        status: statusFilter,
        oliveTypeId: oliveTypeFilter,
        regionId: regionFilter,
        search,
      })

      const res = await fetch(`/api/auctions?${params}`)
      if (!res.ok) throw new Error('Fetch error')
      const data = await res.json()

      setAuctions(data.auctions)
      setTotalPages(data.pagination.totalPages)

      // Compute stats from data
      const allStatuses = ['ACTIVE', 'CLOSED', 'DRAFT', 'EXPIRED', 'CANCELLED']
      const statusCounts = await Promise.all(
        allStatuses.map(async (s) => {
          const r = await fetch(`/api/auctions?status=${s}&limit=1`)
          const d = await r.json()
          return { status: s, count: d.pagination.total }
        })
      )
      const totalRes = await fetch('/api/auctions?limit=1')
      const totalData = await totalRes.json()

      const statsMap: Record<string, number> = {}
      statusCounts.forEach((s) => { statsMap[s.status] = s.count })

      setStats({
        total: totalData.pagination.total,
        active: statsMap.ACTIVE || 0,
        closed: statsMap.CLOSED || 0,
        draft: statsMap.DRAFT || 0,
        expired: statsMap.EXPIRED || 0,
        cancelled: statsMap.CANCELLED || 0,
      })

      // Fetch with-bids count (auctions that have at least one bid)
      try {
        const bidsRes = await fetch('/api/auctions?limit=100')
        const bidsData = await bidsRes.json()
        const auctionsList = bidsData.auctions || []
        const wbCount = auctionsList.filter((a: Auction) => a.bidCount > 0).length
        setWithBidsCount(wbCount)
      } catch { /* ignore */ }
    } catch (error) {
      console.error('Auctions fetch error:', error)
      toast.error('Erreur lors du chargement des enchères')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, oliveTypeFilter, regionFilter, search])

  // ─── Fetch filter options ─────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/api/olive-types').then((r) => r.json()),
      fetch('/api/regions').then((r) => r.json()),
    ]).then(([oliveData, regionData]) => {
      setOliveTypes(oliveData)
      setRegions(regionData)
    })
  }, [])

  useEffect(() => {
    fetchAuctions()
  }, [fetchAuctions])

  // ─── Toggle expand ────────────────────────────────────────────────────────
  const toggleExpand = async (auctionId: string) => {
    if (expandedId === auctionId) {
      setExpandedId(null)
      setExpandedDetail(null)
      return
    }

    setExpandedId(auctionId)
    setLoadingDetail(true)

    try {
      const res = await fetch(`/api/auctions/${auctionId}`)
      if (!res.ok) throw new Error('Detail fetch error')
      const data = await res.json()
      setExpandedDetail(data)
    } catch {
      toast.error('Erreur lors du chargement du détail')
    } finally {
      setLoadingDetail(false)
    }
  }

  // ─── Update status ────────────────────────────────────────────────────────
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/auctions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }

      toast.success(`Enchère ${STATUS_LABELS[newStatus]?.toLowerCase() || newStatus}`)
      fetchAuctions()
      if (expandedId === id) setExpandedId(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  // ─── Delete auction ───────────────────────────────────────────────────────
  const deleteAuction = async () => {
    try {
      const res = await fetch(`/api/auctions/${deleteDialog.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }

      toast.success('Enchère supprimée')
      setDeleteDialog({ open: false, id: '', title: '' })
      fetchAuctions()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading && auctions.length === 0) return <AuctionsSkeleton />

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatsCard
          title="Total enchères"
          value={stats.total}
          icon={Gavel}
          iconColor="text-[#45A452]"
          iconBg="bg-[#45A452]/10"
        />
        <StatsCard
          title="Actives"
          value={stats.active}
          subtitle="en cours"
          icon={Play}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatsCard
          title="Clôturées"
          value={stats.closed}
          icon={Ban}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
        <StatsCard
          title="Brouillons"
          value={stats.draft}
          icon={Package}
          iconColor="text-slate-500"
          iconBg="bg-slate-100"
        />
        <StatsCard
          title="Expirées"
          value={stats.expired}
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
      </div>

      {/* Charts Row: Donut + Funnel */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Status Donut Chart */}
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Répartition par statut</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <ReactECharts
              opts={{ renderer: 'svg' }}
              style={{ height: 200, width: '100%' }}
              option={{
                tooltip: {
                  trigger: 'item',
                  formatter: '{b}: {c} ({d}%)',
                },
                legend: {
                  bottom: 0,
                  itemWidth: 10,
                  itemHeight: 10,
                  textStyle: { fontSize: 11, color: '#64748b' },
                },
                series: [
                  {
                    type: 'pie',
                    radius: ['45%', '72%'],
                    center: ['50%', '42%'],
                    avoidLabelOverlap: false,
                    label: { show: false },
                    emphasis: {
                      label: { show: true, fontSize: 13, fontWeight: 'bold' },
                    },
                    itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
                    data: [
                      { value: stats.active, name: 'Active', itemStyle: { color: '#45A452' } },
                      { value: stats.closed, name: 'Clôturée', itemStyle: { color: '#6366f1' } },
                      { value: stats.draft, name: 'Brouillon', itemStyle: { color: '#94a3b8' } },
                      { value: stats.expired, name: 'Expirée', itemStyle: { color: '#f59e0b' } },
                      { value: stats.cancelled, name: 'Annulée', itemStyle: { color: '#ef4444' } },
                    ].filter((d) => d.value > 0),
                  },
                ],
              }}
            />
          </CardContent>
        </Card>

        {/* Auction Lifecycle Funnel */}
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Cycle de vie des enchères</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <ReactECharts
              opts={{ renderer: 'svg' }}
              style={{ height: 200, width: '100%' }}
              option={{
                tooltip: {
                  trigger: 'item',
                  formatter: '{b}: {c}',
                },
                series: [
                  {
                    type: 'funnel',
                    left: '10%',
                    top: 10,
                    bottom: 10,
                    width: '80%',
                    min: 0,
                    max: Math.max(stats.total, 1),
                    minSize: '15%',
                    maxSize: '100%',
                    sort: 'descending',
                    gap: 4,
                    label: {
                      show: true,
                      position: 'inside',
                      fontSize: 12,
                      formatter: '{b}\n{c}',
                      color: '#fff',
                    },
                    itemStyle: {
                      borderColor: '#fff',
                      borderWidth: 2,
                    },
                    data: [
                      { value: stats.total, name: 'Total', itemStyle: { color: '#45A452' } },
                      { value: stats.active, name: 'Actives', itemStyle: { color: '#22c55e' } },
                      { value: withBidsCount, name: 'Avec offres', itemStyle: { color: '#6366f1' } },
                      { value: stats.closed, name: 'Clôturées', itemStyle: { color: '#818cf8' } },
                    ].filter((d) => d.value > 0),
                  },
                ],
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9 h-10"
              />
            </div>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="h-10 w-full md:w-[150px]">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="CLOSED">Clôturée</SelectItem>
                <SelectItem value="DRAFT">Brouillon</SelectItem>
                <SelectItem value="EXPIRED">Expirée</SelectItem>
                <SelectItem value="CANCELLED">Annulée</SelectItem>
              </SelectContent>
            </Select>

            {/* Olive type filter */}
            <Select value={oliveTypeFilter} onValueChange={(v) => { setOliveTypeFilter(v); setPage(1) }}>
              <SelectTrigger className="h-10 w-full md:w-[160px]">
                <SelectValue placeholder="Type d'olive" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les types</SelectItem>
                {oliveTypes.map((ot) => (
                  <SelectItem key={ot.id} value={ot.id}>{ot.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Region filter */}
            <Select value={regionFilter} onValueChange={(v) => { setRegionFilter(v); setPage(1) }}>
              <SelectTrigger className="h-10 w-full md:w-[160px]">
                <SelectValue placeholder="Région" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes les régions</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Refresh */}
            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={fetchAuctions}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-muted-foreground">
          {auctions.length} enchère{auctions.length > 1 ? 's' : ''} affichée{auctions.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Auctions Table */}
      <div className="space-y-2">
        {auctions.map((auction) => {
          const isExpanded = expandedId === auction.id
          const daysLeft = getDaysRemaining(auction.endDate)
          const isUrgent = auction.status === 'ACTIVE' && daysLeft <= 3 && daysLeft >= 0

          return (
            <Card key={auction.id} className={`overflow-hidden transition-all ${isExpanded ? 'ring-1 ring-[#45A452]/30' : ''}`}>
              {/* Main row */}
              <div
                role="button"
                tabIndex={0}
                className="flex w-full items-center gap-3 p-3 md:p-4 text-left hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => toggleExpand(auction.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(auction.id) } }}
              >
                {/* Expand icon */}
                <div className="shrink-0">
                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  }
                </div>

                {/* Status + Title */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-semibold shrink-0"
                      style={{
                        backgroundColor: (STATUS_COLORS[auction.status] || '#94a3b8') + '15',
                        color: STATUS_COLORS[auction.status] || '#94a3b8',
                      }}
                    >
                      {STATUS_LABELS[auction.status]}
                    </Badge>
                    {auction.isOffline && (
                      <Badge variant="outline" className="text-[10px]">Présentiel</Badge>
                    )}
                    <span className="font-medium text-sm truncate">
                      {auction.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {auction.seller?.name || auction.seller?.phone}
                    </span>
                    <span className="hidden sm:flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {auction.region?.name}
                    </span>
                    <span>{auction.oliveType?.name}</span>
                  </div>
                </div>

                {/* Price + Quantity */}
                <div className="hidden md:flex flex-col items-end shrink-0 text-right">
                  <span className="font-semibold text-sm text-[#45A452]">
                    {auction.highestBid
                      ? `${auction.highestBid.pricePerKg.toFixed(2)} DT/kg`
                      : auction.reservePrice
                        ? `${auction.reservePrice.toFixed(2)} DT/kg`
                        : '—'
                    }
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatNumber(Math.round(auction.quantity))} kg
                  </span>
                </div>

                {/* Bids count */}
                <div className="hidden sm:flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3" />
                  <span className="font-medium">{auction.bidCount}</span>
                </div>

                {/* End date / Days left */}
                <div className="hidden lg:flex flex-col items-end shrink-0">
                  {auction.status === 'ACTIVE' ? (
                    <span className={`text-xs font-medium ${isUrgent ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {isUrgent ? '🔥' : '🕐'} {daysLeft >= 0 ? `${daysLeft}j restants` : 'Expirée'}
                    </span>
                  ) : auction.status === 'CLOSED' ? (
                    <span className="text-xs text-muted-foreground">
                      {auction.closedAt ? formatDateShort(auction.closedAt) : '—'}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {formatDateShort(auction.endDate)}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleExpand(auction.id) }}>
                      <Eye className="mr-2 h-4 w-4" /> Voir détails
                    </DropdownMenuItem>
                    {auction.status === 'DRAFT' && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatus(auction.id, 'ACTIVE') }}>
                        <Play className="mr-2 h-4 w-4 text-[#45A452]" /> Publier
                      </DropdownMenuItem>
                    )}
                    {auction.status === 'ACTIVE' && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatus(auction.id, 'CLOSED') }}>
                        <Ban className="mr-2 h-4 w-4 text-indigo-500" /> Clôturer
                      </DropdownMenuItem>
                    )}
                    {auction.status !== 'ACTIVE' && auction.status !== 'CANCELLED' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteDialog({ open: true, id: auction.id, title: auction.title })
                          }}
                        >
                          <XCircle className="mr-2 h-4 w-4" /> Supprimer
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                loadingDetail ? (
                  <div className="border-t p-4 space-y-3">
                    <Skeleton className="h-20 rounded-lg" />
                    <Skeleton className="h-20 rounded-lg" />
                  </div>
                ) : expandedDetail ? (
                  <ExpandedAuction auction={expandedDetail} />
                ) : null
              )}
            </Card>
          )
        })}

        {/* Empty state */}
        {!loading && auctions.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#45A452]/10">
              <Gavel className="h-7 w-7 text-[#45A452]" />
            </div>
            <p className="text-sm font-medium">Aucune enchère trouvée</p>
            <p className="text-xs text-muted-foreground">Essayez de modifier vos filtres</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Précédent</span>
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 7) {
                pageNum = i + 1
              } else if (page <= 4) {
                pageNum = i + 1
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i
              } else {
                pageNum = page - 3 + i
              }
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  className="w-9 h-9"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            <span className="hidden sm:inline mr-1">Suivant</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Voulez-vous vraiment supprimer l&apos;enchère{' '}
              <strong className="text-foreground">{deleteDialog.title}</strong> ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, id: '', title: '' })}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={deleteAuction}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
