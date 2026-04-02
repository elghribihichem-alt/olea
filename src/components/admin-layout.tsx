'use client'

import React, { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  MapPin,
  TrendingUp,
  Users,
  Gavel,
  AlertTriangle,
  FileBarChart,
  Shield,
  KeyRound,
  Settings,
  Wallet,
  Menu,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  LogOut,
  User,
  ChevronUp,
  Leaf,
  Smartphone,
  Brain,
  Bot,
  FileText,
  MessageSquare,
  Award,
  CalendarDays,
  Building2,
  Webhook,
} from 'lucide-react'
import { useNavigation, type PageKey } from '@/stores/navigation'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import DashboardPage from '@/components/pages/dashboard'
import AuctionsPage from '@/components/pages/auctions'
import UsersPage from '@/components/pages/users'
import MapPage from '@/components/pages/map'
import PricesPage from '@/components/pages/prices'
import DisputesPage from '@/components/pages/disputes'
import AccountsPage from '@/components/pages/accounts'
import ReportsPage from '@/components/pages/reports'
import SettingsPage from '@/components/pages/settings'
import PermissionsPage from '@/components/pages/permissions'
import MobilePreviewPage from '@/components/pages/mobile-preview'
import WalletPage from '@/components/pages/wallet'
import MarketIntelligencePage from '@/components/pages/market-intelligence'
import AutomationPage from '@/components/pages/automation'
import NotificationsPage from '@/components/pages/notifications'
import PDFReportsPage from '@/components/pages/pdf-reports'
import ChatPage from '@/components/pages/chat'
import QualityLabelsPage from '@/components/pages/quality-labels'
import CalendarPage from '@/components/pages/calendar'
import CooperativesPage from '@/components/pages/cooperatives'
import WebhooksPage from '@/components/pages/webhooks'
import LoginPage from '@/components/pages/login'
import ForgotPasswordPage from '@/components/pages/forgot-password'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

// ─── Navigation items definition ──────────────────────────────────────────────
interface NavItem {
  key: PageKey
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { key: 'map', label: 'Carte', icon: MapPin },
  { key: 'prices', label: 'Prix', icon: TrendingUp },
  { key: 'users', label: 'Utilisateurs', icon: Users },
  { key: 'auctions', label: 'Enchères', icon: Gavel },
  { key: 'disputes', label: 'Litiges', icon: AlertTriangle },
  { key: 'reports', label: 'Rapports', icon: FileBarChart },
  { key: 'accounts', label: 'Comptes', icon: Shield },
  { key: 'permissions', label: 'Permissions', icon: KeyRound },
  { key: 'settings', label: 'Paramètres', icon: Settings },
  { key: 'wallet', label: 'Portefeuille', icon: Wallet },
  { key: 'market-intelligence', label: 'Intelligence Marché', icon: Brain },
  { key: 'mobile-preview', label: 'Mobile Preview', icon: Smartphone },
  { key: 'automation', label: 'Automation', icon: Bot },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'pdf-reports', label: 'Rapports PDF', icon: FileText },
  { key: 'chat', label: 'Chat', icon: MessageSquare },
  { key: 'quality-labels', label: 'Labels Qualité', icon: Award },
  { key: 'calendar', label: 'Calendrier', icon: CalendarDays },
  { key: 'cooperatives', label: 'Coopératives', icon: Building2 },
  { key: 'webhooks', label: 'Webhooks', icon: Webhook },
]

// ─── Page title map ────────────────────────────────────────────────────────────
const pageTitles: Record<PageKey, string> = {
  login: 'Connexion',
  'forgot-password': 'Mot de passe oublié',
  dashboard: 'Tableau de bord',
  map: 'Cartographie des enchères',
  prices: 'Suivi des prix',
  users: 'Gestion des utilisateurs',
  auctions: "Gestion des enchères",
  disputes: 'Gestion des litiges',
  reports: 'Rapports & Exports',
  accounts: "Comptes d'accès",
  permissions: 'Matrice des permissions',
  settings: 'Configuration',
  wallet: 'Portefeuille',
  'market-intelligence': 'Intelligence de Marché',
  'mobile-preview': 'Aperçus Mobile',
  automation: 'Automation',
  notifications: 'Notifications',
  'pdf-reports': 'Rapports PDF',
  chat: 'Chat',
  'quality-labels': 'Labels de Qualité',
  calendar: 'Calendrier',
  cooperatives: 'Coopératives',
  webhooks: 'Webhooks',
}

