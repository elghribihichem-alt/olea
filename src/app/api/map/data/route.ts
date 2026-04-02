import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const status = searchParams.get('status') || 'ALL'
    const oliveTypeId = searchParams.get('oliveTypeId') || 'ALL'

    const where: Record<string, unknown> = {}
    if (status !== 'ALL') where.status = status
    if (oliveTypeId !== 'ALL') where.oliveTypeId = oliveTypeId

    // Get all regions with their auctions data
    const regions = await db.region.findMany({
      include: {
        auctions: {
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
            createdAt: true,
            oliveType: { select: { name: true } },
            _count: { select: { bids: true } },
            bids: {
              orderBy: { pricePerKg: 'desc' },
              take: 1,
              select: { pricePerKg: true },
            },
          },
        },
      },
    })

    // Build map data
    const mapData = regions
      .filter((r) => r.latitude && r.longitude && r.auctions.length > 0)
      .map((region) => {
        const auctions = region.auctions
        const totalQuantity = auctions.reduce((sum, a) => sum + a.quantity, 0)
        const avgPrice =
          auctions.filter((a) => a.bids[0]).length > 0
            ? auctions
                .filter((a) => a.bids[0])
                .reduce((sum, a) => sum + a.bids[0].pricePerKg, 0) /
              auctions.filter((a) => a.bids[0]).length
            : 0

        const statusCounts: Record<string, number> = {}
        auctions.forEach((a) => {
          statusCounts[a.status] = (statusCounts[a.status] || 0) + 1
        })

        return {
          regionId: region.id,
          regionName: region.name,
          latitude: region.latitude,
          longitude: region.longitude,
          totalAuctions: auctions.length,
          totalQuantity: Math.round(totalQuantity),
          avgPrice: Number(avgPrice.toFixed(2)),
          statusCounts,
          topOliveTypes: [
            ...new Map(
              auctions.map((a) => [a.oliveType?.name, (statusCounts[a.oliveType?.name || ''] || 0) + 1])
            ).entries(),
          ]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name]) => name),
        }
      })

    // Summary stats
    const totalAuctions = mapData.reduce((s, r) => s + r.totalAuctions, 0)
    const totalVolume = mapData.reduce((s, r) => s + r.totalQuantity, 0)
    const overallAvgPrice =
      mapData.length > 0
        ? mapData.reduce((s, r) => s + r.avgPrice, 0) / mapData.length
        : 0

    return NextResponse.json({
      regions: mapData,
      summary: {
        totalRegions: mapData.length,
        totalAuctions,
        totalVolume,
        avgPrice: Number(overallAvgPrice.toFixed(2)),
      },
    })
  } catch (error) {
    console.error('Map data error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des données carte' },
      { status: 500 }
    )
  }
}
