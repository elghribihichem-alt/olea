import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function safeJson<T>(data: T): string {
  return JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value,
  )
}

async function getSession(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value
  if (!sessionToken) return null
  const account = await db.backOfficeAccount.findFirst({
    where: { sessionToken, sessionExpiresAt: { gt: new Date() } },
    select: { id: true, name: true, email: true, role: true },
  })
  return account
}

// GET /api/webhooks — list webhooks
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return new NextResponse(safeJson({ error: 'Non authentifié' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const webhooks = await db.webhook.findMany({
      where: { accountId: session.id },
      include: {
        _count: { select: { deliveries: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const totalDeliveries = webhooks.reduce((sum, w) => sum + (w.successCount + w.failCount), 0)
    const successDeliveries = webhooks.reduce((sum, w) => sum + w.successCount, 0)
    const successRate = totalDeliveries > 0 ? Math.round((successDeliveries / totalDeliveries) * 100) : 0

    const stats = {
      total: webhooks.length,
      active: webhooks.filter((w) => w.status === 'ACTIVE').length,
      totalDeliveries,
      successRate,
    }

    return new NextResponse(safeJson({ webhooks, stats }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new NextResponse(safeJson({ error: 'Erreur interne du serveur' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// POST /api/webhooks — create webhook
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return new NextResponse(safeJson({ error: 'Non authentifié' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const { name, url, events, secret } = body

    if (!name || !url || !events || !Array.isArray(events) || events.length === 0) {
      return new NextResponse(safeJson({ error: 'Le nom, l\'URL et au moins un événement sont requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const webhook = await db.webhook.create({
      data: {
        accountId: session.id,
        name: name.trim(),
        url: url.trim(),
        events: JSON.stringify(events),
        secret: secret || null,
      },
    })

    return new NextResponse(safeJson({ webhook }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new NextResponse(safeJson({ error: 'Erreur interne du serveur' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
