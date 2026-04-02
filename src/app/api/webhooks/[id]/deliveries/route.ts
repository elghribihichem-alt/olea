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

// GET /api/webhooks/[id]/deliveries — delivery logs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return new NextResponse(safeJson({ error: 'Non authentifié' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { id } = await params

    const webhook = await db.webhook.findFirst({ where: { id, accountId: session.id } })
    if (!webhook) {
      return new NextResponse(safeJson({ error: 'Webhook introuvable' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const deliveries = await db.webhookDelivery.findMany({
      where: { webhookId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return new NextResponse(safeJson({ deliveries }), {
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
