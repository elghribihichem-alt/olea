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
    where: {
      sessionToken,
      sessionExpiresAt: { gt: new Date() },
    },
    select: { id: true, name: true, email: true, role: true },
  })

  return account
}

// GET /api/automation/logs — paginated automation logs
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return new NextResponse(safeJson({ error: 'Non authentifié' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const searchParams = request.nextUrl.searchParams
    const ruleId = searchParams.get('ruleId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}
    if (ruleId) where.ruleId = ruleId
    if (status) where.status = status

    const [logs, total] = await Promise.all([
      db.automationLog.findMany({
        where,
        include: {
          rule: {
            select: { id: true, name: true, type: true },
          },
        },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.automationLog.count({ where }),
    ])

    return new NextResponse(
      safeJson({
        logs: logs.map((l) => ({
          id: l.id,
          ruleId: l.ruleId,
          ruleName: l.rule.name,
          ruleType: l.rule.type,
          status: l.status,
          duration: l.duration,
          recordsProcessed: l.recordsProcessed,
          message: l.message,
          error: l.error,
          startedAt: l.startedAt.toISOString(),
          completedAt: l.completedAt?.toISOString() ?? null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Automation logs error:', error)
    return new NextResponse(
      safeJson({ error: 'Erreur serveur' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
