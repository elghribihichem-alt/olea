'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Shield,
  Save,
  RefreshCw,
  Check,
  X,
  Lock,
  Eye,
  Users,
  AlertTriangle,
  Loader2,
  Pencil,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface PermissionGroup {
  key: string
  label: string
  icon: string
  permissions: Array<{ key: string; label: string }>
}

interface PermissionMatrix {
  [role: string]: {
    [permKey: string]: boolean
  }
}

interface AccountPerm {
  id: string
  name: string
  email: string
  role: string
  status: string
  customPermissionsParsed: Record<string, boolean> | null
  effectivePermissions: Record<string, boolean>
}

interface PermissionsData {
  matrix: PermissionMatrix
  groups: PermissionGroup[]
  roles: string[]
  accounts: AccountPerm[]
  totalPermissions: number
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

const ROLE_ICONS: Record<string, string> = {
  SUPER_ADMIN: 'Crown',
  ADMIN: 'Shield',
  ANALYST: 'BarChart3',
  VIEWER: 'Eye',
  CUSTOM: 'Settings',
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function PermissionsSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-60 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  )
}

// ─── Toggle Cell ───────────────────────────────────────────────────────────────
function PermissionToggle({
  enabled,
  disabled,
  onChange,
}: {
  enabled: boolean
  disabled: boolean
  onChange: () => void
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-all duration-150 ${
        disabled
          ? 'cursor-not-allowed opacity-50'
          : enabled
            ? 'bg-[#45A452] text-white hover:bg-[#2d8a3a] shadow-sm'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {enabled ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
    </button>
  )
}

// ─── Stats per role ────────────────────────────────────────────────────────────
function RoleStatsCard({
  role,
  matrix,
  accounts,
  totalPermissions,
}: {
  role: string
  matrix: PermissionMatrix
  accounts: AccountPerm[]
  totalPermissions: number
}) {
  const perms = matrix[role] || {}
  const enabledCount = Object.values(perms).filter(Boolean).length
  const accountCount = accounts.filter((a) => a.role === role && a.status === 'ACTIVE').length
  const percentage = totalPermissions > 0 ? Math.round((enabledCount / totalPermissions) * 100) : 0

  return (
    <Card className="overflow-hidden">
      <div
        className="h-1"
        style={{ backgroundColor: ROLE_COLORS[role] || '#94a3b8' }}
      />
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold" style={{ color: ROLE_COLORS[role] || '#64748b' }}>
              {ROLE_LABELS[role] || role}
            </p>
            <p className="text-[11px] text-muted-foreground">{accountCount} compte(s) actif(s)</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{enabledCount}</p>
            <p className="text-[10px] text-muted-foreground">/ {totalPermissions} perms</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percentage}%`,
              backgroundColor: ROLE_COLORS[role] || '#94a3b8',
            }}
          />
        </div>
        <p className="mt-1 text-right text-[10px] text-muted-foreground">{percentage}%</p>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PermissionsPage() {
  const [data, setData] = useState<PermissionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  // Editable local matrix
  const [localMatrix, setLocalMatrix] = useState<PermissionMatrix>({})
  const [hasChanges, setHasChanges] = useState(false)

  // ─── Fetch ───────────────────────────────────────────────────────────────
  const fetchPermissions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/permissions')
      if (!res.ok) throw new Error()
      const result = await res.json()
      setData(result)
      setLocalMatrix(JSON.parse(JSON.stringify(result.matrix)))
      setHasChanges(false)
    } catch {
      toast.error('Erreur lors du chargement des permissions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPermissions() }, [fetchPermissions])

  // ─── Toggle permission ──────────────────────────────────────────────────
  const togglePermission = (role: string, permKey: string) => {
    if (role === 'SUPER_ADMIN') {
      toast.error('Les permissions du Super Admin sont verrouillées')
      return
    }

    setLocalMatrix((prev) => {
      const newMatrix = JSON.parse(JSON.stringify(prev))
      newMatrix[role] = newMatrix[role] || {}
      newMatrix[role][permKey] = !newMatrix[role][permKey]
      return newMatrix
    })
    setHasChanges(true)
  }

  // ─── Save role permissions ──────────────────────────────────────────────
  const saveRolePermissions = async (role: string) => {
    setSaving(role)
    try {
      const res = await fetch('/api/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, permissions: localMatrix[role] }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      const result = await res.json()
      toast.success(`Permissions ${ROLE_LABELS[role]} mises à jour (${result.updated} compte(s))`)
      setHasChanges(false)
      fetchPermissions()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(null)
    }
  }

  // ─── Reset role permissions ─────────────────────────────────────────────
  const resetRolePermissions = (role: string) => {
    if (role === 'SUPER_ADMIN') return
    if (!data) return
    setLocalMatrix((prev) => ({
      ...prev,
      [role]: JSON.parse(JSON.stringify(data.matrix[role])),
    }))
    setHasChanges(false)
    toast.info(`Permissions ${ROLE_LABELS[role]} réinitialisées`)
  }

  if (loading || !data) return <PermissionsSkeleton />

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Matrice des permissions</h2>
          <p className="text-sm text-muted-foreground">
            {data.roles.length} rôles · {data.totalPermissions} permissions · {data.accounts.length} comptes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchPermissions}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Recharger
          </Button>
          {hasChanges && (
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
              <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
              Modifications non sauvegardées
            </Button>
          )}
        </div>
      </div>

      {/* ── Role Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {data.roles.map((role) => (
          <RoleStatsCard
            key={role}
            role={role}
            matrix={localMatrix}
            accounts={data.accounts}
            totalPermissions={data.totalPermissions}
          />
        ))}
      </div>

      {/* ── Permission Matrix ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#45A452]" />
            Grille de permissions par rôle
          </CardTitle>
          <CardDescription>
            <span className="inline-flex items-center gap-1 text-[11px]">
              <Lock className="h-3 w-3" /> Super Admin est verrouillé
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="min-w-[700px]">
              {/* Header row */}
              <div className="sticky top-0 z-10 bg-background border-b">
                <div className="flex items-center border-b">
                  {/* Module label column */}
                  <div className="w-[200px] shrink-0 px-4 py-3 text-xs font-semibold text-muted-foreground">
                    MODULE
                  </div>
                  {/* Role columns */}
                  {data.roles.map((role) => (
                    <div
                      key={role}
                      className="flex-1 min-w-[100px] px-2 py-3 text-center"
                    >
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-semibold px-2"
                        style={{
                          backgroundColor: (ROLE_COLORS[role] || '#94a3b8') + '15',
                          color: ROLE_COLORS[role] || '#94a3b8',
                        }}
                      >
                        {ROLE_LABELS[role]}
                      </Badge>
                      {role !== 'SUPER_ADMIN' && (
                        <div className="mt-1 flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[10px] text-[#45A452] hover:text-[#45A452] hover:bg-[#45A452]/10"
                            disabled={saving === role}
                            onClick={() => saveRolePermissions(role)}
                          >
                            {saving === role ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3 mr-0.5" />
                            )}
                            Sauver
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Permission rows */}
              {data.groups.map((group) => (
                <div key={group.key}>
                  {/* Group header */}
                  <div className="flex items-center bg-muted/50 border-b">
                    <div className="w-[200px] shrink-0 px-4 py-2">
                      <span className="text-xs font-bold text-foreground">{group.label}</span>
                      <span className="ml-2 text-[10px] text-muted-foreground">({group.permissions.length})</span>
                    </div>
                    <div className="flex-1" />
                  </div>

                  {/* Permission rows */}
                  {group.permissions.map((perm, idx) => (
                    <div
                      key={perm.key}
                      className={`flex items-center hover:bg-muted/30 transition-colors ${
                        idx < group.permissions.length - 1 ? 'border-b border-border/50' : ''
                      }`}
                    >
                      <div className="w-[200px] shrink-0 px-4 py-2">
                        <span className="text-xs text-muted-foreground">{perm.label}</span>
                      </div>
                      {data.roles.map((role) => (
                        <div
                          key={role}
                          className="flex-1 min-w-[100px] flex items-center justify-center py-1.5"
                        >
                          <PermissionToggle
                            enabled={localMatrix[role]?.[perm.key] || false}
                            disabled={role === 'SUPER_ADMIN'}
                            onChange={() => togglePermission(role, perm.key)}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ── Accounts Summary ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Comptes et permissions effectives
          </CardTitle>
          <CardDescription>
            Permissions calculées pour chaque compte (personnalisées ou par défaut du rôle)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Compte</th>
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Rôle</th>
                  <th className="pb-2 pr-4 font-medium">Statut</th>
                  <th className="pb-2 pr-4 font-medium text-center">Permissions</th>
                  <th className="pb-2 font-medium text-center">Personnalisé</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.accounts.map((account) => {
                  const enabledCount = Object.values(account.effectivePermissions).filter(Boolean).length
                  return (
                    <tr key={account.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 pr-4 font-medium">{account.name}</td>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground">{account.email}</td>
                      <td className="py-2.5 pr-4">
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
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge
                          variant="secondary"
                          className="text-[10px]"
                          style={{
                            backgroundColor: account.status === 'ACTIVE' ? '#45A45215' : '#94a3b815',
                            color: account.status === 'ACTIVE' ? '#45A452' : '#94a3b8',
                          }}
                        >
                          {account.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="inline-flex items-center gap-1">
                                <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-[#45A452]"
                                    style={{
                                      width: `${data.totalPermissions > 0 ? (enabledCount / data.totalPermissions) * 100 : 0}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-medium">{enabledCount}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {enabledCount} / {data.totalPermissions} permissions actives
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      <td className="py-2.5 text-center">
                        {account.customPermissionsParsed ? (
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                            Oui
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Défaut</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
