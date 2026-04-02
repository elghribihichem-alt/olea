'use client'

import { useEffect, useState, useCallback } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  FileText,
  Download,
  Trash2,
  Calendar,
  Loader2,
  BarChart3,
  DollarSign,
  Users,
  TrendingUp,
  ClipboardList,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// ─── Types ─────────────────────────────────────────────────────────────────────
type ReportType = 'AUCTIONS_SUMMARY' | 'TRANSACTIONS_REPORT' | 'USERS_ACTIVITY' | 'FINANCIAL_OVERVIEW' | 'DASHBOARD_SNAPSHOT'

interface ReportTemplate {
  type: ReportType
  title: string
  description: string
  emoji: string
  color: string
  bgColor: string
  icon: React.ElementType
}

interface GeneratedReportRecord {
  id: string
  accountId: string
  type: ReportType
  title: string
  dateFrom: string
  dateTo: string
  filters: string | null
  pageCount: number
  fileSize: number
  createdAt: string
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const OLIVE_GREEN = [69, 164, 82] as const

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    type: 'AUCTIONS_SUMMARY',
    title: 'Synthèse des enchères',
    description: 'Vue complète des enchères, volumes et prix',
    emoji: '📊',
    color: '#45A452',
    bgColor: 'bg-green-50',
    icon: BarChart3,
  },
  {
    type: 'TRANSACTIONS_REPORT',
    title: 'Rapport des transactions',
    description: 'Détail des ventes, montants et revenus',
    emoji: '💰',
    color: '#f59e0b',
    bgColor: 'bg-amber-50',
    icon: DollarSign,
  },
  {
    type: 'USERS_ACTIVITY',
    title: 'Activité utilisateurs',
    description: 'Inscriptions, rôles et activité des comptes',
    emoji: '👥',
    color: '#3b82f6',
    bgColor: 'bg-blue-50',
    icon: Users,
  },
  {
    type: 'FINANCIAL_OVERVIEW',
    title: 'Vue financière',
    description: 'Portefeuilles, crédits, débits et soldes',
    emoji: '💹',
    color: '#8b5cf6',
    bgColor: 'bg-purple-50',
    icon: TrendingUp,
  },
  {
    type: 'DASHBOARD_SNAPSHOT',
    title: 'Snapshot du dashboard',
    description: 'Résumé global avec indicateurs clés et alertes',
    emoji: '📋',
    color: '#14b8a6',
    bgColor: 'bg-teal-50',
    icon: ClipboardList,
  },
]

const TYPE_LABELS: Record<ReportType, string> = {
  AUCTIONS_SUMMARY: 'Synthèse enchères',
  TRANSACTIONS_REPORT: 'Transactions',
  USERS_ACTIVITY: 'Utilisateurs',
  FINANCIAL_OVERVIEW: 'Financier',
  DASHBOARD_SNAPSHOT: 'Dashboard',
}

const TYPE_BADGE_COLORS: Record<ReportType, string> = {
  AUCTIONS_SUMMARY: 'bg-green-100 text-green-800',
  TRANSACTIONS_REPORT: 'bg-amber-100 text-amber-800',
  USERS_ACTIVITY: 'bg-blue-100 text-blue-800',
  FINANCIAL_OVERVIEW: 'bg-purple-100 text-purple-800',
  DASHBOARD_SNAPSHOT: 'bg-teal-100 text-teal-800',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  CLOSED: 'Clôturée',
  DRAFT: 'Brouillon',
  CANCELLED: 'Annulée',
  EXPIRED: 'Expirée',
  PENDING: 'En attente',
  COMPLETED: 'Complété',
  DISPUTED: 'Litige',
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatNumber(n: number): string {
  return n.toLocaleString('fr-FR')
}

function formatCurrency(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' TND'
}

function formatDateFR(dateStr: string): string {
  return format(new Date(dateStr), 'dd/MM/yyyy', { locale: fr })
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '—'
  if (bytes < 1024) return bytes + ' o'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko'
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo'
}

// ─── PDF Generation Functions ──────────────────────────────────────────────────
function addPdfHeader(doc: jsPDF, reportTitle: string, dateFrom: string, dateTo: string) {
  // OLEA logo text
  doc.setFontSize(22)
  doc.setTextColor(...OLIVE_GREEN)
  doc.text('OLEA', 105, 25, { align: 'center' })

  // Subtitle
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text("Plateforme de vente aux enchères d'huile d'olive tunisienne", 105, 33, { align: 'center' })

  // Separator line
  doc.setDrawColor(...OLIVE_GREEN)
  doc.setLineWidth(0.5)
  doc.line(20, 40, 190, 40)

  // Report title
  doc.setFontSize(16)
  doc.setTextColor(30)
  doc.text(reportTitle, 105, 52, { align: 'center' })

  // Date range
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text(`Période: ${formatDateFR(dateFrom)} — ${formatDateFR(dateTo)}`, 105, 60, { align: 'center' })
  doc.text(`Généré le: ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 105, 66, { align: 'center' })
}

function addPdfFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Page ${i}/${pageCount}`, 105, 290, { align: 'center' })
    doc.text('Confidentiel — Olea © 2026', 14, 290)
  }
}

