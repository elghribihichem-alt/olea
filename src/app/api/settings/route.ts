import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const settings = await db.settings.findMany({
      orderBy: { key: 'asc' },
    })

    // Group settings by category
    const grouped: Record<string, Array<{ id: string; key: string; value: string; description: string | null }>> = {
      platform: [],
      auction: [],
      notifications: [],
      fees: [],
      legal: [],
      other: [],
    }

    for (const setting of settings) {
      const category = setting.key.split('_')[0]
      if (grouped[category]) {
        grouped[category].push(setting)
      } else {
        grouped.other.push(setting)
      }
    }

    // Return flat + grouped for flexibility
    return NextResponse.json({
      settings,
      grouped,
      categories: Object.keys(grouped).filter((k) => grouped[k].length > 0),
    })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { key, value, description } = body

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Clé et valeur sont requis' }, { status: 400 })
    }

    const setting = await db.settings.upsert({
      where: { key },
      update: { value, description: description || undefined },
      create: { key, value, description: description || null },
    })

    return NextResponse.json(setting, { status: 201 })
  } catch (error) {
    console.error('Settings create error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { updates } = body as { updates: Array<{ key: string; value: string }> }

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Format invalide' }, { status: 400 })
    }

    const results = await Promise.all(
      updates.map(({ key, value }) =>
        db.settings.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    )

    return NextResponse.json({ settings: results, updated: results.length })
  } catch (error) {
    console.error('Settings batch update error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