// ─── Breadcrumb map ────────────────────────────────────────────────────────────
const breadcrumbs: Record<PageKey, string[]> = {
  dashboard: ['Accueil', 'Tableau de bord'],
  map: ['Accueil', 'Cartographie'],
  prices: ['Accueil', 'Suivi des prix'],
  users: ['Accueil', 'Utilisateurs'],
  auctions: ['Accueil', 'Enchères'],
  disputes: ['Accueil', 'Litiges'],
  reports: ['Accueil', 'Rapports'],
  accounts: ['Accueil', 'Comptes'],
  permissions: ['Accueil', 'Permissions'],
  settings: ['Accueil', 'Paramètres'],
  wallet: ['Accueil', 'Portefeuille'],
  'market-intelligence': ['Accueil', 'Intelligence de Marché'],
  'mobile-preview': ['Accueil', 'Mobile Preview'],
  automation: ['Accueil', 'Automation'],
  notifications: ['Accueil', 'Notifications'],
  'pdf-reports': ['Accueil', 'Rapports PDF'],
  chat: ['Accueil', 'Chat'],
  'quality-labels': ['Accueil', 'Labels de Qualité'],
  calendar: ['Accueil', 'Calendrier'],
  cooperatives: ['Accueil', 'Coopératives'],
  webhooks: ['Accueil', 'Webhooks'],
}

// ─── Sidebar Nav Item ──────────────────────────────────────────────────────────
function SidebarNavItem({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
  onClick: () => void
}) {
  const Icon = item.icon

  const button = (
    <button
      onClick={onClick}
      className={`
        group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5
        text-sm font-medium transition-all duration-200
        ${
          active
            ? 'bg-[#2d5a2d] text-white shadow-sm'
            : 'text-[#a8c8a8] hover:bg-[#223d22] hover:text-white'
        }
        ${collapsed ? 'justify-center px-2' : ''}
      `}
    >
      <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-[#7dda7d]' : 'text-[#6dba6d] group-hover:text-[#7dda7d]'}`} />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {active && !collapsed && (
        <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#45A452]" />
      )}
    </button>
  )

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return button
}

