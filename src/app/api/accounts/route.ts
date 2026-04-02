import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const role = searchParams.get('role') || 'ALL'
    const status = searchParams.get('status') || 'ALL'
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {}
    if (role !== 'ALL') where.role = role
    if (status !== 'ALL') where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { enterprise: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const [accounts, total] = await Promise.all([
      db.backOfficeAccount.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { auditLogs: true } },
        },
      }),
      db.backOfficeAccount.count({ where }),
    ])

    // Stats
    const [activeCount, suspendedCount, pendingCount, expiredCount, thisMonthCount] = await Promise.all([
      db.backOfficeAccount.count({ where: { status: 'ACTIVE' } }),
      db.backOfficeAccount.count({ where: { status: 'SUSPENDED' } }),
      db.backOfficeAccount.count({ where: { status: 'PENDING' } }),
      db.backOfficeAccount.count({ where: { status: 'EXPIRED' } }),
      db.backOfficeAccount.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ])

    return NextResponse.json({
      accounts,
      stats: {
        total,
        active: activeCount,
        suspended: suspendedCount,
        pending: pendingCount,
        expired: expiredCount,
        thisMonth: thisMonthCount,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name, phone, enterprise, role, subscriptionType } = body

    if (!email || !name || !phone || !role) {
      return NextResponse.json(
        { error: 'Email, nom, téléphone et rôle sont requis' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existing = await db.backOfficeAccount.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 })
    }

    // Set subscription dates
    let subscriptionStart: Date | null = null
    let subscriptionEnd: Date | null = null
    if (subscriptionType && subscriptionType !== 'PERMANENT') {
      subscriptionStart = new Date()
      subscriptionEnd = new Date()
      if (subscriptionType === 'MONTHLY') {
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1)
      } else if (subscriptionType === 'YEARLY') {
        subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1)
      }
    }

    const account = await db.backOfficeAccount.create({
      data: {
        email,
        name,
        phone,
        enterprise: enterprise || null,
        role,
        status: 'ACTIVE',
        subscriptionType: subscriptionType || null,
        subscriptionStart,
        subscriptionEnd,
        maxRequestsPerDay: 1000,
        maxExportsPerDay: 50,
        maxExportsPerMonth: 500,
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        accountId: account.id,
        action: 'ACCOUNT_CREATED',
        resource: 'BackOfficeAccount',
        resourceId: account.id,
        details: `Compte créé: ${email} avec rôle ${role}`,
      },
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
