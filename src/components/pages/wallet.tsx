'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  CreditCard,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import ReactECharts from 'echarts-for-react'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface WalletStats {
  currentBalance: number
  creditsThisMonth: number
  debitsThisMonth: number
  transactionCount: number
}

interface ChartDataPoint {
  date: string
  credits: number
  debits: number
}

interface Transaction {
  id: string
  type: string
  description: string
  amount: number
  status: string
  reference: string
  createdAt: string
}

interface BackOfficeAccount {
  id: string
  email: string
  name: string
  enterprise: string | null
  role: string
  status: string
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  CREDIT: 'Crédit',
  DEBIT: 'Débit',
  REFUND: 'Remboursement',
  SUBSCRIPTION: 'Abonnement',
}

const TYPE_COLORS: Record<string, string> = {
  CREDIT: '#45A452',
  DEBIT: '#ef4444',
  REFUND: '#f59e0b',
  SUBSCRIPTION: '#8b5cf6',
}

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Complété',
  PENDING: 'En attente',
  FAILED: 'Échoué',
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#45A452',
  PENDING: '#f59e0b',
  FAILED: '#ef4444',
}

// ─── Common ECharts tooltip style ──────────────────────────────────────────────
const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.96)',
  borderColor: '#e2e8f0',
  borderWidth: 1,
  textStyle: { color: '#334155', fontSize: 12 },
  extraCssText: 'border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);',
}

// ─── Format helpers ────────────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-TN', {
    style: 'decimal',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount) + ' TND'
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toLocaleString('fr-FR')
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

// ─── Loading Skeleton ──────────────────────────────────────────────────────────
function WalletSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  )
}

