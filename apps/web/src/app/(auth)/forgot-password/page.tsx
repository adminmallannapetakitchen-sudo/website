'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguageStore } from '@/store/language-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { forgotPassword } from '@/lib/auth-actions'

export default function ForgotPasswordPage() {
  const { t, language } = useLanguageStore()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await forgotPassword(email)
      setSent(true)
      toast.success(t.auth.resetSent)
      if (res?._devToken) {
        // dev convenience: show the reset token
        console.info('DEV reset token:', res._devToken)
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not send reset link')
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
      <Link
        href="/login"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className={language === 'te' ? 'font-telugu' : ''}>{t.common.back} to Login</span>
      </Link>

      {sent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="text-5xl">📧</div>
          <h1 className={cn('text-xl font-bold text-foreground', language === 'te' ? 'font-telugu' : '')}>
            {language === 'te' ? 'ఇమెయిల్ పంపబడింది!' : 'Email Sent!'}
          </h1>
          <p className={cn('text-muted-foreground text-sm', language === 'te' ? 'font-telugu' : '')}>
            {t.auth.resetSent}
          </p>
        </motion.div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className={cn('text-2xl font-bold text-foreground', language === 'te' ? 'font-telugu' : 'font-display')}>
              {t.auth.resetPassword}
            </h1>
            <p className={cn('text-muted-foreground text-sm mt-1', language === 'te' ? 'font-telugu' : '')}>
              {language === 'te'
                ? 'రీసెట్ లింక్ పొందడానికి మీ ఇమెయిల్ నమోదు చేయండి'
                : 'Enter your email to receive a reset link'}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t.auth.email}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon={<Mail className="w-4 h-4" />}
              required
            />
            <Button type="submit" className="w-full" size="lg" loading={loading} icon={!loading ? <Send className="w-4 h-4" /> : undefined}>
              <span className={language === 'te' ? 'font-telugu' : ''}>
                {language === 'te' ? 'రీసెట్ లింక్ పంపండి' : 'Send Reset Link'}
              </span>
            </Button>
          </form>
        </>
      )}
    </motion.div>
  )
}
