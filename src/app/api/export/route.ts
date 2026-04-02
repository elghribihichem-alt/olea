import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

function escapeCSV(val: unknown): string {
  const s = val === null || val === undefined ? '' : String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function buildCSV(headers: string[], rows: unknown[][], filename: string): NextResponse {
  const bom = '\uFEFF' // UTF-8 BOM for Excel compatibility
  const headerLine = headers.map(escapeCSV).join(',')
  const dataLines = rows.map((row) => row.map(escapeCSV).join(','))
  const csv = bom + [headerLine, ...dataLines].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'transactions'
    const period = searchParams.get('period') || '30d'
    const regionId = searchParams.get('regionId') || ''
    const oliveTypeId = searchParams.get('oliveTypeId') || ''

    // Calculate date range
    const now = new Date()
    let startDate: Date | null = null
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '6m':
        startDate = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
    }

    const dateFilter: Prisma.DateTimeNullableFilter | undefined = startDate
      ? { gte: startDate }
      : undefined

    const timestamp = now.toISOString().slice(0, 10)

    switch (type) {
      case 'transactions': {
        const auctionFilter: Record<string, unknown> = {}
        if (regionId) auctionFilter.regionId = regionId
        if (oliveTypeId) auctionFilter.oliveTypeId = oliveTypeId

        const where: Record<string, unknown> = { createdAt: dateFilter }
        if (Object.keys(auctionFilter).length > 0) {
          where.auction = auctionFilter
        }

        const transactions = await db.transaction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 5000,
          include: {
            auction: {
              include: {
                oliveType: { select: { name: true } },
                region: { select: { name: true } },
                seller: { select: { name: true, phone: true } },
              },
            },
            buyer: { select: { name: true, phone: true } },
          },
        })

        const headers = [
          'ID Transaction',
          'Enchère',
          'Variété',
          'Région',
          'Vendeur',
          'Acheteur',
          'Prix Final (DT)',
          'Statut',
          'Date Création',
          'Date Complétion',
        ]

        const rows = transactions.map((t) => [
          t.id,
          t.auction?.title || '',
          t.auction?.oliveType?.name || '',
          t.auction?.region?.name || '',
          t.auction?.seller?.name || t.auction?.seller?.phone || '',
          t.buyer?.name || t.buyer?.phone || '',
          (t.finalPrice || 0).toFixed(2),
          t.status,
          t.createdAt?.toISOString() || '',
          t.completedAt?.toISOString() || '',
        ])

        return buildCSV(headers, rows, `transactions_${timestamp}.csv`)
      }

      case 'auctions': {
        const where: Record<string, unknown> = { createdAt: dateFilter }
        if (regionId) where.regionId = regionId
        if (oliveTypeId) where.oliveTypeId = oliveTypeId

        const auctions = await db.auction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 5000,
          include: {
            oliveType: { select: { name: true } },
            region: { select: { name: true } },
            seller: { select: { name: true, phone: true } },
            _count: { select: { bids: true } },
          },
        })

        const headers = [
          'ID Enchère',
          'Titre',
          'Variété',
          'Région',
          'Vendeur',
          'Quantité (kg)',
          'Prix Réserve (DT/kg)',
          'Statut',
          'Vues',
          'Offres',
          'Date Fin',
          'Date Création',
        ]

        const rows = auctions.map((a) => [
          a.id,
          a.title,
          a.oliveType?.name || '',
          a.region?.name || '',
          a.seller?.name || a.seller?.phone || '',
          (a.quantity || 0).toFixed(1),
          (a.reservePrice || 0).toFixed(2),
          a.status,
          a.viewCount || 0,
          a._count?.bids || 0,
          a.endDate?.toISOString() || '',
          a.createdAt?.toISOString() || '',
        ])

        return buildCSV(headers, rows, `encheres_${timestamp}.csv`)
      }

      case 'users': {
        const where: Record<string, unknown> = startDate ? { createdAt: dateFilter } : {}

        const users = await db.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 5000,
          include: {
            _count: {
              select: {
                auctions: true,
                bids: true,
                transactionsAsBuyer: true,
                transactionsAsSeller: true,
              },
            },
          },
        })

        const headers = [
          'ID',
          'Nom',
          'Téléphone',
          'Email',
          'Entreprise',
          'Rôle',
          'Statut',
          'Note',
          'Total Notes',
          'Enchères',
          'Offres',
          'Achats',
          'Ventes',
          'Date Inscription',
        ]

        const rows = users.map((u) => [
          u.id,
          u.name || '',
          u.phone,
          u.email || '',
          u.enterprise || '',
          u.role,
          u.status,
          (u.rating || 0).toFixed(1),
          u.totalRatings || 0,
          u._count?.auctions || 0,
          u._count?.bids || 0,
          u._count?.transactionsAsBuyer || 0,
          u._count?.transactionsAsSeller || 0,
          u.createdAt?.toISOString() || '',
        ])

        return buildCSV(headers, rows, `utilisateurs_${timestamp}.csv`)
      }

      default:
        return NextResponse.json({ error: 'Type d\'export invalide' }, { status: 400 })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
