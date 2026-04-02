import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

function safeJson(data: unknown): Response {
  return new Response(JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  ), { headers: { 'Content-Type': 'application/json' } })
}

interface GroupStats {
  sum: number
  min: number
  max: number
  count: number
  volume: number
}

function aggregateBids(
  bids: { pricePerKg: unknown; auction: { quantity: unknown } }[]
): GroupStats {
  let sum = 0
  let min = Infinity
  let max = -Infinity
  let count = 0
  let volume = 0
  for (const bid of bids) {
    const price = Number(bid.pricePerKg)
    const qty = Number(bid.auction.quantity) || 0
    sum += price
    if (price < min) min = price
    if (price > max) max = price
    count += 1
    volume += qty
  }
  return { sum, min: min === Infinity ? 0 : min, max: max === -Infinity ? 0 : max, count, volume }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const oliveTypeId = searchParams.get('oliveTypeId') || ''
    const regionId = searchParams.get('regionId') || ''

    if (oliveTypeId) {
      // Compare avg price across all regions for that olive type
      const bids = await db.bid.findMany({
        where: {
          status: { in: ['WINNING', 'WON'] },
          auction: { oliveTypeId },
        },
        select: {
          pricePerKg: true,
          auction: {
            select: {
              region: { select: { id: true, name: true } },
              quantity: true,
            },
          },
        },
      })

      const regionMap = new Map<string, { id: string; name: string; bids: { pricePerKg: unknown; auction: { quantity: unknown } }[] }>()
      for (const bid of bids) {
        const region = bid.auction.region
        if (!region) continue
        const entry = regionMap.get(region.id) || { id: region.id, name: region.name, bids: [] }
        entry.bids.push(bid)
        regionMap.set(region.id, entry)
      }

      const items = Array.from(regionMap.values())
        .map((entry) => {
          const stats = aggregateBids(entry.bids)
          return {
            id: entry.id,
            name: entry.name,
            avgPrice: Number((stats.sum / stats.count).toFixed(2)),
            minPrice: Number(stats.min.toFixed(2)),
            maxPrice: Number(stats.max.toFixed(2)),
            bidCount: stats.count,
            volume: Number(stats.volume),
          }
        })
        .sort((a, b) => b.avgPrice - a.avgPrice)

      return safeJson({
        dimension: 'regions' as const,
        items,
      })
    }

    if (regionId) {
      // Compare avg price across all types for that region
      const bids = await db.bid.findMany({
        where: {
          status: { in: ['WINNING', 'WON'] },
          auction: { regionId },
        },
        select: {
          pricePerKg: true,
          auction: {
            select: {
              oliveType: { select: { id: true, name: true } },
              quantity: true,
            },
          },
        },
      })

      const typeMap = new Map<string, { id: string; name: string; bids: { pricePerKg: unknown; auction: { quantity: unknown } }[] }>()
      for (const bid of bids) {
        const type = bid.auction.oliveType
        if (!type) continue
        const entry = typeMap.get(type.id) || { id: type.id, name: type.name, bids: [] }
        entry.bids.push(bid)
        typeMap.set(type.id, entry)
      }

      const items = Array.from(typeMap.values())
        .map((entry) => {
          const stats = aggregateBids(entry.bids)
          return {
            id: entry.id,
            name: entry.name,
            avgPrice: Number((stats.sum / stats.count).toFixed(2)),
            minPrice: Number(stats.min.toFixed(2)),
            maxPrice: Number(stats.max.toFixed(2)),
            bidCount: stats.count,
            volume: Number(stats.volume),
          }
        })
        .sort((a, b) => b.avgPrice - a.avgPrice)

      return safeJson({
        dimension: 'types' as const,
        items,
      })
    }

    // Neither: compare top 6 regions by total bid count
    const bids = await db.bid.findMany({
      where: {
        status: { in: ['WINNING', 'WON'] },
      },
      select: {
        pricePerKg: true,
        auction: {
          select: {
            region: { select: { id: true, name: true } },
            quantity: true,
          },
        },
      },
    })

    const regionMap = new Map<string, { id: string; name: string; bids: { pricePerKg: unknown; auction: { quantity: unknown } }[] }>()
    for (const bid of bids) {
      const region = bid.auction.region
      if (!region) continue
      const entry = regionMap.get(region.id) || { id: region.id, name: region.name, bids: [] }
      entry.bids.push(bid)
      regionMap.set(region.id, entry)
    }

    const items = Array.from(regionMap.values())
      .map((entry) => {
        const stats = aggregateBids(entry.bids)
        return {
          id: entry.id,
          name: entry.name,
          avgPrice: Number((stats.sum / stats.count).toFixed(2)),
          minPrice: Number(stats.min.toFixed(2)),
          maxPrice: Number(stats.max.toFixed(2)),
          bidCount: stats.count,
          volume: Number(stats.volume),
        }
      })
      .sort((a, b) => b.bidCount - a.bidCount)
      .slice(0, 6)

    return safeJson({
      dimension: 'regions' as const,
      items,
    })
  } catch (error) {
    console.error('Comparison error:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur lors du chargement des comparaisons' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
