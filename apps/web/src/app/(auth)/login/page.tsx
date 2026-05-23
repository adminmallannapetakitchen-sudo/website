'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, LogIn, Phone, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguageStore } from '@/store/language-store'
import { LanguageToggle } from '@/components/shared/language-toggle'
import { GoogleSignInButton } from '@/components/shared/google-signin-button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { loginWithEmail, requestPhoneOtp, verifyPhoneOtp } from '@/lib/auth-actions'

export default function LoginPage() {
  const { t, language } = useLanguageStore()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [mode, setMode] = useState<'email' | 'phone'>('email')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  const goHome = () => {
    router.push('/')
    router.refresh()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await loginWithEmail(form.email, form.password)
      toast.success('Logged in successfully!')
      goHome()
    } catch (err: any) {
      toast.error(err?.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async () => {
    if (!phone) return toast.error('Enter your phone number')
    setLoading(true)
    try {
      await requestPhoneOtp(phone)
      setOtpSent(true)
      toast.success('OTP sent to your phone')
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await verifyPhoneOtp(phone, otp)
      toast.success('Logged in successfully!')
      goHome()
    } catch (err: any) {
      toast.error(err?.message ?? 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 md:p-8 shadow-card"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={cn('text-2xl font-bold text-foreground', language === 'te' ? 'font-telugu' : 'font-display')}>
            {t.auth.login}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {language === 'te' ? (
              <span className="font-telugu">మళ్ళీ స్వాగతం!</span>
            ) : (
              'Welcome back!'
            )}
          </p>
        </div>
        <LanguageToggle compact />
      </div>

      {/* Google button */}
      <div className="mb-4">
        <GoogleSignInButton label={t.auth.google} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-border" />
        <span className={cn('text-xs text-muted-foreground', language === 'te' ? 'font-telugu' : '')}>
          {t.auth.orContinueWith}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-5 p-1 bg-muted rounded-xl">
        <button
          onClick={() => setMode('email')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors',
            mode === 'email' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
          )}
        >
          <Mail className="w-4 h-4" /> Email
        </button>
        <button
          onClick={() => setMode('phone')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors',
            mode === 'phone' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
          )}
        >
          <Phone className="w-4 h-4" /> Phone OTP
        </button>
      </div>

      {mode === 'email' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t.auth.email}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            icon={<Mail className="w-4 h-4" />}
            required
          />
          <Input
            label={t.auth.password}
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            iconRight={
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            required
          />

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className={cn('text-xs text-brand-red hover:underline', language === 'te' ? 'font-telugu' : '')}
            >
              {t.auth.forgotPassword}
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={loading}
            icon={!loading ? <LogIn className="w-4 h-4" /> : undefined}
          >
            <span className={language === 'te' ? 'font-telugu' : ''}>{t.auth.signIn}</span>
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <Input
            label="Phone number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 99999 00000"
            icon={<Phone className="w-4 h-4" />}
            disabled={otpSent}
            required
          />
          {otpSent && (
            <Input
              label="Enter OTP"
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit code"
              icon={<KeyRound className="w-4 h-4" />}
              required
            />
          )}
          {!otpSent ? (
            <Button type="button" className="w-full" size="lg" loading={loading} onClick={handleSendOtp}>
              Send OTP
            </Button>
          ) : (
            <>
              <Button type="submit" className="w-full" size="lg" loading={loading} icon={<LogIn className="w-4 h-4" />}>
                Verify & Sign In
              </Button>
              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtp('') }}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Change number
              </button>
            </>
          )}
        </form>
      )}

      <p className={cn('text-center text-sm text-muted-foreground mt-4', language === 'te' ? 'font-telugu' : '')}>
        {t.auth.noAccount}{' '}
        <Link href="/register" className="text-brand-red font-medium hover:underline">
          {t.auth.signUp}
        </Link>
      </p>
    </motion.div>
  )
}