function drawKpiBox(doc: jsPDF, x: number, y: number, w: number, h: number, label: string, value: string) {
  // Box
  doc.setFillColor(245, 252, 245)
  doc.setDrawColor(69, 164, 82)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, w, h, 2, 2, 'FD')

  // Label
  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.text(label, x + w / 2, y + 8, { align: 'center' })

  // Value
  doc.setFontSize(14)
  doc.setTextColor(30)
  doc.text(value, x + w / 2, y + 20, { align: 'center' })
}

function generateAuctionsPDF(data: any, dateFrom: string, dateTo: string): jsPDF {
  const doc = new jsPDF()
  addPdfHeader(doc, 'Synthèse des enchères', dateFrom, dateTo)

  // KPIs
  const s = data.summary
  const boxW = 42
  const gap = 3
  const startX = (210 - (boxW * 4 + gap * 3)) / 2
  drawKpiBox(doc, startX, 75, boxW, 26, 'Total enchères', formatNumber(s.total))
  drawKpiBox(doc, startX + boxW + gap, 75, boxW, 26, 'Actives', formatNumber(s.active))
  drawKpiBox(doc, startX + (boxW + gap) * 2, 75, boxW, 26, 'Clôturées', formatNumber(s.closed))
  drawKpiBox(doc, startX + (boxW + gap) * 3, 75, boxW, 26, 'Volume total', formatNumber(s.totalVolume) + ' kg')

  // Table
  autoTable(doc, {
    startY: 110,
    head: [['Titre', 'Variété', 'Région', 'Vendeur', 'Qté (kg)', 'Prix réserve', 'Statut', 'Date']],
    body: data.auctions.map((a: any) => [
      a.title?.substring(0, 30),
      a.oliveType,
      a.region,
      a.seller?.substring(0, 20),
      a.quantity?.toFixed(0),
      a.reservePrice ? a.reservePrice.toFixed(3) + ' TND' : '—',
      STATUS_LABELS[a.status] || a.status,
      a.createdAt,
    ]),
    headStyles: {
      fillColor: OLIVE_GREEN as unknown as number[],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    styles: { cellPadding: 3 },
    margin: { left: 14, right: 14 },
  })

  addPdfFooter(doc)
  return doc
}

function generateTransactionsPDF(data: any, dateFrom: string, dateTo: string): jsPDF {
  const doc = new jsPDF()
  addPdfHeader(doc, 'Rapport des transactions', dateFrom, dateTo)

  const s = data.summary
  const boxW = 56
  const gap = 4
  const startX = (210 - (boxW * 3 + gap * 2)) / 2
  drawKpiBox(doc, startX, 75, boxW, 26, 'Total transactions', formatNumber(s.total))
  drawKpiBox(doc, startX + boxW + gap, 75, boxW, 26, 'Revenu total', formatNumber(s.revenue) + ' DT')
  drawKpiBox(doc, startX + (boxW + gap) * 2, 75, boxW, 26, 'Prix moyen', formatNumber(Math.round(s.avgPrice)) + ' DT')

  autoTable(doc, {
    startY: 110,
    head: [['Enchère', 'Variété', 'Acheteur', 'Vendeur', 'Montant (TND)', 'Statut', 'Date', 'Complétion']],
    body: data.transactions.map((tx: any) => [
      tx.auctionTitle?.substring(0, 28),
      tx.oliveType,
      tx.buyer?.substring(0, 18),
      tx.seller?.substring(0, 18),
      tx.finalPrice?.toFixed(3),
      STATUS_LABELS[tx.status] || tx.status,
      tx.createdAt,
      tx.completedAt || '—',
    ]),
    headStyles: {
      fillColor: [245, 158, 11],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: [255, 251, 235] },
    styles: { cellPadding: 3 },
    margin: { left: 14, right: 14 },
  })

  addPdfFooter(doc)
  return doc
}

function generateUsersPDF(data: any, dateFrom: string, dateTo: string): jsPDF {
  const doc = new jsPDF()
  addPdfHeader(doc, 'Activité utilisateurs', dateFrom, dateTo)

  const s = data.summary
  const boxW = 42
  const gap = 3
  const startX = (210 - (boxW * 4 + gap * 3)) / 2
  drawKpiBox(doc, startX, 75, boxW, 26, 'Total inscrits', formatNumber(s.total))
  drawKpiBox(doc, startX + boxW + gap, 75, boxW, 26, 'Nouveaux (période)', formatNumber(s.newThisPeriod))

  // Role breakdown as mini boxes
  if (s.byRole && s.byRole.length > 0) {
    drawKpiBox(doc, startX + (boxW + gap) * 2, 75, boxW, 26, 'Rôles', s.byRole.map((r: any) => `${r.role}: ${r.count}`).join(', '))
    drawKpiBox(doc, startX + (boxW + gap) * 3, 75, boxW, 26, 'Nouveaux/jour', formatNumber(Math.max(0, Math.round(s.newThisPeriod / Math.max(1, 30)))))
  }

  autoTable(doc, {
    startY: 110,
    head: [['Nom', 'Téléphone', 'Email', 'Entreprise', 'Rôle', 'Statut', 'Note', 'Inscription']],
    body: data.users.map((u: any) => [
      u.name,
      u.phone,
      u.email,
      u.enterprise,
      u.role,
      u.status,
      u.rating.toFixed(1),
      u.createdAt,
    ]),
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: [239, 246, 255] },
    styles: { cellPadding: 3 },
    margin: { left: 14, right: 14 },
  })

  addPdfFooter(doc)
  return doc
}

