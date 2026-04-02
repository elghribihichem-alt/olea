import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function safeJson<T>(data: T): string {
  return JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value,
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return new NextResponse(safeJson({ error: 'Email requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const otpCode = String(Math.floor(100000 + Math.random() * 900000))
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await db.backOfficeAccount.update({
      where: { email },
      data: {
        otpCode,
        otpExpiresAt,
      },
    }).catch(() => {
      // Silently fail if account not found to avoid email enumeration
    })

    return new NextResponse(
      safeJson({ success: true, message: 'Code OTP envoyé' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    // Always return success to avoid email enumeration
    return new NextResponse(
      safeJson({ success: true, message: 'Code OTP envoyé' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
