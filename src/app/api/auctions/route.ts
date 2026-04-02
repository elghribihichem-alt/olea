import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || 'ALL'
    const oliveTypeId = searchParams.get('oliveTypeId') || 'ALL'
    const regionId = searchParams.get('regionId') || 'ALL'
    const search = searchParams.get('search') || ''

    // Build where clause
    const where: Record<string, unknown> = {}

    if (status !== 'ALL') {
      where.status = status
    }
    if (oliveTypeId !== 'ALL') {
      where.oliveTypeId = oliveTypeId
    }
    if (regionId !== 'ALL') {
      where.regionId = regionId
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const skip = (page - 1) * limit

    const [auctions, total] = await Promise.all([
      db.auction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: { select: { id: true, name: true, phone: true, enterprise: true } },
          oliveType: { select: { id: true, name: true } },
          region: { select: { id: true, name: true } },
          _count: { select: { bids: true } },
          bids: {
            orderBy: { pricePerKg: 'desc' },
            take: 1,
            select: { pricePerKg: true, status: true },
          },
        },
      }),
      db.auction.count({ where }),
    ])

    // Format response
    const formatted = auctions.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      quantity: a.quantity,
      reservePrice: a.reservePrice,
      status: a.status,
      endDate: a.endDate,
      isOffline: a.isOffline,
      viewCount: a.viewCount,
      createdAt: a.createdAt,
      publishedAt: a.publishedAt,
      closedAt: a.closedAt,
      seller: a.seller,
      oliveType: a.oliveType,
      region: a.region,
      bidCount: a._count.bids,
      highestBid: a.bids[0] || null,
    }))

    return NextResponse.json({
      auctions: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Auctions fetch error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des enchères' },
      { status: 500 }
    )
  }
}
