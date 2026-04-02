import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

function safeJson(data: unknown): Response {
  return new Response(JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  ), { headers: { 'Content-Type': 'application/json' } })
}

export async function GET() {
  try {
    const alerts = await db.priceAlert.findMany({
      where: {},
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        oliveType: { select: { id: true, name: true } },
        region: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return safeJson(alerts)
  } catch (error) {
    console.error('Alerts fetch error:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur lors du chargement des alertes' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, oliveTypeId, regionId, condition, threshold } = body as {
      userId?: string
      oliveTypeId?: string | null
      regionId?: string | null
      condition?: string
      threshold?: number
    }

    // Validate required fields
    if (!userId || !condition || threshold === undefined) {
      return new Response(
        JSON.stringify({ error: 'userId, condition et threshold sont requis' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate condition
    if (condition !== 'ABOVE' && condition !== 'BELOW') {
      return new Response(
        JSON.stringify({ error: 'condition doit être ABOVE ou BELOW' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate threshold > 0
    if (typeof threshold !== 'number' || threshold <= 0) {
      return new Response(
        JSON.stringify({ error: 'threshold doit être un nombre supérieur à 0' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur introuvable' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate oliveTypeId if provided
    if (oliveTypeId) {
      const oliveType = await db.oliveType.findUnique({ where: { id: oliveTypeId } })
      if (!oliveType) {
        return new Response(
          JSON.stringify({ error: "Type d'olive introuvable" }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Validate regionId if provided
    if (regionId) {
      const region = await db.region.findUnique({ where: { id: regionId } })
      if (!region) {
        return new Response(
          JSON.stringify({ error: 'Région introuvable' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Create the alert
    const alert = await db.priceAlert.create({
      data: {
        userId,
        oliveTypeId: oliveTypeId || null,
        regionId: regionId || null,
        condition,
        threshold,
        isActive: true,
      },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        oliveType: { select: { id: true, name: true } },
        region: { select: { id: true, name: true } },
      },
    })

    return safeJson(alert)
  } catch (error) {
    console.error('Alert create error:', error)
    return new Response(
      JSON.stringify({ error: "Erreur lors de la création de l'alerte" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
