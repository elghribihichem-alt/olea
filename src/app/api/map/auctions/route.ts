import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const status = searchParams.get('status') || 'ACTIVE'
    const oliveTypeId = searchParams.get('oliveTypeId')

    // Build where clause — only auctions with valid coordinates
    const where: Record<string, unknown> = {
      status,
      latitude: { not: null },
      longitude: { not: null },
    }

    if (oliveTypeId) {
      where.oliveTypeId = oliveTypeId
    }

    const auctions = await db.auction.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        quantity: true,
        reservePrice: true,
        endDate: true,
        latitude: true,
        longitude: true,
        seller: { select: { name: true, phone: true } },
        oliveType: { select: { name: true } },
        region: { select: { name: true } },
        _count: { select: { bids: true } },
      },
    })

    // Get highest winning bid for each auction
    const auctionIds = auctions.map((a) => a.id)

    const highestBids = await db.bid.groupBy({
      by: ['auctionId'],
      where: {
        auctionId: { in: auctionIds },
        status: 'WINNING',
      },
      _max: { pricePerKg: true },
    })

    const highestBidMap = new Map(
      highestBids.map((b) => [b.auctionId, b._max.pricePerKg])
    )

    const formatted = auctions.map((a) => ({
      id: a.id,
      title: a.title,
      status: a.status,
      quantity: a.quantity,
      reservePrice: a.reservePrice,
      endDate: a.endDate,
      latitude: a.latitude,
      longitude: a.longitude,
      seller: a.seller,
      oliveType: a.oliveType,
      region: a.region,
      bidCount: a._count.bids,
      highestBid: highestBidMap.get(a.id) ?? null,
    }))

    return NextResponse.json({ auctions: formatted })
  } catch (error) {
    console.error('Map auctions error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des enchères pour la carte' },
      { status: 500 }
    )
  }
}
