import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !['ACTIVE', 'CLOSED', 'CANCELLED', 'DRAFT', 'EXPIRED'].includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }

    const auction = await db.auction.findUnique({ where: { id } })
    if (!auction) {
      return NextResponse.json({ error: 'Enchère non trouvée' }, { status: 404 })
    }

    // Business rules
    if (auction.status === 'CLOSED' && status !== 'CANCELLED') {
      return NextResponse.json(
        { error: 'Une enchère clôturée ne peut être réouverte' },
        { status: 400 }
      )
    }

    if (auction.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Une enchère annulée ne peut être modifiée' },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = { status }

    if (status === 'ACTIVE' && !auction.publishedAt) {
      updateData.publishedAt = new Date()
    }

    if (status === 'CLOSED') {
      updateData.closedAt = new Date()
      // Find the winning bid
      const winningBid = await db.bid.findFirst({
        where: { auctionId: id, status: 'WINNING' },
      })
      if (winningBid) {
        updateData.winningBidId = winningBid.id
        await db.bid.update({
          where: { id: winningBid.id },
          data: { status: 'WON' },
        })
        // Mark other bids as LOST
        await db.bid.updateMany({
          where: { auctionId: id, id: { not: winningBid.id }, status: { not: 'WITHDRAWN' } },
          data: { status: 'LOST' },
        })
        // Create transaction
        await db.transaction.create({
          data: {
            auctionId: id,
            sellerId: auction.sellerId,
            buyerId: winningBid.buyerId,
            bidId: winningBid.id,
            finalPrice: winningBid.totalPrice,
            status: 'PENDING',
          },
        })
      }
    }

    const updated = await db.auction.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Auction status update error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du statut' },
      { status: 500 }
    )
  }
}
