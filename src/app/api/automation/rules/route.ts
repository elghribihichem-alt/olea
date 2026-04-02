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

function isAdmin(role: string): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN'
}

// GET /api/automation/rules — list all rules with optional filters
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
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (type) where.type = type

    const rules = await db.automationRule.findMany({
      where,
      include: {
        _count: { select: { logs: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return new NextResponse(
      safeJson({
        rules: rules.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          status: r.status,
          cronExpr: r.cronExpr,
          lastRunAt: r.lastRunAt?.toISOString() ?? null,
          nextRunAt: r.nextRunAt?.toISOString() ?? null,
          runCount: r.runCount,
          failCount: r.failCount,
          createdBy: r.createdBy,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          logsCount: r._count.logs,
        })),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Automation rules list error:', error)
    return new NextResponse(
      safeJson({ error: 'Erreur serveur' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

// POST /api/automation/rules — create a new rule
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return new NextResponse(safeJson({ error: 'Non authentifié' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!isAdmin(session.role)) {
      return new NextResponse(safeJson({ error: 'Accès non autorisé' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const { name, type, status, config, cronExpr } = body

    if (!name || !type) {
      return new NextResponse(safeJson({ error: 'Nom et type sont requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const validTypes = [
      'AUTO_CLOSE_AUCTION',
      'AUTO_SUSPEND_ACCOUNT',
      'PRICE_ALERT_CHECK',
      'REPORT_GENERATION',
      'DAILY_SUMMARY',
      'WEEKLY_REPORT',
      'CLEANUP_EXPIRED',
    ]

    if (!validTypes.includes(type)) {
      return new NextResponse(safeJson({ error: 'Type invalide' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const validStatuses = ['ACTIVE', 'PAUSED', 'DISABLED']
    const ruleStatus = status || 'ACTIVE'

    if (!validStatuses.includes(ruleStatus)) {
      return new NextResponse(safeJson({ error: 'Statut invalide' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate config JSON if provided
    if (config) {
      try {
        JSON.parse(config)
      } catch {
        return new NextResponse(safeJson({ error: 'Config doit être un JSON valide' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    const rule = await db.automationRule.create({
      data: {
        name,
        type,
        status: ruleStatus,
        config: config || null,
        cronExpr: cronExpr || null,
        createdBy: session.id,
      },
    })

    return new NextResponse(
      safeJson({
        rule: {
          id: rule.id,
          name: rule.name,
          type: rule.type,
          status: rule.status,
          cronExpr: rule.cronExpr,
          config: rule.config,
          lastRunAt: rule.lastRunAt?.toISOString() ?? null,
          nextRunAt: rule.nextRunAt?.toISOString() ?? null,
          runCount: rule.runCount,
          failCount: rule.failCount,
          createdBy: rule.createdBy,
          createdAt: rule.createdAt.toISOString(),
          updatedAt: rule.updatedAt.toISOString(),
        },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Automation rule create error:', error)
    return new NextResponse(
      safeJson({ error: 'Erreur serveur' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
