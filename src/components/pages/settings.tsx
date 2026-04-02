'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Globe,
  Bell,
  CreditCard,
  Scale,
  Shield,
  Mail,
  Smartphone,
  Clock,
  Leaf,
  Package,
  ToggleLeft,
  ToggleRight,
  Gavel,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Setting {
  id: string
  key: string
  value: string
  description: string | null
  createdAt: string
  updatedAt: string
}

// ─── Default settings to seed ──────────────────────────────────────────────────
const DEFAULT_SETTINGS: Array<{ key: string; value: string; description: string; group: string; label: string }> = [
  { key: 'platform_name', value: 'EnchereSolive', description: 'Nom de la plateforme', group: 'platform', label: 'Nom de la plateforme' },
  { key: 'platform_currency', value: 'DT', description: 'Devise utilisee', group: 'platform', label: 'Devise' },
  { key: 'platform_language', value: 'fr', description: 'Langue par defaut', group: 'platform', label: 'Langue' },
  { key: 'platform_country', value: 'Tunisie', description: 'Pays de la plateforme', group: 'platform', label: 'Pays' },
  { key: 'auction_max_active', value: '50', description: 'Nombre max enchères actives par vendeur', group: 'auction', label: "Max enchères actives / vendeur" },
  { key: 'auction_default_duration', value: '7', description: 'Durée par defaut en jours', group: 'auction', label: 'Durée par défaut (jours)' },
  { key: 'auction_min_quantity', value: '100', description: 'Quantite minimale en kg', group: 'auction', label: 'Quantité minimum (kg)' },
  { key: 'auction_max_quantity', value: '50000', description: 'Quantite maximale en kg', group: 'auction', label: 'Quantité maximum (kg)' },
  { key: 'auction_auto_close', value: 'true', description: 'Fermeture automatique à expiration', group: 'auction', label: 'Fermeture automatique' },
  { key: 'auction_allow_offline', value: 'true', description: 'Autoriser les enchères hors ligne', group: 'auction', label: 'Enchères hors ligne' },
  { key: 'notification_new_bid', value: 'true', description: 'Notifier le vendeur pour chaque nouvelle offre', group: 'notifications', label: 'Notification nouvelle offre' },
  { key: 'notification_auction_won', value: 'true', description: 'Notifier l\'acheteur quand il gagne', group: 'notifications', label: 'Notification enchère gagnée' },
  { key: 'notification_auction_closing', value: 'true', description: 'Notifier 24h avant la fin', group: 'notifications', label: 'Alerte fin prochaine' },
  { key: 'notification_new_user', value: 'true', description: 'Notifier admin pour chaque nouvel utilisateur', group: 'notifications', label: 'Notification nouvel utilisateur' },
  { key: 'fees_buyer_percentage', value: '0', description: 'Frais acheteur en pourcentage', group: 'fees', label: 'Frais acheteur (%)' },
  { key: 'fees_seller_percentage', value: '2.5', description: 'Frais vendeur en pourcentage', group: 'fees', label: 'Frais vendeur (%)' },
  { key: 'fees_min_amount', value: '10', description: 'Montant minimum des frais en DT', group: 'fees', label: 'Montant minimum frais (DT)' },
  { key: 'legal_terms_url', value: 'https://encheresolive.tn/cgu', description: 'URL des CGU', group: 'legal', label: 'URL Conditions Générales' },
  { key: 'legal_privacy_url', value: 'https://encheresolive.tn/privacy', description: 'URL de la politique de confidentialite', group: 'legal', label: 'URL Politique de confidentialité' },
  { key: 'legal_support_email', value: 'support@encheresolive.tn', description: 'Email de support', group: 'legal', label: 'Email de support' },
  { key: 'legal_support_phone', value: '+216 71 000 000', description: 'Telephone de support', group: 'legal', label: 'Téléphone de support' },
]

