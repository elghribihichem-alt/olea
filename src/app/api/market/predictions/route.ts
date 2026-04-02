import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

function safeJson(data: unknown): Response {
  return new Response(JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  ), { headers: { 'Content-Type': 'application/json' } })
}

const MONTH_NAMES = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
]

function formatMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const oliveTypeId = searchParams.get('oliveTypeId') || ''
    const regionId = searchParams.get('regionId') || ''

    // Calculate 12 months ago (first day of month)
    const now = new Date()
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    const where: Record<string, unknown> = {
      status: { in: ['WINNING', 'WON'] },
      createdAt: { gte: twelveMonthsAgo },
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

    // Group by YYYY-MM and compute avg price
    const monthMap = new Map<string, { sum: number; count: number }>()
    for (const bid of bids) {
      const key = `${bid.createdAt.getFullYear()}-${String(bid.createdAt.getMonth() + 1).padStart(2, '0')}`
      const acc = monthMap.get(key) || { sum: 0, count: 0 }
      acc.sum += Number(bid.pricePerKg)
      acc.count += 1
      monthMap.set(key, acc)
    }

    // Build history array — fill gaps with null avgPrice for missing months
    const history: { month: string; avgPrice: number | null; predicted: false }[] = []
    for (let i = 0; i < 12; i++) {
      const d = new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth() + i, 1)
      const key = formatMonth(d)
      const match = monthMap.get(key)
      history.push({
        month: key,
        avgPrice: match ? Number((match.sum / match.count).toFixed(2)) : null,
        predicted: false,
      })
    }

    // Linear regression on months that have data
    const points = history
      .map((h, idx) => ({ x: idx, y: h.avgPrice }))
      .filter((p) => p.y !== null) as { x: number; y: number }[]

    let slope = 0
    let intercept = 0
    let trend: 'up' | 'down' | 'stable' = 'stable'

    if (points.length >= 2) {
      const n = points.length
      const sumX = points.reduce((s, p) => s + p.x, 0)
      const sumY = points.reduce((s, p) => s + p.y, 0)
      const sumXY = points.reduce((s, p) => s + p.x * p.y, 0)
      const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0)

      slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
      intercept = (sumY - slope * sumX) / n

      // Determine trend direction
      if (slope > 0.5) trend = 'up'
      else if (slope < -0.5) trend = 'down'
      else trend = 'stable'
    }

    // Predict next 3 months
    const forecast: {
      month: string
      avgPrice: number
      predicted: true
      lowerBound: number
      upperBound: number
    }[] = []

    // Calculate standard error of the regression for confidence bands
    let stdError = 0
    if (points.length >= 2) {
      const residuals = points.map((p) => p.y - (slope * p.x + intercept))
      const sumSqResiduals = residuals.reduce((s, r) => s + r * r, 0)
      stdError = Math.sqrt(sumSqResiduals / Math.max(points.length - 2, 1))
    }

    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + 1 + i, 1)
      const key = formatMonth(d)
      const xIdx = 12 + i
      const predictedPrice = slope * xIdx + intercept
      const margin = Math.max(stdError * 1.5, 0.5) // minimum margin of 0.5

      forecast.push({
        month: key,
        avgPrice: Number(Math.max(0, predictedPrice).toFixed(2)),
        predicted: true,
        lowerBound: Number(Math.max(0, predictedPrice - margin).toFixed(2)),
        upperBound: Number((predictedPrice + margin).toFixed(2)),
      })
    }

    return safeJson({
      history,
      forecast,
      trend,
      slope: Number(slope.toFixed(4)),
    })
  } catch (error) {
    console.error('Predictions error:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur lors du calcul des prédictions' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
