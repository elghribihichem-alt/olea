import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { BONotificationType } from '@prisma/client'

function safeJson<T>(data: T): string {
  return JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value,
  )
}

async function getSession(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value
  if (!sessionToken) return null

  const account = await db.backOfficeAccount.findFirst({
    where: {
      sessionToken,
      sessionExpiresAt: { gt: new Date() },
    },
    select: { id: true, role: true },
  })

  return account
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return new NextResponse(safeJson({ error: 'Non authentifié' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
      return new NextResponse(safeJson({ error: 'Accès refusé' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const { targetAccountId, type, title, message, data } = body

    if (!targetAccountId || !type || !title || !message) {
      return new NextResponse(
        safeJson({ error: 'Champs requis manquants' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    if (!Object.values(BONotificationType).includes(type)) {
      return new NextResponse(
        safeJson({ error: 'Type de notification invalide' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const targetAccount = await db.backOfficeAccount.findUnique({
      where: { id: targetAccountId },
      select: { id: true },
    })

    if (!targetAccount) {
      return new NextResponse(
        safeJson({ error: 'Compte cible introuvable' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const notification = await db.bONotification.create({
      data: {
        accountId: targetAccountId,
        type: type as BONotificationType,
        title,
        message,
        data: data || null,
      },
    })

    return new NextResponse(
      safeJson({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString(),
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Create notification error:', error)
    return new NextResponse(
      safeJson({ error: 'Erreur serveur' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
