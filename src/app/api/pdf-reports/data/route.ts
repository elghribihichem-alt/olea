import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

function safeJson<T>(data: T): string {
  return JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value,
  )
}

// ─── Session helper ────────────────────────────────────────────────────────────
async function getSessionAccount(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value
  if (!sessionToken) return null

  const account = await db.backOfficeAccount.findFirst({
    where: {
      sessionToken,
      sessionExpiresAt: { gt: new Date() },
    },
  })
  return account
}

export async function GET(request: NextRequest) {
  try {
    const account = await getSessionAccount(request)
    if (!account) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    const validTypes = [
      'AUCTIONS_SUMMARY',
      'TRANSACTIONS_REPORT',
      'USERS_ACTIVITY',
      'FINANCIAL_OVERVIEW',
      'DASHBOARD_SNAPSHOT',
    ]

    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Type de rapport invalide' }, { status: 400 })
    }

    const startDate = dateFrom ? new Date(dateFrom) : new Date('2024-01-01')
    const endDate = dateTo ? new Date(dateTo) : new Date()

    const dateFilter = {
      gte: startDate,
      lte: new Date(endDate.getTime() + 24 * 60 * 60 * 1000), // include end of day
    }

    switch (type) {
      case 'AUCTIONS_SUMMARY':
        return handleAuctionsSummary(dateFilter)
      case 'TRANSACTIONS_REPORT':
        return handleTransactionsReport(dateFilter)
      case 'USERS_ACTIVITY':
        return handleUsersActivity(dateFilter, startDate)
      case 'FINANCIAL_OVERVIEW':
        return handleFinancialOverview(dateFilter)
      case 'DASHBOARD_SNAPSHOT':
        return handleDashboardSnapshot(dateFilter)
      default:
        return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
    }
  } catch (error) {
    console.error('PDF data error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// AUCTIONS_SUMMARY
// ════════════════════════════════════════════════════════════════════════════════
async function handleAuctionsSummary(dateFilter: Prisma.DateTimeFilter) {
  const where: Prisma.AuctionWhereInput = { createdAt: dateFilter }

  const [auctions, agg] = await Promise.all([
    db.auction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        seller: { select: { name: true, enterprise: true } },
        oliveType: { select: { name: true } },
        region: { select: { name: true } },
      },
      take: 200,
    }),
    db.auction.aggregate({
      where,
      _count: true,
      _sum: { quantity: true, reservePrice: true },
      _avg: { reservePrice: true },
    }),
  ])

  const activeCount = auctions.filter((a) => a.status === 'ACTIVE').length
  const closedCount = auctions.filter((a) => a.status === 'CLOSED').length

  const data = {
    auctions: auctions.map((a) => ({
      id: a.id,
      title: a.title,
      oliveType: a.oliveType?.name || '—',
      region: a.region?.name || '—',
      seller: a.seller?.name || a.seller?.enterprise || '—',
      quantity: Number(a.quantity),
      reservePrice: a.reservePrice ? Number(a.reservePrice) : null,
      status: a.status,
      createdAt: a.createdAt.toISOString().split('T')[0],
      endDate: a.endDate.toISOString().split('T')[0],
    })),
    summary: {
      total: agg._count,
      active: activeCount,
      closed: closedCount,
      totalVolume: Number(agg._sum?.quantity || 0),
      avgPrice: agg._avg?.reservePrice ? Number(agg._avg.reservePrice) : 0,
    },
  }

  return new NextResponse(safeJson(data), {
    headers: { 'Content-Type': 'application/json' },
  })
}

