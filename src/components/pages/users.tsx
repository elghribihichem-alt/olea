'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import {
  Users,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Star,
  Gavel,
  ArrowUpRight,
  ShoppingCart,
  MessageSquare,
  Shield,
  ShieldOff,
  RefreshCw,
  Phone,
  Building,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
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

// ─── Types ─────────────────────────────────────────────────────────────────────
interface User {
  id: string
  phone: string
  email: string | null
  name: string | null
  enterprise: string | null
  role: string
  status: string
  rating: number
  totalRatings: number
  language: string
  createdAt: string
  _count: {
    auctions: number
    bids: number
    transactionsAsBuyer: number
    transactionsAsSeller: number
    reviewsGiven: number
    reviewsReceived: number
  }
}

interface UserDetail extends User {
  updatedAt: string
  avatar: string | null
  auctions: {
    id: string; title: string; status: string; quantity: number; createdAt: string
    oliveType: { name: string } | null
    _count: { bids: number }
  }[]
  bids: {
    id: string; pricePerKg: number; totalPrice: number; status: string; createdAt: string
    auction: { id: string; title: string; status: string; oliveType: { name: string } | null } | null
  }[]
  reviewsReceived: {
    id: string; rating: number; comment: string | null; createdAt: string
    reviewer: { id: string; name: string | null; phone: string } | null
  }[]
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  SELLER: 'Vendeur',
  BUYER: 'Acheteur',
  MIXED: 'Mixte',
  ADMIN: 'Admin',
}

const ROLE_COLORS: Record<string, string> = {
  SELLER: '#45A452',
  BUYER: '#6366f1',
  MIXED: '#f59e0b',
  ADMIN: '#ef4444',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
  PENDING: 'En attente',
}

const BID_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  WINNING: 'En tête',
  WON: 'Gagnée',
  LOST: 'Perdue',
  WITHDRAWN: 'Retirée',
}

const AUCTION_STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#45A452',
  CLOSED: '#6366f1',
  DRAFT: '#94a3b8',
  EXPIRED: '#f59e0b',
  CANCELLED: '#ef4444',
}

const AUCTION_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  CLOSED: 'Clôturée',
  DRAFT: 'Brouillon',
  EXPIRED: 'Expirée',
  CANCELLED: 'Annulée',
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
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

function formatNumber(n: number): string {
  return n.toLocaleString('fr-FR')
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────
function UsersSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-12 rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ─── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ rating, total }: { rating: number; total: number }) {
  if (total === 0) return <span className="text-xs text-muted-foreground">Aucun avis</span>

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {rating.toFixed(1)} ({total})
      </span>
    </div>
  )
}

