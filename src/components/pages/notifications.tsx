'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Bell,
  Wallet,
  Settings,
  Gavel,
  AlertTriangle,
  Shield,
  CreditCard,
  User,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter,
  BellOff,
  Trash2,
  Inbox,
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
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: string | null
  isRead: boolean
  createdAt: string
}

interface NotificationStats {
  total: number
  unread: number
  thisWeek: number
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  WALLET: { label: 'Portefeuille', icon: Wallet, color: '#45A452', bg: '#45A452' },
  SYSTEM: { label: 'Système', icon: Settings, color: '#64748b', bg: '#64748b' },
  AUCTION: { label: 'Enchère', icon: Gavel, color: '#8b5cf6', bg: '#8b5cf6' },
  ALERT: { label: 'Alerte', icon: AlertTriangle, color: '#f59e0b', bg: '#f59e0b' },
  SECURITY: { label: 'Sécurité', icon: Shield, color: '#ef4444', bg: '#ef4444' },
  SUBSCRIPTION: { label: 'Abonnement', icon: CreditCard, color: '#0ea5e9', bg: '#0ea5e9' },
  ACCOUNT: { label: 'Compte', icon: User, color: '#6366f1', bg: '#6366f1' },
}

const READ_FILTERS = [
  { value: 'ALL', label: 'Toutes' },
  { value: 'UNREAD', label: 'Non lues' },
  { value: 'READ', label: 'Lues' },
]

