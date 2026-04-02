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
    select: { id: true, name: true, email: true, role: true },
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

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type') || 'ALL'
    const status = searchParams.get('status') || 'ALL'

    const where: Record<string, unknown> = {}

    if (type !== 'ALL') {
      where.type = type
    }
    if (status !== 'ALL') {
      where.status = status
    }

    const [transactions, total] = await Promise.all([
      db.walletTransaction.findMany({
        where,
        include: {
          wallet: {
            include: {
              account: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.walletTransaction.count({ where }),
    ])

    return new NextResponse(
      safeJson({
        transactions: transactions.map((t) => ({
          id: t.id,
          type: t.type,
          description: t.description || `${t.type === 'CREDIT' || t.type === 'REFUND' ? 'Crédit' : 'Débit'} — ${t.wallet.account.name}`,
          amount: t.amount,
          status: t.status,
          reference: t.reference || t.id.slice(0, 8).toUpperCase(),
          accountName: t.wallet.account.name,
          accountEmail: t.wallet.account.email,
          createdAt: t.createdAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Wallet transactions error:', error)
    return new NextResponse(
      safeJson({ error: 'Erreur serveur' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
