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

// GET /api/chat/rooms/[id] — get room with messages
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

    const room = await db.chatRoom.findFirst({
      where: {
        id,
        members: { some: { accountId: session.id } },
      },
      include: {
        members: {
          select: { accountId: true, account: { select: { id: true, name: true, email: true } } },
        },
      },
    })

    if (!room) {
      return new NextResponse(safeJson({ error: 'Salon introuvable' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const skip = (page - 1) * limit

    const [messages, total] = await Promise.all([
      db.chatMessage.findMany({
        where: { roomId: id },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip,
      }),
      db.chatMessage.count({ where: { roomId: id } }),
    ])

    return new NextResponse(safeJson({ room, messages, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }), {
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

// DELETE /api/chat/rooms/[id] — delete room
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

    const room = await db.chatRoom.findFirst({
      where: { id },
    })

    if (!room) {
      return new NextResponse(safeJson({ error: 'Salon introuvable' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (room.createdBy !== session.id && session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
      return new NextResponse(safeJson({ error: 'Non autorisé' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await db.chatRoom.delete({ where: { id } })

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
