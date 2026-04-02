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

// GET /api/chat/rooms/[id]/messages — paginated messages
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

    const isMember = await db.chatMember.findFirst({
      where: { roomId: id, accountId: session.id },
    })

    if (!isMember) {
      return new NextResponse(safeJson({ error: 'Accès refusé' }), {
        status: 403,
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

    return new NextResponse(safeJson({ messages, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }), {
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

// POST /api/chat/rooms/[id]/messages — send message
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

    const isMember = await db.chatMember.findFirst({
      where: { roomId: id, accountId: session.id },
    })

    if (!isMember) {
      return new NextResponse(safeJson({ error: 'Accès refusé' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const { content, type } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return new NextResponse(safeJson({ error: 'Le message est requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const message = await db.chatMessage.create({
      data: {
        roomId: id,
        senderId: session.id,
        senderName: session.name,
        content: content.trim(),
        type: type || 'TEXT',
      },
    })

    await db.chatRoom.update({
      where: { id },
      data: { updatedAt: new Date() },
    })

    return new NextResponse(safeJson({ message }), {
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
