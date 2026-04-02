'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Bot,
  Play,
  Pencil,
  Trash2,
  Plus,
  RefreshCw,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Timer,
  FileText,
  ShieldCheck,
  Users,
  Bell,
  BarChart3,
  Calendar,
  Trash,
  ChevronLeft,
  Filter,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface AutomationRule {
  id: string
  name: string
  type: string
  status: string
  cronExpr: string | null
  lastRunAt: string | null
  nextRunAt: string | null
  runCount: number
  failCount: number
  createdBy: string | null
  createdAt: string
  updatedAt: string
  logsCount: number
}

interface AutomationLogEntry {
  id: string
  ruleId: string
  ruleName: string
  ruleType: string
  status: string
  duration: number | null
  recordsProcessed: number | null
  message: string | null
  error: string | null
  startedAt: string
  completedAt: string | null
}

interface AutomationStats {
  totalRules: number
  activeRules: number
  totalRuns: number
  successRate: number
  failedRuns: number
  lastRunAt: string | null
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  AUTO_CLOSE_AUCTION: 'Fermeture auto enchères',
  AUTO_SUSPEND_ACCOUNT: 'Suspension auto comptes',
  PRICE_ALERT_CHECK: 'Vérification alertes prix',
  REPORT_GENERATION: 'Génération rapports',
  DAILY_SUMMARY: 'Résumé quotidien',
  WEEKLY_REPORT: 'Rapport hebdomadaire',
  CLEANUP_EXPIRED: 'Nettoyage expirés',
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  AUTO_CLOSE_AUCTION: Timer,
  AUTO_SUSPEND_ACCOUNT: Users,
  PRICE_ALERT_CHECK: Bell,
  REPORT_GENERATION: FileText,
  DAILY_SUMMARY: BarChart3,
  WEEKLY_REPORT: Calendar,
  CLEANUP_EXPIRED: Trash,
}

const TYPE_COLORS: Record<string, string> = {
  AUTO_CLOSE_AUCTION: '#dc2626',
  AUTO_SUSPEND_ACCOUNT: '#f59e0b',
  PRICE_ALERT_CHECK: '#6366f1',
  REPORT_GENERATION: '#3b82f6',
  DAILY_SUMMARY: '#45A452',
  WEEKLY_REPORT: '#8b5cf6',
  CLEANUP_EXPIRED: '#64748b',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  PAUSED: 'En pause',
  DISABLED: 'Désactivée',
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#45A452',
  PAUSED: '#f59e0b',
  DISABLED: '#94a3b8',
}

const LOG_STATUS_LABELS: Record<string, string> = {
  SUCCESS: 'Succès',
  FAILED: 'Échec',
  SKIPPED: 'Ignoré',
}

const LOG_STATUS_COLORS: Record<string, string> = {
  SUCCESS: '#45A452',
  FAILED: '#dc2626',
  SKIPPED: '#f59e0b',
}

