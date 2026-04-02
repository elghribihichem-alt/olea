'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Shield,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  Clock,
  UserCircle,
  Mail,
  Phone,
  Building2,
  Activity,
  Calendar,
  KeyRound,
  Download,
  FileText,
  Lock,
  Unlock,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface BackOfficeAccount {
  id: string
  email: string
  name: string
  enterprise: string | null
  phone: string
  role: string
  status: string
  customPermissions: string | null
  maxRequestsPerDay: number | null
  maxExportsPerDay: number | null
  maxExportsPerMonth: number | null
  requestsToday: number
  exportsToday: number
  exportsThisMonth: number
  lastResetDate: string | null
  subscriptionType: string | null
  subscriptionStart: string | null
  subscriptionEnd: string | null
  emailVerified: boolean
  lastLogin: string | null
  loginCount: number
  createdAt: string
  updatedAt: string
  _count: { auditLogs: number }
}

interface AuditLog {
  id: string
  accountId: string
  action: string
  resource: string | null
  resourceId: string | null
  details: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrateur',
  ANALYST: 'Analyste',
  VIEWER: 'Observateur',
  CUSTOM: 'Personnalisé',
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#dc2626',
  ADMIN: '#45A452',
  ANALYST: '#6366f1',
  VIEWER: '#94a3b8',
  CUSTOM: '#f59e0b',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
  PENDING: 'En attente',
  EXPIRED: 'Expiré',
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#45A452',
  SUSPENDED: '#dc2626',
  PENDING: '#f59e0b',
  EXPIRED: '#94a3b8',
}

const SUBSCRIPTION_LABELS: Record<string, string> = {
  MONTHLY: 'Mensuel',
  YEARLY: 'Annuel',
  PERMANENT: 'Permanent',
}

const ACTION_LABELS: Record<string, string> = {
  ACCOUNT_CREATED: 'Création',
  ACCOUNT_UPDATED: 'Modification',
  STATUS_CHANGED: 'Changement statut',
  ROLE_CHANGED: 'Changement rôle',
  LOGIN: 'Connexion',
  LOGOUT: 'Déconnexion',
}