// ─── Main Wallet Component ─────────────────────────────────────────────────────
export default function WalletPage() {
  const [stats, setStats] = useState<WalletStats | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<BackOfficeAccount[]>([])
  const [loading, setLoading] = useState(true)

  // Transaction table state
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Dialog state
  const [creditDialogOpen, setCreditDialogOpen] = useState(false)
  const [debitDialogOpen, setDebitDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formAccountId, setFormAccountId] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formDescription, setFormDescription] = useState('')

  // ─── Fetch data ───────────────────────────────────────────────────────────
  const fetchWalletData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, chartRes] = await Promise.all([
        fetch('/api/wallet/stats'),
        fetch('/api/wallet'),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
        setChartData(statsData.chartData || [])
      }

      if (chartRes.ok) {
        const walletData = await chartRes.json()
        // Only set fallback if stats endpoint failed
        if (!statsRes.ok) {
          setStats((prev) => prev ?? {
            currentBalance: walletData.balance || 0,
            creditsThisMonth: walletData.creditsThisMonth || 0,
            debitsThisMonth: walletData.debitsThisMonth || 0,
            transactionCount: walletData.transactionCount || 0,
          })
        }
      }

      // Fetch accounts for dialogs
      const accountsRes = await fetch('/api/accounts?limit=100')
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json()
        setAccounts(accountsData.accounts || [])
      }
    } catch (error) {
      console.error('Wallet fetch error:', error)
    }
  }, [])

  const fetchTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })
      if (typeFilter !== 'ALL') params.set('type', typeFilter)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)

      const res = await fetch(`/api/wallet/transactions?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || [])
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Transactions fetch error:', error)
    }
  }, [page, typeFilter, statusFilter])

  useEffect(() => {
    fetchWalletData().finally(() => setLoading(false))
  }, [fetchWalletData])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // ─── Handle credit/debit submit ──────────────────────────────────────────
  const handleSubmit = async (type: 'credit' | 'debit') => {
    if (!formAccountId) {
      toast.error('Veuillez sélectionner un compte')
      return
    }
    if (!formAmount || parseFloat(formAmount) <= 0) {
      toast.error('Veuillez saisir un montant valide')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/wallet/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: formAccountId,
          amount: parseFloat(formAmount),
          description: formDescription || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur lors de l\'opération')
      }

      toast.success(type === 'credit' ? 'Crédit effectué avec succès' : 'Débit effectué avec succès')
      setCreditDialogOpen(false)
      setDebitDialogOpen(false)
      resetForm()
      fetchWalletData()
      fetchTransactions()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'opération')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormAccountId('')
    setFormAmount('')
    setFormDescription('')
  }

  const openDialog = (type: 'credit' | 'debit') => {
    resetForm()
    if (type === 'credit') setCreditDialogOpen(true)
    else setDebitDialogOpen(true)
  }

  // ─── Reset filters ───────────────────────────────────────────────────────
  const resetFilters = () => {
    setTypeFilter('ALL')
    setStatusFilter('ALL')
    setPage(1)
  }

  // ─── Loading state ───────────────────────────────────────────────────────
  if (loading) return <WalletSkeleton />

  if (!stats) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground">Erreur de chargement des données du portefeuille</p>
      </div>
    )
  }

  // ─── ECharts Options ─────────────────────────────────────────────────────
  const chartOption = {
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'axis',
      formatter: (params: { name: string; seriesName: string; value: number; marker: string }[]) => {
        let html = `<strong>${params[0].name}</strong><br/>`
        params.forEach((p) => {
          html += `${p.marker} ${p.seriesName} : <b>${formatCurrency(p.value)}</b><br/>`
        })
        return html
      },
    },
    legend: {
      data: ['Crédits', 'Débits'],
      top: 0,
      right: 0,
      textStyle: { color: '#64748b', fontSize: 12 },
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 8,
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: chartData.map((d) => {
        const date = new Date(d.date)
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      }),
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { fontSize: 11, color: '#64748b' },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: {
        fontSize: 11,
        color: '#94a3b8',
        formatter: (value: number) => {
          if (value >= 1000) return (value / 1000).toFixed(0) + 'K'
          return value.toString()
        },
      },
    },
    series: [
      {
        name: 'Crédits',
        type: 'line',
        smooth: 0.4,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(69,164,82,0.35)' },
              { offset: 0.5, color: 'rgba(69,164,82,0.12)' },
              { offset: 1, color: 'rgba(69,164,82,0.01)' },
            ],
          },
        },
        lineStyle: { width: 2.5, color: '#45A452' },
        itemStyle: { color: '#45A452', borderWidth: 2, borderColor: '#fff' },
        emphasis: {
          itemStyle: {
            shadowBlur: 8,
            shadowColor: 'rgba(69,164,82,0.4)',
            borderColor: '#fff',
            borderWidth: 3,
          },
        },
        data: chartData.map((d) => d.credits),
        animationDuration: 1200,
        animationEasing: 'cubicOut',
      },
      {
        name: 'Débits',
        type: 'line',
        smooth: 0.4,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(239,68,68,0.3)' },
              { offset: 0.5, color: 'rgba(239,68,68,0.1)' },
              { offset: 1, color: 'rgba(239,68,68,0.01)' },
            ],
          },
        },
        lineStyle: { width: 2.5, color: '#ef4444' },
        itemStyle: { color: '#ef4444', borderWidth: 2, borderColor: '#fff' },
        emphasis: {
          itemStyle: {
            shadowBlur: 8,
            shadowColor: 'rgba(239,68,68,0.4)',
            borderColor: '#fff',
            borderWidth: 3,
          },
        },
        data: chartData.map((d) => d.debits),
        animationDuration: 1200,
        animationEasing: 'cubicOut',
      },
    ],
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ── Stats Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard
          title="Solde actuel"
          value={formatCurrency(stats.currentBalance)}
          subtitle="Portefeuille principal"
          icon={Wallet}
          iconColor="text-[#45A452]"
          iconBg="bg-[#45A452]/10"
        />
        <StatsCard
          title="Crédits ce mois"
          value={formatCurrency(stats.creditsThisMonth)}
          subtitle="Entrées"
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatsCard
          title="Débits ce mois"
          value={formatCurrency(stats.debitsThisMonth)}
          subtitle="Sorties"
          icon={TrendingDown}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
        <StatsCard
          title="Transactions"
          value={formatNumber(stats.transactionCount)}
          subtitle="Total des opérations"
          icon={CreditCard}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
      </div>

      {/* ── Chart + Quick Actions ──────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Balance History Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[#45A452]" />
              Flux de trésorerie (7 jours)
            </CardTitle>
            <CardDescription>Crédits et débits quotidiens</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {chartData.length > 0 ? (
                <ReactECharts
                  option={chartOption}
                  style={{ height: '100%', width: '100%' }}
                  opts={{ renderer: 'svg' }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  Aucune donnée disponible pour cette période
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#45A452]" />
              Actions rapides
            </CardTitle>
            <CardDescription>Opérations sur le portefeuille</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Credit action */}
            <button
              onClick={() => openDialog('credit')}
              className="w-full flex items-center gap-4 rounded-xl border border-dashed border-[#45A452]/40 bg-[#45A452]/5 p-4 text-left transition-all hover:border-[#45A452] hover:bg-[#45A452]/10 hover:shadow-sm"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#45A452]/15">
                <Plus className="h-6 w-6 text-[#45A452]" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground">Créditer un compte</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ajouter des fonds au portefeuille
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-[#45A452] ml-auto shrink-0" />
            </button>

            {/* Debit action */}
            <button
              onClick={() => openDialog('debit')}
              className="w-full flex items-center gap-4 rounded-xl border border-dashed border-red-300/60 bg-red-50/50 p-4 text-left transition-all hover:border-red-400 hover:bg-red-50 hover:shadow-sm"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100">
                <Minus className="h-6 w-6 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground">Débiter un compte</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Retirer des fonds du portefeuille
                </p>
              </div>
              <ArrowDownLeft className="h-4 w-4 text-red-500 ml-auto shrink-0" />
            </button>

            {/* Summary info */}
            <div className="rounded-xl bg-muted/50 p-4 space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Résumé du mois
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#45A452]" />
                    Crédits
                  </span>
                  <span className="font-semibold text-[#45A452]">
                    +{formatCurrency(stats.creditsThisMonth)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    Débits
                  </span>
                  <span className="font-semibold text-red-600">
                    -{formatCurrency(stats.debitsThisMonth)}
                  </span>
                </div>
                <div className="border-t pt-2 flex items-center justify-between text-sm">
                  <span className="font-medium">Solde net</span>
                  <span className={`font-bold ${stats.creditsThisMonth - stats.debitsThisMonth >= 0 ? 'text-[#45A452]' : 'text-red-600'}`}>
                    {stats.creditsThisMonth - stats.debitsThisMonth >= 0 ? '+' : ''}
                    {formatCurrency(stats.creditsThisMonth - stats.debitsThisMonth)}
                  </span>
                </div>
              </div>
            </div>

            {/* Refresh button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setLoading(true)
                fetchWalletData().finally(() => setLoading(false))
                fetchTransactions()
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser les données
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── Transaction History ────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#45A452]" />
                Historique des transactions
              </CardTitle>
              <CardDescription className="mt-1">
                Toutes les opérations sur le portefeuille
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Search input */}
              <div className="relative hidden md:block">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Référence..."
                  className="h-9 w-[180px] pl-9"
                  readOnly
                />
              </div>

              {/* Type filter */}
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
                <SelectTrigger className="h-9 w-full sm:w-[150px]">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les types</SelectItem>
                  <SelectItem value="CREDIT">Crédit</SelectItem>
                  <SelectItem value="DEBIT">Débit</SelectItem>
                  <SelectItem value="REFUND">Remboursement</SelectItem>
                  <SelectItem value="SUBSCRIPTION">Abonnement</SelectItem>
                </SelectContent>
              </Select>

              {/* Status filter */}
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="h-9 w-full sm:w-[150px]">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les statuts</SelectItem>
                  <SelectItem value="COMPLETED">Complété</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="FAILED">Échoué</SelectItem>
                </SelectContent>
              </Select>

              {/* Reset */}
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={resetFilters}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs text-right">Montant</TableHead>
                  <TableHead className="text-xs">Statut</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Référence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      Aucune transaction trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap py-3">
                        {formatDate(tx.createdAt)}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold"
                          style={{
                            backgroundColor: (TYPE_COLORS[tx.type] || '#94a3b8') + '15',
                            color: TYPE_COLORS[tx.type] || '#94a3b8',
                          }}
                        >
                          {TYPE_LABELS[tx.type] || tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm py-3 max-w-[200px] truncate">
                        {tx.description || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-right font-semibold py-3 whitespace-nowrap">
                        <span
                          className={
                            tx.type === 'CREDIT' || tx.type === 'REFUND'
                              ? 'text-[#45A452]'
                              : 'text-red-600'
                          }
                        >
                          {tx.type === 'CREDIT' || tx.type === 'REFUND' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold"
                          style={{
                            backgroundColor: (STATUS_COLORS[tx.status] || '#94a3b8') + '15',
                            color: STATUS_COLORS[tx.status] || '#94a3b8',
                          }}
                        >
                          {STATUS_LABELS[tx.status] || tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell font-mono py-3">
                        {tx.reference || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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

      {/* ── Credit Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#45A452]/10">
                <Plus className="h-4 w-4 text-[#45A452]" />
              </div>
              Créditer un compte
            </DialogTitle>
            <DialogDescription>
              Ajouter des fonds au portefeuille d&apos;un compte
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="credit-account">Compte cible *</Label>
              <Select value={formAccountId} onValueChange={setFormAccountId}>
                <SelectTrigger id="credit-account">
                  <SelectValue placeholder="Sélectionner un compte" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      <div className="flex items-center gap-2">
                        <span>{acc.name}</span>
                        <span className="text-muted-foreground text-xs">({acc.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit-amount">Montant (TND) *</Label>
              <Input
                id="credit-amount"
                type="number"
                min="0.001"
                step="0.001"
                placeholder="0.000"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit-description">Description (optionnel)</Label>
              <Input
                id="credit-description"
                placeholder="Motif du crédit..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCreditDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              className="bg-[#45A452] hover:bg-[#2d8a3a] text-white"
              onClick={() => handleSubmit('credit')}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Créditer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Debit Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={debitDialogOpen} onOpenChange={setDebitDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                <Minus className="h-4 w-4 text-red-600" />
              </div>
              Débiter un compte
            </DialogTitle>
            <DialogDescription>
              Retirer des fonds du portefeuille d&apos;un compte
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="debit-account">Compte cible *</Label>
              <Select value={formAccountId} onValueChange={setFormAccountId}>
                <SelectTrigger id="debit-account">
                  <SelectValue placeholder="Sélectionner un compte" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      <div className="flex items-center gap-2">
                        <span>{acc.name}</span>
                        <span className="text-muted-foreground text-xs">({acc.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="debit-amount">Montant (TND) *</Label>
              <Input
                id="debit-amount"
                type="number"
                min="0.001"
                step="0.001"
                placeholder="0.000"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debit-description">Description (optionnel)</Label>
              <Input
                id="debit-description"
                placeholder="Motif du débit..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDebitDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => handleSubmit('debit')}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <Minus className="mr-2 h-4 w-4" />
                  Débiter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
