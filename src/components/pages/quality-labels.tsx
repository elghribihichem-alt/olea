'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Award,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  Shield,
  CalendarClock,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StatsCard } from '@/components/stats-card'
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
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface QualityLabel {
  id: string
  name: string
  description: string | null
  category: string
  status: string
  icon: string | null
  certifier: string | null
  validFrom: string | null
  validUntil: string | null
  criteria: string | null
  createdAt: string
  updatedAt: string
}

interface Stats {
  total: number
  active: number
  expired: number
  byCategory: Record<string, number>
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  AOP: '#7c3aed',
  AOC: '#d97706',
  BIO: '#059669',
  NATURE: '#0d9488',
  FAIR_TRADE: '#ec4899',
  TRADITIONNEL: '#92400e',
  PREMIUM: '#ca8a04',
  CUSTOM: '#3b82f6',
}

const CATEGORY_LABELS: Record<string, string> = {
  AOP: 'AOP',
  AOC: 'AOC',
  BIO: 'Bio',
  NATURE: 'Nature',
  FAIR_TRADE: 'Commerce Équitable',
  TRADITIONNEL: 'Traditionnel',
  PREMIUM: 'Premium',
  CUSTOM: 'Personnalisé',
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#059669',
  INACTIVE: '#6b7280',
  PENDING_RENEWAL: '#d97706',
  EXPIRED: '#dc2626',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  PENDING_RENEWAL: 'Renouvellement',
  EXPIRED: 'Expiré',
}

const CATEGORIES = ['AOP', 'AOC', 'BIO', 'NATURE', 'FAIR_TRADE', 'TRADITIONNEL', 'PREMIUM', 'CUSTOM']
const STATUSES = ['ACTIVE', 'INACTIVE', 'PENDING_RENEWAL', 'EXPIRED']

