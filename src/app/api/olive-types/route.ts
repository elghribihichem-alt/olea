import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET() {
  try {
    const oliveTypes = await db.oliveType.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { auctions: true } },
      },
    })

    return NextResponse.json(oliveTypes)
  } catch (error) {
    console.error('Olive types fetch error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des types d\'olives' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, nameAr, nameFr, nameEn, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
    }

    const oliveType = await db.oliveType.create({
      data: { name, nameAr, nameFr, nameEn, description },
    })

    return NextResponse.json(oliveType, { status: 201 })
  } catch (error) {
    console.error('Olive type create error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du type d\'olive' },
      { status: 500 }
    )
  }
}
