import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function safeJson<T>(data: T): string {
  return JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value,
  )
}

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value

    if (!sessionToken) {
      return new NextResponse(
        safeJson({ error: 'Non authentifié' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const account = await db.backOfficeAccount.findFirst({
      where: {
        sessionToken,
        sessionExpiresAt: { gt: new Date() },
      },
    })

    if (!account) {
      // Session expired or not found — clear the session token if it exists
      await db.backOfficeAccount.updateMany({
        where: { sessionToken },
        data: {
          sessionToken: null,
          sessionExpiresAt: null,
        },
      })

      return new NextResponse(
        safeJson({ error: 'Non authentifié' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const user = {
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
      status: account.status,
      enterprise: account.enterprise,
      phone: account.phone,
      avatar: null,
      loginCount: account.loginCount,
      lastLogin: account.lastLogin,
      emailVerified: account.emailVerified,
    }

    return new NextResponse(safeJson(user), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
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
