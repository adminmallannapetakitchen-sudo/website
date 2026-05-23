'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, User, Phone, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguageStore } from '@/store/language-store'
import { LanguageToggle } from '@/components/shared/language-toggle'
import { GoogleSignInButton } from '@/components/shared/google-signin-button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { registerWithEmail } from '@/lib/auth-actions'

export default function RegisterPage() {
  const { t, language } = useLanguageStore()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (!/^(\+?91)?[6-9]\d{9}$/.test(form.phone.replace(/[\s-]/g, ''))) {
      toast.error('Enter a valid 10-digit Indian mobile number — the kitchen calls you for delivery')
      return
    }
    setLoading(true)
    try {
      await registerWithEmail(form.email, form.password, form.name, form.phone.replace(/[\s-]/g, ''))
      toast.success('Account created! Welcome to Mallannapeta Kitchen!')
      router.push('/')
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 md:p-8 shadow-card"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={cn('text-2xl font-bold text-foreground', language === 'te' ? 'font-telugu' : 'font-display')}>
            {t.auth.register}
          </h1>
          <p className={cn('text-muted-foreground text-sm mt-1', language === 'te' ? 'font-telugu' : '')}>
            {language === 'te' ? 'కొత్త అకౌంట్ తయారు చేయండి' : 'Create a new account'}
          </p>
        </div>
        <LanguageToggle compact />
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label={t.auth.name} type="text" value={form.name} onChange={update('name')} placeholder="Raju Naidu" icon={<User className="w-4 h-4" />} required />
        <Input label={t.auth.email} type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" icon={<Mail className="w-4 h-4" />} required />
        <Input label={t.auth.phone} type="tel" value={form.phone} onChange={update('phone')} placeholder="+91 99999 00000" icon={<Phone className="w-4 h-4" />} required />
        <Input
          label={t.auth.password}
          type={showPassword ? 'text' : 'password'}
          value={form.password}
          onChange={update('password')}
          placeholder="Min. 8 characters"
          icon={<Lock className="w-4 h-4" />}
          iconRight={
            <button type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          required
        />
        <Input
          label={t.auth.confirmPassword}
          type={showPassword ? 'text' : 'password'}
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          placeholder="Repeat password"
          icon={<Lock className="w-4 h-4" />}
          required
        />

        <Button type="submit" className="w-full mt-2" size="lg" loading={loading} icon={!loading ? <UserPlus className="w-4 h-4" /> : undefined}>
          <span className={language === 'te' ? 'font-telugu' : ''}>{t.auth.signUp}</span>
        </Button>
      </form>

      <p className={cn('text-center text-sm text-muted-foreground mt-4', language === 'te' ? 'font-telugu' : '')}>
        {t.auth.hasAccount}{' '}
        <Link href="/login" className="text-brand-red font-medium hover:underline">
          {t.auth.signIn}
        </Link>
      </p>
    </motion.div>
  )
}
