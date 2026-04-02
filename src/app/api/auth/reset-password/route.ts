import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashSync } from 'bcryptjs'

function safeJson<T>(data: T): string {
  return JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value,
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, otp, newPassword } = body

    if (!email || !otp || !newPassword) {
      return new NextResponse(
        safeJson({ error: 'Tous les champs sont requis' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const account = await db.backOfficeAccount.findUnique({
      where: { email },
    })

    if (!account) {
      return new NextResponse(
        safeJson({ error: 'Code invalide ou expiré' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    if (
      !account.otpCode ||
      account.otpCode !== otp ||
      !account.otpExpiresAt ||
      account.otpExpiresAt < new Date()
    ) {
      return new NextResponse(
        safeJson({ error: 'Code invalide ou expiré' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const passwordHash = hashSync(newPassword, 10)

    await db.backOfficeAccount.update({
      where: { id: account.id },
      data: {
        passwordHash,
        otpCode: null,
        otpExpiresAt: null,
      },
    })

    return new NextResponse(safeJson({ success: true }), {
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