// ─── Expanded User Detail ─────────────────────────────────────────────────────
function ExpandedUser({ user }: { user: UserDetail }) {
  return (
    <div className="border-t bg-muted/30 px-4 py-4">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Last auctions */}
        <div className="md:col-span-1">
          <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
            <Gavel className="h-4 w-4 text-[#45A452]" />
            Dernières enchères
          </h4>
          {user.auctions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune enchère</p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {user.auctions.map((a) => (
                <div key={a.id} className="rounded-lg bg-background p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate max-w-[160px]">{a.title}</span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] shrink-0 ml-2"
                      style={{
                        backgroundColor: (AUCTION_STATUS_COLORS[a.status] || '#94a3b8') + '15',
                        color: AUCTION_STATUS_COLORS[a.status] || '#94a3b8',
                      }}
                    >
                      {AUCTION_STATUS_LABELS[a.status]}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{a.oliveType?.name}</span>
                    <span>•</span>
                    <span>{formatNumber(Math.round(a.quantity))} kg</span>
                    <span>•</span>
                    <span>{a._count.bids} offres</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Last bids */}
        <div className="md:col-span-1">
          <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-indigo-500" />
            Dernières offres
          </h4>
          {user.bids.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune offre</p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {user.bids.map((b) => (
                <div key={b.id} className="rounded-lg bg-background p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate max-w-[140px]">{b.auction?.title}</span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] shrink-0 ml-2"
                      style={{
                        backgroundColor: (b.status === 'WINNING' || b.status === 'WON' ? '#45A452' : '#94a3b8') + '15',
                        color: b.status === 'WINNING' || b.status === 'WON' ? '#45A452' : '#94a3b8',
                      }}
                    >
                      {BID_STATUS_LABELS[b.status]}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{b.auction?.oliveType?.name}</span>
                    <span className="font-semibold text-[#45A452]">{b.pricePerKg.toFixed(2)} DT/kg</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews + Activity */}
        <div className="space-y-4">
          {/* Activity stats */}
          <div>
            <h4 className="mb-2 text-sm font-semibold">Activité</h4>
            <div className="rounded-lg bg-background p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Enchères créées</span>
                <span className="font-medium">{user._count.auctions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Offres placées</span>
                <span className="font-medium">{user._count.bids}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Achats</span>
                <span className="font-medium">{user._count.transactionsAsBuyer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ventes</span>
                <span className="font-medium">{user._count.transactionsAsSeller}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avis reçus</span>
                <span className="font-medium">{user._count.reviewsReceived}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inscription</span>
                <span className="font-medium">{formatDateShort(user.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div>
            <h4 className="mb-2 text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-500" />
              Derniers avis
            </h4>
            {user.reviewsReceived.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun avis</p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {user.reviewsReceived.map((r) => (
                  <div key={r.id} className="rounded-lg bg-background p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {r.reviewer?.name || r.reviewer?.phone}
                      </span>
                      <div className="flex">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Users Page ───────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0, pending: 0, sellers: 0, buyers: 0, mixed: 0, admins: 0 })
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedDetail, setExpandedDetail] = useState<UserDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Role change dialog
  const [roleDialog, setRoleDialog] = useState<{
    open: boolean
    userId: string
    userName: string
    currentRole: string
    newRole: string
  }>({ open: false, userId: '', userName: '', currentRole: '', newRole: '' })

  // ─── Fetch users ──────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        role: roleFilter,
        status: statusFilter,
        search,
      })

      const res = await fetch(`/api/users?${params}`)
      if (!res.ok) throw new Error('Fetch error')
      const data = await res.json()

      setUsers(data.users)
      setTotalPages(data.pagination.totalPages)

      // Fetch counts for stats
      const allRoles = ['SELLER', 'BUYER', 'MIXED', 'ADMIN']
      const allStatuses = ['ACTIVE', 'SUSPENDED', 'PENDING']
      const [totalRes, roleCounts, statusCounts] = await Promise.all([
        fetch('/api/users?limit=1').then((r) => r.json()),
        Promise.all(allRoles.map((r) => fetch(`/api/users?role=${r}&limit=1`).then((res) => res.json()))),
        Promise.all(allStatuses.map((s) => fetch(`/api/users?status=${s}&limit=1`).then((res) => res.json()))),
      ])

      const roleMap: Record<string, number> = {}
      roleCounts.forEach((d, i) => { roleMap[allRoles[i]] = d.pagination.total })
      const statusMap: Record<string, number> = {}
      statusCounts.forEach((d, i) => { statusMap[allStatuses[i]] = d.pagination.total })

      setStats({
        total: totalRes.pagination.total,
        active: statusMap.ACTIVE || 0,
        suspended: statusMap.SUSPENDED || 0,
        pending: statusMap.PENDING || 0,
        sellers: roleMap.SELLER || 0,
        buyers: roleMap.BUYER || 0,
        mixed: roleMap.MIXED || 0,
        admins: roleMap.ADMIN || 0,
      })
    } catch (error) {
      console.error('Users fetch error:', error)
      toast.error('Erreur lors du chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }, [page, roleFilter, statusFilter, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // ─── Toggle expand ────────────────────────────────────────────────────────
  const toggleExpand = async (userId: string) => {
    if (expandedId === userId) {
      setExpandedId(null)
      setExpandedDetail(null)
      return
    }

    setExpandedId(userId)
    setLoadingDetail(true)

    try {
      const res = await fetch(`/api/users/${userId}`)
      if (!res.ok) throw new Error('Detail fetch error')
      const data = await res.json()
      setExpandedDetail(data)
    } catch {
      toast.error('Erreur lors du chargement du profil')
    } finally {
      setLoadingDetail(false)
    }
  }

  // ─── Change role ──────────────────────────────────────────────────────────
  const changeRole = async () => {
    try {
      const res = await fetch(`/api/users/${roleDialog.userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleDialog.newRole }),
      })
      if (!res.ok) throw new Error()

      toast.success(`Rôle changé en ${ROLE_LABELS[roleDialog.newRole]}`)
      setRoleDialog({ open: false, userId: '', userName: '', currentRole: '', newRole: '' })
      fetchUsers()
    } catch {
      toast.error('Erreur lors du changement de rôle')
    }
  }

  // ─── Toggle status ────────────────────────────────────────────────────────
  const toggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()

      toast.success(`Utilisateur ${newStatus === 'ACTIVE' ? 'réactivé' : 'suspendu'}`)
      fetchUsers()
      if (expandedId === userId) setExpandedId(null)
    } catch {
      toast.error('Erreur lors du changement de statut')
    }
  }

  // ─── Chart Options ───────────────────────────────────────────────────────
  const roleChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 11, color: '#64748b' },
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 'bold' },
        },
        data: [
          { value: stats.sellers, name: 'Vendeurs', itemStyle: { color: '#45A452' } },
          { value: stats.buyers, name: 'Acheteurs', itemStyle: { color: '#6366f1' } },
          { value: stats.mixed, name: 'Mixtes', itemStyle: { color: '#f59e0b' } },
          { value: stats.admins, name: 'Admins', itemStyle: { color: '#ef4444' } },
        ].filter((d) => d.value > 0),
      },
    ],
  }), [stats])

  const statusChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: { left: 20, right: 30, top: 30, bottom: 30 },
    xAxis: {
      type: 'value',
      show: false,
    },
    yAxis: {
      type: 'category',
      data: ['Utilisateurs'],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 12 },
    },
    series: [
      {
        type: 'bar',
        stack: 'status',
        barWidth: 40,
        data: [
          {
            value: stats.active,
            itemStyle: {
              color: '#45A452',
              borderRadius: [6, 0, 0, 6],
            },
            label: {
              show: true,
              position: 'insideLeft',
              formatter: stats.active > 0 ? 'Actifs\n{c}' : '',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
            },
          },
          {
            value: stats.suspended,
            itemStyle: {
              color: '#ef4444',
              borderRadius: [0, 6, 6, 0],
            },
            label: {
              show: true,
              position: 'insideRight',
              formatter: stats.suspended > 0 ? 'Suspendus\n{c}' : '',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
            },
          },
        ],
      },
    ],
  }), [stats])

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading && users.length === 0) return <UsersSkeleton />

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatsCard
          title="Total utilisateurs"
          value={stats.total}
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatsCard
          title="Actifs"
          value={stats.active}
          subtitle={`${Math.round((stats.active / Math.max(stats.total, 1)) * 100)}%`}
          icon={Shield}
          iconColor="text-[#45A452]"
          iconBg="bg-[#45A452]/10"
        />
        <StatsCard
          title="Suspendus"
          value={stats.suspended}
          icon={ShieldOff}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
        <StatsCard
          title="Vendeurs"
          value={stats.sellers}
          icon={Gavel}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatsCard
          title="Acheteurs"
          value={stats.buyers}
          icon={ShoppingCart}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Role Distribution Ring */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Répartition des rôles</h3>
              <div className="flex items-center gap-1.5 text-xs text-[#45A452]">
                <span className="font-medium">{stats.total}</span>
                <span className="text-muted-foreground">utilisateurs</span>
              </div>
            </div>
            <div className="h-56">
              <ReactECharts
                opts={{ renderer: 'svg' }}
                option={roleChartOption}
                style={{ height: '100%', width: '100%' }}
                notMerge
              />
            </div>
          </CardContent>
        </Card>

        {/* User Status Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Statut des utilisateurs</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#45A452]" />
                  <span className="text-muted-foreground">Actifs</span>
                  <span className="font-medium text-foreground">{stats.active}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
                  <span className="text-muted-foreground">Suspendus</span>
                  <span className="font-medium text-foreground">{stats.suspended}</span>
                </div>
              </div>
            </div>
            <div className="h-56">
              <ReactECharts
                opts={{ renderer: 'svg' }}
                option={statusChartOption}
                style={{ height: '100%', width: '100%' }}
                notMerge
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, téléphone, email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9 h-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }}>
              <SelectTrigger className="h-10 w-full md:w-[150px]">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les rôles</SelectItem>
                <SelectItem value="SELLER">Vendeurs</SelectItem>
                <SelectItem value="BUYER">Acheteurs</SelectItem>
                <SelectItem value="MIXED">Mixtes</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="h-10 w-full md:w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="ACTIVE">Actifs</SelectItem>
                <SelectItem value="SUSPENDED">Suspendus</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={fetchUsers}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-muted-foreground">
          {users.length} utilisateur{users.length > 1 ? 's' : ''} affiché{users.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Users List */}
      <div className="space-y-2">
        {users.map((user) => {
          const isExpanded = expandedId === user.id

          return (
            <Card key={user.id} className={`overflow-hidden transition-all ${isExpanded ? 'ring-1 ring-[#45A452]/30' : ''}`}>
              <div
                role="button"
                tabIndex={0}
                className="flex w-full items-center gap-3 p-3 md:p-4 text-left hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => toggleExpand(user.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(user.id) } }}
              >
                <div className="shrink-0">
                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  }
                </div>

                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: ROLE_COLORS[user.role] || '#94a3b8' }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : user.phone.slice(-2)}
                </div>

                {/* Name + info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {user.name || 'Sans nom'}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-semibold shrink-0"
                      style={{
                        backgroundColor: (ROLE_COLORS[user.role] || '#94a3b8') + '15',
                        color: ROLE_COLORS[user.role] || '#94a3b8',
                      }}
                    >
                      {ROLE_LABELS[user.role]}
                    </Badge>
                    {user.status === 'SUSPENDED' && (
                      <Badge variant="secondary" className="text-[10px] bg-red-50 text-red-600">
                        Suspendu
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {user.phone}
                    </span>
                    {user.enterprise && (
                      <span className="hidden sm:flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {user.enterprise}
                      </span>
                    )}
                    <span>Inscrit {formatDateShort(user.createdAt)}</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="hidden md:flex items-center">
                  <StarRating rating={user.rating} total={user.totalRatings} />
                </div>

                {/* Activity counts */}
                <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                  <span className="flex items-center gap-1" title="Enchères">
                    <Gavel className="h-3 w-3" />
                    <span className="font-medium">{user._count.auctions}</span>
                  </span>
                  <span className="flex items-center gap-1" title="Offres">
                    <ArrowUpRight className="h-3 w-3" />
                    <span className="font-medium">{user._count.bids}</span>
                  </span>
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
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleExpand(user.id) }}>
                      <Users className="mr-2 h-4 w-4" /> Voir le profil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuItem>
                        <Shield className="mr-2 h-4 w-4" /> Changer le rôle
                      </DropdownMenuItem>
                      <DropdownMenuSubContent>
                        {['SELLER', 'BUYER', 'MIXED'].map((r) => (
                          <DropdownMenuItem
                            key={r}
                            disabled={user.role === r}
                            onClick={(e) => {
                              e.stopPropagation()
                              setRoleDialog({
                                open: true,
                                userId: user.id,
                                userName: user.name || user.phone,
                                currentRole: user.role,
                                newRole: r,
                              })
                            }}
                          >
                            {ROLE_LABELS[r]} {user.role === r && '✓'}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); toggleStatus(user.id, user.status) }}
                      className={user.status === 'ACTIVE' ? 'text-red-600' : 'text-[#45A452]'}
                    >
                      {user.status === 'ACTIVE' ? (
                        <>
                          <ShieldOff className="mr-2 h-4 w-4" /> Suspendre
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" /> Réactiver
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                loadingDetail ? (
                  <div className="border-t p-4 space-y-3">
                    <Skeleton className="h-24 rounded-lg" />
                    <Skeleton className="h-24 rounded-lg" />
                  </div>
                ) : expandedDetail ? (
                  <ExpandedUser user={expandedDetail} />
                ) : null
              )}
            </Card>
          )
        })}

        {/* Empty state */}
        {!loading && users.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
              <Users className="h-7 w-7 text-blue-600" />
            </div>
            <p className="text-sm font-medium">Aucun utilisateur trouvé</p>
            <p className="text-xs text-muted-foreground">Essayez de modifier vos filtres</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
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
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            <span className="hidden sm:inline mr-1">Suivant</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Role Change Dialog */}
      <Dialog open={roleDialog.open} onOpenChange={(open) => setRoleDialog({ ...roleDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le rôle</DialogTitle>
            <DialogDescription>
              Voulez-vous changer le rôle de <strong className="text-foreground">{roleDialog.userName}</strong>
              {' '}de <Badge variant="secondary" className="text-[10px]">{ROLE_LABELS[roleDialog.currentRole]}</Badge>
              {' '}à <Badge variant="secondary" className="text-[10px]">{ROLE_LABELS[roleDialog.newRole]}</Badge> ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRoleDialog({ open: false, userId: '', userName: '', currentRole: '', newRole: '' })}>
              Annuler
            </Button>
            <Button onClick={changeRole}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
