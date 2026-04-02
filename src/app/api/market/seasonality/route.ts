import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

function safeJson(data: unknown): Response {
  return new Response(JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  ), { headers: { 'Content-Type': 'application/json' } })
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const oliveTypeId = searchParams.get('oliveTypeId') || ''
    const regionId = searchParams.get('regionId') || ''

    const where: Record<string, unknown> = {
      status: { in: ['WINNING', 'WON'] },
    }

    const auctionFilter: Record<string, unknown> = {}
    if (oliveTypeId) auctionFilter.oliveTypeId = oliveTypeId
    if (regionId) auctionFilter.regionId = regionId
    if (Object.keys(auctionFilter).length > 0) {
      where.auction = auctionFilter
    }

    const bids = await db.bid.findMany({
      where,
      select: {
        createdAt: true,
        pricePerKg: true,
      },
    })

    // Group by calendar month (1-12) and compute sum/count for avg
    const monthMap = new Map<number, { sum: number; count: number }>()
    for (const bid of bids) {
      const monthNum = bid.createdAt.getMonth() + 1
      const acc = monthMap.get(monthNum) || { sum: 0, count: 0 }
      acc.sum += Number(bid.pricePerKg)
      acc.count += 1
      monthMap.set(monthNum, acc)
    }

    // Build full 12-month array, filling gaps with zero
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1
      const match = monthMap.get(monthNum)
      return {
        month: monthNum,
        monthName: MONTH_NAMES[i],
        avgPrice: match ? Number((match.sum / match.count).toFixed(2)) : 0,
        bidCount: match ? match.count : 0,
      }
    })

    // Find peak and low months (only from months with data)
    const monthsWithData = months.filter((m) => m.bidCount > 0)

    let peakMonth = 0
    let lowMonth = 0
    let peakPrice = 0
    let lowPrice = 0

    if (monthsWithData.length > 0) {
      const peak = monthsWithData.reduce((max, m) => (m.avgPrice > max.avgPrice ? m : max))
      const low = monthsWithData.reduce((min, m) => (m.avgPrice < min.avgPrice ? m : min))
      peakMonth = peak.month
      lowMonth = low.month
      peakPrice = peak.avgPrice
      lowPrice = low.avgPrice
    }

    return safeJson({
      months,
      peakMonth,
      lowMonth,
      peakPrice,
      lowPrice,
    })
  } catch (error) {
    console.error('Seasonality error:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur lors du chargement de la saisonnalité' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
