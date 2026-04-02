import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || 'ALL'

    const where: Record<string, unknown> = {}
    if (status !== 'ALL') where.status = status

    const skip = (page - 1) * limit

    const [reports, total] = await Promise.all([
      db.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { id: true, name: true, phone: true } },
          auction: {
            select: {
              id: true,
              title: true,
              status: true,
              oliveType: { select: { name: true } },
              region: { select: { name: true } },
            },
          },
        },
      }),
      db.report.count({ where }),
    ])

    return NextResponse.json({
      reports,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Reports fetch error:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement' }, { status: 500 })
  }
}