// ════════════════════════════════════════════════════════════════════════════════
// TRANSACTIONS_REPORT
// ════════════════════════════════════════════════════════════════════════════════
async function handleTransactionsReport(dateFilter: Prisma.DateTimeFilter) {
  const where: Prisma.TransactionWhereInput = { createdAt: dateFilter }

  const [transactions, agg] = await Promise.all([
    db.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        auction: {
          include: {
            seller: { select: { name: true, enterprise: true } },
            oliveType: { select: { name: true } },
            region: { select: { name: true } },
          },
        },
        buyer: { select: { name: true, enterprise: true, phone: true } },
        seller: { select: { name: true, enterprise: true, phone: true } },
      },
      take: 200,
    }),
    db.transaction.aggregate({
      where,
      _count: true,
      _sum: { finalPrice: true },
      _avg: { finalPrice: true },
    }),
  ])

  const data = {
    transactions: transactions.map((tx) => ({
      id: tx.id,
      auctionTitle: tx.auction?.title || '—',
      oliveType: tx.auction?.oliveType?.name || '—',
      region: tx.auction?.region?.name || '—',
      buyer: tx.buyer?.name || tx.buyer?.enterprise || '—',
      seller: tx.seller?.name || tx.seller?.enterprise || '—',
      finalPrice: Number(tx.finalPrice),
      status: tx.status,
      createdAt: tx.createdAt.toISOString().split('T')[0],
      completedAt: tx.completedAt ? tx.completedAt.toISOString().split('T')[0] : null,
    })),
    summary: {
      total: agg._count,
      revenue: Number(agg._sum?.finalPrice || 0),
      avgPrice: agg._avg?.finalPrice ? Number(agg._avg.finalPrice) : 0,
    },
  }

  return new NextResponse(safeJson(data), {
    headers: { 'Content-Type': 'application/json' },
  })
}

// ════════════════════════════════════════════════════════════════════════════════
// USERS_ACTIVITY
// ════════════════════════════════════════════════════════════════════════════════
async function handleUsersActivity(dateFilter: Prisma.DateTimeFilter, startDate: Date) {
  const usersInPeriod = await db.user.findMany({
    where: { createdAt: dateFilter },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const totalUsers = await db.user.count()
  const newThisPeriod = usersInPeriod.length

  // Role breakdown for users in period
  const roleMap = new Map<string, number>()
  for (const u of usersInPeriod) {
    roleMap.set(u.role, (roleMap.get(u.role) || 0) + 1)
  }
  const byRole = Array.from(roleMap.entries()).map(([role, count]) => ({
    role,
    count,
  }))

  // Status breakdown
  const statusMap = new Map<string, number>()
  for (const u of usersInPeriod) {
    statusMap.set(u.status, (statusMap.get(u.status) || 0) + 1)
  }
  const byStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
  }))

  const data = {
    users: usersInPeriod.map((u) => ({
      id: u.id,
      name: u.name || '—',
      phone: u.phone,
      email: u.email || '—',
      enterprise: u.enterprise || '—',
      role: u.role,
      status: u.status,
      rating: Number(u.rating),
      createdAt: u.createdAt.toISOString().split('T')[0],
    })),
    summary: {
      total: totalUsers,
      newThisPeriod,
      byRole,
      byStatus,
    },
  }

  return new NextResponse(safeJson(data), {
    headers: { 'Content-Type': 'application/json' },
  })
}

// ════════════════════════════════════════════════════════════════════════════════
// FINANCIAL_OVERVIEW
// ════════════════════════════════════════════════════════════════════════════════
async function handleFinancialOverview(dateFilter: Prisma.DateTimeFilter) {
  const [walletStats, transactions] = await Promise.all([
    db.wallet.findMany({
      include: {
        account: {
          select: { name: true, enterprise: true, email: true },
        },
      },
    }),
    db.walletTransaction.findMany({
      where: { createdAt: dateFilter },
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: {
          include: {
            account: {
              select: { name: true, enterprise: true, email: true },
            },
          },
        },
      },
      take: 200,
    }),
  ])

  // Credit/debit summary
  let totalCredits = 0
  let totalDebits = 0
  for (const tx of transactions) {
    const amount = Number(tx.amount)
    if (tx.type === 'CREDIT' || tx.type === 'REFUND') {
      totalCredits += amount
    } else {
      totalDebits += amount
    }
  }

  const topAccounts = walletStats
    .map((w) => ({
      accountId: w.accountId,
      name: w.account.name,
      enterprise: w.account.enterprise,
      email: w.account.email,
      balance: Number(w.balance),
      totalCredited: Number(w.totalCredited),
      totalDebited: Number(w.totalDebited),
    }))
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 10)

  const data = {
    walletStats: {
      totalWallets: walletStats.length,
      totalBalance: walletStats.reduce((s, w) => s + Number(w.balance), 0),
      totalCredited: walletStats.reduce((s, w) => s + Number(w.totalCredited), 0),
      totalDebited: walletStats.reduce((s, w) => s + Number(w.totalDebited), 0),
    },
    creditDebitSummary: {
      totalCredits,
      totalDebits,
      netFlow: totalCredits - totalDebits,
      transactionCount: transactions.length,
    },
    topAccounts,
  }

  return new NextResponse(safeJson(data), {
    headers: { 'Content-Type': 'application/json' },
  })
}

