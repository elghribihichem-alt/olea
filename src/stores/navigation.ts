import { create } from 'zustand'

export type PageKey =
  | 'login'
  | 'forgot-password'
  | 'dashboard'
  | 'auctions'
  | 'users'
  | 'map'
  | 'prices'
  | 'disputes'
  | 'reports'
  | 'accounts'
  | 'permissions'
  | 'settings'
  | 'wallet'
  | 'mobile-preview'
  | 'market-intelligence'
  | 'notifications'
  | 'automation'
  | 'pdf-reports'
  | 'chat'
  | 'quality-labels'
  | 'calendar'
  | 'cooperatives'
  | 'webhooks'

interface NavigationState {
  currentPage: PageKey
  sidebarOpen: boolean
  setCurrentPage: (page: PageKey) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useNavigation = create<NavigationState>((set) => ({
  currentPage: 'dashboard',
  sidebarOpen: true,
  setCurrentPage: (page) => set({ currentPage: page }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))

// Alias for backward compatibility
export const useNavigationStore = useNavigation
