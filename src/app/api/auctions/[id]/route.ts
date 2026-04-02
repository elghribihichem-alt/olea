import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const auction = await db.auction.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, name: true, phone: true, enterprise: true, rating: true, totalRatings: true } },
        oliveType: { select: { id: true, name: true } },
        region: { select: { id: true, name: true, latitude: true, longitude: true } },
        images: { orderBy: { order: 'asc' } },
        bids: {
          orderBy: { pricePerKg: 'desc' },
          include: {
            buyer: { select: { id: true, name: true, phone: true } },
          },
        },
        transaction: true,
      },
    })

    if (!auction) {
      return NextResponse.json({ error: 'Enchère non trouvée' }, { status: 404 })
    }

    return NextResponse.json(auction)
  } catch (error) {
    console.error('Auction detail error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement de l\'enchère' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const auction = await db.auction.findUnique({ where: { id } })
    if (!auction) {
      return NextResponse.json({ error: 'Enchère non trouvée' }, { status: 404 })
    }

    if (auction.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'Impossible de supprimer une enchère active' },
        { status: 400 }
      )
    }

    await db.auction.delete({ where: { id } })

    return NextResponse.json({ message: 'Enchère supprimée avec succès' })
  } catch (error) {
    console.error('Auction delete error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}
