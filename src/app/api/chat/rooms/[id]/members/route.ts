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

// GET /api/chat/rooms/[id]/members — list members
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

    const members = await db.chatMember.findMany({
      where: { roomId: id },
      select: {
        id: true,
        accountId: true,
        lastRead: true,
        createdAt: true,
        account: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return new NextResponse(safeJson({ members }), {
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

// POST /api/chat/rooms/[id]/members — add member
export async function POST(
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
    const { accountId } = body

    if (!accountId) {
      return new NextResponse(safeJson({ error: 'accountId requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const room = await db.chatRoom.findFirst({ where: { id } })
    if (!room) {
      return new NextResponse(safeJson({ error: 'Salon introuvable' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const existing = await db.chatMember.findFirst({
      where: { roomId: id, accountId },
    })
    if (existing) {
      return new NextResponse(safeJson({ error: 'Membre déjà présent' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const member = await db.chatMember.create({
      data: { roomId: id, accountId },
      select: {
        id: true,
        accountId: true,
        account: { select: { id: true, name: true, email: true } },
      },
    })

    return new NextResponse(safeJson({ member }), {
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

// DELETE /api/chat/rooms/[id]/members — remove member
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
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')

    if (!accountId) {
      return new NextResponse(safeJson({ error: 'accountId requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const member = await db.chatMember.findFirst({
      where: { roomId: id, accountId },
    })

    if (!member) {
      return new NextResponse(safeJson({ error: 'Membre introuvable' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await db.chatMember.delete({ where: { id: member.id } })

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
