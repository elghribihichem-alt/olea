import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function safeJson<T>(data: T): string {
  return JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value,
  )
}

// ─── Session helper ────────────────────────────────────────────────────────────
async function getSessionAccount(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value
  if (!sessionToken) return null

  const account = await db.backOfficeAccount.findFirst({
    where: {
      sessionToken,
      sessionExpiresAt: { gt: new Date() },
    },
  })
  return account
}

// ─── GET: Get single report ────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const account = await getSessionAccount(request)
    if (!account) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    const report = await db.generatedReport.findFirst({
      where: {
        id,
        accountId: account.id,
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Rapport non trouvé' }, { status: 404 })
    }

    return new NextResponse(safeJson(report), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('PDF Report get error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── DELETE: Delete a report ───────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const account = await getSessionAccount(request)
    if (!account) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    const report = await db.generatedReport.findFirst({
      where: {
        id,
        accountId: account.id,
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Rapport non trouvé' }, { status: 404 })
    }

    await db.generatedReport.delete({
      where: { id },
    })

    return new NextResponse(
      safeJson({ success: true, message: 'Rapport supprimé' }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('PDF Report delete error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
