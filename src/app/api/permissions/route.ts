import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── Default Permission Matrix ──────────────────────────────────────────────
const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  SUPER_ADMIN: {
    dashboard_view: true,
    auctions_view: true,
    auctions_create: true,
    auctions_edit: true,
    auctions_delete: true,
    auctions_publish: true,
    auctions_close: true,
    users_view: true,
    users_edit: true,
    users_suspend: true,
    users_delete: true,
    reports_view: true,
    reports_export: true,
    reports_analytics: true,
    disputes_view: true,
    disputes_resolve: true,
    disputes_escalate: true,
    accounts_view: true,
    accounts_create: true,
    accounts_edit: true,
    accounts_delete: true,
    settings_view: true,
    settings_edit: true,
    permissions_view: true,
    permissions_edit: true,
    map_view: true,
    prices_view: true,
  },
  ADMIN: {
    dashboard_view: true,
    auctions_view: true,
    auctions_create: true,
    auctions_edit: true,
    auctions_delete: false,
    auctions_publish: true,
    auctions_close: true,
    users_view: true,
    users_edit: true,
    users_suspend: true,
    users_delete: false,
    reports_view: true,
    reports_export: true,
    reports_analytics: true,
    disputes_view: true,
    disputes_resolve: true,
    disputes_escalate: false,
    accounts_view: true,
    accounts_create: true,
    accounts_edit: true,
    accounts_delete: false,
    settings_view: true,
    settings_edit: false,
    permissions_view: true,
    permissions_edit: false,
    map_view: true,
    prices_view: true,
  },
  ANALYST: {
    dashboard_view: true,
    auctions_view: true,
    auctions_create: false,
    auctions_edit: false,
    auctions_delete: false,
    auctions_publish: false,
    auctions_close: false,
    users_view: true,
    users_edit: false,
    users_suspend: false,
    users_delete: false,
    reports_view: true,
    reports_export: true,
    reports_analytics: true,
    disputes_view: true,
    disputes_resolve: false,
    disputes_escalate: false,
    accounts_view: false,
    accounts_create: false,
    accounts_edit: false,
    accounts_delete: false,
    settings_view: false,
    settings_edit: false,
    permissions_view: true,
    permissions_edit: false,
    map_view: true,
    prices_view: true,
  },
  VIEWER: {
    dashboard_view: true,
    auctions_view: true,
    auctions_create: false,
    auctions_edit: false,
    auctions_delete: false,
    auctions_publish: false,
    auctions_close: false,
    users_view: true,
    users_edit: false,
    users_suspend: false,
    users_delete: false,
    reports_view: true,
    reports_export: false,
    reports_analytics: false,
    disputes_view: true,
    disputes_resolve: false,
    disputes_escalate: false,
    accounts_view: false,
    accounts_create: false,
    accounts_edit: false,
    accounts_delete: false,
    settings_view: false,
    settings_edit: false,
    permissions_view: false,
    permissions_edit: false,
    map_view: true,
    prices_view: true,
  },
  CUSTOM: {
    dashboard_view: true,
    auctions_view: true,
    auctions_create: false,
    auctions_edit: false,
    auctions_delete: false,
    auctions_publish: false,
    auctions_close: false,
    users_view: false,
    users_edit: false,
    users_suspend: false,
    users_delete: false,
    reports_view: false,
    reports_export: false,
    reports_analytics: false,
    disputes_view: false,
    disputes_resolve: false,
    disputes_escalate: false,
    accounts_view: false,
    accounts_create: false,
    accounts_edit: false,
    accounts_delete: false,
    settings_view: false,
    settings_edit: false,
    permissions_view: false,
    permissions_edit: false,
    map_view: true,
    prices_view: true,
  },
}

