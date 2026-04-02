import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const regions = await db.region.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { auctions: true } },
      },
    })

    return NextResponse.json(regions)
  } catch (error) {
    console.error('Regions fetch error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des régions' },
      { status: 500 }
    )
  }
}
