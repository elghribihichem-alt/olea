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

// GET /api/calendar — list events for a month range
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
    const month = parseInt(searchParams.get('month') || new Date().getMonth().toString(), 10)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString(), 10)

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const events = await db.calendarEvent.findMany({
      where: {
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      orderBy: { startDate: 'asc' },
    })

    // Stats
    const now = new Date()
    const thisMonthEvents = events.length
    const upcomingEvents = events.filter((e) => new Date(e.startDate) >= now).length

    return new NextResponse(safeJson({
      events,
      stats: { thisMonthEvents, upcomingEvents },
    }), {
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

// POST /api/calendar — create event
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
    const { title, description, type, startDate, endDate, allDay, color, location } = body

    if (!title || !type || !startDate) {
      return new NextResponse(safeJson({ error: 'Le titre, le type et la date de début sont requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const event = await db.calendarEvent.create({
      data: {
        title: title.trim(),
        description: description || null,
        type,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        allDay: Boolean(allDay),
        color: color || '#45A452',
        location: location || null,
        createdBy: session.id,
      },
    })

    return new NextResponse(safeJson({ event }), {
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
