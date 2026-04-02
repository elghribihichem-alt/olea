import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { compareSync } from 'bcryptjs'

function safeJson<T>(data: T): string {
  return JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value,
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return new NextResponse(safeJson({ error: 'Email et mot de passe requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const account = await db.backOfficeAccount.findUnique({
      where: { email },
    })

    if (!account || account.status !== 'ACTIVE') {
      return new NextResponse(
        safeJson({ error: 'Email ou mot de passe incorrect' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const isPasswordValid = compareSync(password, account.passwordHash)

    if (!isPasswordValid) {
      return new NextResponse(
        safeJson({ error: 'Email ou mot de passe incorrect' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const sessionToken = crypto.randomUUID()
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await db.backOfficeAccount.update({
      where: { id: account.id },
      data: {
        sessionToken,
        sessionExpiresAt,
        loginCount: { increment: 1 },
        lastLogin: new Date(),
      },
    })

    const user = {
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
      status: account.status,
      enterprise: account.enterprise,
      avatar: null,
    }

    const response = new NextResponse(safeJson({ success: true, user }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session_token=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
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
