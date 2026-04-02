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
    where: {
      sessionToken,
      sessionExpiresAt: { gt: new Date() },
    },
    select: { id: true, role: true },
  })

  return account
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return new NextResponse(safeJson({ error: 'Non authentifié' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const count = await db.bONotification.count({
      where: {
        accountId: session.id,
        isRead: false,
      },
    })

    return new NextResponse(
      safeJson({ count }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Unread count error:', error)
    return new NextResponse(
      safeJson({ error: 'Erreur serveur' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
