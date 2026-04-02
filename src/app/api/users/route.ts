import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const role = searchParams.get('role') || 'ALL'
    const status = searchParams.get('status') || 'ALL'
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {}

    if (role !== 'ALL') {
      where.role = role
    }
    if (status !== 'ALL') {
      where.status = status
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { enterprise: { contains: search } },
      ]
    }

    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
          createdAt: true,
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
        },
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des utilisateurs' },
      { status: 500 }
    )
  }
}
