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

    // Get all wallets aggregated data
    const wallets = await db.wallet.findMany({
      include: {
        account: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0)
    const totalCredited = wallets.reduce((sum, w) => sum + w.totalCredited, 0)
    const totalDebited = wallets.reduce((sum, w) => sum + w.totalDebited, 0)

    return new NextResponse(
      safeJson({
        balance: totalBalance,
        totalCredited,
        totalDebited,
        totalAccounts: wallets.length,
        wallets: wallets.map((w) => ({
          id: w.id,
          accountId: w.accountId,
          accountName: w.account.name,
          accountEmail: w.account.email,
          balance: w.balance,
          totalCredited: w.totalCredited,
          totalDebited: w.totalDebited,
          currency: w.currency,
        })),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Wallet fetch error:', error)
    return new NextResponse(
      safeJson({ error: 'Erreur serveur' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