// ─── Sidebar Content (shared between desktop & mobile) ─────────────────────────
function SidebarContent({
  collapsed,
  currentPage,
  onNavigate,
  onClose,
}: {
  collapsed: boolean
  currentPage: PageKey
  onNavigate: (page: PageKey) => void
  onClose?: () => void
}) {
  return (
    <div className="sidebar-dark flex h-full flex-col bg-[#0d1a0e]">
      {/* Logo */}
      <div className={`flex h-16 items-center gap-3 px-4 border-b border-[#1a3d1e] ${collapsed ? 'justify-center px-2' : ''}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#45A452]">
          <Leaf className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-white">EnchèreSolive</span>
            <span className="text-[10px] text-[#6dba6d]">Back-Office</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.key}
              item={item}
              active={currentPage === item.key}
              collapsed={collapsed}
              onClick={() => {
                onNavigate(item.key)
                onClose?.()
              }}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <Separator className="bg-[#1a3d1e]" />
      <div className="p-3">
        <div className={`flex items-center gap-3 rounded-lg px-3 py-2 ${collapsed ? 'justify-center' : ''}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a3d1e]">
            <span className="text-xs font-bold text-[#45A452]">AD</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-white">Admin</span>
              <span className="truncate text-[11px] text-[#6dba6d]">admin@encheresolive.tn</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Desktop Sidebar ───────────────────────────────────────────────────────────
function DesktopSidebar({
  open,
  currentPage,
  onNavigate,
  onToggle,
}: {
  open: boolean
  currentPage: PageKey
  onNavigate: (page: PageKey) => void
  onToggle: () => void
}) {
  return (
    <aside
      className={`fixed left-0 top-0 z-30 hidden h-[100dvh] flex-col transition-all duration-300 ease-in-out md:flex ${
        open ? 'w-[280px]' : 'w-[68px]'
      }`}
    >
      <SidebarContent
        collapsed={!open}
        currentPage={currentPage}
        onNavigate={onNavigate}
      />
      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-[#1a3d1e] bg-[#142c16] text-[#6dba6d] shadow-sm transition-colors hover:bg-[#1a3d1e] hover:text-white"
      >
        {open ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
    </aside>
  )
}

// ─── Mobile Sidebar (Sheet) ───────────────────────────────────────────────────
function MobileSidebar({
  isOpen,
  currentPage,
  onNavigate,
  onClose,
}: {
  isOpen: boolean
  currentPage: PageKey
  onNavigate: (page: PageKey) => void
  onClose: () => void
}) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <SidebarContent
          collapsed={false}
          currentPage={currentPage}
          onNavigate={onNavigate}
          onClose={onClose}
        />
      </SheetContent>
    </Sheet>
  )
}

// ─── Top Header ────────────────────────────────────────────────────────────────
function TopHeader({ currentPage }: { currentPage: PageKey }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { sidebarOpen, setSidebarOpen, setCurrentPage } = useNavigation()
  const [unreadCount, setUnreadCount] = useState(0)
  const [recentNotifications, setRecentNotifications] = useState<Array<{
    id: string
    title: string
    message: string
    type: string
    isRead: boolean
    createdAt: string
  }>>([])

  // Fetch unread count and recent notifications
  useEffect(() => {
    if (currentPage === 'login' || currentPage === 'forgot-password') return

    const fetchNotificationData = async () => {
      try {
        const [countRes, notifsRes] = await Promise.all([
          fetch('/api/notifications/unread-count'),
          fetch('/api/notifications?limit=5'),
        ])

        if (countRes.ok) {
          const countData = await countRes.json()
          setUnreadCount(countData.count || 0)
        }

        if (notifsRes.ok) {
          const notifsData = await notifsRes.json()
          setRecentNotifications(notifsData.notifications || [])
        }
      } catch {
        // Silently fail
      }
    }

    fetchNotificationData()

    // Poll every 30 seconds
    const interval = setInterval(fetchNotificationData, 30000)
    return () => clearInterval(interval)
  }, [currentPage])

  return (
    <>
      {/* Mobile menu trigger — hidden on auth pages */}
      {currentPage !== 'login' && currentPage !== 'forgot-password' && (
        <MobileSidebar
          isOpen={mobileMenuOpen}
          currentPage={currentPage}
          onNavigate={() => setMobileMenuOpen(false)}
          onClose={() => setMobileMenuOpen(false)}
        />
      )}

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-white px-4 md:px-6">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>

          {/* Desktop sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Basculer le menu</span>
          </Button>

          {/* Breadcrumb & Title */}
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {breadcrumbs[currentPage].map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronUp className="h-3 w-3 rotate-90" />}
                  <span className={idx === breadcrumbs[currentPage].length - 1 ? 'text-foreground font-medium' : ''}>
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              {pageTitles[currentPage]}
            </h1>
          </div>

          {/* Mobile title only */}
          <h1 className="text-base font-semibold sm:hidden">
            {pageTitles[currentPage]}
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Search (hidden on small screens) */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="h-9 w-[220px] rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#45A452]/30 focus:border-[#45A452]"
            />
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full bg-[#45A452] px-1 text-[10px] font-bold text-white">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {recentNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <span className="text-xs text-muted-foreground">Aucune notification</span>
                </div>
              ) : (
                recentNotifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex flex-col items-start gap-1 py-3 px-3 ${!notification.isRead ? 'bg-[#f0f7f0]/50' : ''}`}
                    onClick={() => setCurrentPage('notifications')}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {!notification.isRead && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#45A452]" />
                      )}
                      <span className={`text-sm truncate ${!notification.isRead ? 'font-semibold' : 'font-medium'}`}>
                        {notification.title}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground pl-4">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: fr })}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="justify-center text-[#45A452] text-sm font-medium"
                onClick={() => setCurrentPage('notifications')}
              >
                Voir toutes les notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-[#45A452] text-sm font-bold text-white">
                    AD
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">Administrateur</p>
                  <p className="text-xs text-muted-foreground">admin@encheresolive.tn</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Mon profil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  )
}

// ─── Page Content Router ─────────────────────────────────────────────────────
function PageContent({ page }: { page: PageKey }) {
  // Dynamic imports for lazy loading
  const title = pageTitles[page]
  const Icon = navItems.find((n) => n.key === page)?.icon || LayoutDashboard

  // Auth pages: no sidebar needed
  if (page === 'login') {
    return <LoginPage />
  }
  if (page === 'forgot-password') {
    return <ForgotPasswordPage />
  }

  // All other pages are protected
  if (page === 'dashboard') {
    return <DashboardPage />
  }
  if (page === 'auctions') {
    return <AuctionsPage />
  }
  if (page === 'users') {
    return <UsersPage />
  }
  if (page === 'map') {
    return <MapPage />
  }
  if (page === 'prices') {
    return <PricesPage />
  }
  if (page === 'disputes') {
    return <DisputesPage />
  }
  if (page === 'accounts') {
    return <AccountsPage />
  }
  if (page === 'reports') {
    return <ReportsPage />
  }
  if (page === 'settings') {
    return <SettingsPage />
  }
  if (page === 'wallet') {
    return <WalletPage />
  }
  if (page === 'permissions') {
    return <PermissionsPage />
  }
  if (page === 'market-intelligence') {
    return <MarketIntelligencePage />
  }
  if (page === 'mobile-preview') {
    return <MobilePreviewPage />
  }
  if (page === 'automation') {
    return <AutomationPage />
  }
  if (page === 'notifications') {
    return <NotificationsPage />
  }
  if (page === 'pdf-reports') {
    return <PDFReportsPage />
  }
  if (page === 'chat') {
    return <ChatPage />
  }
  if (page === 'quality-labels') {
    return <QualityLabelsPage />
  }
  if (page === 'calendar') {
    return <CalendarPage />
  }
  if (page === 'cooperatives') {
    return <CooperativesPage />
  }
  if (page === 'webhooks') {
    return <WebhooksPage />
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#45A452]/10">
        <Icon className="h-8 w-8 text-[#45A452]" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cette page est en cours de développement.
        </p>
      </div>
    </div>
  )
}

// ─── Main AdminLayout ──────────────────────────────────────────────────────────
export default function AdminLayout() {
  const { currentPage, sidebarOpen, setCurrentPage, toggleSidebar, setSidebarOpen } = useNavigation()
  const [isDesktop, setIsDesktop] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const { isAuthenticated, checkSession } = useAuthStore()

  // Check session on mount
  useEffect(() => {
    checkSession().then(() => setAuthChecked(true))
  }, [checkSession])

  // Redirect to login if not authenticated (after check)
  useEffect(() => {
    if (authChecked && !isAuthenticated && currentPage !== 'login' && currentPage !== 'forgot-password') {
      setCurrentPage('login')
    }
  }, [authChecked, isAuthenticated, currentPage, setCurrentPage])

  // Track viewport width for responsive behavior
  useEffect(() => {
    const checkWidth = () => {
      const width = window.innerWidth
      setIsDesktop(width >= 768)
      // Auto-collapse on tablet, expand on desktop
      if (width >= 1024) {
        setSidebarOpen(true)
      } else if (width >= 768) {
        setSidebarOpen(false)
      }
    }

    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [setSidebarOpen])

  // Show loading spinner while checking session
  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f0f7f0]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#45A452] border-t-transparent" />
          <span className="text-sm text-muted-foreground">Chargement...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#f0f7f0]">
      {/* Desktop sidebar — hidden on auth pages */}
      {isDesktop && currentPage !== 'login' && currentPage !== 'forgot-password' && (
        <DesktopSidebar
          open={sidebarOpen}
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          onToggle={toggleSidebar}
        />
      )}

      {/* Main content area */}
      <div
        className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${
          isDesktop ? (sidebarOpen ? 'md:ml-[280px]' : 'md:ml-[68px]') : ''
        }`}
      >
        {currentPage !== 'login' && currentPage !== 'forgot-password' && <TopHeader currentPage={currentPage} />}

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <PageContent page={currentPage} />
        </main>
      </div>
    </div>
  )
}
