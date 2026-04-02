import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const now = new Date()

    // Monthly auction trends (last 12 months)
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    const monthlyAuctions = await db.auction.groupBy({
      by: ['status'],
      where: { createdAt: { gte: twelveMonthsAgo } },
      _count: { id: true },
    })

    // Auctions by region (top 8)
    const auctionsByRegion = await db.auction.groupBy({
      by: ['regionId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 8,
    })

    const regionNames = await db.region.findMany({
      where: { id: { in: auctionsByRegion.map((r) => r.regionId) } },
      select: { id: true, name: true },
    })

    // Auctions by olive type
    const auctionsByOliveType = await db.auction.groupBy({
      by: ['oliveTypeId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })

    const oliveTypeNames = await db.oliveType.findMany({
      where: { id: { in: auctionsByOliveType.map((o) => o.oliveTypeId) } },
      select: { id: true, name: true },
    })

    // Price evolution by month — use Prisma findMany + JS grouping (no raw SQL)
    const winningBids = await db.bid.findMany({
      where: {
        status: { in: ['WINNING', 'WON'] },
        createdAt: { gte: twelveMonthsAgo },
      },
      select: { createdAt: true, pricePerKg: true },
    })

    // Group by YYYY-MM in JavaScript
    const monthMap = new Map<string, { sum: number; count: number }>()
    for (const bid of winningBids) {
      const m = `${bid.createdAt.getFullYear()}-${String(bid.createdAt.getMonth() + 1).padStart(2, '0')}`
      const entry = monthMap.get(m) || { sum: 0, count: 0 }
      entry.sum += bid.pricePerKg
      entry.count++
      monthMap.set(m, entry)
    }
    const priceEvolution = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        avgPrice: Number((data.sum / data.count).toFixed(2)),
      }))

    // Volume by region
    const volumeByRegion = await db.auction.groupBy({
      by: ['regionId'],
      where: { status: 'ACTIVE' },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 8,
    })

    return NextResponse.json({
      monthlyAuctions: monthlyAuctions.map((m) => ({
        status: m.status,
        count: m._count.id,
      })),
      auctionsByRegion: auctionsByRegion.map((r) => ({
        regionId: r.regionId,
        name: regionNames.find((n) => n.id === r.regionId)?.name || 'Inconnu',
        count: r._count.id,
      })),
      auctionsByOliveType: auctionsByOliveType.map((o) => ({
        oliveTypeId: o.oliveTypeId,
        name: oliveTypeNames.find((n) => n.id === o.oliveTypeId)?.name || 'Inconnu',
        count: o._count.id,
      })),
      priceEvolution,
      volumeByRegion: volumeByRegion.map((v) => ({
        regionId: v.regionId,
        name: regionNames.find((n) => n.id === v.regionId)?.name || 'Inconnu',
        volume: v._sum.quantity || 0,
      })),
    })
  } catch (error) {
    console.error('Dashboard charts error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des graphiques' },
      { status: 500 }
    )
  }
}
