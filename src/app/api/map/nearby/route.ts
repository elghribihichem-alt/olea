import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const latParam = searchParams.get('lat')
    const lngParam = searchParams.get('lng')
    const radiusParam = searchParams.get('radius')
    const oliveTypeId = searchParams.get('oliveTypeId')

    if (!latParam || !lngParam) {
      return NextResponse.json(
        { error: 'Les paramètres lat et lng sont requis' },
        { status: 400 }
      )
    }

    const centerLat = parseFloat(latParam)
    const centerLng = parseFloat(lngParam)
    const radius = radiusParam ? parseFloat(radiusParam) : 50

    if (Number.isNaN(centerLat) || Number.isNaN(centerLng)) {
      return NextResponse.json(
        { error: 'Les paramètres lat et lng doivent être des nombres valides' },
        { status: 400 }
      )
    }

    if (Number.isNaN(radius) || radius <= 0) {
      return NextResponse.json(
        { error: 'Le rayon doit être un nombre positif' },
        { status: 400 }
      )
    }

    // Build where clause — only active auctions with valid coordinates
    const where: Record<string, unknown> = {
      status: 'ACTIVE',
      latitude: { not: null },
      longitude: { not: null },
    }

    if (oliveTypeId) {
      where.oliveTypeId = oliveTypeId
    }

    // Fetch ALL matching auctions with coordinates
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

    // Filter by radius using Haversine formula
    const nearby = auctions
      .filter((a) => a.latitude !== null && a.longitude !== null)
      .map((a) => {
        const distanceKm = haversine(
          centerLat,
          centerLng,
          a.latitude as number,
          a.longitude as number
        )
        return { ...a, distanceKm }
      })
      .filter((a) => a.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 50)

    // Format response
    const formatted = nearby.map((a) => ({
      id: a.id,
      title: a.title,
      status: a.status,
      quantity: a.quantity,
      reservePrice: a.reservePrice,
      endDate: a.endDate,
      latitude: a.latitude,
      longitude: a.longitude,
      distanceKm: Number(a.distanceKm.toFixed(2)),
      seller: a.seller,
      oliveType: a.oliveType,
      region: a.region,
      bidCount: a._count.bids,
      highestBid: highestBidMap.get(a.id) ?? null,
    }))

    return NextResponse.json({
      center: { lat: centerLat, lng: centerLng, radius },
      count: formatted.length,
      auctions: formatted,
    })
  } catch (error) {
    console.error('Nearby auctions error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la recherche des enchères nearby' },
      { status: 500 }
    )
  }
}