const RULE_TYPES = Object.keys(TYPE_LABELS)
const RULE_STATUSES = Object.keys(STATUS_LABELS)

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '—'
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function AutomationSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-14 rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AutomationPage() {
  const [stats, setStats] = useState<AutomationStats | null>(null)
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [runDialogOpen, setRunDialogOpen] = useState(false)
  const [runResult, setRunResult] = useState<{
    status: string
    message: string
    duration: number | null
    recordsProcessed: number | null
    error: string | null
  } | null>(null)
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null)
  const [runningRule, setRunningRule] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'AUTO_CLOSE_AUCTION',
    status: 'ACTIVE',
    cronExpr: '',
    config: '',
  })
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Logs
  const [logs, setLogs] = useState<AutomationLogEntry[]>([])
  const [expandedLogRuleId, setExpandedLogRuleId] = useState<string | null>(null)
  const [expandedErrorLogId, setExpandedErrorLogId] = useState<string | null>(null)
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsPage, setLogsPage] = useState(1)
  const [logsTotalPages, setLogsTotalPages] = useState(1)
  const [logsFilterRuleId, setLogsFilterRuleId] = useState<string | null>(null)
  const [logsFilterStatus, setLogsFilterStatus] = useState<string>('ALL')

  // ─── Fetch data ──────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, rulesRes] = await Promise.all([
        fetch('/api/automation/stats'),
        fetch('/api/automation/rules'),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
      if (rulesRes.ok) {
        const rulesData = await rulesRes.json()
        setRules(rulesData.rules)
      }
    } catch {
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ─── Fetch logs ──────────────────────────────────────────────────────
  const fetchLogs = useCallback(async (page = 1, ruleId?: string | null, status?: string) => {
    setLogsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (ruleId) params.set('ruleId', ruleId)
      if (status && status !== 'ALL') params.set('status', status)

      const res = await fetch(`/api/automation/logs?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setLogsTotalPages(data.pagination.totalPages)
        setLogsPage(page)
      }
    } catch {
      toast.error('Erreur lors du chargement des logs')
    } finally {
      setLogsLoading(false)
    }
  }, [])

  // Load initial logs
  useEffect(() => { fetchLogs(1, null, 'ALL') }, [fetchLogs])

  // ─── Create rule ─────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!formData.name) {
      toast.error('Le nom est requis')
      return
    }
    setFormSubmitting(true)
    try {
      const res = await fetch('/api/automation/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          status: formData.status,
          cronExpr: formData.cronExpr || null,
          config: formData.config || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      toast.success('Règle créée avec succès')
      setCreateDialogOpen(false)
      setFormData({ name: '', type: 'AUTO_CLOSE_AUCTION', status: 'ACTIVE', cronExpr: '', config: '' })
      fetchData()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur de création')
    } finally {
      setFormSubmitting(false)
    }
  }

  // ─── Edit rule ───────────────────────────────────────────────────────
  const openEditDialog = (rule: AutomationRule) => {
    setSelectedRule(rule)
    setFormData({
      name: rule.name,
      type: rule.type,
      status: rule.status,
      cronExpr: rule.cronExpr || '',
      config: '', // Config not returned in list
    })
    setEditDialogOpen(true)
  }

  const handleEdit = async () => {
    if (!selectedRule) return
    setFormSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        status: formData.status,
        cronExpr: formData.cronExpr || null,
      }
      if (formData.config) {
        payload.config = formData.config
      }

      const res = await fetch(`/api/automation/rules/${selectedRule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      toast.success('Règle mise à jour')
      setEditDialogOpen(false)
      fetchData()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur de modification')
    } finally {
      setFormSubmitting(false)
    }
  }

  // ─── Delete rule ─────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selectedRule) return
    try {
      const res = await fetch(`/api/automation/rules/${selectedRule.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      toast.success('Règle supprimée')
      setDeleteDialogOpen(false)
      fetchData()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur de suppression')
    }
  }

  // ─── Toggle status ───────────────────────────────────────────────────
  const toggleStatus = async (rule: AutomationRule) => {
    const newStatus = rule.status === 'ACTIVE' ? 'PAUSED' : rule.status === 'PAUSED' ? 'ACTIVE' : rule.status
    if (newStatus === rule.status) return
    try {
      const res = await fetch(`/api/automation/rules/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Statut changé en ${STATUS_LABELS[newStatus]}`)
      fetchData()
    } catch {
      toast.error('Erreur lors du changement de statut')
    }
  }

  // ─── Run rule ────────────────────────────────────────────────────────
  const handleRun = async () => {
    if (!selectedRule) return
    setRunningRule(true)
    setRunResult(null)
    try {
      const res = await fetch(`/api/automation/rules/${selectedRule.id}/run`, {
        method: 'POST',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      const data = await res.json()
      setRunResult(data.log)
      fetchData()
      fetchLogs(1, logsFilterRuleId, logsFilterStatus)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur d\'exécution')
    } finally {
      setRunningRule(false)
    }
  }

  // ─── Open run dialog ─────────────────────────────────────────────────
  const openRunDialog = (rule: AutomationRule) => {
    setSelectedRule(rule)
    setRunResult(null)
    setRunDialogOpen(true)
  }

  // ─── Form helpers ────────────────────────────────────────────────────
  const resetLogsFilters = () => {
    setLogsFilterRuleId(null)
    setLogsFilterStatus('ALL')
    fetchLogs(1, null, 'ALL')
  }

  if (loading) return <AutomationSkeleton />

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* ── Stats Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatsCard
          title="Règles actives"
          value={stats?.activeRules ?? 0}
          subtitle={`${stats?.totalRules ?? 0} règles au total`}
          icon={Zap}
          iconColor="text-[#45A452]"
          iconBg="bg-[#45A452]/10"
        />
        <StatsCard
          title="Exécutions totales"
          value={stats?.totalRuns ?? 0}
          subtitle={`${stats?.failedRuns ?? 0} échec(s)`}
          icon={Play}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatsCard
          title="Taux de succès"
          value={`${stats?.successRate ?? 0}%`}
          subtitle={stats?.lastRunAt ? `Dernière: ${formatDateTime(stats.lastRunAt)}` : 'Aucune exécution'}
          icon={CheckCircle}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </div>

      {/* ── Rules Section ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#45A452]/10">
                <Bot className="h-4 w-4 text-[#45A452]" />
              </div>
              <div>
                <CardTitle className="text-base">Règles d&apos;automatisation</CardTitle>
                <p className="text-xs text-muted-foreground">{rules.length} règle(s) configurée(s)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={fetchData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                className="h-9 bg-[#45A452] hover:bg-[#2d8a3a] text-white"
                onClick={() => {
                  setFormData({ name: '', type: 'AUTO_CLOSE_AUCTION', status: 'ACTIVE', cronExpr: '', config: '' })
                  setCreateDialogOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer une règle
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Bot className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="mt-3 text-sm font-medium">Aucune règle</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Créez votre première règle d&apos;automatisation
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold uppercase">Nom</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Type</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Statut</TableHead>
                    <TableHead className="text-xs font-semibold uppercase hidden md:table-cell">Dernière exécution</TableHead>
                    <TableHead className="text-xs font-semibold uppercase hidden sm:table-cell">Exécutions</TableHead>
                    <TableHead className="text-xs font-semibold uppercase hidden lg:table-cell">Succès / Échec</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => {
                    const TypeIcon = TYPE_ICONS[rule.type] || Zap
                    return (
                      <TableRow key={rule.id}>
                        {/* Name */}
                        <TableCell className="font-medium text-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: (TYPE_COLORS[rule.type] || '#94a3b8') + '15' }}>
                              <TypeIcon className="h-4 w-4" style={{ color: TYPE_COLORS[rule.type] || '#94a3b8' }} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-sm">{rule.name}</p>
                              {rule.cronExpr && (
                                <p className="text-[11px] text-muted-foreground font-mono">{rule.cronExpr}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Type badge */}
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-semibold whitespace-nowrap"
                            style={{
                              backgroundColor: (TYPE_COLORS[rule.type] || '#94a3b8') + '15',
                              color: TYPE_COLORS[rule.type] || '#94a3b8',
                            }}
                          >
                            {TYPE_LABELS[rule.type] || rule.type}
                          </Badge>
                        </TableCell>

                        {/* Status badge */}
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-semibold"
                            style={{
                              backgroundColor: (STATUS_COLORS[rule.status] || '#94a3b8') + '15',
                              color: STATUS_COLORS[rule.status] || '#94a3b8',
                            }}
                          >
                            {STATUS_LABELS[rule.status] || rule.status}
                          </Badge>
                        </TableCell>

                        {/* Last run */}
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {rule.lastRunAt ? formatDateTime(rule.lastRunAt) : '—'}
                          </span>
                        </TableCell>

                        {/* Run count */}
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{rule.runCount}</span>
                            {rule.logsCount > 0 && (
                              <button
                                onClick={() => {
                                  setLogsFilterRuleId(rule.id)
                                  fetchLogs(1, rule.id, logsFilterStatus)
                                }}
                                className="text-[11px] text-[#45A452] hover:underline text-left"
                              >
                                {rule.logsCount} log(s)
                              </button>
                            )}
                          </div>
                        </TableCell>

                        {/* Success / Fail */}
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="flex items-center gap-1 text-emerald-600">
                              <CheckCircle className="h-3.5 w-3.5" />
                              {rule.runCount - rule.failCount}
                            </span>
                            <span className="flex items-center gap-1 text-red-500">
                              <XCircle className="h-3.5 w-3.5" />
                              {rule.failCount}
                            </span>
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-[#45A452] hover:text-[#45A452] hover:bg-[#45A452]/10"
                                    onClick={() => openRunDialog(rule)}
                                    disabled={rule.status === 'DISABLED'}
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Exécuter</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => toggleStatus(rule)}
                                  >
                                    {rule.status === 'ACTIVE' ? (
                                      <Clock className="h-4 w-4 text-amber-500" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {rule.status === 'ACTIVE' ? 'Mettre en pause' : 'Activer'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openEditDialog(rule)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Modifier</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => {
                                      setSelectedRule(rule)
                                      setDeleteDialogOpen(true)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Supprimer</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Execution Logs ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Journaux d&apos;exécution</CardTitle>
                <p className="text-xs text-muted-foreground">Historique des exécutions automatiques</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Rule filter */}
              <Select
                value={logsFilterRuleId || 'ALL'}
                onValueChange={(v) => {
                  const val = v === 'ALL' ? null : v
                  setLogsFilterRuleId(val)
                  fetchLogs(1, val, logsFilterStatus)
                }}
              >
                <SelectTrigger className="h-9 w-full sm:w-[200px]">
                  <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Toutes les règles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toutes les règles</SelectItem>
                  {rules.map((rule) => (
                    <SelectItem key={rule.id} value={rule.id}>
                      {rule.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status filter */}
              <Select
                value={logsFilterStatus}
                onValueChange={(v) => {
                  setLogsFilterStatus(v)
                  fetchLogs(1, logsFilterRuleId, v)
                }}
              >
                <SelectTrigger className="h-9 w-full sm:w-[130px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous</SelectItem>
                  <SelectItem value="SUCCESS">Succès</SelectItem>
                  <SelectItem value="FAILED">Échec</SelectItem>
                  <SelectItem value="SKIPPED">Ignoré</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={resetLogsFilters}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {logsLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Aucun journal d&apos;exécution</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {logs.map((log) => {
                const LogTypeIcon = TYPE_ICONS[log.ruleType] || Zap
                const hasError = log.status === 'FAILED' && log.error
                return (
                  <Collapsible
                    key={log.id}
                    open={expandedErrorLogId === log.id}
                    onOpenChange={(open) => setExpandedErrorLogId(open ? log.id : null)}
                  >
                    <div className="border-b px-4 py-3 last:border-b-0">
                      <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: (LOG_STATUS_COLORS[log.status] || '#94a3b8') + '15' }}
                        >
                          {log.status === 'SUCCESS' ? (
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          ) : log.status === 'FAILED' ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{log.ruleName}</span>
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-semibold"
                              style={{
                                backgroundColor: (LOG_STATUS_COLORS[log.status] || '#94a3b8') + '15',
                                color: LOG_STATUS_COLORS[log.status] || '#94a3b8',
                              }}
                            >
                              {LOG_STATUS_LABELS[log.status] || log.status}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-semibold"
                              style={{
                                backgroundColor: (TYPE_COLORS[log.ruleType] || '#94a3b8') + '15',
                                color: TYPE_COLORS[log.ruleType] || '#94a3b8',
                              }}
                            >
                              <LogTypeIcon className="mr-1 h-3 w-3" />
                              {TYPE_LABELS[log.ruleType] || log.ruleType}
                            </Badge>
                          </div>
                          <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{formatDateTime(log.startedAt)}</span>
                            {log.duration !== null && (
                              <span className="flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                {formatDuration(log.duration)}
                              </span>
                            )}
                            {log.recordsProcessed !== null && (
                              <span>{log.recordsProcessed} enregistrement(s)</span>
                            )}
                          </div>
                          {log.message && (
                            <p className="mt-1 text-xs text-muted-foreground">{log.message}</p>
                          )}
                        </div>

                        {/* Error expand button */}
                        {hasError && (
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 shrink-0 text-xs text-red-500">
                              {expandedErrorLogId === log.id ? (
                                <ChevronDown className="h-3.5 w-3.5 mr-1" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 mr-1" />
                              )}
                              Détails
                            </Button>
                          </CollapsibleTrigger>
                        )}
                      </div>

                      {/* Error details */}
                      <CollapsibleContent>
                        {log.error && (
                          <div className="mt-2 ml-11 rounded-lg bg-red-50 border border-red-200 p-3">
                            <p className="text-xs font-mono text-red-700 break-all">{log.error}</p>
                          </div>
                        )}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )
              })}

              {/* Logs pagination */}
              {logsTotalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    Page {logsPage} sur {logsTotalPages}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={logsPage <= 1}
                      onClick={() => fetchLogs(logsPage - 1, logsFilterRuleId, logsFilterStatus)}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={logsPage >= logsTotalPages}
                      onClick={() => fetchLogs(logsPage + 1, logsFilterRuleId, logsFilterStatus)}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Create/Edit Rule Dialog ─────────────────────────────────────── */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false)
            setEditDialogOpen(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editDialogOpen ? 'Modifier la règle' : 'Créer une règle'}
            </DialogTitle>
            <DialogDescription>
              {editDialogOpen
                ? 'Modifiez les paramètres de la règle d\'automatisation.'
                : 'Configurez une nouvelle règle d\'automatisation.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="rule-name">Nom *</Label>
              <Input
                id="rule-name"
                placeholder="Ex: Fermeture automatique des enchères"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="rule-type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v })}
                disabled={editDialogOpen}
              >
                <SelectTrigger id="rule-type">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {RULE_TYPES.map((type) => {
                    const Icon = TYPE_ICONS[type] || Zap
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" style={{ color: TYPE_COLORS[type] }} />
                          {TYPE_LABELS[type]}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="rule-status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger id="rule-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RULE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[s] }}
                        />
                        {STATUS_LABELS[s]}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cron expression */}
            <div className="space-y-2">
              <Label htmlFor="rule-cron">Expression Cron</Label>
              <Input
                id="rule-cron"
                placeholder="Ex: 0 */6 * * * (toutes les 6 heures)"
                value={formData.cronExpr}
                onChange={(e) => setFormData({ ...formData, cronExpr: e.target.value })}
                className="font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Format Cron : minute heure jour mois jour-semaine. Exemples : &quot;0 0 * * *&quot; (quotidien), &quot;0 */6 * * *&quot; (toutes les 6h), &quot;0 0 * * 1&quot; (chaque lundi)
              </p>
            </div>

            {/* Config JSON */}
            <div className="space-y-2">
              <Label htmlFor="rule-config">Configuration (JSON)</Label>
              <textarea
                id="rule-config"
                placeholder='{"key": "value"}'
                value={formData.config}
                onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#45A452]/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                Configuration optionnelle au format JSON
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false)
                setEditDialogOpen(false)
              }}
            >
              Annuler
            </Button>
            <Button
              className="bg-[#45A452] hover:bg-[#2d8a3a] text-white"
              onClick={editDialogOpen ? handleEdit : handleCreate}
              disabled={formSubmitting}
            >
              {formSubmitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : editDialogOpen ? (
                'Enregistrer'
              ) : (
                'Créer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ──────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la règle ?</AlertDialogTitle>
            <AlertDialogDescription>
              La règle <strong>{selectedRule?.name}</strong> et tous ses journaux d&apos;exécution seront définitivement supprimés. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Run Confirmation Dialog ─────────────────────────────────────── */}
      <Dialog open={runDialogOpen} onOpenChange={setRunDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#45A452]/10">
                <Play className="h-4 w-4 text-[#45A452]" />
              </div>
              Exécuter la règle
            </DialogTitle>
            <DialogDescription>
              Vous êtes sur le point d&apos;exécuter manuellement la règle{' '}
              <strong>{selectedRule?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {!runResult && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{selectedRule ? TYPE_LABELS[selectedRule.type] : ''}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Exécutions précédentes</span>
                <span className="font-medium">{selectedRule?.runCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dernière exécution</span>
                <span className="font-medium">
                  {selectedRule?.lastRunAt ? formatDateTime(selectedRule.lastRunAt) : 'Jamais'}
                </span>
              </div>
            </div>
          )}

          {runResult && (
            <div className="space-y-3">
              <div className={`rounded-lg p-4 ${
                runResult.status === 'SUCCESS'
                  ? 'bg-emerald-50 border border-emerald-200'
                  : runResult.status === 'FAILED'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-amber-50 border border-amber-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {runResult.status === 'SUCCESS' ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : runResult.status === 'FAILED' ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  )}
                  <span className="font-semibold text-sm">
                    {LOG_STATUS_LABELS[runResult.status] || runResult.status}
                  </span>
                </div>
                <p className="text-sm">{runResult.message}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  {runResult.duration !== null && (
                    <span>Durée: {formatDuration(runResult.duration)}</span>
                  )}
                  {runResult.recordsProcessed !== null && (
                    <span>Enregistrements: {runResult.recordsProcessed}</span>
                  )}
                </div>
                {runResult.error && (
                  <div className="mt-2 rounded bg-red-100 p-2">
                    <p className="text-xs font-mono text-red-700 break-all">{runResult.error}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRunDialogOpen(false)}>
              Fermer
            </Button>
            {!runResult && (
              <Button
                className="bg-[#45A452] hover:bg-[#2d8a3a] text-white"
                onClick={handleRun}
                disabled={runningRule}
              >
                {runningRule ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Exécution en cours...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Exécuter
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
