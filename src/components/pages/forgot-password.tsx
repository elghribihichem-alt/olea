'use client'

import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react'
import { Leaf, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2, KeyRound, ShieldCheck, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useNavigationStore } from '@/stores/navigation'
import { AnimatePresence, motion } from 'framer-motion'

// ─── Decorative Left Panel (shared visual) ─────────────────────────────────────
function DecorativePanel() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#45A452] to-[#1F6E2B] px-12">
      {/* Background decorative shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-white/[0.03]" />
        <div className="absolute left-1/3 top-1/4 h-64 w-64 rounded-full bg-white/[0.04]" />

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
          <ellipse cx="38" cy="45" rx="12" ry="6" fill="white" opacity="0.3" transform="rotate(-30 38 45)" />
          <ellipse cx="62" cy="65" rx="12" ry="6" fill="white" opacity="0.3" transform="rotate(30 62 65)" />
          <ellipse cx="38" cy="85" rx="12" ry="6" fill="white" opacity="0.3" transform="rotate(-30 38 85)" />
          <ellipse cx="62" cy="105" rx="12" ry="6" fill="white" opacity="0.3" transform="rotate(30 62 105)" />
          <ellipse cx="42" cy="125" rx="10" ry="5" fill="white" opacity="0.3" transform="rotate(-25 42 125)" />
          <circle cx="50" cy="55" r="5" fill="white" opacity="0.25" />
          <circle cx="50" cy="95" r="5" fill="white" opacity="0.25" />
          <circle cx="50" cy="135" r="5" fill="white" opacity="0.25" />
        </svg>

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
        <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
          <Leaf className="h-14 w-14 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-6xl font-extrabold tracking-tight text-white drop-shadow-lg">
          OLEA
        </h1>
        <p className="mt-4 max-w-xs text-lg leading-relaxed text-white/80">
          Plateforme de vente aux enchères d&apos;huile d&apos;olive tunisienne
        </p>
        <div className="mt-8 flex items-center gap-3">
          <span className="h-px w-12 bg-white/30" />
          <span className="h-2 w-2 rounded-full bg-white/40" />
          <span className="h-px w-12 bg-white/30" />
        </div>
        <div className="mt-6 flex flex-col items-center gap-2 text-sm text-white/60">
          <span>🌱 Commerce équitable tunisien</span>
          <span>🛡️ Transactions sécurisées</span>
        </div>
      </div>
    </div>
  )
}

// ─── Step Indicator ─────────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Email', icon: Mail },
  { label: 'Code OTP', icon: KeyRound },
  { label: 'Nouveau mot de passe', icon: ShieldCheck },
] as const

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((step, index) => {
        const Icon = step.icon
        const isActive = index === currentStep
        const isCompleted = index < currentStep

        return (
          <div key={step.label} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'border-[#45A452] bg-[#45A452] text-white'
                    : isActive
                    ? 'border-[#45A452] bg-[#F0FDF4] text-[#45A452] ring-4 ring-[#45A452]/10'
                    : 'border-gray-200 bg-gray-50 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={`text-[11px] font-medium transition-colors ${
                  isActive ? 'text-[#45A452]' : isCompleted ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div className="mx-3 mb-6 h-0.5 w-10 sm:w-16 transition-colors duration-300">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCompleted ? 'w-full bg-[#45A452]' : 'w-full bg-gray-200'
                  }`}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Password Strength ──────────────────────────────────────────────────────────
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '#e2e8f0' }

  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: 'Faible', color: '#ef4444' }
  if (score <= 3) return { score, label: 'Moyen', color: '#F59E0B' }
  return { score, label: 'Fort', color: '#45A452' }
}

function PasswordStrengthBar({ password }: { password: string }) {
  const { score, label, color } = getPasswordStrength(password)

  if (!password) return null

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: level <= score ? color : '#e2e8f0',
            }}
          />
        ))}
      </div>
      <p className="text-xs font-medium" style={{ color }}>
        {label}
      </p>
    </div>
  )
}

// ─── Step Variants for framer-motion ───────────────────────────────────────────
const stepVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

const stepTransition = { duration: 0.35, ease: 'easeInOut' as const }

// ─── Forgot Password Page ──────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const setCurrentPage = useNavigationStore((s) => s.setCurrentPage)

  const [currentStep, setCurrentStep] = useState(0)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // OTP input refs
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // Auto-focus first OTP input when entering step 2
  useEffect(() => {
    if (currentStep === 1) {
      setTimeout(() => otpRefs.current[0]?.focus(), 400)
    }
  }, [currentStep])

  // ── Step 1: Send OTP ─────────────────────────────────────────────────────
  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim()) return

    setIsSubmitting(true)
    try {
      // TODO: Replace with actual API call
      // await fetch('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })
      await new Promise((resolve) => setTimeout(resolve, 1200))
      setCountdown(60)
      setCurrentStep(1)
    } catch {
      setError('Impossible d\'envoyer le code. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────
  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      // Only allow digits
      if (value && !/^\d$/.test(value)) return

      setError(null)
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      // Auto-focus next input
      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus()
      }

      // Auto-submit when all 6 digits are entered
      if (index === 5 && value) {
        const fullCode = newOtp.join('')
        if (fullCode.length === 6) {
          handleVerifyOtp(fullCode)
        }
      }
    },
    [otp],
  )

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus()
      }
    },

    [otp],
  )

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 0) return

    const newOtp = [...Array(6).fill('')]
    pasted.split('').forEach((digit, i) => {
      newOtp[i] = digit
    })
    setOtp(newOtp)

    // Focus the next empty input or the last one
    const focusIndex = Math.min(pasted.length, 5)
    otpRefs.current[focusIndex]?.focus()
  }, [])

  const handleVerifyOtp = async (code: string) => {
    setError(null)
    setIsSubmitting(true)
    try {
      // TODO: Replace with actual API call
      // await fetch('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, code }) })
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setCurrentStep(2)
    } catch {
      setError('Code invalide. Veuillez réessayer.')
      setOtp(Array(6).fill(''))
      otpRefs.current[0]?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    setError(null)
    setIsSubmitting(true)
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 800))
      setCountdown(60)
      setOtp(Array(6).fill(''))
      otpRefs.current[0]?.focus()
    } catch {
      setError('Impossible de renvoyer le code.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Step 3: Reset Password ──────────────────────────────────────────────
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!newPassword) {
      setError('Veuillez saisir un nouveau mot de passe.')
      return
    }
    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setIsSubmitting(true)
    try {
      // TODO: Replace with actual API call
      // await fetch('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, otp: otp.join(''), newPassword }) })
      await new Promise((resolve) => setTimeout(resolve, 1200))
      // Navigate to login with success indication
      setCurrentPage('login' as any)
    } catch {
      setError('Impossible de réinitialiser le mot de passe. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
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
            {/* Mobile-only logo */}
            <div className="lg:hidden flex items-center justify-center gap-2 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#45A452]">
                <Leaf className="h-5 w-5 text-white" />
              </div>
            </div>

            {/* Brand */}
            <div className="flex items-center justify-center gap-2">
              <Leaf className="h-6 w-6 text-[#45A452]" />
              <span className="text-2xl font-bold text-[#1F6E2B]">Olea</span>
            </div>

            <div className="pt-3 text-center">
              <h2 className="text-xl font-semibold tracking-tight text-gray-900">
                Mot de passe oublié
              </h2>
            </div>

            {/* Step indicator */}
            <div className="pt-4">
              <StepIndicator currentStep={currentStep} />
            </div>
          </CardHeader>

          <CardContent className="min-h-[280px]">
            <AnimatePresence mode="wait">
              {/* ── Step 1: Email ─────────────────────────────────────── */}
              {currentStep === 0 && (
                <motion.div
                  key="step-email"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={stepTransition}
                >
                  <p className="mb-6 text-center text-sm text-gray-500">
                    Saisissez votre email professionnel pour recevoir un code de vérification.
                  </p>

                  {error && (
                    <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-gray-700">
                        Adresse email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="nom@olea.tn"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-11 pl-10 border-gray-200 bg-gray-50/50 focus-visible:border-[#45A452] focus-visible:ring-[#45A452]/20 focus-visible:bg-white transition-colors"
                          required
                          autoComplete="email"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || !email.trim()}
                      className="h-11 w-full bg-[#45A452] text-white font-semibold shadow-md shadow-[#45A452]/20 hover:bg-[#1F6E2B] hover:shadow-lg hover:shadow-[#1F6E2B]/20 active:bg-[#185A22] transition-all duration-200 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Envoi en cours…
                        </>
                      ) : (
                        'Envoyer le code'
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* ── Step 2: OTP ────────────────────────────────────────── */}
              {currentStep === 1 && (
                <motion.div
                  key="step-otp"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={stepTransition}
                >
                  <div className="mb-6 text-center">
                    <p className="text-sm text-gray-500">
                      Entrez le code à 6 chiffres envoyé à votre adresse email.
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#45A452]">
                      Un code a été envoyé à {email}
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* 6-digit OTP inputs */}
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpRefs.current[index] = el
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
                        className={`h-12 w-11 rounded-lg border-2 text-center text-lg font-semibold outline-none transition-all duration-200 sm:h-14 sm:w-13 sm:text-xl ${
                          digit
                            ? 'border-[#45A452] bg-[#F0FDF4] text-[#1F6E2B]'
                            : 'border-gray-200 bg-gray-50/50 text-gray-900 focus-visible:border-[#45A452] focus-visible:ring-2 focus-visible:ring-[#45A452]/10'
                        }`}
                        disabled={isSubmitting}
                        aria-label={`Chiffre ${index + 1}`}
                      />
                    ))}
                  </div>

                  {/* Resend countdown */}
                  <div className="text-center">
                    {countdown > 0 ? (
                      <p className="text-sm text-gray-400">
                        Renvoyer le code dans{' '}
                        <span className="font-semibold text-[#45A452]">
                          {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                        </span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isSubmitting}
                        className="text-sm font-medium text-[#45A452] hover:text-[#1F6E2B] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Renvoyer le code
                      </button>
                    )}
                  </div>

                  {/* Back link */}
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null)
                        setCurrentStep(0)
                      }}
                      className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Retour
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 3: New Password ──────────────────────────────── */}
              {currentStep === 2 && (
                <motion.div
                  key="step-password"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={stepTransition}
                >
                  <p className="mb-6 text-center text-sm text-gray-500">
                    Créez votre nouveau mot de passe. Il doit contenir au moins 8 caractères.
                  </p>

                  {error && (
                    <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    {/* New password */}
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-gray-700">
                        Nouveau mot de passe
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="new-password"
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="h-11 pl-10 pr-10 border-gray-200 bg-gray-50/50 focus-visible:border-[#45A452] focus-visible:ring-[#45A452]/20 focus-visible:bg-white transition-colors"
                          required
                          autoComplete="new-password"
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          tabIndex={-1}
                          aria-label={showNewPassword ? 'Masquer' : 'Afficher'}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {/* Strength indicator */}
                      <PasswordStrengthBar password={newPassword} />
                    </div>

                    {/* Confirm password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-gray-700">
                        Confirmer le mot de passe
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`h-11 pl-10 pr-10 border-gray-200 bg-gray-50/50 focus-visible:bg-white transition-colors ${
                            confirmPassword && confirmPassword !== newPassword
                              ? 'border-red-300 focus-visible:border-red-400 focus-visible:ring-red-200'
                              : confirmPassword && confirmPassword === newPassword
                              ? 'border-[#45A452] focus-visible:border-[#45A452] focus-visible:ring-[#45A452]/20'
                              : 'focus-visible:border-[#45A452] focus-visible:ring-[#45A452]/20'
                          }`}
                          required
                          autoComplete="new-password"
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          tabIndex={-1}
                          aria-label={showConfirmPassword ? 'Masquer' : 'Afficher'}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {confirmPassword && confirmPassword !== newPassword && (
                        <p className="text-xs text-red-500 animate-in fade-in slide-in-from-top-1 duration-200">
                          Les mots de passe ne correspondent pas.
                        </p>
                      )}
                      {confirmPassword && confirmPassword === newPassword && (
                        <p className="text-xs text-[#45A452] animate-in fade-in slide-in-from-top-1 duration-200">
                          Les mots de passe correspondent.
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        !newPassword ||
                        !confirmPassword ||
                        newPassword !== confirmPassword ||
                        newPassword.length < 8
                      }
                      className="h-11 w-full bg-[#45A452] text-white font-semibold shadow-md shadow-[#45A452]/20 hover:bg-[#1F6E2B] hover:shadow-lg hover:shadow-[#1F6E2B]/20 active:bg-[#185A22] transition-all duration-200 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Réinitialisation…
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Réinitialiser le mot de passe
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Back link */}
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null)
                        setCurrentStep(1)
                      }}
                      className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Retour
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Back to login link */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setCurrentPage('login' as any)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#45A452] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour à la connexion
          </button>
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-gray-400">
          © 2026 Olea — Tous droits réservés
        </p>
      </div>
    </div>
  )
}