// Permission group definitions
const PERMISSION_GROUPS = [
  {
    key: 'dashboard',
    label: 'Tableau de bord',
    icon: 'LayoutDashboard',
    permissions: [
      { key: 'dashboard_view', label: 'Voir le dashboard' },
    ],
  },
  {
    key: 'auctions',
    label: 'Enchères',
    icon: 'Gavel',
    permissions: [
      { key: 'auctions_view', label: 'Voir les enchères' },
      { key: 'auctions_create', label: 'Créer une enchère' },
      { key: 'auctions_edit', label: 'Modifier une enchère' },
      { key: 'auctions_delete', label: 'Supprimer une enchère' },
      { key: 'auctions_publish', label: 'Publier une enchère' },
      { key: 'auctions_close', label: 'Clôturer une enchère' },
    ],
  },
  {
    key: 'users',
    label: 'Utilisateurs',
    icon: 'Users',
    permissions: [
      { key: 'users_view', label: 'Voir les utilisateurs' },
      { key: 'users_edit', label: 'Modifier un utilisateur' },
      { key: 'users_suspend', label: 'Suspendre un utilisateur' },
      { key: 'users_delete', label: 'Supprimer un utilisateur' },
    ],
  },
  {
    key: 'reports',
    label: 'Rapports',
    icon: 'FileBarChart',
    permissions: [
      { key: 'reports_view', label: 'Voir les rapports' },
      { key: 'reports_export', label: 'Exporter des données' },
      { key: 'reports_analytics', label: 'Accéder aux analytics' },
    ],
  },
  {
    key: 'disputes',
    label: 'Litiges',
    icon: 'AlertTriangle',
    permissions: [
      { key: 'disputes_view', label: 'Voir les litiges' },
      { key: 'disputes_resolve', label: 'Résoudre un litige' },
      { key: 'disputes_escalate', label: 'Escalader un litige' },
    ],
  },
  {
    key: 'accounts',
    label: 'Comptes Back-Office',
    icon: 'Shield',
    permissions: [
      { key: 'accounts_view', label: 'Voir les comptes' },
      { key: 'accounts_create', label: 'Créer un compte' },
      { key: 'accounts_edit', label: 'Modifier un compte' },
      { key: 'accounts_delete', label: 'Supprimer un compte' },
    ],
  },
  {
    key: 'settings',
    label: 'Paramètres',
    icon: 'Settings',
    permissions: [
      { key: 'settings_view', label: 'Voir les paramètres' },
      { key: 'settings_edit', label: 'Modifier les paramètres' },
    ],
  },
  {
    key: 'permissions',
    label: 'Permissions',
    icon: 'KeyRound',
    permissions: [
      { key: 'permissions_view', label: 'Voir la matrice' },
      { key: 'permissions_edit', label: 'Modifier les permissions' },
    ],
  },
  {
    key: 'other',
    label: 'Autres',
    icon: 'Map',
    permissions: [
      { key: 'map_view', label: 'Voir la carte' },
      { key: 'prices_view', label: 'Voir les prix' },
    ],
  },
]

export async function GET() {
  try {
    // Get accounts with custom permissions
    const accounts = await db.backOfficeAccount.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        customPermissions: true,
        status: true,
      },
      orderBy: { role: 'asc' },
    })

    // Parse custom permissions for each account
    const parsedAccounts = accounts.map((acc) => {
      let customPerms: Record<string, boolean> | null = null
      if (acc.customPermissions) {
        try {
          customPerms = JSON.parse(acc.customPermissions)
        } catch {
          customPerms = null
        }
      }

      // Effective permissions = custom if set, else default for role
      const effectivePermissions = customPerms || DEFAULT_PERMISSIONS[acc.role] || DEFAULT_PERMISSIONS.VIEWER

      return {
        ...acc,
        customPermissionsParsed: customPerms,
        effectivePermissions,
      }
    })

    return NextResponse.json({
      matrix: DEFAULT_PERMISSIONS,
      groups: PERMISSION_GROUPS,
      roles: Object.keys(DEFAULT_PERMISSIONS),
      accounts: parsedAccounts,
      totalPermissions: PERMISSION_GROUPS.reduce((sum, g) => sum + g.permissions.length, 0),
    })
  } catch (error) {
    console.error('Permissions fetch error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { role, permissions } = await req.json()

    if (!role || !permissions || typeof permissions !== 'object') {
      return NextResponse.json({ error: 'Rôle et permissions requis' }, { status: 400 })
    }

    if (role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Les permissions du Super Admin ne peuvent pas être modifiées' },
        { status: 403 }
      )
    }

    if (!DEFAULT_PERMISSIONS[role]) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }

    // Validate all permission keys
    const allValidKeys = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key))
    for (const key of Object.keys(permissions)) {
      if (!allValidKeys.includes(key)) {
        return NextResponse.json({ error: `Permission invalide: ${key}` }, { status: 400 })
      }
    }

    // Update all accounts with this role
    const updated = await db.backOfficeAccount.updateMany({
      where: { role },
      data: {
        customPermissions: JSON.stringify(permissions),
      },
    })

    // Update default matrix in memory (for display purposes)
    DEFAULT_PERMISSIONS[role] = permissions

    return NextResponse.json({
      success: true,
      updated: updated.count,
      role,
      permissions,
    })
  } catch (error) {
    console.error('Permissions update error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { accountId, permissions } = await req.json()

    if (!accountId || !permissions || typeof permissions !== 'object') {
      return NextResponse.json({ error: 'accountId et permissions requis' }, { status: 400 })
    }

    const account = await db.backOfficeAccount.findUnique({
      where: { id: accountId },
      select: { id: true, role: true },
    })

    if (!account) {
      return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 })
    }

    if (account.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Les permissions du Super Admin ne peuvent pas être modifiées' },
        { status: 403 }
      )
    }

    const updated = await db.backOfficeAccount.update({
      where: { id: accountId },
      data: {
        customPermissions: JSON.stringify(permissions),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Account permissions update error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