function generateFinancialPDF(data: any, dateFrom: string, dateTo: string): jsPDF {
  const doc = new jsPDF()
  addPdfHeader(doc, 'Vue financière', dateFrom, dateTo)

  const ws = data.walletStats
  const cds = data.creditDebitSummary
  const boxW = 36
  const gap = 3
  const startX = (210 - (boxW * 5 + gap * 4)) / 2
  drawKpiBox(doc, startX, 75, boxW, 26, 'Portefeuilles', formatNumber(ws.totalWallets))
  drawKpiBox(doc, startX + boxW + gap, 75, boxW, 26, 'Solde total', formatNumber(ws.totalBalance) + ' DT')
  drawKpiBox(doc, startX + (boxW + gap) * 2, 75, boxW, 26, 'Crédits', formatNumber(cds.totalCredits) + ' DT')
  drawKpiBox(doc, startX + (boxW + gap) * 3, 75, boxW, 26, 'Débits', formatNumber(cds.totalDebits) + ' DT')
  drawKpiBox(doc, startX + (boxW + gap) * 4, 75, boxW, 26, 'Flux net', (cds.netFlow >= 0 ? '+' : '') + formatNumber(cds.netFlow) + ' DT')

  // Top accounts table
  if (data.topAccounts && data.topAccounts.length > 0) {
    autoTable(doc, {
      startY: 110,
      head: [['Compte', 'Email', 'Solde (DT)', 'Total crédité', 'Total débité']],
      body: data.topAccounts.map((a: any) => [
        a.name,
        a.email,
        a.balance.toFixed(3),
        a.totalCredited.toFixed(3),
        a.totalDebited.toFixed(3),
      ]),
      headStyles: {
        fillColor: [139, 92, 246],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 243, 255] },
      styles: { cellPadding: 3 },
      margin: { left: 14, right: 14 },
    })
  }

  addPdfFooter(doc)
  return doc
}

