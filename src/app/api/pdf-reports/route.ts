import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function safeJson<T>(data: T): string {
  return JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value,
  )
}

// ─── Session helper ────────────────────────────────────────────────────────────
async function getSessionAccount(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value
  if (!sessionToken) return null

  const account = await db.backOfficeAccount.findFirst({
    where: {
      sessionToken,
      sessionExpiresAt: { gt: new Date() },
    },
  })
  return account
}

// ─── GET: List generated reports ───────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const account = await getSessionAccount(request)
    if (!account) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const type = searchParams.get('type') || ''

    const where: Record<string, unknown> = { accountId: account.id }
    if (type) {
      where.type = type
    }

    const [reports, total] = await Promise.all([
      db.generatedReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.generatedReport.count({ where }),
    ])

    return new NextResponse(
      safeJson({
        reports,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('PDF Reports list error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── POST: Save a generated report ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const account = await getSessionAccount(request)
    if (!account) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { type, title, dateFrom, dateTo, filters, pageCount, fileSize } = body

    if (!type || !title || !dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'Champs requis manquants: type, title, dateFrom, dateTo' },
        { status: 400 },
      )
    }

    const validTypes = ['AUCTIONS_SUMMARY', 'TRANSACTIONS_REPORT', 'USERS_ACTIVITY', 'FINANCIAL_OVERVIEW', 'DASHBOARD_SNAPSHOT']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Type de rapport invalide' }, { status: 400 })
    }

    const report = await db.generatedReport.create({
      data: {
        accountId: account.id,
        type,
        title,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        filters: filters ? JSON.stringify(filters) : null,
        pageCount: pageCount || 1,
        fileSize: fileSize || 0,
      },
    })

    return new NextResponse(safeJson(report), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('PDF Reports save error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