// ─── Format helpers ────────────────────────────────────────────────────────────
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────
function LabelsSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-14 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Quality Labels Component ─────────────────────────────────────────────
export default function QualityLabelsPage() {
  const [labels, setLabels] = useState<QualityLabel[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLabel, setEditingLabel] = useState<QualityLabel | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState('BIO')
  const [formStatus, setFormStatus] = useState('ACTIVE')
  const [formCertifier, setFormCertifier] = useState('')
  const [formValidFrom, setFormValidFrom] = useState('')
  const [formValidUntil, setFormValidUntil] = useState('')
  const [formCriteria, setFormCriteria] = useState('')

  // ─── Fetch data ───────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter)

      const res = await fetch(`/api/quality-labels?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLabels(data.labels || [])
        setStats(data.stats || null)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ─── Open create dialog ───────────────────────────────────────────────────
  const openCreateDialog = () => {
    setEditingLabel(null)
    resetForm()
    setDialogOpen(true)
  }

  // ─── Open edit dialog ─────────────────────────────────────────────────────
  const openEditDialog = (label: QualityLabel) => {
    setEditingLabel(label)
    setFormName(label.name)
    setFormDescription(label.description || '')
    setFormCategory(label.category)
    setFormStatus(label.status)
    setFormCertifier(label.certifier || '')
    setFormValidFrom(label.validFrom ? label.validFrom.slice(0, 10) : '')
    setFormValidUntil(label.validUntil ? label.validUntil.slice(0, 10) : '')
    setFormCriteria(label.criteria || '')
    setDialogOpen(true)
  }

  // ─── Reset form ───────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormName('')
    setFormDescription('')
    setFormCategory('BIO')
    setFormStatus('ACTIVE')
    setFormCertifier('')
    setFormValidFrom('')
    setFormValidUntil('')
    setFormCriteria('')
  }

  // ─── Handle submit ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error('Le nom est requis')
      return
    }
    if (!formCategory) {
      toast.error('La catégorie est requise')
      return
    }

    setSubmitting(true)
    try {
      const url = editingLabel ? `/api/quality-labels/${editingLabel.id}` : '/api/quality-labels'
      const method = editingLabel ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription || undefined,
          category: formCategory,
          status: formStatus,
          certifier: formCertifier || undefined,
          validFrom: formValidFrom || undefined,
          validUntil: formValidUntil || undefined,
          criteria: formCriteria || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erreur lors de l'opération")
      }

      toast.success(editingLabel ? 'Label mis à jour' : 'Label créé avec succès')
      setDialogOpen(false)
      resetForm()
      fetchData()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'opération")
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Delete label ─────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/quality-labels/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur lors de la suppression')
      }
      toast.success('Label supprimé')
      fetchData()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la suppression')
    }
  }

  // ─── Reset filters ───────────────────────────────────────────────────────
  const resetFilters = () => {
    setSearch('')
    setCategoryFilter('ALL')
  }

  // ─── Loading state ───────────────────────────────────────────────────────
  if (loading) return <LabelsSkeleton />

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ── Stats Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard
          title="Total labels"
          value={stats?.total || 0}
          subtitle="Tous les labels"
          icon={Award}
          iconColor="text-[#45A452]"
          iconBg="bg-[#45A452]/10"
        />
        <StatsCard
          title="Labels actifs"
          value={stats?.active || 0}
          subtitle="En cours de validité"
          icon={Shield}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatsCard
          title="Labels expirés"
          value={stats?.expired || 0}
          subtitle="À renouveler"
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
        <StatsCard
          title="Catégories"
          value={stats?.byCategory ? Object.keys(stats.byCategory).length : 0}
          subtitle="Types de labels"
          icon={CalendarClock}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
      </div>

      {/* ── Category Distribution ──────────────────────────────────────────── */}
      {stats?.byCategory && Object.keys(stats.byCategory).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byCategory).map(([cat, count]) => (
                <Badge
                  key={cat}
                  variant="secondary"
                  className="text-xs font-semibold"
                  style={{
                    backgroundColor: (CATEGORY_COLORS[cat] || '#94a3b8') + '15',
                    color: CATEGORY_COLORS[cat] || '#94a3b8',
                  }}
                >
                  {CATEGORY_LABELS[cat] || cat}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Header + Filters ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-[#45A452]" />
                Labels de Qualité
              </CardTitle>
              <CardDescription>Gestion des certifications et labels</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  className="h-9 w-[180px] pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 w-[150px]">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toutes</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={resetFilters}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                className="bg-[#45A452] hover:bg-[#2d8a3a] text-white"
                onClick={openCreateDialog}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nouveau
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {labels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Award className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Aucun label trouvé</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {labels.map((label) => (
                <Card key={label.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: (CATEGORY_COLORS[label.category] || '#94a3b8') + '15' }}
                        >
                          <Award className="h-5 w-5" style={{ color: CATEGORY_COLORS[label.category] || '#94a3b8' }} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">{label.name}</h3>
                          {label.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-[150px]">
                              {label.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditDialog(label)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-500"
                          onClick={() => handleDelete(label.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-semibold"
                        style={{
                          backgroundColor: (CATEGORY_COLORS[label.category] || '#94a3b8') + '15',
                          color: CATEGORY_COLORS[label.category] || '#94a3b8',
                        }}
                      >
                        {CATEGORY_LABELS[label.category] || label.category}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-semibold"
                        style={{
                          backgroundColor: (STATUS_COLORS[label.status] || '#94a3b8') + '15',
                          color: STATUS_COLORS[label.status] || '#94a3b8',
                        }}
                      >
                        {STATUS_LABELS[label.status] || label.status}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {label.certifier && (
                        <p className="flex items-center gap-1.5">
                          <Shield className="h-3 w-3" />
                          {label.certifier}
                        </p>
                      )}
                      <p className="flex items-center gap-1.5">
                        <CalendarClock className="h-3 w-3" />
                        {formatDate(label.validFrom)} — {formatDate(label.validUntil)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                <Award className="h-4 w-4 text-[#45A452]" />
              </div>
              {editingLabel ? 'Modifier le label' : 'Nouveau label'}
            </DialogTitle>
            <DialogDescription>
              {editingLabel ? 'Modifiez les informations du label' : 'Créez un nouveau label de qualité'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="label-name">Nom *</Label>
              <Input
                id="label-name"
                placeholder="Ex: Huile d'olive bio Sfax"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="label-description">Description</Label>
              <Textarea
                id="label-description"
                placeholder="Description du label..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie *</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="label-certifier">Organisme certificateur</Label>
              <Input
                id="label-certifier"
                placeholder="Ex: Ecocert, AGROBIO..."
                value={formCertifier}
                onChange={(e) => setFormCertifier(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="label-from">Date début</Label>
                <Input
                  id="label-from"
                  type="date"
                  value={formValidFrom}
                  onChange={(e) => setFormValidFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="label-until">Date fin</Label>
                <Input
                  id="label-until"
                  type="date"
                  value={formValidUntil}
                  onChange={(e) => setFormValidUntil(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="label-criteria">Critères</Label>
              <Textarea
                id="label-criteria"
                placeholder="Critères d'obtention..."
                value={formCriteria}
                onChange={(e) => setFormCriteria(e.target.value)}
                rows={2}
              />
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
              {submitting ? 'Enregistrement...' : editingLabel ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
