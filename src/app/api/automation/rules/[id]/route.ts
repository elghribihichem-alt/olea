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

// GET /api/automation/rules/[id] — get single rule with logs
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

    const rule = await db.automationRule.findUnique({
      where: { id },
      include: {
        logs: {
          orderBy: { startedAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!rule) {
      return new NextResponse(safeJson({ error: 'Règle non trouvée' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new NextResponse(
      safeJson({
        rule: {
          id: rule.id,
          name: rule.name,
          type: rule.type,
          status: rule.status,
          config: rule.config,
          cronExpr: rule.cronExpr,
          lastRunAt: rule.lastRunAt?.toISOString() ?? null,
          nextRunAt: rule.nextRunAt?.toISOString() ?? null,
          runCount: rule.runCount,
          failCount: rule.failCount,
          createdBy: rule.createdBy,
          createdAt: rule.createdAt.toISOString(),
          updatedAt: rule.updatedAt.toISOString(),
          logs: rule.logs.map((l) => ({
            id: l.id,
            status: l.status,
            duration: l.duration,
            recordsProcessed: l.recordsProcessed,
            message: l.message,
            error: l.error,
            startedAt: l.startedAt.toISOString(),
            completedAt: l.completedAt?.toISOString() ?? null,
          })),
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Automation rule get error:', error)
    return new NextResponse(
      safeJson({ error: 'Erreur serveur' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

// PATCH /api/automation/rules/[id] — update a rule
export async function PATCH(
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

    if (!isAdmin(session.role)) {
      return new NextResponse(safeJson({ error: 'Accès non autorisé' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { id } = await params
    const body = await request.json()
    const { name, status, config, cronExpr } = body

    const existing = await db.automationRule.findUnique({ where: { id } })
    if (!existing) {
      return new NextResponse(safeJson({ error: 'Règle non trouvée' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate config JSON if provided
    if (config !== undefined && config !== null) {
      try {
        JSON.parse(config)
      } catch {
        return new NextResponse(safeJson({ error: 'Config doit être un JSON valide' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (status !== undefined) {
      const validStatuses = ['ACTIVE', 'PAUSED', 'DISABLED']
      if (!validStatuses.includes(status)) {
        return new NextResponse(safeJson({ error: 'Statut invalide' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      updateData.status = status
    }
    if (config !== undefined) updateData.config = config || null
    if (cronExpr !== undefined) updateData.cronExpr = cronExpr || null

    const rule = await db.automationRule.update({
      where: { id },
      data: updateData,
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
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Automation rule update error:', error)
    return new NextResponse(
      safeJson({ error: 'Erreur serveur' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

// DELETE /api/automation/rules/[id] — delete a rule and its logs
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

    if (!isAdmin(session.role)) {
      return new NextResponse(safeJson({ error: 'Accès non autorisé' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { id } = await params

    const existing = await db.automationRule.findUnique({ where: { id } })
    if (!existing) {
      return new NextResponse(safeJson({ error: 'Règle non trouvée' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Logs are deleted via cascade
    await db.automationRule.delete({ where: { id } })

    return new NextResponse(
      safeJson({ success: true, message: 'Règle supprimée avec succès' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Automation rule delete error:', error)
    return new NextResponse(
      safeJson({ error: 'Erreur serveur' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
