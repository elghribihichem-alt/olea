import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { role } = await req.json()

    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'ANALYST', 'VIEWER', 'CUSTOM']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }

    const existing = await db.backOfficeAccount.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 })
    }

    const account = await db.backOfficeAccount.update({
      where: { id },
      data: { role },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        accountId: account.id,
        action: 'ROLE_CHANGED',
        resource: 'BackOfficeAccount',
        resourceId: account.id,
        details: `Rôle changé de ${existing.role} à ${role}`,
      },
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error('Error changing account role:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
