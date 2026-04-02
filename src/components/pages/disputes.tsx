'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  AlertTriangle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  User,
  Gavel,
  MessageSquare,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import ReactECharts from 'echarts-for-react'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Report {
  id: string
  reporterId: string
  auctionId: string | null
  reportedUserId: string | null
  reason: string
  description: string | null
  status: string
  resolution: string | null
  createdAt: string
  updatedAt: string
  reporter: { id: string; name: string | null; phone: string } | null
  auction: {
    id: string; title: string; status: string; quantity: number; createdAt: string
    seller: { id: string; name: string | null; phone: string } | null
    oliveType: { name: string } | null
    region: { name: string } | null
    _count: { bids: number }
  } | null
}

interface ReportDetail extends Report {
  reporter: { id: string; name: string | null; phone: string; role: string } | null
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  IN_REVIEW: 'En cours',
  RESOLVED: 'Résolu',
  DISMISSED: 'Rejeté',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  IN_REVIEW: '#6366f1',
  RESOLVED: '#45A452',
  DISMISSED: '#94a3b8',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function DisputesSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-12 rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function DisputesPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, inReview: 0, resolved: 0, dismissed: 0 })
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedDetail, setExpandedDetail] = useState<ReportDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [resolveDialog, setResolveDialog] = useState<{
    open: boolean; id: string; type: 'resolve' | 'dismiss'
  }>({ open: false, id: '', type: 'resolve' })
  const [resolutionText, setResolutionText] = useState('')

  // ─── Fetch ───────────────────────────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20', status: statusFilter })
      const res = await fetch(`/api/reports?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setReports(data.reports)
      setTotalPages(data.pagination.totalPages)

      const counts = await Promise.all(
        ['ALL', 'PENDING', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'].map((s) =>
          fetch(`/api/reports?status=${s}&limit=1`).then((r) => r.json())
        )
      )
      setStats({
        total: counts[0].pagination.total,
        pending: counts[1].pagination.total,
        inReview: counts[2].pagination.total,
        resolved: counts[3].pagination.total,
        dismissed: counts[4].pagination.total,
      })
    } catch {
      toast.error('Erreur lors du chargement des litiges')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { fetchReports() }, [fetchReports])

  // ─── Expand ─────────────────────────────────────────────────────────────
  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      setExpandedDetail(null)
      return
    }
    setExpandedId(id)
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/reports/${id}`)
      if (!res.ok) throw new Error()
      setExpandedDetail(await res.json())
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoadingDetail(false)
    }
  }

  // ─── Action ────────────────────────────────────────────────────────────────
  const handleAction = async () => {
    try {
      const status = resolveDialog.type === 'resolve' ? 'RESOLVED' : 'DISMISSED'
      const res = await fetch(`/api/reports/${resolveDialog.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution: resolutionText || undefined }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      toast.success(resolveDialog.type === 'resolve' ? 'Litige résolu' : 'Litige rejeté')
      setResolveDialog({ open: false, id: '', type: 'resolve' })
      setResolutionText('')
      fetchReports()
      if (expandedId === resolveDialog.id) setExpandedId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    }
  }

  if (loading && reports.length === 0) return <DisputesSkeleton />

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatsCard title="Total litiges" value={stats.total} icon={AlertTriangle} iconColor="text-orange-600" iconBg="bg-orange-50" />
        <StatsCard title="En attente" value={stats.pending} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatsCard title="En cours" value={stats.inReview} icon={Eye} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
        <StatsCard title="Résolus" value={stats.resolved} icon={CheckCircle} iconColor="text-[#45A452]" iconBg="bg-[#45A452]/10" />
        <StatsCard title="Rejetés" value={stats.dismissed} icon={XCircle} iconColor="text-slate-500" iconBg="bg-slate-100" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-2 text-sm font-semibold">Répartition par statut</h3>
            <div className="h-56">
              <ReactECharts
                opts={{ renderer: 'svg' }}
                style={{ height: '100%', width: '100%' }}
                option={{
                  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
                  legend: { bottom: 0, textStyle: { fontSize: 11 } },
                  series: [
                    {
                      type: 'pie',
                      radius: ['50%', '75%'],
                      avoidLabelOverlap: false,
                      label: { show: false },
                      emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } },
                      data: [
                        { value: stats.pending, name: 'En attente', itemStyle: { color: STATUS_COLORS.PENDING } },
                        { value: stats.inReview, name: 'En cours', itemStyle: { color: STATUS_COLORS.IN_REVIEW } },
                        { value: stats.resolved, name: 'Résolu', itemStyle: { color: STATUS_COLORS.RESOLVED } },
                        { value: stats.dismissed, name: 'Rejeté', itemStyle: { color: STATUS_COLORS.DISMISSED } },
                      ].filter((d) => d.value > 0),
                    },
                  ],
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="mb-2 text-sm font-semibold">Volume par statut</h3>
            <div className="h-56">
              <ReactECharts
                opts={{ renderer: 'svg' }}
                style={{ height: '100%', width: '100%' }}
                option={{
                  tooltip: { trigger: 'axis' },
                  grid: { left: 8, right: 16, top: 12, bottom: 28, containLabel: true },
                  xAxis: {
                    type: 'category',
                    data: ['En attente', 'En cours', 'Résolu', 'Rejeté'],
                    axisLabel: { fontSize: 11 },
                  },
                  yAxis: {
                    type: 'value',
                    minInterval: 1,
                    axisLabel: { fontSize: 11 },
                  },
                  series: [
                    {
                      type: 'bar',
                      barWidth: '45%',
                      data: [
                        { value: stats.pending, itemStyle: { color: STATUS_COLORS.PENDING, borderRadius: [4, 4, 0, 0] } },
                        { value: stats.inReview, itemStyle: { color: STATUS_COLORS.IN_REVIEW, borderRadius: [4, 4, 0, 0] } },
                        { value: stats.resolved, itemStyle: { color: STATUS_COLORS.RESOLVED, borderRadius: [4, 4, 0, 0] } },
                        { value: stats.dismissed, itemStyle: { color: STATUS_COLORS.DISMISSED, borderRadius: [4, 4, 0, 0] } },
                      ],
                    },
                  ],
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="h-10 w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="IN_REVIEW">En cours</SelectItem>
                <SelectItem value="RESOLVED">Résolus</SelectItem>
                <SelectItem value="DISMISSED">Rejetés</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={fetchReports}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-2">
        {reports.map((report) => {
          const isExpanded = expandedId === report.id
          return (
            <Card key={report.id} className={`overflow-hidden transition-all ${isExpanded ? 'ring-1 ring-[#45A452]/30' : ''}`}>
              <div
                role="button"
                tabIndex={0}
                className="flex w-full items-center gap-3 p-3 md:p-4 text-left hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => toggleExpand(report.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(report.id) } }}
              >
                <div className="shrink-0">
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-semibold"
                      style={{ backgroundColor: (STATUS_COLORS[report.status] || '#94a3b8') + '15', color: STATUS_COLORS[report.status] || '#94a3b8' }}
                    >
                      {STATUS_LABELS[report.status]}
                    </Badge>
                    <span className="font-medium text-sm">{report.reason}</span>
                  </div>
                  {report.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{report.description}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{report.reporter?.name || report.reporter?.phone}</span>
                    {report.auction && (
                      <span className="flex items-center gap-1"><Gavel className="h-3 w-3" />{report.auction.title}</span>
                    )}
                    <span>{formatDate(report.createdAt)}</span>
                  </div>
                </div>

                {(report.status === 'PENDING' || report.status === 'IN_REVIEW') && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-[#45A452] hover:text-[#45A452] hover:bg-[#45A452]/10"
                      onClick={(e) => { e.stopPropagation(); setResolveDialog({ open: true, id: report.id, type: 'resolve' }); setResolutionText('') }}
                    >
                      <CheckCircle className="mr-1 h-3.5 w-3.5" /> Résoudre
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-red-600 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => { e.stopPropagation(); setResolveDialog({ open: true, id: report.id, type: 'dismiss' }); setResolutionText('') }}
                    >
                      <XCircle className="mr-1 h-3.5 w-3.5" /> Rejeter
                    </Button>
                  </div>
                )}
              </div>

              {/* Expanded */}
              {isExpanded && (
                loadingDetail ? (
                  <div className="border-t p-4"><Skeleton className="h-16 rounded-lg" /></div>
                ) : expandedDetail ? (
                  <div className="border-t bg-muted/30 px-4 py-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2"><User className="h-4 w-4 text-blue-500" /> Signaleur</h4>
                        <div className="rounded-lg bg-background p-3 space-y-1.5 text-sm">
                          <p className="font-medium">{expandedDetail.reporter?.name || 'N/A'}</p>
                          <p className="text-muted-foreground">{expandedDetail.reporter?.phone}</p>
                          <p className="text-xs text-muted-foreground">Le {formatDate(expandedDetail.createdAt)}</p>
                        </div>
                      </div>
                      {expandedDetail.auction && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold flex items-center gap-2"><Gavel className="h-4 w-4 text-[#45A452]" /> Enchère concernée</h4>
                          <div className="rounded-lg bg-background p-3 space-y-1.5 text-sm">
                            <p className="font-medium">{expandedDetail.auction.title}</p>
                            <p className="text-muted-foreground">Vendeur: {expandedDetail.auction.seller?.name || expandedDetail.auction.seller?.phone}</p>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              {expandedDetail.auction.oliveType && <span>{expandedDetail.auction.oliveType.name}</span>}
                              {expandedDetail.auction.region && <span> - {expandedDetail.auction.region.name}</span>}
                              <span> - {expandedDetail.auction._count.bids} offres</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <Separator className="my-2" />
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-2"><MessageSquare className="h-4 w-4 text-amber-500" /> Description</h4>
                        <p className="text-sm text-muted-foreground">{expandedDetail.description || 'Aucune description fournie'}</p>
                      </div>
                      {expandedDetail.resolution && (
                        <div>
                          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2"><CheckCircle className="h-4 w-4 text-[#45A452]" /> Résolution</h4>
                          <p className="text-sm text-muted-foreground bg-[#45A452]/5 rounded-lg p-3">{expandedDetail.resolution}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null
              )}
            </Card>
          )
        })}

        {!loading && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
              <AlertTriangle className="h-7 w-7 text-amber-600" />
            </div>
            <p className="text-sm font-medium">Aucun litige trouvé</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={resolveDialog.open} onOpenChange={(open) => setResolveDialog({ ...resolveDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{resolveDialog.type === 'resolve' ? 'Résoudre le litige' : 'Rejeter le litige'}</DialogTitle>
            <DialogDescription>
              {resolveDialog.type === 'resolve'
                ? 'Confirmez la résolution de ce litige. Vous pouvez ajouter une note.'
                : 'Confirmez le rejet de ce litige. Vous pouvez ajouter une raison.'}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={resolveDialog.type === 'resolve' ? 'Note de résolution (optionnel)...' : 'Raison du rejet (optionnel)...'}
            value={resolutionText}
            onChange={(e) => setResolutionText(e.target.value)}
            className="min-h-[80px]"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResolveDialog({ open: false, id: '', type: 'resolve' })}>Annuler</Button>
            <Button
              variant={resolveDialog.type === 'resolve' ? 'default' : 'destructive'}
              onClick={handleAction}
              className={resolveDialog.type === 'resolve' ? 'bg-[#45A452] hover:bg-[#2d8a3a]' : ''}
            >
              {resolveDialog.type === 'resolve' ? 'Résoudre' : 'Rejeter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
