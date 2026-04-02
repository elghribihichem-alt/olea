'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Webhook,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  Play,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Zap,
  Link2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatsCard } from '@/components/stats-card'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Webhook {
  id: string
  name: string
  url: string
  secret: string | null
  events: string
  status: string
  lastTrigger: string | null
  successCount: number
  failCount: number
  createdAt: string
}

interface WebhookStats {
  total: number
  active: number
  totalDeliveries: number
  successRate: number
}

interface Delivery {
  id: string
  webhookId: string
  event: string
  payload: string
  statusCode: number | null
  response: string | null
  duration: number | null
  success: boolean
  createdAt: string
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const WEBHOOK_EVENTS = [
  'AUCTION_CREATED',
  'AUCTION_CLOSED',
  'BID_PLACED',
  'TRANSACTION_COMPLETED',
  'USER_REGISTERED',
  'WALLET_CREDIT',
  'WALLET_DEBIT',
  'REPORT_GENERATED',
]

const EVENT_COLORS: Record<string, string> = {
  AUCTION_CREATED: '#45A452',
  AUCTION_CLOSED: '#ef4444',
  BID_PLACED: '#6366f1',
  TRANSACTION_COMPLETED: '#8b5cf6',
  USER_REGISTERED: '#06b6d4',
  WALLET_CREDIT: '#059669',
  WALLET_DEBIT: '#dc2626',
  REPORT_GENERATED: '#f59e0b',
  TEST: '#94a3b8',
}

const EVENT_LABELS: Record<string, string> = {
  AUCTION_CREATED: 'Enchère créée',
  AUCTION_CLOSED: 'Enchère fermée',
  BID_PLACED: 'Enchère placée',
  TRANSACTION_COMPLETED: 'Transaction',
  USER_REGISTERED: 'Inscription',
  WALLET_CREDIT: 'Crédit portefeuille',
  WALLET_DEBIT: 'Débit portefeuille',
  REPORT_GENERATED: 'Rapport généré',
  TEST: 'Test',
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#059669',
  DISABLED: '#6b7280',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  DISABLED: 'Désactivé',
}

// ─── Format helpers ────────────────────────────────────────────────────────────
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function generateSecret(): string {
  return 'whsec_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────
function WebhooksSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}

// ─── Main Webhooks Component ───────────────────────────────────────────────────
export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [stats, setStats] = useState<WebhookStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedWebhook, setExpandedWebhook] = useState<string | null>(null)
  const [deliveries, setDeliveries] = useState<Record<string, Delivery[]>>({})
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formSecret, setFormSecret] = useState('')
  const [formStatus, setFormStatus] = useState('ACTIVE')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])

  // ─── Fetch data ───────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/webhooks')
      if (res.ok) {
        const data = await res.json()
        setWebhooks(data.webhooks || [])
        setStats(data.stats || null)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ─── Fetch deliveries for a webhook ───────────────────────────────────────
  const fetchDeliveries = useCallback(async (webhookId: string) => {
    try {
      const res = await fetch(`/api/webhooks/${webhookId}/deliveries`)
      if (res.ok) {
        const data = await res.json()
        setDeliveries((prev) => ({ ...prev, [webhookId]: data.deliveries || [] }))
      }
    } catch {
      // silent
    }
  }, [])

  const toggleExpanded = (webhookId: string) => {
    if (expandedWebhook === webhookId) {
      setExpandedWebhook(null)
    } else {
      setExpandedWebhook(webhookId)
      fetchDeliveries(webhookId)
    }
  }

  // ─── Open create dialog ───────────────────────────────────────────────────
  const openCreateDialog = () => {
    setEditingWebhook(null)
    resetForm()
    setFormSecret(generateSecret())
    setDialogOpen(true)
  }

  // ─── Open edit dialog ─────────────────────────────────────────────────────
  const openEditDialog = (wh: Webhook) => {
    setEditingWebhook(wh)
    setFormName(wh.name)
    setFormUrl(wh.url)
    setFormSecret(wh.secret || '')
    setFormStatus(wh.status)
    try {
      setSelectedEvents(JSON.parse(wh.events))
    } catch {
      setSelectedEvents([])
    }
    setDialogOpen(true)
  }

  // ─── Reset form ───────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormName('')
    setFormUrl('')
    setFormSecret('')
    setFormStatus('ACTIVE')
    setSelectedEvents([])
  }

  // ─── Toggle event selection ───────────────────────────────────────────────
  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    )
  }

  // ─── Handle submit ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error('Le nom est requis')
      return
    }
    if (!formUrl.trim()) {
      toast.error("L'URL est requise")
      return
    }
    if (selectedEvents.length === 0) {
      toast.error('Sélectionnez au moins un événement')
      return
    }

    setSubmitting(true)
    try {
      const url = editingWebhook ? `/api/webhooks/${editingWebhook.id}` : '/api/webhooks'
      const method = editingWebhook ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          url: formUrl.trim(),
          events: selectedEvents,
          secret: formSecret || undefined,
          status: formStatus,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erreur lors de l'opération")
      }

      toast.success(editingWebhook ? 'Webhook mis à jour' : 'Webhook créé')
      setDialogOpen(false)
      resetForm()
      fetchData()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'opération")
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Delete webhook ───────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/webhooks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur lors de la suppression')
      toast.success('Webhook supprimé')
      fetchData()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la suppression')
    }
  }

  // ─── Test webhook ─────────────────────────────────────────────────────────
  const handleTest = async (id: string) => {
    setTestingWebhook(id)
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: 'POST' })
      const data = await res.json()

      if (res.ok && data.result?.success) {
        toast.success(`Test réussi (${data.result.duration}ms)`)
      } else {
        toast.error(`Test échoué: ${data.result?.response || 'Erreur serveur'}`)
      }

      fetchData()
      fetchDeliveries(id)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors du test')
    } finally {
      setTestingWebhook(null)
    }
  }

  // ─── Loading state ───────────────────────────────────────────────────────
  if (loading) return <WebhooksSkeleton />

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ── Stats Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard
          title="Total webhooks"
          value={stats?.total || 0}
          subtitle="Configurés"
          icon={Webhook}
          iconColor="text-[#45A452]"
          iconBg="bg-[#45A452]/10"
        />
        <StatsCard
          title="Webhooks actifs"
          value={stats?.active || 0}
          subtitle="En fonctionnement"
          icon={Zap}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatsCard
          title="Total deliveries"
          value={stats?.totalDeliveries || 0}
          subtitle="Requêtes envoyées"
          icon={Activity}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatsCard
          title="Taux de succès"
          value={`${stats?.successRate || 0}%`}
          subtitle="Délivrés avec succès"
          icon={CheckCircle2}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Webhook className="h-4 w-4 text-[#45A452]" />
                Webhooks
              </CardTitle>
              <CardDescription>Gestion des webhooks et intégrations</CardDescription>
            </div>
            <Button className="bg-[#45A452] hover:bg-[#2d8a3a] text-white" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Webhook className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Aucun webhook configuré</p>
              <p className="text-xs text-muted-foreground mt-1">
                Créez un webhook pour recevoir des notifications
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((wh) => {
                let eventsList: string[] = []
                try {
                  eventsList = JSON.parse(wh.events)
                } catch {
                  eventsList = []
                }

                const isExpanded = expandedWebhook === wh.id
                const webhookDeliveries = deliveries[wh.id] || []

                return (
                  <Collapsible key={wh.id} open={isExpanded} onOpenChange={() => toggleExpanded(wh.id)}>
                    <Card className="overflow-hidden">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                              wh.status === 'ACTIVE' ? 'bg-[#45A452]/10' : 'bg-muted'
                            }`}
                          >
                            <Link2 className={`h-5 w-5 ${wh.status === 'ACTIVE' ? 'text-[#45A452]' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold truncate">{wh.name}</h3>
                              <Badge
                                variant="secondary"
                                className="text-[10px] font-semibold shrink-0"
                                style={{
                                  backgroundColor: (STATUS_COLORS[wh.status] || '#94a3b8') + '15',
                                  color: STATUS_COLORS[wh.status] || '#94a3b8',
                                }}
                              >
                                {STATUS_LABELS[wh.status] || wh.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{wh.url}</p>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {eventsList.slice(0, 4).map((ev) => (
                                <Badge
                                  key={ev}
                                  variant="secondary"
                                  className="text-[9px] font-semibold"
                                  style={{
                                    backgroundColor: (EVENT_COLORS[ev] || '#94a3b8') + '15',
                                    color: EVENT_COLORS[ev] || '#94a3b8',
                                  }}
                                >
                                  {EVENT_LABELS[ev] || ev}
                                </Badge>
                              ))}
                              {eventsList.length > 4 && (
                                <Badge variant="outline" className="text-[9px]">
                                  +{eventsList.length - 4}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="hidden md:flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-xs">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                <span className="font-medium">{wh.successCount}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <XCircle className="h-3 w-3 text-red-500" />
                                <span className="font-medium">{wh.failCount}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Dernier déclenchement</p>
                              <p className="text-xs font-medium">{formatDate(wh.lastTrigger)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTest(wh.id)
                              }}
                              disabled={testingWebhook === wh.id}
                            >
                              <Play className={`h-3.5 w-3.5 ${testingWebhook === wh.id ? 'animate-pulse text-[#45A452]' : ''}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditDialog(wh)
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(wh.id)
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground ml-1" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <Separator />
                        <div className="p-4">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                            Journaux de livraison
                          </h4>
                          {webhookDeliveries.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-4">
                              Aucune livraison enregistrée
                            </p>
                          ) : (
                            <div className="max-h-64 overflow-y-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-xs">Événement</TableHead>
                                    <TableHead className="text-xs">Statut</TableHead>
                                    <TableHead className="text-xs">Code</TableHead>
                                    <TableHead className="text-xs">Durée</TableHead>
                                    <TableHead className="text-xs">Date</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {webhookDeliveries.map((d) => (
                                    <TableRow key={d.id}>
                                      <TableCell className="py-2">
                                        <Badge
                                          variant="secondary"
                                          className="text-[9px] font-semibold"
                                          style={{
                                            backgroundColor: (EVENT_COLORS[d.event] || '#94a3b8') + '15',
                                            color: EVENT_COLORS[d.event] || '#94a3b8',
                                          }}
                                        >
                                          {EVENT_LABELS[d.event] || d.event}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="py-2">
                                        {d.success ? (
                                          <span className="flex items-center gap-1 text-xs text-emerald-600">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Succès
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-1 text-xs text-red-600">
                                            <XCircle className="h-3 w-3" />
                                            Échec
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-xs py-2 font-mono">
                                        {d.statusCode || '—'}
                                      </TableCell>
                                      <TableCell className="text-xs py-2">
                                        {d.duration ? `${d.duration}ms` : '—'}
                                      </TableCell>
                                      <TableCell className="text-xs text-muted-foreground py-2">
                                        {formatDate(d.createdAt)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Create/Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#45A452]/10">
                <Webhook className="h-4 w-4 text-[#45A452]" />
              </div>
              {editingWebhook ? 'Modifier le webhook' : 'Nouveau webhook'}
            </DialogTitle>
            <DialogDescription>
              {editingWebhook ? 'Modifiez la configuration' : 'Configurez un nouveau webhook'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="wh-name">Nom *</Label>
              <Input
                id="wh-name"
                placeholder="Ex: Notification Slack"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wh-url">URL de destination *</Label>
              <Input
                id="wh-url"
                placeholder="https://example.com/webhook"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Actif</SelectItem>
                    <SelectItem value="DISABLED">Désactivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wh-secret">Secret</Label>
                <div className="flex gap-2">
                  <Input
                    id="wh-secret"
                    placeholder="whsec_..."
                    value={formSecret}
                    onChange={(e) => setFormSecret(e.target.value)}
                    className="font-mono text-xs"
                  />
                  {!editingWebhook && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 h-9 w-9"
                      onClick={() => setFormSecret(generateSecret())}
                      title="Générer un secret"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Événements</Label>
              <div className="max-h-48 overflow-y-auto rounded-lg border p-2 space-y-1">
                {WEBHOOK_EVENTS.map((event) => (
                  <label
                    key={event}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedEvents.includes(event)}
                      onCheckedChange={() => toggleEvent(event)}
                    />
                    <Badge
                      variant="secondary"
                      className="text-[9px] font-semibold"
                      style={{
                        backgroundColor: (EVENT_COLORS[event] || '#94a3b8') + '15',
                        color: EVENT_COLORS[event] || '#94a3b8',
                      }}
                    >
                      {EVENT_LABELS[event]}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">{event}</span>
                  </label>
                ))}
              </div>
              {selectedEvents.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedEvents.length} événement(s) sélectionné(s)
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-[#45A452] hover:bg-[#2d8a3a] text-white"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Enregistrement...' : editingWebhook ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
