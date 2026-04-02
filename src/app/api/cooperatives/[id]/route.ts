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

// GET /api/cooperatives/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return new NextResponse(safeJson({ error: 'Non authentifié' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { id } = await params
    const cooperative = await db.cooperative.findUnique({
      where: { id },
      include: { region: { select: { id: true, name: true } } },
    })

    if (!cooperative) {
      return new NextResponse(safeJson({ error: 'Coopérative introuvable' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new NextResponse(safeJson({ cooperative }), {
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

// PATCH /api/cooperatives/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return new NextResponse(safeJson({ error: 'Non authentifié' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { id } = await params
    const body = await request.json()

    const cooperative = await db.cooperative.findUnique({ where: { id } })
    if (!cooperative) {
      return new NextResponse(safeJson({ error: 'Coopérative introuvable' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const updated = await db.cooperative.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.regionId !== undefined && { regionId: body.regionId || null }),
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.website !== undefined && { website: body.website || null }),
        ...(body.memberCount !== undefined && { memberCount: body.memberCount || 0 }),
        ...(body.annualVolume !== undefined && { annualVolume: body.annualVolume || null }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.certification !== undefined && { certification: body.certification || null }),
        ...(body.foundedYear !== undefined && { foundedYear: body.foundedYear || null }),
        ...(body.contactPerson !== undefined && { contactPerson: body.contactPerson || null }),
      },
      include: { region: { select: { id: true, name: true } } },
    })

    return new NextResponse(safeJson({ cooperative: updated }), {
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

// DELETE /api/cooperatives/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return new NextResponse(safeJson({ error: 'Non authentifié' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { id } = await params
    const cooperative = await db.cooperative.findUnique({ where: { id } })
    if (!cooperative) {
      return new NextResponse(safeJson({ error: 'Coopérative introuvable' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await db.cooperative.delete({ where: { id } })

    return new NextResponse(safeJson({ success: true }), {
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
