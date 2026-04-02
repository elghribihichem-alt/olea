import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

function safeJson(data: unknown): Response {
  return new Response(JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  ), { headers: { 'Content-Type': 'application/json' } })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { oliveTypeId, regionId, currentPrice } = body as {
      oliveTypeId?: string | null
      regionId?: string | null
      currentPrice?: number
    }

    if (typeof currentPrice !== 'number' || currentPrice <= 0) {
      return new Response(
        JSON.stringify({ error: 'currentPrice doit être un nombre positif' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build the WHERE clause for matching alerts
    // An alert matches if:
    //   - alert.oliveTypeId is null OR matches the given oliveTypeId
    //   - AND alert.regionId is null OR matches the given regionId
    const oliveTypeFilter = oliveTypeId
      ? { OR: [{ oliveTypeId: null as never }, { oliveTypeId }] }
      : { oliveTypeId: null as never }

    const regionFilter = regionId
      ? { OR: [{ regionId: null as never }, { regionId }] }
      : { regionId: null as never }

    const alerts = await db.priceAlert.findMany({
      where: {
        isActive: true,
        ...oliveTypeFilter,
        ...regionFilter,
      },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        oliveType: { select: { id: true, name: true } },
        region: { select: { id: true, name: true } },
      },
    })

    // Filter alerts based on condition and currentPrice
    const triggeredAlerts = alerts.filter((alert) => {
      if (alert.condition === 'ABOVE' && currentPrice >= alert.threshold) {
        return true
      }
      if (alert.condition === 'BELOW' && currentPrice <= alert.threshold) {
        return true
      }
      return false
    })

    // Update triggeredAt for triggered alerts
    if (triggeredAlerts.length > 0) {
      await db.priceAlert.updateMany({
        where: {
          id: { in: triggeredAlerts.map((a) => a.id) },
        },
        data: {
          triggeredAt: new Date(),
        },
      })
    }

    return safeJson({
      triggered: triggeredAlerts.length > 0,
      alerts: triggeredAlerts,
    })
  } catch (error) {
    console.error('Alert check error:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur lors de la vérification des alertes' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
