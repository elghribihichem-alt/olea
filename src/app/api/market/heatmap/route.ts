import { db } from '@/lib/db'

function safeJson(data: unknown): Response {
  return new Response(JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  ), { headers: { 'Content-Type': 'application/json' } })
}

export async function GET() {
  try {
    const bids = await db.bid.findMany({
      where: {
        status: { in: ['WINNING', 'WON'] },
      },
      select: {
        pricePerKg: true,
        auction: {
          select: {
            oliveType: { select: { name: true } },
            region: { select: { name: true } },
          },
        },
      },
    })

    // Group by (oliveType name, region name) and compute sum/count for avg
    const groupMap = new Map<string, { oliveType: string; region: string; sum: number; count: number }>()
    for (const bid of bids) {
      const oliveTypeName = bid.auction.oliveType?.name || ''
      const regionName = bid.auction.region?.name || ''
      if (!oliveTypeName || !regionName) continue

      const key = `${oliveTypeName}|||${regionName}`
      const acc = groupMap.get(key) || { oliveType: oliveTypeName, region: regionName, sum: 0, count: 0 }
      acc.sum += Number(bid.pricePerKg)
      acc.count += 1
      groupMap.set(key, acc)
    }

    const matrixData = Array.from(groupMap.values())
      .map((g) => ({
        oliveType: g.oliveType,
        region: g.region,
        avgPrice: Number((g.sum / g.count).toFixed(2)),
        bidCount: g.count,
      }))
      .sort((a, b) => b.avgPrice - a.avgPrice)

    // Extract unique labels preserving order
    const oliveTypeSet = new Set<string>()
    const regionSet = new Set<string>()
    for (const row of matrixData) {
      oliveTypeSet.add(row.oliveType)
      regionSet.add(row.region)
    }

    return safeJson({
      oliveTypes: Array.from(oliveTypeSet),
      regions: Array.from(regionSet),
      data: matrixData.map((d) => ({
        oliveType: d.oliveType,
        region: d.region,
        avgPrice: d.avgPrice,
        bidCount: d.bidCount,
      })),
    })
  } catch (error) {
    console.error('Heatmap error:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur lors du chargement de la heatmap' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
