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

    // Platform-wide stats (aggregate all wallets)
    const wallets = await db.wallet.findMany()
    const currentBalance = wallets.reduce((sum, w) => sum + w.balance, 0)

    // Get current month boundaries
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)

    // All transactions with wallet + account info
    const allTransactions = await db.walletTransaction.findMany({
      include: {
        wallet: {
          include: {
            account: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    })

    const transactionCount = allTransactions.length

    // Credits and debits this month (completed only)
    const creditsThisMonth = allTransactions
      .filter(
        (t) =>
          (t.type === 'CREDIT' || t.type === 'REFUND') &&
          t.status === 'COMPLETED' &&
          new Date(t.createdAt) >= monthStart,
      )
      .reduce((sum, t) => sum + t.amount, 0)

    const debitsThisMonth = allTransactions
      .filter(
        (t) =>
          t.type === 'DEBIT' &&
          t.status === 'COMPLETED' &&
          new Date(t.createdAt) >= monthStart,
      )
      .reduce((sum, t) => sum + t.amount, 0)

    // Chart data: last 7 days
    const chartData: { date: string; credits: number; debits: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0, 0)
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1, 0, 0, 0, 0)

      const dayCredits = allTransactions
        .filter(
          (t) =>
            (t.type === 'CREDIT' || t.type === 'REFUND') &&
            t.status === 'COMPLETED' &&
            new Date(t.createdAt) >= dayStart &&
            new Date(t.createdAt) < dayEnd,
        )
        .reduce((sum, t) => sum + t.amount, 0)

      const dayDebits = allTransactions
        .filter(
          (t) =>
            t.type === 'DEBIT' &&
            t.status === 'COMPLETED' &&
            new Date(t.createdAt) >= dayStart &&
            new Date(t.createdAt) < dayEnd,
        )
        .reduce((sum, t) => sum + t.amount, 0)

      chartData.push({
        date: dayStart.toISOString().split('T')[0],
        credits: dayCredits,
        debits: dayDebits,
      })
    }

    return new NextResponse(
      safeJson({
        currentBalance,
        creditsThisMonth,
        debitsThisMonth,
        transactionCount,
        chartData,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Wallet stats error:', error)
    return new NextResponse(
      safeJson({ error: 'Erreur serveur' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
