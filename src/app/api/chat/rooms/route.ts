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

// GET /api/chat/rooms — list rooms
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return new NextResponse(safeJson({ error: 'Non authentifié' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const rooms = await db.chatRoom.findMany({
      where: {
        members: { some: { accountId: session.id } },
      },
      include: {
        members: {
          select: { accountId: true, account: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const enriched = await Promise.all(
      rooms.map(async (room) => {
        const lastMessage = await db.chatMessage.findFirst({
          where: { roomId: room.id },
          orderBy: { createdAt: 'desc' },
          select: { content: true, senderName: true, createdAt: true },
        })

        const unreadCount = await db.chatMessage.count({
          where: {
            roomId: room.id,
            createdAt: { gt: room.members.find((m) => m.accountId === session.id)?.lastRead || new Date(0) },
            senderId: { not: session.id },
          },
        })

        return {
          id: room.id,
          name: room.name,
          description: room.description,
          isPrivate: room.isPrivate,
          createdBy: room.createdBy,
          lastMessage,
          unreadCount,
          memberCount: room.members.length,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt,
        }
      }),
    )

    return new NextResponse(safeJson({ rooms: enriched }), {
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

// POST /api/chat/rooms — create room
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
    const { name, description, isPrivate, memberAccountIds } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new NextResponse(safeJson({ error: 'Le nom est requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const members = Array.isArray(memberAccountIds) ? memberAccountIds : []

    const room = await db.chatRoom.create({
      data: {
        name: name.trim(),
        description: description || null,
        isPrivate: Boolean(isPrivate),
        createdBy: session.id,
        members: {
          create: [
            { accountId: session.id },
            ...members
              .filter((id: string) => id !== session.id)
              .map((accountId: string) => ({ accountId })),
          ],
        },
      },
      include: {
        members: {
          select: { accountId: true, account: { select: { id: true, name: true, email: true } } },
        },
      },
    })

    return new NextResponse(safeJson({ room }), {
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