const AVATAR_COLORS = [
  'bg-red-100 text-red-700',
  'bg-green-100 text-green-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-teal-100 text-teal-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function AccountsSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-14 rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AccountsPage() {
  const [accounts, setAccounts] = useState<BackOfficeAccount[]>([])
  const [stats, setStats] = useState({
    total: 0, active: 0, suspended: 0, pending: 0, expired: 0, thisMonth: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Expanded row
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedDetail, setExpandedDetail] = useState<(BackOfficeAccount & { auditLogs: AuditLog[] }) | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditPage, setAuditPage] = useState(1)
  const [auditTotalPages, setAuditTotalPages] = useState(1)

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<BackOfficeAccount | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', enterprise: '', role: 'VIEWER' as string, subscriptionType: 'MONTHLY' as string,
  })
  const [editFormData, setEditFormData] = useState({
    name: '', email: '', phone: '', enterprise: '',
    maxRequestsPerDay: '', maxExportsPerDay: '', maxExportsPerMonth: '',
  })
  const [formSubmitting, setFormSubmitting] = useState(false)

  // ─── Fetch accounts ─────────────────────────────────────────────────────
  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        role: roleFilter,
        status: statusFilter,
        search,
      })
      const res = await fetch(`/api/accounts?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAccounts(data.accounts)
      setStats(data.stats)
      setTotalPages(data.pagination.totalPages)
    } catch {
      toast.error('Erreur lors du chargement des comptes')
    } finally {
      setLoading(false)
    }
  }, [page, roleFilter, statusFilter, search])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  // ─── Expand row ────────────────────────────────────────────────────────
  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      setExpandedDetail(null)
      return
    }
    setExpandedId(id)
    setLoadingDetail(true)
    setAuditPage(1)
    try {
      const res = await fetch(`/api/accounts/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setExpandedDetail(data)
      // Fetch audit logs
      const logsRes = await fetch(`/api/accounts/${id}/audit-logs?limit=10`)
      if (logsRes.ok) {
        const logsData = await logsRes.json()
        setAuditLogs(logsData.logs)
        setAuditTotalPages(logsData.pagination.totalPages)
      }
    } catch {
      toast.error('Erreur de chargement du détail')
    } finally {
      setLoadingDetail(false)
    }
  }

  // Fetch more audit logs when page changes
  useEffect(() => {
    if (expandedId && expandedDetail) {
      const fetchLogs = async () => {
        const res = await fetch(`/api/accounts/${expandedId}/audit-logs?page=${auditPage}&limit=10`)
        if (res.ok) {
          const data = await res.json()
          setAuditLogs(data.logs)
          setAuditTotalPages(data.pagination.totalPages)
        }
      }
      fetchLogs()
    }
  }, [auditPage, expandedId, expandedDetail])

  // ─── Create account ────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    setFormSubmitting(true)
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      toast.success('Compte créé avec succès')
      setCreateDialogOpen(false)
      setFormData({ name: '', email: '', phone: '', enterprise: '', role: 'VIEWER', subscriptionType: 'MONTHLY' })
      fetchAccounts()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur de création')
    } finally {
      setFormSubmitting(false)
    }
  }

  // ─── Edit account ──────────────────────────────────────────────────────
  const openEditDialog = (account: BackOfficeAccount) => {
    setSelectedAccount(account)
    setEditFormData({
      name: account.name,
      email: account.email,
      phone: account.phone,
      enterprise: account.enterprise || '',
      maxRequestsPerDay: account.maxRequestsPerDay?.toString() || '',
      maxExportsPerDay: account.maxExportsPerDay?.toString() || '',
      maxExportsPerMonth: account.maxExportsPerMonth?.toString() || '',
    })
    setEditDialogOpen(true)
  }

  const handleEdit = async () => {
    if (!selectedAccount) return
    setFormSubmitting(true)
    try {
      const res = await fetch(`/api/accounts/${selectedAccount.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          maxRequestsPerDay: editFormData.maxRequestsPerDay ? parseInt(editFormData.maxRequestsPerDay) : null,
          maxExportsPerDay: editFormData.maxExportsPerDay ? parseInt(editFormData.maxExportsPerDay) : null,
          maxExportsPerMonth: editFormData.maxExportsPerMonth ? parseInt(editFormData.maxExportsPerMonth) : null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      toast.success('Compte mis à jour')
      setEditDialogOpen(false)
      fetchAccounts()
      if (expandedId === selectedAccount.id) toggleExpand(selectedAccount.id)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur de modification')
    } finally {
      setFormSubmitting(false)
    }
  }

  // ─── Delete account ────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selectedAccount) return
    try {
      const res = await fetch(`/api/accounts/${selectedAccount.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      toast.success('Compte supprimé')
      setDeleteDialogOpen(false)
      setExpandedId(null)
      fetchAccounts()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur de suppression')
    }
  }

  // ─── Change role ───────────────────────────────────────────────────────
  const changeRole = async (accountId: string, role: string) => {
    try {
      const res = await fetch(`/api/accounts/${accountId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Rôle changé en ${ROLE_LABELS[role]}`)
      fetchAccounts()
      if (expandedId === accountId) toggleExpand(accountId)
    } catch {
      toast.error('Erreur lors du changement de rôle')
    }
  }

  // ─── Change status ────────────────────────────────────────────────────
  const changeStatus = async (accountId: string, status: string) => {
    try {
      const res = await fetch(`/api/accounts/${accountId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Statut changé en ${STATUS_LABELS[status]}`)
      fetchAccounts()
      if (expandedId === accountId) toggleExpand(accountId)
    } catch {
      toast.error('Erreur lors du changement de statut')
    }
  }

  // ─── Reset filters ─────────────────────────────────────────────────────
  const resetFilters = () => {
    setSearch('')
    setRoleFilter('ALL')
    setStatusFilter('ALL')
    setPage(1)
  }

  if (loading && accounts.length === 0) return <AccountsSkeleton />

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatsCard
          title="Total comptes"
          value={stats.total}
          icon={Shield}
          iconColor="text-[#45A452]"
          iconBg="bg-[#45A452]/10"
        />
        <StatsCard
          title="Actifs"
          value={stats.active}
          icon={CheckCircle}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatsCard
          title="Suspendus"
          value={stats.suspended}
          icon={XCircle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
        <StatsCard
          title="En attente"
          value={stats.pending}
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatsCard
          title="Nouveaux ce mois"
          value={stats.thisMonth}
          icon={UserCircle}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-1">
              {/* Search */}
              <div className="relative flex-1 sm:max-w-[260px]">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className="h-10 pl-9"
                />
              </div>

              {/* Role filter */}
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }}>
                <SelectTrigger className="h-10 w-full sm:w-[170px]">
                  <KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les rôles</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="ADMIN">Administrateur</SelectItem>
                  <SelectItem value="ANALYST">Analyste</SelectItem>
                  <SelectItem value="VIEWER">Observateur</SelectItem>
                  <SelectItem value="CUSTOM">Personnalisé</SelectItem>
                </SelectContent>
              </Select>

              {/* Status filter */}
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="h-10 w-full sm:w-[160px]">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les statuts</SelectItem>
                  <SelectItem value="ACTIVE">Actif</SelectItem>
                  <SelectItem value="SUSPENDED">Suspendu</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="EXPIRED">Expiré</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={resetFilters}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                className="h-10 bg-[#45A452] hover:bg-[#2d8a3a] text-white shrink-0"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Nouveau compte</span>
                <span className="sm:hidden">Nouveau</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Accounts List ────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {accounts.map((account) => {
          const isExpanded = expandedId === account.id
          return (
            <Card
              key={account.id}
              className={`overflow-hidden transition-all ${isExpanded ? 'ring-1 ring-[#45A452]/30' : ''}`}
            >
              {/* Row */}
              <div className="flex items-center gap-3 p-3 md:p-4">
                {/* Expand toggle */}
                <button
                  onClick={() => toggleExpand(account.id)}
                  className="shrink-0 rounded-md p-1 hover:bg-muted transition-colors"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {/* Avatar */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${getAvatarColor(account.name)}`}
                >
                  {getInitials(account.name)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{account.name}</span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-semibold"
                      style={{
                        backgroundColor: (ROLE_COLORS[account.role] || '#94a3b8') + '15',
                        color: ROLE_COLORS[account.role] || '#94a3b8',
                      }}
                    >
                      {ROLE_LABELS[account.role]}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-semibold"
                      style={{
                        backgroundColor: (STATUS_COLORS[account.status] || '#94a3b8') + '15',
                        color: STATUS_COLORS[account.status] || '#94a3b8',
                      }}
                    >
                      {STATUS_LABELS[account.status]}
                    </Badge>
                    {!account.emailVerified && (
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                        Non vérifié
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />{account.email}
                    </span>
                    {account.enterprise && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />{account.enterprise}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />{formatDate(account.createdAt)}
                    </span>
                    {account.lastLogin && (
                      <span className="flex items-center gap-1 text-[#45A452]">
                        <Activity className="h-3 w-3" />Dernière connexion: {formatDateTime(account.lastLogin)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Quick status toggle */}
                  {account.status === 'ACTIVE' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 text-amber-600 hover:text-amber-600 hover:bg-amber-50 p-0"
                      onClick={() => changeStatus(account.id, 'SUSPENDED')}
                      title="Suspendre"
                    >
                      <Lock className="h-3.5 w-3.5" />
                    </Button>
                  ) : account.status === 'SUSPENDED' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 text-[#45A452] hover:text-[#45A452] hover:bg-[#45A452]/10 p-0"
                      onClick={() => changeStatus(account.id, 'ACTIVE')}
                      title="Réactiver"
                    >
                      <Unlock className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}

                  {/* More actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      {/* Role sub-menu */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Changer le rôle
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {Object.entries(ROLE_LABELS).map(([key, label]) => (
                            <DropdownMenuItem
                              key={key}
                              onClick={() => changeRole(account.id, key)}
                              className={account.role === key ? 'bg-accent' : ''}
                            >
                              <div
                                className="mr-2 h-2 w-2 rounded-full"
                                style={{ backgroundColor: ROLE_COLORS[key] }}
                              />
                              {label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>

                      {/* Status sub-menu */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Activity className="mr-2 h-4 w-4" />
                          Changer le statut
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <DropdownMenuItem
                              key={key}
                              onClick={() => changeStatus(account.id, key)}
                              className={account.status === key ? 'bg-accent' : ''}
                            >
                              <div
                                className="mr-2 h-2 w-2 rounded-full"
                                style={{ backgroundColor: STATUS_COLORS[key] }}
                              />
                              {label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openEditDialog(account)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedAccount(account)
                          setDeleteDialogOpen(true)
                        }}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* ── Expanded detail ──────────────────────────────────────────── */}
              {isExpanded && (
                loadingDetail ? (
                  <div className="border-t p-4">
                    <Skeleton className="h-32 rounded-lg" />
                  </div>
                ) : expandedDetail ? (
                  <div className="border-t bg-muted/30 px-4 py-4">
                    <Tabs defaultValue="info" className="w-full">
                      <TabsList className="mb-3">
                        <TabsTrigger value="info" className="text-xs">
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Informations
                        </TabsTrigger>
                        <TabsTrigger value="quotas" className="text-xs">
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          Quotas & Abonnement
                        </TabsTrigger>
                        <TabsTrigger value="logs" className="text-xs">
                          <FileText className="mr-1.5 h-3.5 w-3.5" />
                          Journal d&apos;audit
                        </TabsTrigger>
                      </TabsList>

                      {/* Info tab */}
                      <TabsContent value="info">
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Identité</h4>
                            <div className="rounded-lg bg-background p-3 space-y-2 text-sm">
                              <p><span className="text-muted-foreground">Nom:</span> <span className="font-medium">{expandedDetail.name}</span></p>
                              <p><span className="text-muted-foreground">Email:</span> <span className="font-medium">{expandedDetail.email}</span></p>
                              <p><span className="text-muted-foreground">Téléphone:</span> <span className="font-medium">{expandedDetail.phone}</span></p>
                              {expandedDetail.enterprise && (
                                <p><span className="text-muted-foreground">Entreprise:</span> <span className="font-medium">{expandedDetail.enterprise}</span></p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Accès</h4>
                            <div className="rounded-lg bg-background p-3 space-y-2 text-sm">
                              <p>
                                <span className="text-muted-foreground">Rôle:</span>{' '}
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] font-semibold ml-1"
                                  style={{
                                    backgroundColor: (ROLE_COLORS[expandedDetail.role] || '#94a3b8') + '15',
                                    color: ROLE_COLORS[expandedDetail.role] || '#94a3b8',
                                  }}
                                >
                                  {ROLE_LABELS[expandedDetail.role]}
                                </Badge>
                              </p>
                              <p>
                                <span className="text-muted-foreground">Statut:</span>{' '}
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] font-semibold ml-1"
                                  style={{
                                    backgroundColor: (STATUS_COLORS[expandedDetail.status] || '#94a3b8') + '15',
                                    color: STATUS_COLORS[expandedDetail.status] || '#94a3b8',
                                  }}
                                >
                                  {STATUS_LABELS[expandedDetail.status]}
                                </Badge>
                              </p>
                              <p>
                                <span className="text-muted-foreground">Email vérifié:</span>{' '}
                                {expandedDetail.emailVerified ? (
                                  <span className="text-[#45A452] font-medium">Oui</span>
                                ) : (
                                  <span className="text-amber-600 font-medium">Non</span>
                                )}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Connexions:</span>{' '}
                                <span className="font-medium">{expandedDetail.loginCount}</span>
                              </p>
                              <p>
                                <span className="text-muted-foreground">Dernière connexion:</span>{' '}
                                <span className="font-medium">
                                  {expandedDetail.lastLogin ? formatDateTime(expandedDetail.lastLogin) : 'Jamais'}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dates</h4>
                            <div className="rounded-lg bg-background p-3 space-y-2 text-sm">
                              <p>
                                <span className="text-muted-foreground">Création:</span>{' '}
                                <span className="font-medium">{formatDateTime(expandedDetail.createdAt)}</span>
                              </p>
                              <p>
                                <span className="text-muted-foreground">Modification:</span>{' '}
                                <span className="font-medium">{formatDateTime(expandedDetail.updatedAt)}</span>
                              </p>
                              {expandedDetail.lastResetDate && (
                                <p>
                                  <span className="text-muted-foreground">Dernier reset quotas:</span>{' '}
                                  <span className="font-medium">{formatDate(expandedDetail.lastResetDate)}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Quotas tab */}
                      <TabsContent value="quotas">
                        <div className="grid gap-4 md:grid-cols-2">
                          {/* Subscription */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Abonnement</h4>
                            <div className="rounded-lg bg-background p-3 space-y-2 text-sm">
                              <p>
                                <span className="text-muted-foreground">Type:</span>{' '}
                                <span className="font-medium">
                                  {expandedDetail.subscriptionType
                                    ? SUBSCRIPTION_LABELS[expandedDetail.subscriptionType] || expandedDetail.subscriptionType
                                    : 'Aucun'}
                                </span>
                              </p>
                              {expandedDetail.subscriptionStart && (
                                <p>
                                  <span className="text-muted-foreground">Début:</span>{' '}
                                  <span className="font-medium">{formatDate(expandedDetail.subscriptionStart)}</span>
                                </p>
                              )}
                              {expandedDetail.subscriptionEnd && (
                                <p>
                                  <span className="text-muted-foreground">Fin:</span>{' '}
                                  <span className="font-medium">
                                    {formatDate(expandedDetail.subscriptionEnd)}
                                    {new Date(expandedDetail.subscriptionEnd) < new Date() && (
                                      <Badge variant="destructive" className="ml-2 text-[10px]">Expiré</Badge>
                                    )}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Quotas */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Limites d&apos;utilisation</h4>
                            <div className="rounded-lg bg-background p-3 space-y-3">
                              {/* Requests per day */}
                              <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">Requêtes / jour</span>
                                  <span className="font-medium">{expandedDetail.requestsToday} / {expandedDetail.maxRequestsPerDay || '∞'}</span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-[#45A452] transition-all"
                                    style={{
                                      width: expandedDetail.maxRequestsPerDay
                                        ? `${Math.min(100, (expandedDetail.requestsToday / expandedDetail.maxRequestsPerDay) * 100)}%`
                                        : '0%',
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Exports per day */}
                              <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">Exports / jour</span>
                                  <span className="font-medium">{expandedDetail.exportsToday} / {expandedDetail.maxExportsPerDay || '∞'}</span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-blue-500 transition-all"
                                    style={{
                                      width: expandedDetail.maxExportsPerDay
                                        ? `${Math.min(100, (expandedDetail.exportsToday / expandedDetail.maxExportsPerDay) * 100)}%`
                                        : '0%',
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Exports per month */}
                              <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">Exports / mois</span>
                                  <span className="font-medium">{expandedDetail.exportsThisMonth} / {expandedDetail.maxExportsPerMonth || '∞'}</span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-amber-500 transition-all"
                                    style={{
                                      width: expandedDetail.maxExportsPerMonth
                                        ? `${Math.min(100, (expandedDetail.exportsThisMonth / expandedDetail.maxExportsPerMonth) * 100)}%`
                                        : '0%',
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Audit logs tab */}
                      <TabsContent value="logs">
                        <div className="space-y-2">
                          {auditLogs.length === 0 ? (
                            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              Aucune entrée dans le journal d&apos;audit
                            </div>
                          ) : (
                            <>
                              <ScrollArea className="max-h-[300px]">
                                <div className="space-y-2">
                                  {auditLogs.map((log) => (
                                    <div
                                      key={log.id}
                                      className="flex items-start gap-3 rounded-lg bg-background p-3 text-sm"
                                    >
                                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                                        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="secondary" className="text-[10px]">
                                            {ACTION_LABELS[log.action] || log.action}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            {formatDateTime(log.createdAt)}
                                          </span>
                                        </div>
                                        {log.details && (
                                          <p className="mt-1 text-xs text-muted-foreground">{log.details}</p>
                                        )}
                                        {log.ipAddress && (
                                          <p className="mt-0.5 text-[10px] text-muted-foreground">IP: {log.ipAddress}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>

                              {/* Audit logs pagination */}
                              {auditTotalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 pt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={auditPage <= 1}
                                    onClick={() => setAuditPage(auditPage - 1)}
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                  <span className="text-xs text-muted-foreground">{auditPage} / {auditTotalPages}</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={auditPage >= auditTotalPages}
                                    onClick={() => setAuditPage(auditPage + 1)}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : null
              )}
            </Card>
          )
        })}

        {/* Empty state */}
        {!loading && accounts.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#45A452]/10">
              <Shield className="h-7 w-7 text-[#45A452]" />
            </div>
            <p className="text-sm font-medium">Aucun compte trouvé</p>
            <p className="text-xs text-muted-foreground">Modifiez vos filtres ou créez un nouveau compte</p>
          </div>
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
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

      {/* ════════════════════════════════════════════════════════════════════
          CREATE DIALOG
         ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#45A452]" />
              Nouveau compte back-office
            </DialogTitle>
            <DialogDescription>
              Créez un nouveau compte d&apos;accès au back-office
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="create-name">Nom complet *</Label>
              <Input
                id="create-name"
                placeholder="Ahmed Ben Ali"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="ahmed@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-phone">Téléphone *</Label>
              <Input
                id="create-phone"
                placeholder="+216 XX XXX XXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-enterprise">Entreprise</Label>
              <Input
                id="create-enterprise"
                placeholder="Nom de l'entreprise (optionnel)"
                value={formData.enterprise}
                onChange={(e) => setFormData({ ...formData, enterprise: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Rôle *</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Abonnement</Label>
                <Select value={formData.subscriptionType} onValueChange={(v) => setFormData({ ...formData, subscriptionType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Mensuel</SelectItem>
                    <SelectItem value="YEARLY">Annuel</SelectItem>
                    <SelectItem value="PERMANENT">Permanent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Annuler</Button>
            <Button
              onClick={handleCreate}
              disabled={formSubmitting}
              className="bg-[#45A452] hover:bg-[#2d8a3a] text-white"
            >
              {formSubmitting ? 'Création...' : 'Créer le compte'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          EDIT DIALOG
         ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-[#45A452]" />
              Modifier le compte
            </DialogTitle>
            <DialogDescription>
              Modifiez les informations du compte back-office
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nom complet</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Téléphone</Label>
              <Input
                id="edit-phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-enterprise">Entreprise</Label>
              <Input
                id="edit-enterprise"
                value={editFormData.enterprise}
                onChange={(e) => setEditFormData({ ...editFormData, enterprise: e.target.value })}
              />
            </div>

            <Separator />
            <h4 className="text-sm font-semibold text-muted-foreground">Limites d&apos;utilisation</h4>

            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label className="text-xs">Requêtes/jour</Label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={editFormData.maxRequestsPerDay}
                  onChange={(e) => setEditFormData({ ...editFormData, maxRequestsPerDay: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Exports/jour</Label>
                <Input
                  type="number"
                  placeholder="50"
                  value={editFormData.maxExportsPerDay}
                  onChange={(e) => setEditFormData({ ...editFormData, maxExportsPerDay: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Exports/mois</Label>
                <Input
                  type="number"
                  placeholder="500"
                  value={editFormData.maxExportsPerMonth}
                  onChange={(e) => setEditFormData({ ...editFormData, maxExportsPerMonth: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Annuler</Button>
            <Button
              onClick={handleEdit}
              disabled={formSubmitting}
              className="bg-[#45A452] hover:bg-[#2d8a3a] text-white"
            >
              {formSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          DELETE CONFIRMATION
         ════════════════════════════════════════════════════════════════════ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Supprimer le compte
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le compte{' '}
              <strong>{selectedAccount?.name}</strong> ({selectedAccount?.email}) ?
              <br />
              Cette action est irréversible. Toutes les données associées seront supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
