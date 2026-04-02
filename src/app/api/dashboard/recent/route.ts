import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Last 10 auctions
    const recentAuctions = await db.auction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        seller: { select: { id: true, name: true, phone: true } },
        oliveType: { select: { id: true, name: true } },
        region: { select: { id: true, name: true } },
        _count: { select: { bids: true } },
      },
    })

    // Last 10 users
    const recentUsers = await db.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        enterprise: true,
      },
    })

    // Last 10 bids
    const recentBids = await db.bid.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { id: true, name: true, phone: true } },
        auction: {
          select: {
            id: true,
            title: true,
            status: true,
            oliveType: { select: { name: true } },
          },
        },
      },
    })

    return NextResponse.json({
      recentAuctions: recentAuctions.map((a) => ({
        id: a.id,
        title: a.title,
        status: a.status,
        quantity: a.quantity,
        reservePrice: a.reservePrice,
        endDate: a.endDate,
        createdAt: a.createdAt,
        seller: a.seller,
        oliveType: a.oliveType,
        region: a.region,
        bidCount: a._count.bids,
      })),
      recentUsers,
      recentBids: recentBids.map((b) => ({
        id: b.id,
        pricePerKg: b.pricePerKg,
        totalPrice: b.totalPrice,
        status: b.status,
        createdAt: b.createdAt,
        buyer: b.buyer,
        auction: b.auction,
      })),
    })
  } catch (error) {
    console.error('Dashboard recent error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des activités récentes' },
      { status: 500 }
    )
  }
}
