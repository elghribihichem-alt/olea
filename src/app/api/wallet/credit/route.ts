import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

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
    select: { id: true, name: true, email: true, role: true },
  })

  return account
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return new NextResponse(safeJson({ error: 'Non authentifié' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Only SUPER_ADMIN and ADMIN can credit accounts
    if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
      return new NextResponse(safeJson({ error: 'Accès non autorisé' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const { accountId, amount, description } = body

    if (!accountId || !amount || amount <= 0) {
      return new NextResponse(
        safeJson({ error: 'Compte et montant requis' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Find or create wallet for the target account
    let wallet = await db.wallet.findUnique({
      where: { accountId },
    })

    if (!wallet) {
      wallet = await db.wallet.create({
        data: { accountId },
      })
    }

    const reference = `CRD-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`

    // Atomic credit operation
    await db.$transaction(async (tx) => {
      await tx.walletTransaction.create({
        data: {
          walletId: wallet!.id,
          type: 'CREDIT',
          amount,
          status: 'COMPLETED',
          description: description || `Crédit de ${amount.toFixed(3)} TND`,
          reference,
          performedBy: session.id,
        },
      })

      await tx.wallet.update({
        where: { id: wallet!.id },
        data: {
          balance: { increment: amount },
          totalCredited: { increment: amount },
        },
      })
    })

    return new NextResponse(
      safeJson({
        success: true,
        message: 'Crédit effectué avec succès',
        reference,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Wallet credit error:', error)
    return new NextResponse(
      safeJson({ error: 'Erreur serveur' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
