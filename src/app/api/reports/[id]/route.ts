import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const report = await db.report.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, name: true, phone: true, role: true } },
        auction: {
          select: {
            id: true,
            title: true,
            status: true,
            quantity: true,
            createdAt: true,
            seller: { select: { id: true, name: true, phone: true } },
            oliveType: { select: { name: true } },
            region: { select: { name: true } },
            _count: { select: { bids: true } },
          },
        },
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Signalement non trouvé' }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Report detail error:', error)
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, resolution } = body

    if (!status || !['IN_REVIEW', 'RESOLVED', 'DISMISSED'].includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }

    const report = await db.report.findUnique({ where: { id } })
    if (!report) {
      return NextResponse.json({ error: 'Signalement non trouvé' }, { status: 404 })
    }

    if (report.status === 'RESOLVED' || report.status === 'DISMISSED') {
      return NextResponse.json({ error: 'Ce signalement est déjà clôturé' }, { status: 400 })
    }

    const updated = await db.report.update({
      where: { id },
      data: { status, ...(resolution ? { resolution } : {}) },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Report update error:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }
}
