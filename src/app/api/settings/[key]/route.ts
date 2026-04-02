import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params
    const setting = await db.settings.findUnique({ where: { key } })

    if (!setting) {
      return NextResponse.json({ error: 'Paramètre non trouvé' }, { status: 404 })
    }

    return NextResponse.json(setting)
  } catch (error) {
    console.error('Setting fetch error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params
    const { value, description } = await req.json()

    const existing = await db.settings.findUnique({ where: { key } })
    if (!existing) {
      return NextResponse.json({ error: 'Paramètre non trouvé' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (value !== undefined) updateData.value = value
    if (description !== undefined) updateData.description = description

    const setting = await db.settings.update({
      where: { key },
      data: updateData,
    })

    return NextResponse.json(setting)
  } catch (error) {
    console.error('Setting update error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params
    const existing = await db.settings.findUnique({ where: { key } })
    if (!existing) {
      return NextResponse.json({ error: 'Paramètre non trouvé' }, { status: 404 })
    }

    await db.settings.delete({ where: { key } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Setting delete error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
