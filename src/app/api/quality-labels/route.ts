import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function safeJson<T>(data: T): string {
  return JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value,
  )
}

async function getSession(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value
  if (!sessionToken) return null
  const account = await db.backOfficeAccount.findFirst({
    where: { sessionToken, sessionExpiresAt: { gt: new Date() } },
    select: { id: true, name: true, email: true, role: true },
  })
  return account
}

// GET /api/quality-labels — list all labels
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return new NextResponse(safeJson({ error: 'Non authentifié' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }
    if (category) {
      where.category = category
    }

    const labels = await db.qualityLabel.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: 'desc' },
    })

    const stats = {
      total: labels.length,
      active: labels.filter((l) => l.status === 'ACTIVE').length,
      expired: labels.filter((l) => l.status === 'EXPIRED').length,
      byCategory: labels.reduce((acc, l) => {
        acc[l.category] = (acc[l.category] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }

    return new NextResponse(safeJson({ labels, stats }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new NextResponse(safeJson({ error: 'Erreur interne du serveur' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// POST /api/quality-labels — create label
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return new NextResponse(safeJson({ error: 'Non authentifié' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const { name, description, category, status, icon, certifier, validFrom, validUntil, criteria } = body

    if (!name || !category) {
      return new NextResponse(safeJson({ error: 'Le nom et la catégorie sont requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const label = await db.qualityLabel.create({
      data: {
        name: name.trim(),
        description: description || null,
        category,
        status: status || 'ACTIVE',
        icon: icon || null,
        certifier: certifier || null,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        criteria: criteria || null,
      },
    })

    return new NextResponse(safeJson({ label }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new NextResponse(safeJson({ error: 'Erreur interne du serveur' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
