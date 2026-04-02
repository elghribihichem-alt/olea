import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        enterprise: true,
        role: true,
        status: true,
        rating: true,
        totalRatings: true,
        language: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            auctions: true,
            bids: true,
            transactionsAsBuyer: true,
            transactionsAsSeller: true,
            reviewsGiven: true,
            reviewsReceived: true,
          },
        },
        auctions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            quantity: true,
            createdAt: true,
            oliveType: { select: { name: true } },
            _count: { select: { bids: true } },
          },
        },
        bids: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            pricePerKg: true,
            totalPrice: true,
            status: true,
            createdAt: true,
            auction: {
              select: {
                id: true,
                title: true,
                status: true,
                oliveType: { select: { name: true } },
              },
            },
          },
        },
        reviewsReceived: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            reviewer: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('User detail error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement de l\'utilisateur' },
      { status: 500 }
    )
  }
}
