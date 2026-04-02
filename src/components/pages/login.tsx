'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { Leaf, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth'
import { useNavigationStore } from '@/stores/navigation'

// ─── Decorative Left Panel (shared visual) ─────────────────────────────────────
function DecorativePanel() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#45A452] to-[#1F6E2B] px-12">
      {/* Background decorative shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Large translucent circles */}
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-white/[0.03]" />
        <div className="absolute left-1/3 top-1/4 h-64 w-64 rounded-full bg-white/[0.04]" />

        {/* Decorative olive branch SVG — top-right */}
        <svg
          className="absolute right-12 top-16 opacity-20"
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
        >
          <ellipse cx="60" cy="60" rx="50" ry="50" stroke="white" strokeWidth="1.5" />
          <ellipse cx="60" cy="60" rx="35" ry="35" stroke="white" strokeWidth="1" />
          <ellipse cx="60" cy="60" rx="20" ry="20" stroke="white" strokeWidth="0.8" />
          <circle cx="60" cy="60" r="5" fill="white" opacity="0.5" />
        </svg>

        {/* Decorative olive branch SVG — bottom-left */}
        <svg
          className="absolute bottom-20 left-8 opacity-15"
          width="100"
          height="160"
          viewBox="0 0 100 160"
          fill="none"
        >
          <path
            d="M50 10 Q50 80 50 150"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Leaves */}
          <ellipse cx="38" cy="45" rx="12" ry="6" fill="white" opacity="0.3" transform="rotate(-30 38 45)" />
          <ellipse cx="62" cy="65" rx="12" ry="6" fill="white" opacity="0.3" transform="rotate(30 62 65)" />
          <ellipse cx="38" cy="85" rx="12" ry="6" fill="white" opacity="0.3" transform="rotate(-30 38 85)" />
          <ellipse cx="62" cy="105" rx="12" ry="6" fill="white" opacity="0.3" transform="rotate(30 62 105)" />
          <ellipse cx="42" cy="125" rx="10" ry="5" fill="white" opacity="0.3" transform="rotate(-25 42 125)" />
          {/* Olives */}
          <circle cx="50" cy="55" r="5" fill="white" opacity="0.25" />
          <circle cx="50" cy="95" r="5" fill="white" opacity="0.25" />
          <circle cx="50" cy="135" r="5" fill="white" opacity="0.25" />
        </svg>

        {/* Floating dots pattern */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: `${3 + Math.random() * 5}px`,
              height: `${3 + Math.random() * 5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Main brand content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Leaf icon */}
        <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
          <Leaf className="h-14 w-14 text-white" strokeWidth={1.5} />
        </div>

        {/* Brand name */}
        <h1 className="text-6xl font-extrabold tracking-tight text-white drop-shadow-lg">
          OLEA
        </h1>

        {/* Tagline */}
        <p className="mt-4 max-w-xs text-lg leading-relaxed text-white/80">
          Plateforme de vente aux enchères d&apos;huile d&apos;olive tunisienne
        </p>

        {/* Decorative divider */}
        <div className="mt-8 flex items-center gap-3">
          <span className="h-px w-12 bg-white/30" />
          <span className="h-2 w-2 rounded-full bg-white/40" />
          <span className="h-px w-12 bg-white/30" />
        </div>

        {/* Trust indicators */}
        <div className="mt-6 flex flex-col items-center gap-2 text-sm text-white/60">
          <span>🌱 Commerce équitable tunisien</span>
          <span>🛡️ Transactions sécurisées</span>
        </div>
      </div>
    </div>
  )
}

// ─── Login Page ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const setCurrentPage = useNavigationStore((s) => s.setCurrentPage)
  const { login, isLoading, isAuthenticated, error, clearError } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setCurrentPage('dashboard' as any)
    }
  }, [isAuthenticated, setCurrentPage])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError?.()
    try {
      await login(email, password)
      setCurrentPage('dashboard' as any)
    } catch {
      // error is set in the store
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F0FDF4]">
      {/* ── Left Panel (hidden on mobile) ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2">
        <DecorativePanel />
      </div>

      {/* ── Right Panel ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-12">
        <Card className="w-full max-w-md border-0 bg-white/80 shadow-xl shadow-[#45A452]/5 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            {/* Mobile-only logo (shown when left panel is hidden) */}
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#45A452]">
                <Leaf className="h-5 w-5 text-white" />
              </div>
            </div>

            {/* Brand */}
            <div className="flex items-center justify-center gap-2">
              <Leaf className="h-6 w-6 text-[#45A452]" />
              <span className="text-2xl font-bold text-[#1F6E2B]">Olea</span>
            </div>

            <div className="pt-4 text-center">
              <h2 className="text-xl font-semibold tracking-tight text-gray-900">
                Connexion Back-Office
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Accédez à votre espace de gestion
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error banner */}
              {error && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Adresse email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nom@olea.tn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 pl-10 border-gray-200 bg-gray-50/50 focus-visible:border-[#45A452] focus-visible:ring-[#45A452]/20 focus-visible:bg-white transition-colors"
                    required
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pl-10 pr-10 border-gray-200 bg-gray-50/50 focus-visible:border-[#45A452] focus-visible:ring-[#45A452]/20 focus-visible:bg-white transition-colors"
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="data-[state=checked]:bg-[#45A452] data-[state=checked]:border-[#45A452]"
                  disabled={isLoading}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm text-gray-600 cursor-pointer select-none"
                >
                  Se souvenir de moi
                </Label>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full bg-[#45A452] text-white font-semibold shadow-md shadow-[#45A452]/20 hover:bg-[#1F6E2B] hover:shadow-lg hover:shadow-[#1F6E2B]/20 focus-visible:ring-[#45A452]/30 active:bg-[#185A22] transition-all duration-200 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connexion en cours…
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>

            {/* Forgot password */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setCurrentPage('forgot-password')}
                className="text-sm font-medium text-[#45A452] hover:text-[#1F6E2B] transition-colors cursor-pointer"
              >
                Mot de passe oublié ?
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-400">
          © 2026 Olea — Tous droits réservés
        </p>
      </div>
    </div>
  )
}