// ─── Loading Skeleton ──────────────────────────────────────────────────────────
function NotificationsSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-14 rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats>({ total: 0, unread: 0, thisWeek: 0 })
  const [loading, setLoading] = useState(true)

  // Filters
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [readFilter, setReadFilter] = useState('ALL')
  const [markingAll, setMarkingAll] = useState(false)

  // ─── Fetch notifications ──────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (typeFilter !== 'ALL') params.set('type', typeFilter)
      if (readFilter === 'UNREAD') params.set('unreadOnly', 'true')

      const res = await fetch(`/api/notifications?${params}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setStats((prev) => ({
          ...prev,
          total: data.pagination?.total ?? prev.total,
          unread: data.unreadCount ?? prev.unread,
        }))
      }
    } catch (error) {
      console.error('Notifications fetch error:', error)
    }
  }, [page, typeFilter, readFilter])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=1')
      if (res.ok) {
        const data = await res.json()
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        // We calculate thisWeek from the fetched notifications (full list would be needed)
        // Use the pagination total and unread count as available
        setStats((prev) => ({
          ...prev,
          total: data.pagination?.total ?? prev.total,
          unread: data.unreadCount ?? prev.unread,
          thisWeek: prev.thisWeek, // will be updated below
        }))
      }
    } catch (error) {
      console.error('Stats fetch error:', error)
    }
  }, [])

  // Fetch all notifications without filters to compute thisWeek count
  const fetchThisWeek = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=1000')
      if (res.ok) {
        const data = await res.json()
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        const weekCount = (data.notifications || []).filter(
          (n: Notification) => new Date(n.createdAt) >= oneWeekAgo,
        ).length
        setStats((prev) => ({
          ...prev,
          thisWeek: weekCount,
          total: data.pagination?.total ?? prev.total,
          unread: data.unreadCount ?? prev.unread,
        }))
      }
    } catch (error) {
      console.error('This week count fetch error:', error)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchNotifications(), fetchStats(), fetchThisWeek()]).finally(() =>
      setLoading(false),
    )
  }, [fetchNotifications, fetchStats, fetchThisWeek])

  // ─── Mark as read ─────────────────────────────────────────────────────────
  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        )
        setStats((prev) => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1),
        }))
      }
    } catch (error) {
      console.error('Mark as read error:', error)
    }
  }

  // ─── Delete notification ──────────────────────────────────────────────────
  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        setStats((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
        }))
        toast.success('Notification supprimée')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  // ─── Mark all as read ─────────────────────────────────────────────────────
  const markAllAsRead = async () => {
    setMarkingAll(true)
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        setStats((prev) => ({ ...prev, unread: 0 }))
        toast.success(`${data.count} notification(s) marquée(s) comme lue(s)`)
      }
    } catch (error) {
      console.error('Mark all error:', error)
      toast.error('Erreur lors du marquage')
    } finally {
      setMarkingAll(false)
    }
  }

  // ─── Reset filters ───────────────────────────────────────────────────────
  const resetFilters = () => {
    setTypeFilter('ALL')
    setReadFilter('ALL')
    setPage(1)
  }

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) return <NotificationsSkeleton />

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ── Stats Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard
          title="Total"
          value={stats.total}
          subtitle="Toutes les notifications"
          icon={Bell}
          iconColor="text-[#45A452]"
          iconBg="bg-[#45A452]/10"
        />
        <StatsCard
          title="Non lues"
          value={stats.unread}
          subtitle="À traiter"
          icon={Bell}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatsCard
          title="Cette semaine"
          value={stats.thisWeek}
          subtitle="7 derniers jours"
          icon={Inbox}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatsCard
          title="Lues"
          value={stats.total - stats.unread}
          subtitle="Déjà consultées"
          icon={CheckCheck}
          iconColor="text-slate-500"
          iconBg="bg-slate-100"
        />
      </div>

      {/* ── Notifications List ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#45A452]" />
                Notifications
              </CardTitle>
              <CardDescription className="mt-1">
                Historique de vos notifications
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Type filter */}
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
                <SelectTrigger className="h-9 w-full sm:w-[150px]">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les types</SelectItem>
                  <SelectItem value="WALLET">Portefeuille</SelectItem>
                  <SelectItem value="SYSTEM">Système</SelectItem>
                  <SelectItem value="AUCTION">Enchère</SelectItem>
                  <SelectItem value="ALERT">Alerte</SelectItem>
                  <SelectItem value="SECURITY">Sécurité</SelectItem>
                  <SelectItem value="SUBSCRIPTION">Abonnement</SelectItem>
                  <SelectItem value="ACCOUNT">Compte</SelectItem>
                </SelectContent>
              </Select>

              {/* Read filter */}
              <Select value={readFilter} onValueChange={(v) => { setReadFilter(v); setPage(1) }}>
                <SelectTrigger className="h-9 w-full sm:w-[130px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  {READ_FILTERS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Mark all as read */}
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                disabled={stats.unread === 0 || markingAll}
                onClick={markAllAsRead}
                title="Tout marquer comme lu"
              >
                <CheckCheck className={`h-4 w-4 ${markingAll ? 'animate-spin' : ''}`} />
              </Button>

              {/* Refresh */}
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => {
                  setLoading(true)
                  Promise.all([fetchNotifications(), fetchThisWeek()]).finally(() =>
                    setLoading(false),
                  )
                }}
                title="Actualiser"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>

              {/* Reset */}
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={resetFilters}
                title="Réinitialiser les filtres"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Notification cards */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                  <BellOff className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Aucune notification</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                  {typeFilter !== 'ALL' || readFilter !== 'ALL'
                    ? 'Aucune notification ne correspond à vos filtres.'
                    : 'Vous n\'avez pas encore de notification.'}
                </p>
                {(typeFilter !== 'ALL' || readFilter !== 'ALL') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={resetFilters}
                  >
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            ) : (
              notifications.map((notification) => {
                const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.SYSTEM
                const Icon = config.icon

                return (
                  <div
                    key={notification.id}
                    className={`group relative flex gap-4 rounded-xl border p-4 transition-all hover:shadow-md cursor-pointer ${
                      notification.isRead
                        ? 'bg-white border-border/60'
                        : 'bg-[#f0f7f0] border-[#45A452]/20'
                    }`}
                    style={{
                      borderLeftWidth: '4px',
                      borderLeftColor: notification.isRead ? '#e2e8f0' : config.color,
                    }}
                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                  >
                    {/* Icon */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        notification.isRead ? 'bg-muted' : `${config.bg}/15`
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          notification.isRead ? 'text-muted-foreground' : config.color
                        }`}
                      />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4
                              className={`text-sm truncate ${
                                notification.isRead
                                  ? 'font-medium text-foreground/70'
                                  : 'font-semibold text-foreground'
                              }`}
                            >
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-[#45A452]" />
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                              title="Marquer comme lu"
                            >
                              <CheckCheck className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="mt-2 flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold"
                          style={{
                            backgroundColor: config.color + '15',
                            color: config.color,
                          }}
                        >
                          {config.label}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Page {page} sur {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'outline'}
                      size="icon"
                      className={`h-8 w-8 text-xs ${page === pageNum ? 'bg-[#45A452] hover:bg-[#2d8a3a]' : ''}`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
