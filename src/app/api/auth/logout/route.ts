import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function safeJson<T>(data: T): string {
  return JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value,
  )
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value

    if (sessionToken) {
      await db.backOfficeAccount.updateMany({
        where: { sessionToken },
        data: {
          sessionToken: null,
          sessionExpiresAt: null,
        },
      })
    }

    const response = new NextResponse(safeJson({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'session_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
      },
    })

    return response
  } catch (error) {
    return new NextResponse(
      safeJson({ error: 'Erreur interne du serveur' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
