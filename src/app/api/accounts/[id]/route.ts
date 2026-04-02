import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const account = await db.backOfficeAccount.findUnique({
      where: { id },
      include: {
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!account) {
      return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 })
    }

    return NextResponse.json(account)
  } catch (error) {
    console.error('Error fetching account:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, email, phone, enterprise, maxRequestsPerDay, maxExportsPerDay, maxExportsPerMonth } = body

    const existing = await db.backOfficeAccount.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 })
    }

    // Check email uniqueness if changing
    if (email && email !== existing.email) {
      const emailExists = await db.backOfficeAccount.findUnique({ where: { email } })
      if (emailExists) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (enterprise !== undefined) updateData.enterprise = enterprise
    if (maxRequestsPerDay !== undefined) updateData.maxRequestsPerDay = maxRequestsPerDay
    if (maxExportsPerDay !== undefined) updateData.maxExportsPerDay = maxExportsPerDay
    if (maxExportsPerMonth !== undefined) updateData.maxExportsPerMonth = maxExportsPerMonth

    const account = await db.backOfficeAccount.update({
      where: { id },
      data: updateData,
    })

    // Audit log
    await db.auditLog.create({
      data: {
        accountId: account.id,
        action: 'ACCOUNT_UPDATED',
        resource: 'BackOfficeAccount',
        resourceId: account.id,
        details: `Compte mis à jour: ${Object.keys(updateData).join(', ')}`,
      },
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error('Error updating account:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.backOfficeAccount.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 })
    }

    // Prevent deleting SUPER_ADMIN accounts (keep at least one)
    if (existing.role === 'SUPER_ADMIN') {
      const superAdminCount = await db.backOfficeAccount.count({
        where: { role: 'SUPER_ADMIN' },
      })
      if (superAdminCount <= 1) {
        return NextResponse.json(
          { error: 'Impossible de supprimer le dernier super administrateur' },
          { status: 400 }
        )
      }
    }

    // Delete audit logs first (cascade not set)
    await db.auditLog.deleteMany({ where: { accountId: id } })

    await db.backOfficeAccount.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
