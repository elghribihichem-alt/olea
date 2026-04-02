import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [
      totalUsers,
      activeUsers,
      totalAuctions,
      activeAuctions,
      closedAuctions,
      totalBids,
      totalTransactions,
      completedTransactions,
      avgPricePerKg,
      totalVolume,
      pendingReports,
      sellersCount,
      buyersCount,
    ] = await Promise.all([
      // Total users
      db.user.count(),
      // Active users
      db.user.count({ where: { status: 'ACTIVE' } }),
      // Total auctions
      db.auction.count(),
      // Active auctions
      db.auction.count({ where: { status: 'ACTIVE' } }),
      // Closed auctions
      db.auction.count({ where: { status: 'CLOSED' } }),
      // Total bids
      db.bid.count(),
      // Total transactions
      db.transaction.count(),
      // Completed transactions
      db.transaction.count({ where: { status: 'COMPLETED' } }),
      // Average price per kg (from winning bids)
      db.bid.aggregate({
        where: { status: { in: ['WINNING', 'WON'] } },
        _avg: { pricePerKg: true },
      }),
      // Total volume (kg) from active auctions
      db.auction.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { quantity: true },
      }),
      // Pending reports/disputes
      db.report.count({ where: { status: { in: ['PENDING', 'IN_REVIEW'] } } }),
      // Sellers count
      db.user.count({ where: { role: { in: ['SELLER', 'MIXED'] } } }),
      // Buyers count
      db.user.count({ where: { role: { in: ['BUYER', 'MIXED'] } } }),
    ])

    // Total revenue from completed transactions
    const revenueResult = await db.transaction.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { finalPrice: true },
    })

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalAuctions,
      activeAuctions,
      closedAuctions,
      totalBids,
      totalTransactions,
      completedTransactions,
      avgPricePerKg: avgPricePerKg._avg.pricePerKg?.toFixed(2) || '0.00',
      totalVolume: totalVolume._sum.quantity || 0,
      totalRevenue: revenueResult._sum.finalPrice || 0,
      pendingReports,
      sellersCount,
      buyersCount,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des statistiques' },
      { status: 500 }
    )
  }
}
