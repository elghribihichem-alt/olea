import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Safe JSON serializer that converts BigInt to Number
function safeJson<T>(data: T): string {
  return JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  )
}

// Helper type for accumulating statistics
interface StatEntry { sum: number; min: number; max: number; count: number }

// Helper to build a stats map from an array of numbers keyed by a string
function accumulateStats(
  map: Map<string, StatEntry>,
  key: string,
  value: number
) {
  const entry = map.get(key)
  if (entry) {
    entry.sum += value
    entry.min = Math.min(entry.min, value)
    entry.max = Math.max(entry.max, value)
    entry.count++
  } else {
    map.set(key, { sum: value, min: value, max: value, count: 1 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const oliveTypeId = searchParams.get('oliveTypeId') || 'ALL'
    const regionId = searchParams.get('regionId') || 'ALL'

    // ── 1. Global price stats ────────────────────────────────────────────────
    const priceAgg = await db.bid.aggregate({
      where: { status: { in: ['WINNING', 'WON'] } },
      _avg: { pricePerKg: true },
      _min: { pricePerKg: true },
      _max: { pricePerKg: true },
      _count: true,
    })

    // ── 2. Monthly price trend (last 12 months) ──────────────────────────────
    const twelveMonthsAgo = new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)

    const monthlyBids = await db.bid.findMany({
      where: {
        status: { in: ['WINNING', 'WON'] },
        createdAt: { gte: twelveMonthsAgo },
        ...(oliveTypeId !== 'ALL' ? { auction: { oliveTypeId } } : {}),
        ...(regionId !== 'ALL' ? { auction: { regionId } } : {}),
      },
      select: {
        createdAt: true,
        pricePerKg: true,
      },
    })

    const monthlyMap = new Map<string, StatEntry>()
    for (const bid of monthlyBids) {
      const month = `${bid.createdAt.getFullYear()}-${String(bid.createdAt.getMonth() + 1).padStart(2, '0')}`
      accumulateStats(monthlyMap, month, Number(bid.pricePerKg))
    }

    const monthlyTrend = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, stats]) => ({
        month,
        avgPrice: Number((stats.sum / stats.count).toFixed(2)),
        minPrice: Number(stats.min.toFixed(2)),
        maxPrice: Number(stats.max.toFixed(2)),
        bidCount: stats.count,
      }))

    // ── 3. Price by olive type ─────────────────────────────────────────────
    const bidsByOliveType = await db.bid.findMany({
      where: {
        status: { in: ['WINNING', 'WON'] },
        ...(regionId !== 'ALL' ? { auction: { regionId } } : {}),
      },
      select: {
        pricePerKg: true,
        auction: {
          select: {
            oliveTypeId: true,
            oliveType: { select: { id: true, name: true } },
          },
        },
      },
    })

    const oliveTypeMap = new Map<string, StatEntry & { name: string }>()
    for (const bid of bidsByOliveType) {
      const oid = bid.auction.oliveTypeId!
      const name = bid.auction.oliveType?.name || 'Unknown'
      const entry = oliveTypeMap.get(oid)
      if (entry) {
        entry.sum += Number(bid.pricePerKg)
        entry.min = Math.min(entry.min, Number(bid.pricePerKg))
        entry.max = Math.max(entry.max, Number(bid.pricePerKg))
        entry.count++
      } else {
        oliveTypeMap.set(oid, {
          sum: Number(bid.pricePerKg),
          min: Number(bid.pricePerKg),
          max: Number(bid.pricePerKg),
          count: 1,
          name,
        })
      }
    }

    const priceByOliveType = Array.from(oliveTypeMap.entries())
      .sort((a, b) => (b[1].sum / b[1].count) - (a[1].sum / a[1].count))
      .map(([oliveTypeId, stats]) => ({
        oliveTypeId,
        name: stats.name,
        avgPrice: Number((stats.sum / stats.count).toFixed(2)),
        minPrice: Number(stats.min.toFixed(2)),
        maxPrice: Number(stats.max.toFixed(2)),
        bidCount: stats.count,
      }))

    // ── 4. Price by region ─────────────────────────────────────────────────
    const bidsByRegion = await db.bid.findMany({
      where: {
        status: { in: ['WINNING', 'WON'] },
        ...(oliveTypeId !== 'ALL' ? { auction: { oliveTypeId } } : {}),
      },
      select: {
        pricePerKg: true,
        auction: {
          select: {
            regionId: true,
            region: { select: { id: true, name: true } },
          },
        },
      },
    })

    const regionMap = new Map<string, StatEntry & { name: string }>()
    for (const bid of bidsByRegion) {
      const rid = bid.auction.regionId!
      const name = bid.auction.region?.name || 'Unknown'
      const entry = regionMap.get(rid)
      if (entry) {
        entry.sum += Number(bid.pricePerKg)
        entry.min = Math.min(entry.min, Number(bid.pricePerKg))
        entry.max = Math.max(entry.max, Number(bid.pricePerKg))
        entry.count++
      } else {
        regionMap.set(rid, {
          sum: Number(bid.pricePerKg),
          min: Number(bid.pricePerKg),
          max: Number(bid.pricePerKg),
          count: 1,
          name,
        })
      }
    }

    const priceByRegion = Array.from(regionMap.entries())
      .sort((a, b) => (b[1].sum / b[1].count) - (a[1].sum / a[1].count))
      .map(([regionId, stats]) => ({
        regionId,
        name: stats.name,
        avgPrice: Number((stats.sum / stats.count).toFixed(2)),
        minPrice: Number(stats.min.toFixed(2)),
        maxPrice: Number(stats.max.toFixed(2)),
        bidCount: stats.count,
      }))

    // ── 5. Quantity ranges price analysis ───────────────────────────────────
    const quantityRanges = [
      { label: '< 500 kg', min: 0, max: 500 },
      { label: '500-1000 kg', min: 500, max: 1000 },
      { label: '1000-2000 kg', min: 1000, max: 2000 },
      { label: '2000-5000 kg', min: 2000, max: 5000 },
      { label: '> 5000 kg', min: 5000, max: 999999 },
    ]

    const priceByQuantity = await Promise.all(
      quantityRanges.map(async (range) => {
        const bids = await db.bid.findMany({
          where: {
            status: { in: ['WINNING', 'WON'] },
            auction: {
              quantity: { gte: range.min, lt: range.max },
              ...(oliveTypeId !== 'ALL' ? { oliveTypeId } : {}),
              ...(regionId !== 'ALL' ? { regionId } : {}),
            },
          },
          select: { pricePerKg: true },
        })

        if (bids.length === 0) {
          return { ...range, avgPrice: 0, bidCount: 0 }
        }

        return {
          ...range,
          avgPrice: Number((bids.reduce((s, b) => s + b.pricePerKg, 0) / bids.length).toFixed(2)),
          bidCount: bids.length,
        }
      })
    )

    // ── 6. Top deals (highest prices) ──────────────────────────────────────
    const topDeals = await db.bid.findMany({
      where: { status: { in: ['WINNING', 'WON'] } },
      orderBy: { pricePerKg: 'desc' },
      take: 10,
      select: {
        pricePerKg: true,
        totalPrice: true,
        createdAt: true,
        buyer: { select: { id: true, name: true, phone: true } },
        auction: {
          select: {
            id: true,
            title: true,
            quantity: true,
            oliveType: { select: { name: true } },
            region: { select: { name: true } },
          },
        },
      },
    })

    return new NextResponse(safeJson({
      global: {
        avgPrice: Number(priceAgg._avg.pricePerKg?.toFixed(2) || 0),
        minPrice: Number(priceAgg._min.pricePerKg?.toFixed(2) || 0),
        maxPrice: Number(priceAgg._max.pricePerKg?.toFixed(2) || 0),
        totalBids: priceAgg._count,
      },
      monthlyTrend,
      priceByOliveType,
      priceByRegion,
      priceByQuantity,
      topDeals: topDeals.map((d) => ({
        ...d,
        pricePerKg: Number(d.pricePerKg),
        totalPrice: Number(d.totalPrice),
        createdAt: d.createdAt,
      })),
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Prices fetch error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des prix' },
      { status: 500 }
    )
  }
}