const GROUP_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  platform: { label: 'Plateforme', icon: Globe, color: '#45A452' },
  auction: { label: 'Enchères', icon: Gavel, color: '#6366f1' },
  notifications: { label: 'Notifications', icon: Bell, color: '#f59e0b' },
  fees: { label: 'Frais & Commissions', icon: CreditCard, color: '#ef4444' },
  legal: { label: 'Juridique & Support', icon: Scale, color: '#06b6d4' },
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function SettingsSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modifiedKeys, setModifiedKeys] = useState<Set<string>>(new Set())
  const [editValues, setEditValues] = useState<Record<string, string>>({})

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newSetting, setNewSetting] = useState({ key: '', value: '', description: '' })

  // ─── Fetch ───────────────────────────────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error()
      const data = await res.json()
      const existingSettings = data.settings as Setting[]

      // Seed default settings if none exist
      if (existingSettings.length === 0) {
        const seedRes = await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updates: DEFAULT_SETTINGS.map((s) => ({ key: s.key, value: s.value })),
          }),
        })
        if (seedRes.ok) {
          const seedData = await seedRes.json()
          setSettings(seedData.settings)
        }
      } else {
        setSettings(existingSettings)
      }
    } catch {
      toast.error('Erreur lors du chargement des paramètres')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  // ─── Edit value ─────────────────────────────────────────────────────────
  const handleValueChange = (key: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [key]: value }))
    const original = settings.find((s) => s.key === key)
    if (original && original.value !== value) {
      setModifiedKeys((prev) => new Set(prev).add(key))
    } else {
      setModifiedKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  // ─── Save all ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (modifiedKeys.size === 0) return
    setSaving(true)
    try {
      const updates = Array.from(modifiedKeys).map((key) => ({
        key,
        value: editValues[key] !== undefined ? editValues[key] : (settings.find((s) => s.key === key)?.value || ''),
      }))
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      if (!res.ok) throw new Error()
      toast.success(`${updates.length} paramètre(s) mis à jour(s)`)
      setModifiedKeys(new Set())
      setEditValues({})
      fetchSettings()
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  // ─── Add setting ────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newSetting.key || !newSetting.value) {
      toast.error('Clé et valeur sont requis')
      return
    }
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSetting),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      toast.success('Paramètre ajouté')
      setAddDialogOpen(false)
      setNewSetting({ key: '', value: '', description: '' })
      fetchSettings()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    }
  }

  // ─── Delete setting ─────────────────────────────────────────────────────
  const handleDelete = async (key: string) => {
    try {
      const res = await fetch(`/api/settings/${encodeURIComponent(key)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Paramètre supprimé')
      fetchSettings()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  // ─── Toggle boolean ─────────────────────────────────────────────────────
  const handleToggle = (key: string, currentValue: string) => {
    const newValue = currentValue === 'true' ? 'false' : 'true'
    handleValueChange(key, newValue)
  }

  // ─── Render field ───────────────────────────────────────────────────────
  const renderField = (setting: Setting, defaultMeta: { label: string; type?: string } | undefined) => {
    const currentValue = editValues[setting.key] !== undefined ? editValues[setting.key] : setting.value
    const isModified = modifiedKeys.has(setting.key)
    const isBoolean = setting.value === 'true' || setting.value === 'false'
    const isDefault = DEFAULT_SETTINGS.some((ds) => ds.key === setting.key)

    if (isBoolean) {
      return (
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label className="text-sm font-medium">{defaultMeta?.label || setting.key}</Label>
            {setting.description && <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>}
          </div>
          <button
            onClick={() => handleToggle(setting.key, currentValue)}
            className="shrink-0"
          >
            {currentValue === 'true' ? (
              <ToggleRight className="h-8 w-8 text-[#45A452]" />
            ) : (
              <ToggleLeft className="h-8 w-8 text-muted-foreground" />
            )}
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{defaultMeta?.label || setting.key}</Label>
          {isModified && (
            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
              Modifié
            </Badge>
          )}
        </div>
        {setting.description && <p className="text-xs text-muted-foreground">{setting.description}</p>}
        <Input
          value={currentValue}
          onChange={(e) => handleValueChange(setting.key, e.target.value)}
          className="h-9"
        />
      </div>
    )
  }

  // ─── Group settings ─────────────────────────────────────────────────────
  const getSettingsByGroup = (groupKey: string) => {
    return settings.filter((s) => s.key.startsWith(groupKey + '_'))
  }

  if (loading) return <SettingsSkeleton />

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Configuration de la plateforme</h2>
          <p className="text-sm text-muted-foreground">
            {settings.length} paramètres{modifiedKeys.size > 0 && ` · ${modifiedKeys.size} modifié(s)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSettings}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Recharger
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Ajouter
          </Button>
          <Button
            size="sm"
            className="bg-[#45A452] hover:bg-[#2d8a3a] text-white"
            onClick={handleSave}
            disabled={modifiedKeys.size === 0 || saving}
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {saving ? 'Sauvegarde...' : `Sauvegarder (${modifiedKeys.size})`}
          </Button>
        </div>
      </div>

      {/* ── Settings Groups ───────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(GROUP_CONFIG).map(([groupKey, config]) => {
          const groupSettings = getSettingsByGroup(groupKey)
          const Icon = config.icon

          if (groupSettings.length === 0) return null

          return (
            <Card key={groupKey}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ backgroundColor: config.color + '15' }}
                  >
                    <Icon className="h-4 w-4" style={{ color: config.color }} />
                  </div>
                  {config.label}
                  <Badge variant="secondary" className="text-[10px] ml-auto">
                    {groupSettings.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {groupSettings.map((setting) => {
                    const defaultMeta = DEFAULT_SETTINGS.find((ds) => ds.key === setting.key)
                    return (
                      <div key={setting.id}>
                        {renderField(setting, defaultMeta)}
                        {groupSettings.indexOf(setting) < groupSettings.length - 1 && (
                          <Separator className="mt-4" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Other settings not in groups */}
        {(() => {
          const knownPrefixes = Object.keys(GROUP_CONFIG)
          const otherSettings = settings.filter((s) => !knownPrefixes.some((p) => s.key.startsWith(p + '_')))
          if (otherSettings.length === 0) return null

          return (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                    <SettingsIcon className="h-4 w-4 text-slate-600" />
                  </div>
                  Autres paramètres
                  <Badge variant="secondary" className="text-[10px] ml-auto">
                    {otherSettings.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {otherSettings.map((setting) => (
                    <div key={setting.id}>
                      {renderField(setting, undefined)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })()}
      </div>

      {/* ── Add Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#45A452]" />
              Nouveau paramètre
            </DialogTitle>
            <DialogDescription>Ajoutez un nouveau paramètre de configuration</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Clé *</Label>
              <Input
                placeholder="ex: platform_timezone"
                value={newSetting.key}
                onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">Utilisez le format: categorie_nom (ex: platform_timezone)</p>
            </div>
            <div className="grid gap-2">
              <Label>Valeur *</Label>
              <Input
                placeholder="Valeur du paramètre"
                value={newSetting.value}
                onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Description optionnelle..."
                value={newSetting.description}
                onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                className="min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleAdd} className="bg-[#45A452] hover:bg-[#2d8a3a] text-white">
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
