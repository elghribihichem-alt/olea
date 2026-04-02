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

// GET /api/cooperatives — list cooperatives
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
    const status = searchParams.get('status') || ''
    const regionId = searchParams.get('regionId') || ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }
    if (status) {
      where.status = status
    }
    if (regionId) {
      where.regionId = regionId
    }

    const cooperatives = await db.cooperative.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { region: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const totalMembers = cooperatives.reduce((sum, c) => sum + c.memberCount, 0)
    const totalVolume = cooperatives.reduce((sum, c) => sum + (c.annualVolume || 0), 0)
    const activeCount = cooperatives.filter((c) => c.status === 'ACTIVE').length

    const stats = {
      total: cooperatives.length,
      totalMembers,
      totalVolume: Math.round(totalVolume),
      active: activeCount,
    }

    // Fetch regions for filter
    const regions = await db.region.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })

    return new NextResponse(safeJson({ cooperatives, stats, regions }), {
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

// POST /api/cooperatives — create cooperative
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
    const { name, description, regionId, address, phone, email, website, memberCount, annualVolume, status, certification, foundedYear, contactPerson } = body

    if (!name) {
      return new NextResponse(safeJson({ error: 'Le nom est requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const cooperative = await db.cooperative.create({
      data: {
        name: name.trim(),
        description: description || null,
        regionId: regionId || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        memberCount: memberCount || 0,
        annualVolume: annualVolume || null,
        status: status || 'ACTIVE',
        certification: certification || null,
        foundedYear: foundedYear || null,
        contactPerson: contactPerson || null,
      },
      include: { region: { select: { id: true, name: true } } },
    })

    return new NextResponse(safeJson({ cooperative }), {
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
