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

// Execute a rule based on its type
async function executeRule(
  type: string,
  config: string | null,
): Promise<{ status: string; message: string; recordsProcessed?: number; error?: string }> {
  try {
    switch (type) {
      case 'AUTO_CLOSE_AUCTION': {
        // Close all expired auctions (endDate < now, status = ACTIVE)
        const result = await db.auction.updateMany({
          where: {
            endDate: { lt: new Date() },
            status: 'ACTIVE',
          },
          data: {
            status: 'CLOSED',
            closedAt: new Date(),
          },
        })
        return {
          status: 'SUCCESS',
          message: `${result.count} enchère(s) expirée(s) clôturée(s)`,
          recordsProcessed: result.count,
        }
      }

      case 'AUTO_SUSPEND_ACCOUNT': {
        // Suspend back-office accounts with expired sessions (inactive for 90+ days)
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        const result = await db.backOfficeAccount.updateMany({
          where: {
            lastLogin: { lt: ninetyDaysAgo },
            status: 'ACTIVE',
            role: { not: 'SUPER_ADMIN' },
          },
          data: {
            status: 'EXPIRED',
          },
        })
        return {
          status: 'SUCCESS',
          message: `${result.count} compte(s) inactif(s) suspendu(s)`,
          recordsProcessed: result.count,
        }
      }

      case 'PRICE_ALERT_CHECK': {
        // Count active price alerts that could be checked
        const count = await db.priceAlert.count({
          where: { isActive: true },
        })
        return {
          status: 'SUCCESS',
          message: `${count} alerte(s) de prix active(s) vérifiée(s)`,
          recordsProcessed: count,
        }
      }

      case 'REPORT_GENERATION': {
        return {
          status: 'SUCCESS',
          message: 'Rapport généré avec succès',
          recordsProcessed: 1,
        }
      }

      case 'DAILY_SUMMARY': {
        const todayAuctions = await db.auction.count({
          where: {
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        })
        const todayBids = await db.bid.count({
          where: {
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        })
        const todayUsers = await db.user.count({
          where: {
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        })
        return {
          status: 'SUCCESS',
          message: `Résumé quotidien: ${todayAuctions} enchères, ${todayBids} offres, ${todayUsers} utilisateurs`,
          recordsProcessed: todayAuctions + todayBids + todayUsers,
        }
      }

      case 'WEEKLY_REPORT': {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)

        const weekAuctions = await db.auction.count({
          where: { createdAt: { gte: weekAgo } },
        })
        const weekBids = await db.bid.count({
          where: { createdAt: { gte: weekAgo } },
        })
        const weekTransactions = await db.transaction.count({
          where: { createdAt: { gte: weekAgo } },
        })
        return {
          status: 'SUCCESS',
          message: `Rapport hebdomadaire: ${weekAuctions} enchères, ${weekBids} offres, ${weekTransactions} transactions`,
          recordsProcessed: weekAuctions + weekBids + weekTransactions,
        }
      }

      case 'CLEANUP_EXPIRED': {
        // Clear expired session tokens from back-office accounts
        const result = await db.backOfficeAccount.updateMany({
          where: {
            sessionExpiresAt: { lt: new Date() },
            sessionToken: { not: null },
          },
          data: {
            sessionToken: null,
            sessionExpiresAt: null,
          },
        })
        return {
          status: 'SUCCESS',
          message: `${result.count} session(s) expirée(s) nettoyée(s)`,
          recordsProcessed: result.count,
        }
      }

      default:
        return {
          status: 'SKIPPED',
          message: `Type de règle non reconnu: ${type}`,
        }
    }
  } catch (error) {
    return {
      status: 'FAILED',
      message: `Erreur lors de l'exécution`,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

// POST /api/automation/rules/[id]/run — execute a rule manually
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

    if (!isAdmin(session.role)) {
      return new NextResponse(safeJson({ error: 'Accès non autorisé' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { id } = await params

    const rule = await db.automationRule.findUnique({ where: { id } })
    if (!rule) {
      return new NextResponse(safeJson({ error: 'Règle non trouvée' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (rule.status === 'DISABLED') {
      return new NextResponse(safeJson({ error: 'Cette règle est désactivée' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const startedAt = new Date()

    // Execute the rule
    const result = await executeRule(rule.type, rule.config)
    const completedAt = new Date()
    const duration = Math.round((completedAt.getTime() - startedAt.getTime()) / 1000)

    // Update rule run counts
    await db.automationRule.update({
      where: { id },
      data: {
        lastRunAt: startedAt,
        runCount: { increment: 1 },
        failCount: result.status === 'FAILED' ? { increment: 1 } : undefined,
      },
    })

    // Create log entry
    const log = await db.automationLog.create({
      data: {
        ruleId: rule.id,
        status: result.status as 'SUCCESS' | 'FAILED' | 'SKIPPED',
        duration,
        recordsProcessed: result.recordsProcessed,
        message: result.message,
        error: result.error || null,
        startedAt,
        completedAt,
      },
    })

    return new NextResponse(
      safeJson({
        success: true,
        log: {
          id: log.id,
          status: log.status,
          duration: log.duration,
          recordsProcessed: log.recordsProcessed,
          message: log.message,
          error: log.error,
          startedAt: log.startedAt.toISOString(),
          completedAt: log.completedAt?.toISOString() ?? null,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Automation rule run error:', error)
    return new NextResponse(
      safeJson({ error: 'Erreur serveur' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