function generateDashboardPDF(data: any, dateFrom: string, dateTo: string): jsPDF {
  const doc = new jsPDF()
  addPdfHeader(doc, 'Snapshot du dashboard', dateFrom, dateTo)

  const ds = data.dashboardStats
  const boxW = 30
  const gap = 2.5
  const startX = (210 - (boxW * 6 + gap * 5)) / 2
  drawKpiBox(doc, startX, 75, boxW, 26, 'Enchères', formatNumber(ds.totalAuctions))
  drawKpiBox(doc, startX + boxW + gap, 75, boxW, 26, 'Volume', formatNumber(ds.totalVolume) + ' kg')
  drawKpiBox(doc, startX + (boxW + gap) * 2, 75, boxW, 26, 'Transactions', formatNumber(ds.totalTransactions))
  drawKpiBox(doc, startX + (boxW + gap) * 3, 75, boxW, 26, 'Revenu', formatNumber(Math.round(ds.totalRevenue)) + ' DT')
  drawKpiBox(doc, startX + (boxW + gap) * 4, 75, boxW, 26, 'Nvx users', formatNumber(ds.newUsers))
  drawKpiBox(doc, startX + (boxW + gap) * 5, 75, boxW, 26, 'Actives', formatNumber(ds.activeAuctionsCount))

  // Alerts section
  let currentY = 110
  if (data.alerts && data.alerts.length > 0) {
    doc.setFontSize(11)
    doc.setTextColor(220, 38, 38)
    doc.text('⚠ Alertes', 14, currentY)
    currentY += 2
    for (const alert of data.alerts) {
      doc.setFontSize(9)
      doc.setTextColor(80)
      doc.text(`• ${alert.message}: ${alert.count}`, 18, currentY + 7)
      currentY += 7
    }
    currentY += 5
  }

  // Active auctions table
  const ra = data.recentActivity?.activeAuctions || []
  if (ra.length > 0) {
    autoTable(doc, {
      startY: currentY,
      head: [['Titre', 'Vendeur', 'Variété', 'Région', 'Qté (kg)', 'Fin']],
      body: ra.map((a: any) => [
        a.title?.substring(0, 35),
        a.seller,
        a.oliveType,
        a.region,
        a.quantity?.toFixed(0),
        a.endDate,
      ]),
      headStyles: {
        fillColor: [20, 184, 166],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [240, 253, 250] },
      styles: { cellPadding: 3 },
      margin: { left: 14, right: 14 },
    })
  }

  // Recent transactions
  const rt = data.recentActivity?.recentTransactions || []
  if (rt.length > 0) {
    autoTable(doc, {
      startY: doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : currentY + 80,
      head: [['Enchère', 'Acheteur', 'Montant (TND)', 'Statut', 'Date']],
      body: rt.map((tx: any) => [
        tx.auctionTitle?.substring(0, 40),
        tx.buyer,
        tx.finalPrice?.toFixed(3),
        STATUS_LABELS[tx.status] || tx.status,
        tx.createdAt,
      ]),
      headStyles: {
        fillColor: OLIVE_GREEN as unknown as number[],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      styles: { cellPadding: 3 },
      margin: { left: 14, right: 14 },
    })
  }

  addPdfFooter(doc)
  return doc
}

function generatePDF(type: ReportType, data: any, dateFrom: string, dateTo: string): jsPDF {
  switch (type) {
    case 'AUCTIONS_SUMMARY':
      return generateAuctionsPDF(data, dateFrom, dateTo)
    case 'TRANSACTIONS_REPORT':
      return generateTransactionsPDF(data, dateFrom, dateTo)
    case 'USERS_ACTIVITY':
      return generateUsersPDF(data, dateFrom, dateTo)
    case 'FINANCIAL_OVERVIEW':
      return generateFinancialPDF(data, dateFrom, dateTo)
    case 'DASHBOARD_SNAPSHOT':
      return generateDashboardPDF(data, dateFrom, dateTo)
    default:
      throw new Error('Type de rapport inconnu')
  }
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function PDFReportsSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PDFReportsPage() {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null)
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [generating, setGenerating] = useState(false)
  const [reports, setReports] = useState<GeneratedReportRecord[]>([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [reportsPage, setReportsPage] = useState(1)
  const [reportsTotal, setReportsTotal] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<GeneratedReportRecord | null>(null)

  // ─── Fetch reports history ──────────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    setReportsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(reportsPage),
        limit: '10',
      })
      const res = await fetch(`/api/pdf-reports?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setReports(data.reports || [])
      setReportsTotal(data.pagination?.total || 0)
    } catch {
      toast.error('Erreur lors du chargement des rapports')
    } finally {
      setReportsLoading(false)
    }
  }, [reportsPage])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  // ─── Generate PDF ───────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedType) {
      toast.error('Veuillez sélectionner un type de rapport')
      return
    }

    setGenerating(true)
    try {
      // Fetch report data
      const params = new URLSearchParams({
        type: selectedType,
        dateFrom,
        dateTo,
      })
      const res = await fetch(`/api/pdf-reports/data?${params}`)
      if (!res.ok) throw new Error('Erreur lors de la récupération des données')
      const data = await res.json()

      // Generate PDF client-side
      const doc = generatePDF(selectedType, data, dateFrom, dateTo)
      const pageCount = doc.getNumberOfPages()
      const pdfBlob = doc.output('blob')
      const fileSize = pdfBlob.size

      // Save report record
      const template = REPORT_TEMPLATES.find((t) => t.type === selectedType)
      await fetch('/api/pdf-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          title: template?.title || selectedType,
          dateFrom,
          dateTo,
          pageCount,
          fileSize,
        }),
      })

      // Download the PDF
      const filename = `${template?.title || 'rapport'}_${dateFrom}_${dateTo}.pdf`
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Rapport "${template?.title}" généré avec succès (${pageCount} pages)`)
      fetchReports()
    } catch (err) {
      toast.error('Erreur lors de la génération du rapport')
    } finally {
      setGenerating(false)
    }
  }

  // ─── Re-download PDF ────────────────────────────────────────────────────
  const handleReDownload = async (report: GeneratedReportRecord) => {
    try {
      const res = await fetch(`/api/pdf-reports/data?type=${report.type}&dateFrom=${report.dateFrom.split('T')[0]}&dateTo=${report.dateTo.split('T')[0]}`)
      if (!res.ok) throw new Error()
      const data = await res.json()

      const template = REPORT_TEMPLATES.find((t) => t.type === report.type)
      const doc = generatePDF(report.type, data, report.dateFrom.split('T')[0], report.dateTo.split('T')[0])
      const pdfBlob = doc.output('blob')
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${template?.title || 'rapport'}_redownload.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Rapport téléchargé')
    } catch {
      toast.error('Erreur lors du téléchargement')
    }
  }

  // ─── Delete report ──────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!reportToDelete) return
    try {
      const res = await fetch(`/api/pdf-reports/${reportToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Rapport supprimé')
      fetchReports()
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleteDialogOpen(false)
      setReportToDelete(null)
    }
  }

  const totalPages = Math.ceil(reportsTotal / 10)

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* ── Report Templates Section ──────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Modèles de rapports</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {REPORT_TEMPLATES.map((template) => {
            const Icon = template.icon
            const isSelected = selectedType === template.type
            return (
              <button
                key={template.type}
                onClick={() => setSelectedType(isSelected ? null : template.type)}
                className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 text-center ${
                  isSelected
                    ? 'border-[' + template.color + '] shadow-md scale-[1.02]'
                    : 'border-transparent bg-white hover:border-muted hover:shadow-sm'
                }`}
                style={
                  isSelected
                    ? { borderColor: template.color, backgroundColor: template.color + '08' }
                    : undefined
                }
              >
                <span className="text-2xl">{template.emoji}</span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: isSelected ? template.color : '#374151' }}>
                    {template.title}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">
                    {template.description}
                  </p>
                </div>
                {isSelected && (
                  <div
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full"
                    style={{ backgroundColor: template.color }}
                  >
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Configuration Panel ───────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#45A452]" />
            Configuration du rapport
          </CardTitle>
          <CardDescription>
            Sélectionnez une période et générez le rapport PDF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="dateFrom" className="text-xs font-medium">
                Date début
              </Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="dateTo" className="text-xs font-medium">
                Date fin
              </Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10"
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={!selectedType || generating || dateFrom >= dateTo}
              className="h-10 bg-[#45A452] hover:bg-[#3d944a] text-white px-8"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Générer le PDF
                </>
              )}
            </Button>
          </div>
          {!selectedType && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Veuillez sélectionner un modèle de rapport ci-dessus
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Generated Reports History ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#45A452]" />
                Rapports générés
              </CardTitle>
              <CardDescription className="mt-1">
                {reportsTotal} rapport{reportsTotal > 1 ? 's' : ''} généré{reportsTotal > 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchReports()} disabled={reportsLoading}>
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${reportsLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium text-muted-foreground">Aucun rapport généré</p>
              <p className="text-xs text-muted-foreground mt-1">
                Sélectionnez un modèle et générez votre premier rapport PDF
              </p>
            </div>
          ) : (
            <>
              <ScrollArea className="max-h-96">
                <div className="space-y-2">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center gap-3 rounded-lg border bg-white p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium truncate">{report.title}</span>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] font-semibold shrink-0 ${TYPE_BADGE_COLORS[report.type]}`}
                          >
                            {TYPE_LABELS[report.type]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateFR(report.dateFrom)} — {formatDateFR(report.dateTo)}
                          </span>
                          <span>{report.pageCount} page{report.pageCount > 1 ? 's' : ''}</span>
                          <span>{formatFileSize(report.fileSize)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleReDownload(report)}
                        >
                          <Download className="mr-1 h-3 w-3" />
                          Télécharger
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setReportToDelete(report)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <span className="text-xs text-muted-foreground">
                    Page {reportsPage} sur {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={reportsPage <= 1}
                      onClick={() => setReportsPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={reportsPage >= totalPages}
                      onClick={() => setReportsPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Delete Confirmation Dialog ────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le rapport</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le rapport &quot;{reportToDelete?.title}&quot; ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setReportToDelete(null)
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
