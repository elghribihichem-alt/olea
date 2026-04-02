'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  Users,
  Droplets,
  ShieldCheck,
  Phone,
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
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Cooperative {
  id: string
  name: string
  description: string | null
  regionId: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  memberCount: number
  annualVolume: number | null
  status: string
  certification: string | null
  foundedYear: number | null
  contactPerson: string | null
  createdAt: string
  region: { id: string; name: string } | null
}

interface Region {
  id: string
  name: string
}

interface Stats {
  total: number
  totalMembers: number
  totalVolume: number
  active: number
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#059669',
  SUSPENDED: '#dc2626',
  PENDING: '#d97706',
  INACTIVE: '#6b7280',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspendue',
  PENDING: 'En attente',
  INACTIVE: 'Inactive',
}

const STATUSES = ['ACTIVE', 'SUSPENDED', 'PENDING', 'INACTIVE']

// ─── Format helpers ────────────────────────────────────────────────────────────
function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toLocaleString('fr-FR')
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────
function CooperativesSkeleton() {
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

// ─── Main Cooperatives Component ───────────────────────────────────────────────
export default function CooperativesPage() {
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [regionFilter, setRegionFilter] = useState('ALL')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCoop, setEditingCoop] = useState<Cooperative | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formRegionId, setFormRegionId] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formWebsite, setFormWebsite] = useState('')
  const [formMemberCount, setFormMemberCount] = useState('0')
  const [formAnnualVolume, setFormAnnualVolume] = useState('')
  const [formStatus, setFormStatus] = useState('ACTIVE')
  const [formCertification, setFormCertification] = useState('')
  const [formFoundedYear, setFormFoundedYear] = useState('')
  const [formContactPerson, setFormContactPerson] = useState('')

  // ─── Fetch data ───────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (regionFilter !== 'ALL') params.set('regionId', regionFilter)

      const res = await fetch(`/api/cooperatives?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCooperatives(data.cooperatives || [])
        setStats(data.stats || null)
        setRegions(data.regions || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, regionFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ─── Open create dialog ───────────────────────────────────────────────────
  const openCreateDialog = () => {
    setEditingCoop(null)
    resetForm()
    setDialogOpen(true)
  }

  // ─── Open edit dialog ─────────────────────────────────────────────────────
  const openEditDialog = (coop: Cooperative) => {
    setEditingCoop(coop)
    setFormName(coop.name)
    setFormDescription(coop.description || '')
    setFormRegionId(coop.regionId || '')
    setFormAddress(coop.address || '')
    setFormPhone(coop.phone || '')
    setFormEmail(coop.email || '')
    setFormWebsite(coop.website || '')
    setFormMemberCount(String(coop.memberCount))
    setFormAnnualVolume(coop.annualVolume ? String(coop.annualVolume) : '')
    setFormStatus(coop.status)
    setFormCertification(coop.certification || '')
    setFormFoundedYear(coop.foundedYear ? String(coop.foundedYear) : '')
    setFormContactPerson(coop.contactPerson || '')
    setDialogOpen(true)
  }

  // ─── Reset form ───────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormName('')
    setFormDescription('')
    setFormRegionId('')
    setFormAddress('')
    setFormPhone('')
    setFormEmail('')
    setFormWebsite('')
    setFormMemberCount('0')
    setFormAnnualVolume('')
    setFormStatus('ACTIVE')
    setFormCertification('')
    setFormFoundedYear('')
    setFormContactPerson('')
  }

  // ─── Handle submit ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error('Le nom est requis')
      return
    }

    setSubmitting(true)
    try {
      const url = editingCoop ? `/api/cooperatives/${editingCoop.id}` : '/api/cooperatives'
      const method = editingCoop ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription || undefined,
          regionId: formRegionId || undefined,
          address: formAddress || undefined,
          phone: formPhone || undefined,
          email: formEmail || undefined,
          website: formWebsite || undefined,
          memberCount: parseInt(formMemberCount, 10) || 0,
          annualVolume: formAnnualVolume ? parseFloat(formAnnualVolume) : undefined,
          status: formStatus,
          certification: formCertification || undefined,
          foundedYear: formFoundedYear ? parseInt(formFoundedYear, 10) : undefined,
          contactPerson: formContactPerson || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erreur lors de l'opération")
      }

      toast.success(editingCoop ? 'Coopérative mise à jour' : 'Coopérative créée')
      setDialogOpen(false)
      resetForm()
      fetchData()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'opération")
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/cooperatives/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur lors de la suppression')
      toast.success('Coopérative supprimée')
      fetchData()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la suppression')
    }
  }

  // ─── Reset filters ───────────────────────────────────────────────────────
  const resetFilters = () => {
    setSearch('')
    setStatusFilter('ALL')
    setRegionFilter('ALL')
  }

  // ─── Loading state ───────────────────────────────────────────────────────
  if (loading) return <CooperativesSkeleton />

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ── Stats Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard
          title="Total coopératives"
          value={stats?.total || 0}
          subtitle="Enregistrées"
          icon={Building2}
          iconColor="text-[#45A452]"
          iconBg="bg-[#45A452]/10"
        />
        <StatsCard
          title="Membres totaux"
          value={formatNumber(stats?.totalMembers || 0)}
          subtitle="Toutes coopératives"
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatsCard
          title="Volume total"
          value={formatNumber(stats?.totalVolume || 0)}
          subtitle="Litres par an"
          icon={Droplets}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatsCard
          title="Coopératives actives"
          value={stats?.active || 0}
          subtitle="En activité"
          icon={ShieldCheck}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#45A452]" />
                Coopératives
              </CardTitle>
              <CardDescription>Gestion des coopératives oléicoles</CardDescription>
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
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder="Région" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toutes</SelectItem>
                  {regions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={resetFilters}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button className="bg-[#45A452] hover:bg-[#2d8a3a] text-white" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Nom</TableHead>
                  <TableHead className="text-xs">Région</TableHead>
                  <TableHead className="text-xs">Membres</TableHead>
                  <TableHead className="text-xs">Volume annuel</TableHead>
                  <TableHead className="text-xs">Statut</TableHead>
                  <TableHead className="text-xs">Certification</TableHead>
                  <TableHead className="text-xs">Contact</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cooperatives.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      Aucune coopérative trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  cooperatives.map((coop) => (
                    <TableRow key={coop.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="py-3">
                        <div>
                          <p className="text-sm font-medium">{coop.name}</p>
                          {coop.contactPerson && (
                            <p className="text-xs text-muted-foreground">{coop.contactPerson}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-3">
                        {coop.region?.name || '—'}
                      </TableCell>
                      <TableCell className="text-xs py-3 font-medium">{coop.memberCount}</TableCell>
                      <TableCell className="text-xs py-3">
                        {coop.annualVolume ? `${formatNumber(coop.annualVolume)} L` : '—'}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold"
                          style={{
                            backgroundColor: (STATUS_COLORS[coop.status] || '#94a3b8') + '15',
                            color: STATUS_COLORS[coop.status] || '#94a3b8',
                          }}
                        >
                          {STATUS_LABELS[coop.status] || coop.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-3">
                        {coop.certification || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-3">
                        {coop.phone || coop.email || '—'}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(coop)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-500"
                            onClick={() => handleDelete(coop.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Create/Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#45A452]/10">
                <Building2 className="h-4 w-4 text-[#45A452]" />
              </div>
              {editingCoop ? 'Modifier la coopérative' : 'Nouvelle coopérative'}
            </DialogTitle>
            <DialogDescription>
              {editingCoop ? 'Modifiez les informations' : 'Ajoutez une nouvelle coopérative'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="coop-name">Nom *</Label>
              <Input id="coop-name" placeholder="Nom de la coopérative" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coop-description">Description</Label>
              <Textarea id="coop-description" placeholder="Description..." value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Région</Label>
                <Select value={formRegionId} onValueChange={setFormRegionId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucune</SelectItem>
                    {regions.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coop-members">Nombre de membres</Label>
                <Input id="coop-members" type="number" placeholder="0" value={formMemberCount} onChange={(e) => setFormMemberCount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coop-volume">Volume annuel (L)</Label>
                <Input id="coop-volume" type="number" placeholder="0" value={formAnnualVolume} onChange={(e) => setFormAnnualVolume(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coop-phone">Téléphone</Label>
                <Input id="coop-phone" placeholder="+216..." value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coop-email">Email</Label>
                <Input id="coop-email" type="email" placeholder="email@example.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coop-contact">Personne contact</Label>
                <Input id="coop-contact" placeholder="Nom du contact" value={formContactPerson} onChange={(e) => setFormContactPerson(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coop-year">Année fondation</Label>
                <Input id="coop-year" type="number" placeholder="2020" value={formFoundedYear} onChange={(e) => setFormFoundedYear(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coop-cert">Certification</Label>
              <Input id="coop-cert" placeholder="Ex: Bio, AOP..." value={formCertification} onChange={(e) => setFormCertification(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coop-address">Adresse</Label>
              <Input id="coop-address" placeholder="Adresse physique" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button
              className="bg-[#45A452] hover:bg-[#2d8a3a] text-white"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Enregistrement...' : editingCoop ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
