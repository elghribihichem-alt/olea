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

// GET /api/automation/stats — automation statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return new NextResponse(safeJson({ error: 'Non authentifié' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const [
      totalRules,
      activeRules,
      totalLogs,
      successLogs,
      failedLogs,
      lastRunLog,
    ] = await Promise.all([
      db.automationRule.count(),
      db.automationRule.count({ where: { status: 'ACTIVE' } }),
      db.automationLog.count(),
      db.automationLog.count({ where: { status: 'SUCCESS' } }),
      db.automationLog.count({ where: { status: 'FAILED' } }),
      db.automationLog.findFirst({
        orderBy: { startedAt: 'desc' },
        select: { startedAt: true },
      }),
    ])

    const totalRuns = totalLogs
    const successRate = totalRuns > 0
      ? Math.round((successLogs / totalRuns) * 100)
      : 0

    return new NextResponse(
      safeJson({
        totalRules,
        activeRules,
        totalRuns,
        successRate,
        failedRuns: failedLogs,
        lastRunAt: lastRunLog?.startedAt?.toISOString() ?? null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Automation stats error:', error)
    return new NextResponse(
      safeJson({ error: 'Erreur serveur' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
