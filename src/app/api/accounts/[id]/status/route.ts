import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status } = await req.json()

    const validStatuses = ['ACTIVE', 'SUSPENDED', 'PENDING', 'EXPIRED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }

    const existing = await db.backOfficeAccount.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 })
    }

    const account = await db.backOfficeAccount.update({
      where: { id },
      data: { status },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        accountId: account.id,
        action: 'STATUS_CHANGED',
        resource: 'BackOfficeAccount',
        resourceId: account.id,
        details: `Statut changé de ${existing.status} à ${status}`,
      },
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error('Error changing account status:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