// ════════════════════════════════════════════════════════════════════════════════
// DASHBOARD_SNAPSHOT
// ════════════════════════════════════════════════════════════════════════════════
async function handleDashboardSnapshot(dateFilter: Prisma.DateTimeFilter) {
  const [
    auctionAgg,
    transactionAgg,
    userAgg,
    activeAuctions,
    recentTransactions,
    recentUsers,
  ] = await Promise.all([
    db.auction.aggregate({
      where: dateFilter,
      _count: true,
      _sum: { quantity: true },
    }),
    db.transaction.aggregate({
      where: dateFilter,
      _count: true,
      _sum: { finalPrice: true },
    }),
    db.user.aggregate({
      where: { createdAt: dateFilter },
      _count: true,
    }),
    db.auction.findMany({
      where: { status: 'ACTIVE' },
      take: 10,
      include: {
        seller: { select: { name: true } },
        oliveType: { select: { name: true } },
        region: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.transaction.findMany({
      where: dateFilter,
      take: 10,
      include: {
        auction: { select: { title: true } },
        buyer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.user.findMany({
      where: { createdAt: dateFilter },
      take: 10,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Alerts: auctions expiring soon, high-value transactions, etc.
  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const expiringAuctions = await db.auction.count({
    where: {
      status: 'ACTIVE',
      endDate: { lte: threeDaysFromNow },
    },
  })

  const disputedCount = await db.transaction.count({
    where: {
      status: 'DISPUTED',
      createdAt: dateFilter,
    },
  })

  const alerts: Array<{ type: string; message: string; count: number }> = []
  if (expiringAuctions > 0) {
    alerts.push({
      type: 'warning',
      message: 'Enchères expirant dans les 3 prochains jours',
      count: expiringAuctions,
    })
  }
  if (disputedCount > 0) {
    alerts.push({
      type: 'danger',
      message: 'Transactions en litige',
      count: disputedCount,
    })
  }

  const data = {
    dashboardStats: {
      totalAuctions: auctionAgg._count,
      totalVolume: Number(auctionAgg._sum?.quantity || 0),
      totalTransactions: transactionAgg._count,
      totalRevenue: Number(transactionAgg._sum?.finalPrice || 0),
      newUsers: userAgg._count,
      activeAuctionsCount: activeAuctions.length,
    },
    recentActivity: {
      activeAuctions: activeAuctions.map((a) => ({
        id: a.id,
        title: a.title,
        seller: a.seller?.name || '—',
        oliveType: a.oliveType?.name || '—',
        region: a.region?.name || '—',
        quantity: Number(a.quantity),
        endDate: a.endDate.toISOString().split('T')[0],
      })),
      recentTransactions: recentTransactions.map((tx) => ({
        id: tx.id,
        auctionTitle: tx.auction?.title || '—',
        buyer: tx.buyer?.name || '—',
        finalPrice: Number(tx.finalPrice),
        status: tx.status,
        createdAt: tx.createdAt.toISOString().split('T')[0],
      })),
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        name: u.name || '—',
        phone: u.phone,
        role: u.role,
        createdAt: u.createdAt.toISOString().split('T')[0],
      })),
    },
    alerts,
  }

  return new NextResponse(safeJson(data), {
    headers: { 'Content-Type': 'application/json' },
  })
}
