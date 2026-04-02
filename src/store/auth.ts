import { create } from 'zustand'

interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  status: string
  enterprise: string | null
  phone: string | null
  avatar: string | null
  loginCount: number
  lastLogin: string | null
  emailVerified: boolean
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkSession: () => Promise<boolean>
  forgotPassword: (email: string) => Promise<boolean>
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<boolean>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string): Promise<boolean> => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        set({ isLoading: false, error: data.error || data.message || 'Login failed' })
        return false
      }

      const data = await res.json()
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      set({ isLoading: false, error: message })
      return false
    }
  },

  logout: async (): Promise<void> => {
    set({ isLoading: true, error: null })
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Proceed with local cleanup even if the request fails
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  checkSession: async (): Promise<boolean> => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/auth/me')

      if (!res.ok) {
        set({ user: null, isAuthenticated: false, isLoading: false })
        return false
      }

      const data = await res.json()
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check session'
      set({ user: null, isAuthenticated: false, isLoading: false, error: message })
      return false
    }
  },

  forgotPassword: async (email: string): Promise<boolean> => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        set({ isLoading: false, error: data.message || 'Failed to send reset email' })
        return false
      }

      set({ isLoading: false })
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      set({ isLoading: false, error: message })
      return false
    }
  },

  resetPassword: async (email: string, otp: string, newPassword: string): Promise<boolean> => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      })

      if (!res.ok) {
        const data = await res.json()
        set({ isLoading: false, error: data.message || 'Failed to reset password' })
        return false
      }

      set({ isLoading: false })
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      set({ isLoading: false, error: message })
      return false
    }
  },

  clearError: (): void => {
    set({ error: null })
  },
}))
