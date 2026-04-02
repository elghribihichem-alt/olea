import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

function safeJson<T>(data: T): string {
  return JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value,
  )
}

// POST /api/webhooks/[id]/test — simulate a test delivery
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const webhook = await db.webhook.findUnique({ where: { id } })
    if (!webhook) {
      return NextResponse.json({ error: 'Webhook non trouvé' }, { status: 404 })
    }

    const start = Date.now()

    // Simulate a test ping to the webhook URL
    let responseStatus: number | null = null
    let responseBody: string | null = null
    let success = false

    try {
      if (webhook.url) {
        const res = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Olea-Event': 'test.ping',
            'X-Olea-Signature': 'sha256=test_signature',
            'X-Olea-Delivery': 'test_delivery_id',
          },
          body: safeJson({
            event: 'test.ping',
            timestamp: new Date().toISOString(),
            data: { message: 'Test de livraison depuis Olea', webhookId: id },
          }),
          signal: AbortSignal.timeout(10000),
        })
        responseStatus = res.status
        responseBody = await res.text().catch(() => null)
        success = res.ok
      }
    } catch (err) {
      responseBody = err instanceof Error ? err.message : 'Erreur de connexion'
    }

    const duration = Date.now() - start

    // Log the test delivery
    await db.webhookDelivery.create({
      data: {
        webhookId: id,
        event: 'test.ping',
        payload: safeJson({
          event: 'test.ping',
          timestamp: new Date().toISOString(),
          data: { message: 'Test de livraison depuis Olea', webhookId: id },
        }),
        responseStatus: responseStatus ?? 0,
        responseBody: responseBody
          ? responseBody.substring(0, 2000)
          : null,
        success,
        duration,
        triggeredBy: 'TEST',
      },
    })

    return NextResponse.json({
      result: {
        success,
        status: responseStatus,
        duration,
        response: success ? 'OK' : responseBody?.substring(0, 200) || 'Échec',
      },
    })
  } catch (error) {
    console.error('Webhook test error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du test du webhook' },
      { status: 500 },
    )
  }
}
